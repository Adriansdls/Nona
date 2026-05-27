"""
Export training data from Supabase for future fine-tuning of MegaDescriptor-L.

Usage:
    uv run python scripts/export_training_data.py --output ./training_data

Exports:
    - Original dog photos (from case-images-original bucket)
    - Metadata CSV: case_id, breed, primary_color, distinctive_marks, quality_score
    - Positive pairs CSV: case_a_id, case_b_id (from admin-confirmed visual_matches)

Run once you have 200+ admin-confirmed matches in visual_matches table.
"""

import argparse
import csv
import json
import os
from pathlib import Path

from dotenv import load_dotenv
from supabase import create_client

load_dotenv("../../.env.local")


def get_supabase():
    url = os.environ["SUPABASE_URL"]
    key = os.environ["SUPABASE_SERVICE_ROLE_KEY"]
    return create_client(url, key)


def export(output_dir: Path) -> None:
    output_dir.mkdir(parents=True, exist_ok=True)
    images_dir = output_dir / "images"
    images_dir.mkdir(exist_ok=True)

    sb = get_supabase()

    print("Fetching case images with embeddings and quality >= 0.5...")
    rows = (
        sb.table("case_images")
        .select(
            "id, case_id, storage_path_original, quality_score, "
            "cases(breed, primary_color, secondary_color, distinctive_marks, dog_name)"
        )
        .not_.is_("embedding", "null")
        .gte("quality_score", 0.5)
        .not_.is_("storage_path_original", "null")
        .execute()
        .data
    )
    print(f"  {len(rows)} images found")

    # Write metadata CSV
    meta_path = output_dir / "images_metadata.csv"
    with open(meta_path, "w", newline="") as f:
        writer = csv.writer(f)
        writer.writerow(["image_id", "case_id", "storage_path", "quality_score", "breed", "primary_color", "distinctive_marks"])
        for row in rows:
            case = row.get("cases") or {}
            marks = json.dumps(case.get("distinctive_marks") or [])
            writer.writerow([
                row["id"], row["case_id"], row["storage_path_original"],
                row["quality_score"], case.get("breed", ""), case.get("primary_color", ""), marks,
            ])

    # Download images
    print("Downloading original images...")
    downloaded = 0
    for row in rows:
        path = row["storage_path_original"]
        if not path:
            continue
        dest = images_dir / f"{row['id']}.jpg"
        if dest.exists():
            continue
        try:
            data = sb.storage.from_("case-images-original").download(path)
            dest.write_bytes(data)
            downloaded += 1
            if downloaded % 50 == 0:
                print(f"  {downloaded}/{len(rows)} downloaded...")
        except Exception as e:
            print(f"  Skip {row['id']}: {e}")

    print(f"  {downloaded} images downloaded to {images_dir}")

    # Export confirmed positive pairs
    print("Fetching admin-confirmed visual matches...")
    matches = (
        sb.table("visual_matches")
        .select("case_a_id, case_b_id, similarity_score")
        .eq("status", "match")
        .execute()
        .data
    )
    print(f"  {len(matches)} confirmed positive pairs")

    pairs_path = output_dir / "positive_pairs.csv"
    with open(pairs_path, "w", newline="") as f:
        writer = csv.writer(f)
        writer.writerow(["case_a_id", "case_b_id", "similarity_score"])
        for m in matches:
            writer.writerow([m["case_a_id"], m["case_b_id"], m["similarity_score"]])

    print(f"\nExport complete:")
    print(f"  Metadata: {meta_path}")
    print(f"  Pairs:    {pairs_path}")
    print(f"  Images:   {images_dir}")
    print(f"\nNext step: fine-tune MegaDescriptor-L with supervised contrastive loss on these pairs.")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Export SalvaCão training data")
    parser.add_argument("--output", default="./training_data", help="Output directory")
    args = parser.parse_args()
    export(Path(args.output))
