"""
Seed the database with test dog cases using public domain images (Stanford Dogs CC BY-SA 4.0).
Inserts directly via Supabase service client — no web app required.
All cases tagged admin_notes='[TEST DATA]' for easy removal.

Usage:
    uv run python scripts/seed_test_cases.py
    uv run python scripts/seed_test_cases.py --dry-run   # download images only
    uv run python scripts/seed_test_cases.py --remove    # delete all test data
"""

import argparse
import io
import os
import sys
import uuid
import random
from datetime import datetime, timedelta, timezone

import httpx
from dotenv import load_dotenv

for _f in ["/Users/asdls/Documents/save-dogs/apps/web/.env.local",
           "../../apps/web/.env.local",
           "../../.env.local"]:
    load_dotenv(_f)

SUPABASE_URL = (os.environ.get("NEXT_PUBLIC_SUPABASE_URL")
                or os.environ.get("SUPABASE_URL"))
SUPABASE_KEY = (os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
                or os.environ.get("SUPABASE_SECRET_KEY"))
TEST_TAG = "[TEST DATA]"
DOG_CEO = "https://dog.ceo/api/breed"

MUNICIPALITIES = [
    "Faro", "Portimão", "Albufeira", "Loulé", "Silves",
    "Lagoa", "Lagos", "Tavira", "Olhão", "Vila Real de Santo António",
]
ZONES = [
    "Centro histórico", "Zona industrial", "Praia", "Zona residencial",
    "Campo", "Junto ao supermercado", "Parque urbano", "Estrada nacional",
]

CASES = [
    {
        "type": "perdido",
        "dog_name": "Bolinha",
        "breed": "Labrador",
        "api_breed": "labrador",
        "sex": "macho",
        "size": "grande",
        "primary_color": "Amarelo",
        "secondary_color": None,
        "distinctive_marks": ["Mancha branca no peito"],
        "age_estimate": "3 anos",
        "has_chip": True,
        "chip_last_3": "412",
        "municipality": "Faro",
        "zone": "Parque urbano",
        "description": "Cão muito dócil e sociável. Desapareceu perto do Parque das Cidades. Responde ao nome Bolinha.",
        "reporter_name": "Maria Silva",
        "reporter_email": "test+maria@salvacao.local",
        "reporter_phone": "+351 912 345 678",
        "days_ago": 3,
    },
    {
        "type": "perdido",
        "dog_name": "Pipoca",
        "breed": "Beagle",
        "api_breed": "beagle",
        "sex": "femea",
        "size": "medio",
        "primary_color": "Castanho",
        "secondary_color": "Branco",
        "distinctive_marks": ["Orelha esquerda dobrada", "Cauda branca na ponta"],
        "age_estimate": "2 anos",
        "has_chip": True,
        "chip_last_3": "891",
        "municipality": "Albufeira",
        "zone": "Praia",
        "description": "Beagle com coleira azul com identificação. Perdida perto da praia dos Pescadores. Muito amigável.",
        "reporter_name": "João Costa",
        "reporter_email": "test+joao@salvacao.local",
        "reporter_phone": "+351 963 210 987",
        "days_ago": 7,
    },
    {
        "type": "perdido",
        "dog_name": "Storm",
        "breed": "Husky Siberiano",
        "api_breed": "husky",
        "sex": "macho",
        "size": "grande",
        "primary_color": "Cinzento",
        "secondary_color": "Branco",
        "distinctive_marks": ["Olhos azuis", "Máscara facial escura"],
        "age_estimate": "4 anos",
        "has_chip": True,
        "chip_last_3": "033",
        "municipality": "Portimão",
        "zone": "Zona residencial",
        "description": "Husky com olhos azuis inconfundíveis. Muito assustado com barulho, pode não responder ao nome.",
        "reporter_name": "Ana Ferreira",
        "reporter_email": "test+ana@salvacao.local",
        "reporter_phone": "+351 936 789 012",
        "days_ago": 1,
    },
    {
        "type": "perdido",
        "dog_name": "Mel",
        "breed": "Golden Retriever",
        "api_breed": "retriever-golden",
        "sex": "femea",
        "size": "grande",
        "primary_color": "Amarelo",
        "secondary_color": None,
        "distinctive_marks": ["Cicatriz pequena no ouvido direito"],
        "age_estimate": "5 anos",
        "has_chip": True,
        "chip_last_3": "227",
        "municipality": "Loulé",
        "zone": "Campo",
        "description": "Golden muito amigável, usa microchip. Desapareceu do jardim de casa. Está gestante.",
        "reporter_name": "Pedro Almeida",
        "reporter_email": "test+pedro@salvacao.local",
        "reporter_phone": "+351 914 567 890",
        "days_ago": 5,
    },
    {
        "type": "perdido",
        "dog_name": "Rex",
        "breed": "Pastor Alemão",
        "api_breed": "germanshepherd",
        "sex": "macho",
        "size": "grande",
        "primary_color": "Castanho",
        "secondary_color": "Preto",
        "distinctive_marks": ["Focinho longo", "Pata traseira direita com pelo mais claro"],
        "age_estimate": "6 anos",
        "has_chip": True,
        "chip_last_3": "659",
        "municipality": "Tavira",
        "zone": "Estrada nacional",
        "description": "Pastor alemão com coleira preta e placa de identificação. Responde ao nome Rex. Muito bem treinado.",
        "reporter_name": "Sofia Rodrigues",
        "reporter_email": "test+sofia@salvacao.local",
        "reporter_phone": "+351 965 432 109",
        "days_ago": 2,
    },
    {
        "type": "perdido",
        "dog_name": "Pintas",
        "breed": "Dálmata",
        "api_breed": "dalmatian",
        "sex": "macho",
        "size": "grande",
        "primary_color": "Branco",
        "secondary_color": "Preto",
        "distinctive_marks": ["Mancha negra sobre o olho esquerdo", "Focinho com sardas"],
        "age_estimate": "2 anos",
        "has_chip": False,
        "chip_last_3": None,
        "municipality": "Vila Real de Santo António",
        "zone": "Centro histórico",
        "description": "Dálmata muito brincalhão e energético. Não tem chip. Desapareceu durante passeio.",
        "reporter_name": "Carlos Mendes",
        "reporter_email": "test+carlos@salvacao.local",
        "reporter_phone": "+351 912 098 765",
        "days_ago": 4,
    },
    {
        "type": "perdido",
        "dog_name": "Sombra",
        "breed": "Rottweiler",
        "api_breed": "rottweiler",
        "sex": "femea",
        "size": "grande",
        "primary_color": "Preto",
        "secondary_color": "Castanho",
        "distinctive_marks": ["Mancha castanha sobre cada olho", "Peito com pelo castanho"],
        "age_estimate": "3 anos",
        "has_chip": True,
        "chip_last_3": "744",
        "municipality": "Silves",
        "zone": "Junto ao supermercado",
        "description": "Rottweiler fêmea, muito dócil apesar do aspecto. Assustou-se com foguetes e fugiu.",
        "reporter_name": "Luísa Gonçalves",
        "reporter_email": "test+luisa@salvacao.local",
        "reporter_phone": "+351 935 678 901",
        "days_ago": 8,
    },
    {
        "type": "encontrado",
        "dog_name": None,
        "breed": "Poodle",
        "api_breed": "poodle-standard",
        "sex": "desconhecido",
        "size": "pequeno",
        "primary_color": "Branco",
        "secondary_color": None,
        "distinctive_marks": ["Pelo tosquiado recentemente", "Sem coleira"],
        "age_estimate": "Adulto, idade desconhecida",
        "has_chip": None,
        "chip_last_3": None,
        "municipality": "Lagos",
        "zone": "Junto ao supermercado",
        "description": "Poodle branco bem tratado encontrado junto ao mercado municipal. Parece domesticado e está bem alimentado.",
        "reporter_name": "Rui Figueiredo",
        "reporter_email": "test+rui@salvacao.local",
        "reporter_phone": "+351 963 456 789",
        "days_ago": 1,
    },
    {
        "type": "encontrado",
        "dog_name": None,
        "breed": "Labrador",
        "api_breed": "labrador",
        "sex": "macho",
        "size": "grande",
        "primary_color": "Preto",
        "secondary_color": None,
        "distinctive_marks": ["Cicatriz no flanco esquerdo", "Sem coleira"],
        "age_estimate": "Jovem, 1-2 anos",
        "has_chip": None,
        "chip_last_3": None,
        "municipality": "Olhão",
        "zone": "Estrada nacional",
        "description": "Labrador preto encontrado na EN125. Muito assustado e esfomeado. Aparenta estar perdido há vários dias.",
        "reporter_name": "Margarida Lopes",
        "reporter_email": "test+margarida@salvacao.local",
        "reporter_phone": "+351 914 321 654",
        "days_ago": 2,
    },
    {
        "type": "encontrado",
        "dog_name": None,
        "breed": "Border Collie",
        "api_breed": "collie-border",
        "sex": "femea",
        "size": "medio",
        "primary_color": "Preto",
        "secondary_color": "Branco",
        "distinctive_marks": ["Mancha branca no pescoço", "Pata dianteira esquerda branca"],
        "age_estimate": "Jovem adulto",
        "has_chip": None,
        "chip_last_3": None,
        "municipality": "Lagoa",
        "zone": "Campo",
        "description": "Border Collie encontrada a correr sozinha junto à A22. Muito inteligente e obediente. Parece de alguém que a treinou bem.",
        "reporter_name": "António Pereira",
        "reporter_email": "test+antonio@salvacao.local",
        "reporter_phone": "+351 966 543 210",
        "days_ago": 1,
    },
]


def get_sb():
    from supabase import create_client
    return create_client(SUPABASE_URL, SUPABASE_KEY)


def fetch_dog_image(breed_slug: str) -> bytes:
    # Dog CEO uses slashes for sub-breeds: retriever/golden not retriever-golden
    api_slug = breed_slug.replace("-", "/", 1) if "-" in breed_slug else breed_slug
    resp = httpx.get(f"{DOG_CEO}/{api_slug}/images/random", timeout=10)
    resp.raise_for_status()
    img_url = resp.json()["message"]
    img_resp = httpx.get(img_url, timeout=20, follow_redirects=True)
    img_resp.raise_for_status()
    return img_resp.content


def ensure_buckets(sb) -> None:
    """Create storage buckets if they don't exist."""
    buckets = sb.storage.list_buckets()
    existing = {b.name for b in buckets}
    for bucket, public in [("case-images-original", False), ("case-images-public", True)]:
        if bucket not in existing:
            sb.storage.create_bucket(bucket, options={"public": public})
            print(f"  Created bucket: {bucket}")


def make_slug(case: dict) -> str:
    import re
    parts = [case["type"]]
    if case.get("dog_name"):
        parts.append(case["dog_name"].lower())
    parts.append(case["breed"].lower().replace(" ", "-"))
    parts.append(case["municipality"].lower().replace(" ", "-"))
    parts.append(uuid.uuid4().hex[:6])
    slug = "-".join(parts)
    return re.sub(r"[^a-z0-9-]", "", slug)


def seed(dry_run: bool = False) -> None:
    print(f"{'DRY RUN — ' if dry_run else ''}Seeding {len(CASES)} test cases")
    print(f"Target: {SUPABASE_URL}\n")

    sb = get_sb() if not dry_run else None

    if not dry_run:
        ensure_buckets(sb)

    created = 0
    for i, case in enumerate(CASES):
        label = f"{case['type'].upper()} — {case.get('dog_name') or case['breed']}, {case['municipality']}"
        print(f"[{i+1:02d}/{len(CASES)}] {label}")

        try:
            print(f"  Downloading {case['api_breed']} photo...", end=" ", flush=True)
            image_bytes = fetch_dog_image(case["api_breed"])
            print(f"{len(image_bytes)//1024}KB")
        except Exception as e:
            print(f"FAIL: {e}")
            continue

        if dry_run:
            print("  [dry-run] would insert case")
            continue

        # Upload original photo
        case_id = str(uuid.uuid4())
        img_id = str(uuid.uuid4())
        storage_path = f"original/{case_id}/0-seed.jpg"

        try:
            sb.storage.from_("case-images-original").upload(
                storage_path,
                image_bytes,
                file_options={"content-type": "image/jpeg", "upsert": "true"},
            )
        except Exception as e:
            print(f"  Upload failed: {e}")
            continue

        # Insert case
        last_seen_at = (datetime.now(timezone.utc) - timedelta(days=case["days_ago"])).isoformat()
        slug = make_slug(case)

        case_row = {
            "id": case_id,
            "slug": slug,
            "type": case["type"],
            "status": "ativo",
            "sensitivity": "publico",
            "dog_name": case.get("dog_name"),
            "breed": case["breed"],
            "sex": case["sex"],
            "neutered": False,
            "size": case["size"],
            "primary_color": case["primary_color"],
            "secondary_color": case.get("secondary_color"),
            "distinctive_marks": case.get("distinctive_marks", []),
            "age_estimate": case.get("age_estimate"),
            "has_chip": case.get("has_chip"),
            "chip_last_3": case.get("chip_last_3"),
            "last_seen_at": last_seen_at,
            "last_seen_municipality": case["municipality"],
            "last_seen_zone_approx": case["zone"],
            "description": case["description"],
            "reporter_name": case["reporter_name"],
            "reporter_email": case["reporter_email"],
            "reporter_phone": case.get("reporter_phone"),
            "reporter_contact_public": case.get("reporter_phone"),
            "admin_notes": TEST_TAG,
        }

        try:
            sb.table("cases").insert(case_row).execute()
        except Exception as e:
            print(f"  Case insert failed: {e}")
            continue

        # Insert case_image row (no embedding yet — ML service would add it)
        img_row = {
            "id": img_id,
            "case_id": case_id,
            "storage_path_original": storage_path,
            "is_primary": True,
            "image_type": "referencia",
        }
        try:
            sb.table("case_images").insert(img_row).execute()
        except Exception as e:
            print(f"  case_images insert failed: {e}")

        print(f"  ✓ Created: /pt/caso/{slug}")
        created += 1

    print(f"\n{'='*50}")
    print(f"Done: {created}/{len(CASES)} cases seeded.")
    if created:
        print(f"All tagged admin_notes='{TEST_TAG}'")
        print(f"Remove with: uv run python scripts/seed_test_cases.py --remove")


def remove_test_data() -> None:
    sb = get_sb()
    # First find all test case IDs to delete their images from storage
    result = sb.table("cases").select("id, slug").eq("admin_notes", TEST_TAG).execute()
    cases = result.data or []
    print(f"Found {len(cases)} test cases to remove")

    for case in cases:
        cid = case["id"]
        # Delete storage files
        imgs = sb.table("case_images").select("storage_path_original, storage_path_public").eq("case_id", cid).execute().data or []
        for img in imgs:
            for bucket, path_key in [("case-images-original", "storage_path_original"), ("case-images-public", "storage_path_public")]:
                path = img.get(path_key)
                if path:
                    try:
                        sb.storage.from_(bucket).remove([path])
                    except Exception:
                        pass

    # Delete cases (cascade deletes case_images, visual_matches)
    del_result = sb.table("cases").delete().eq("admin_notes", TEST_TAG).execute()
    print(f"Removed {len(del_result.data or [])} test cases + all related images.")


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--remove", action="store_true")
    parser.add_argument("--dry-run", action="store_true")
    args = parser.parse_args()

    if args.remove:
        remove_test_data()
    else:
        seed(dry_run=args.dry_run)
