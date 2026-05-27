"""
Test same-individual re-ID: the only meaningful test for our use case.

Takes two photos of the SAME dog and reports similarity.
This is what actually validates whether MegaDescriptor-L works for us.

Usage:
    uv run python scripts/test_same_individual.py photo_a.jpg photo_b.jpg

    # With URL inputs:
    uv run python scripts/test_same_individual.py https://example.com/dog1.jpg https://example.com/dog2.jpg

    # Run on ALL pairs from our seeded test cases (fetches from DB):
    uv run python scripts/test_same_individual.py --from-db

Expected results (calibration guide):
    > 70%  — almost certainly same dog
    50-70% — probably same dog, worth reviewing
    30-50% — possible match, weak signal
    < 30%  — likely different dogs
"""

import argparse
import io
import os
import sys
import time
import warnings
warnings.filterwarnings("ignore")

import httpx
import numpy as np
import torch
from PIL import Image

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))


def load_models():
    import timm
    from sam2.build_sam import build_sam2_hf
    from sam2.sam2_image_predictor import SAM2ImagePredictor
    from ultralytics import YOLO

    device = torch.device("mps" if torch.backends.mps.is_available() else "cpu")
    print(f"Device: {device}")

    print("Loading MegaDescriptor-L-384...", end=" ", flush=True)
    t0 = time.time()
    model = timm.create_model("hf-hub:BVRA/MegaDescriptor-L-384", pretrained=True, num_classes=0).to(device).eval()
    print(f"{time.time()-t0:.1f}s")

    print("Loading SAM2 + YOLO...", end=" ", flush=True)
    t0 = time.time()
    sam2 = SAM2ImagePredictor(build_sam2_hf("facebook/sam2-hiera-tiny", device=str(device)))
    yolo = YOLO("yolo11s.pt")
    print(f"{time.time()-t0:.1f}s\n")

    return model, sam2, yolo, device


def load_image(src: str) -> Image.Image:
    if src.startswith("http"):
        raw = httpx.get(src, timeout=20, follow_redirects=True).content
    else:
        raw = open(src, "rb").read()
    return Image.open(io.BytesIO(raw)).convert("RGB")


def embed_image(img: Image.Image, model, sam2, yolo, device) -> tuple[np.ndarray, float]:
    import timm
    from pipeline.detect import detect_dog
    from pipeline.segment import segment_dog
    from pipeline.quality import compute_quality
    from pipeline.embed import compute_embedding

    _, bbox = detect_dog(img, yolo)
    crop = segment_dog(img, bbox, sam2)
    quality = compute_quality(crop)
    emb = compute_embedding(crop, model, device)
    return emb, quality


def compare(src_a: str, src_b: str, model, sam2, yolo, device) -> dict:
    img_a = load_image(src_a)
    img_b = load_image(src_b)
    emb_a, qa = embed_image(img_a, model, sam2, yolo, device)
    emb_b, qb = embed_image(img_b, model, sam2, yolo, device)
    score = float(np.dot(emb_a, emb_b) / (np.linalg.norm(emb_a) * np.linalg.norm(emb_b)))
    return {"score": score, "quality_a": qa, "quality_b": qb}


def interpret(score: float) -> str:
    if score > 0.70: return "🟢 VERY LIKELY same dog (>70%)"
    if score > 0.50: return "🟡 PROBABLY same dog (50-70%) — review visually"
    if score > 0.30: return "🟠 WEAK match (30-50%) — unlikely same dog"
    return "🔴 DIFFERENT dogs (<30%)"


def run_pair(src_a: str, src_b: str, model, sam2, yolo, device, label: str = "") -> None:
    print(f"{'  ' if not label else ''}{label or 'Comparing'}")
    try:
        r = compare(src_a, src_b, model, sam2, yolo, device)
        pct = r["score"] * 100
        print(f"  Similarity: {pct:.1f}%")
        print(f"  Quality:    A={r['quality_a']:.2f}  B={r['quality_b']:.2f}")
        print(f"  Result:     {interpret(r['score'])}")
    except Exception as e:
        print(f"  ERROR: {e}")
    print()


def run_from_db(model, sam2, yolo, device) -> None:
    """
    Fetches all seeded test cases from DB.
    For each case, re-embeds its photo against itself (sanity) and against all other cases.
    Shows the distribution of scores across same-case vs cross-case comparisons.
    Useful for calibrating thresholds before we have real paired photos.
    """
    from dotenv import load_dotenv
    for f in ["/Users/asdls/Documents/save-dogs/apps/web/.env.local", "../../apps/web/.env.local"]:
        load_dotenv(f)

    from supabase import create_client
    sb = create_client(os.environ["NEXT_PUBLIC_SUPABASE_URL"], os.environ["SUPABASE_SERVICE_ROLE_KEY"])

    rows = sb.table("case_images")\
        .select("id, case_id, public_url, cases(breed, dog_name, admin_notes)")\
        .not_.is_("public_url", "null")\
        .execute().data

    # Filter test data only
    rows = [r for r in rows if (r.get("cases") or {}).get("admin_notes") == "[TEST DATA]"]
    print(f"Found {len(rows)} test case images\n")

    if len(rows) < 2:
        print("Need at least 2 images. Run seed_test_cases.py first.")
        return

    # Embed all
    print("Embedding all images...")
    embeddings = {}
    for r in rows:
        url = r["public_url"]
        case = r.get("cases") or {}
        label = f"{case.get('dog_name') or case.get('breed', '?')} [{r['case_id'][:6]}]"
        try:
            img = load_image(url)
            emb, q = embed_image(img, model, sam2, yolo, device)
            embeddings[r["case_id"]] = {"emb": emb, "label": label, "quality": q}
            print(f"  ✓ {label}  quality={q:.2f}")
        except Exception as e:
            print(f"  ✗ {label}: {e}")

    # Compute all-pairs similarity matrix
    cases = list(embeddings.items())
    print(f"\n{'─'*60}")
    print(f"{'Dog A':<25} {'Dog B':<25} {'Score':>7}")
    print(f"{'─'*60}")

    scores = []
    for i, (cid_a, va) in enumerate(cases):
        for j, (cid_b, vb) in enumerate(cases):
            if j <= i:
                continue
            score = float(np.dot(va["emb"], vb["emb"]) / (np.linalg.norm(va["emb"]) * np.linalg.norm(vb["emb"])))
            scores.append(score)
            marker = interpret(score).split()[0]
            print(f"  {va['label']:<23} {vb['label']:<23} {score*100:>6.1f}% {marker}")

    print(f"\n{'─'*60}")
    print(f"Score distribution across {len(scores)} pairs:")
    print(f"  Max:    {max(scores)*100:.1f}%")
    print(f"  Mean:   {np.mean(scores)*100:.1f}%")
    print(f"  Median: {np.median(scores)*100:.1f}%")
    print(f"  Min:    {min(scores)*100:.1f}%")
    print(f"\nThreshold guidance for this model:")
    over60 = sum(1 for s in scores if s > 0.60)
    over75 = sum(1 for s in scores if s > 0.75)
    print(f"  Pairs scoring >60% (current insert threshold): {over60}/{len(scores)}")
    print(f"  Pairs scoring >75% (current notify threshold): {over75}/{len(scores)}")
    if over60 > len(scores) * 0.3:
        print("  ⚠ Too many false positives at 0.60 threshold — consider raising to 0.70+")
    else:
        print("  ✓ Threshold looks reasonable for these test cases")


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("images", nargs="*", help="Two image paths or URLs to compare")
    parser.add_argument("--from-db", action="store_true", help="Run on all seeded DB cases")
    args = parser.parse_args()

    model, sam2, yolo, device = load_models()

    if args.from_db:
        run_from_db(model, sam2, yolo, device)
    elif len(args.images) == 2:
        run_pair(args.images[0], args.images[1], model, sam2, yolo, device)
    else:
        print("Usage: test_same_individual.py photo_a.jpg photo_b.jpg")
        print("       test_same_individual.py --from-db")
        sys.exit(1)
