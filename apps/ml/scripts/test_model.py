"""
Test ML pipeline: similarity scores and sanity checks.

Tests:
  Sanity: same image twice → must be ~100%
  Same breed (different individuals): moderate similarity expected
  Different breed: lower similarity expected
  Pipeline: detect → segment → embed works end-to-end

Usage:
    uv run python scripts/test_model.py --model-only
    uv run python scripts/test_model.py --health        # check running service
    uv run python scripts/test_model.py --verbose       # print extra stats
"""

import argparse
import io
import os
import sys
import time

import httpx
import numpy as np
import torch
from PIL import Image

ML_SERVICE_URL = "http://127.0.0.1:8000"
DOG_CEO = "https://dog.ceo/api/breed"

# Sub-breeds use /slash/ in the Dog CEO API
BREED_SLUGS = {
    "Labrador":       "labrador",
    "Beagle":         "beagle",
    "Husky":          "husky",
    "Golden":         "retriever/golden",
    "GermanShepherd": "german/shepherd",
    "Dalmatian":      "dalmatian",
    "Rottweiler":     "rottweiler",
    "Poodle":         "poodle/standard",
    "BorderCollie":   "collie/border",
}


def fetch_image(breed_key: str) -> Image.Image:
    slug = BREED_SLUGS[breed_key]
    url = httpx.get(f"{DOG_CEO}/{slug}/images/random", timeout=10).json()["message"]
    raw = httpx.get(url, timeout=20, follow_redirects=True).content
    return Image.open(io.BytesIO(raw)).convert("RGB")


def cosine(a: np.ndarray, b: np.ndarray) -> float:
    na, nb = np.linalg.norm(a), np.linalg.norm(b)
    if na < 1e-9 or nb < 1e-9:
        return 0.0
    return float(np.dot(a, b) / (na * nb))


def embed(img: Image.Image, detect_dog, segment_dog, compute_quality, compute_embedding, yolo, megadescriptor, sam2, device) -> tuple[np.ndarray, float]:
    _, bbox = detect_dog(img, yolo)
    crop = segment_dog(img, bbox, sam2)
    quality = compute_quality(crop)
    emb = compute_embedding(crop, megadescriptor, device)
    return emb, quality


def test_model_direct(verbose: bool = False) -> None:
    sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))
    import timm
    from pipeline.detect import detect_dog
    from pipeline.segment import segment_dog
    from pipeline.quality import compute_quality
    from pipeline.embed import compute_embedding
    from sam2.build_sam import build_sam2_hf
    from sam2.sam2_image_predictor import SAM2ImagePredictor
    from ultralytics import YOLO

    device = torch.device("mps" if torch.backends.mps.is_available() else "cpu")
    print(f"Device: {device}\n")

    print("Loading MegaDescriptor-L-384 (~1.3GB, cached after first run)...")
    t0 = time.time()
    megadescriptor = timm.create_model(
        "hf-hub:BVRA/MegaDescriptor-L-384",
        pretrained=True,
        num_classes=0,
    ).to(device).eval()
    print(f"  Loaded in {time.time()-t0:.1f}s  |  output dim: {megadescriptor.num_features}")

    print("Loading SAM2-Tiny + YOLO...")
    t0 = time.time()
    sam2 = SAM2ImagePredictor(build_sam2_hf("facebook/sam2-hiera-tiny", device=str(device)))
    yolo = YOLO("yolo11s.pt")
    print(f"  Loaded in {time.time()-t0:.1f}s\n")

    def e(img):
        return embed(img, detect_dog, segment_dog, compute_quality, compute_embedding,
                     yolo, megadescriptor, sam2, device)

    results = []

    # -----------------------------------------------------------------------
    # SANITY: same image twice — must be ~1.0
    # -----------------------------------------------------------------------
    print("=" * 60)
    print("SANITY CHECKS")
    print("=" * 60)
    for breed in ["Labrador", "Beagle", "GermanShepherd"]:
        try:
            img = fetch_image(breed)
            emb_a, qa = e(img)
            emb_b, _ = e(img)  # same image
            score = cosine(emb_a, emb_b)
            status = "✓" if score > 0.99 else "✗"
            print(f"  {status} Same image × 2 ({breed}): {score*100:.2f}%  quality={qa:.2f}")
            results.append(("sanity_same_image", score, True, status))
        except Exception as ex:
            print(f"  ERR {breed}: {ex}")

    # -----------------------------------------------------------------------
    # DISCRIMINATION: same breed (diff individual) vs diff breed
    # Model is individual re-ID, so same-breed ≠ same individual.
    # We expect scores to be low-moderate for both, but same-breed slightly higher.
    # -----------------------------------------------------------------------
    print()
    print("=" * 60)
    print("BREED DISCRIMINATION (same vs different breed, different individuals)")
    print("NOTE: Model targets individual identity — not breed. Scores will be lower")
    print("      than a breed classifier. What matters: same-breed > diff-breed.")
    print("=" * 60)

    same_scores = []
    diff_scores  = []

    breed_pairs_same = [
        ("Labrador A", "Labrador B", "Labrador", "Labrador"),
        ("Beagle A",   "Beagle B",   "Beagle",   "Beagle"),
        ("Husky A",    "Husky B",    "Husky",    "Husky"),
    ]
    breed_pairs_diff = [
        ("Labrador",  "Beagle",   "Labrador", "Beagle"),
        ("Husky",     "Poodle",   "Husky",    "Poodle"),
        ("Dalmatian", "Rottweiler","Dalmatian","Rottweiler"),
    ]

    for label_a, label_b, breed_a, breed_b in breed_pairs_same:
        try:
            img_a = fetch_image(breed_a)
            img_b = fetch_image(breed_b)
            emb_a, qa = e(img_a)
            emb_b, qb = e(img_b)
            score = cosine(emb_a, emb_b)
            same_scores.append(score)
            print(f"  Same breed ({breed_a} × {breed_b}): {score*100:.1f}%  quality={qa:.2f}/{qb:.2f}")
            if verbose:
                print(f"    emb norm: {np.linalg.norm(emb_a):.4f} / {np.linalg.norm(emb_b):.4f}")
        except Exception as ex:
            print(f"  ERR ({breed_a} × {breed_b}): {ex}")

    for label_a, label_b, breed_a, breed_b in breed_pairs_diff:
        try:
            img_a = fetch_image(breed_a)
            img_b = fetch_image(breed_b)
            emb_a, _ = e(img_a)
            emb_b, _ = e(img_b)
            score = cosine(emb_a, emb_b)
            diff_scores.append(score)
            print(f"  Diff breed ({breed_a} × {breed_b}): {score*100:.1f}%")
        except Exception as ex:
            print(f"  ERR ({breed_a} × {breed_b}): {ex}")

    # -----------------------------------------------------------------------
    # SUMMARY
    # -----------------------------------------------------------------------
    print()
    print("=" * 60)
    print("SUMMARY")
    print("=" * 60)

    sanity_pass = sum(1 for n, s, _, st in results if n == "sanity_same_image" and st == "✓")
    print(f"Sanity (same image = 100%): {sanity_pass}/3 passed")

    if same_scores and diff_scores:
        same_avg = np.mean(same_scores) * 100
        diff_avg  = np.mean(diff_scores)  * 100
        gap = same_avg - diff_avg
        print(f"Same-breed avg:  {same_avg:.1f}%")
        print(f"Diff-breed avg:  {diff_avg:.1f}%")
        print(f"Discrimination:  {gap:+.1f}pp")

        if gap > 5:
            print("✓ Model shows meaningful breed-level discrimination")
        elif gap > 0:
            print("~ Slight discrimination — individual re-ID model working as designed")
        else:
            print("✗ No discrimination — check normalization or model loading")

    print()
    print("Embedding dim:", megadescriptor.num_features)
    print("Expected dim:  1024 (MegaDescriptor-L)")
    print("✓ Dim OK" if megadescriptor.num_features == 1024 else "✗ Unexpected dim!")


def test_service_health() -> bool:
    try:
        resp = httpx.get(f"{ML_SERVICE_URL}/health", timeout=5)
        data = resp.json()
        print(f"ML service: {data}")
        return data.get("status") == "ok"
    except Exception as ex:
        print(f"ML service not reachable: {ex}")
        return False


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--model-only", action="store_true")
    parser.add_argument("--health", action="store_true")
    parser.add_argument("--verbose", action="store_true")
    args = parser.parse_args()

    if args.health:
        sys.exit(0 if test_service_health() else 1)
    elif args.model_only:
        test_model_direct(verbose=args.verbose)
    else:
        if test_service_health():
            print("Service up. Use --model-only for full local tests.")
        else:
            print("Run: uv run uvicorn main:app --port 8000  OR  --model-only")
