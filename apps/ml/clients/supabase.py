import io
import os
from functools import lru_cache

from PIL import Image
from supabase import create_client, Client


@lru_cache(maxsize=1)
def get_client() -> Client:
    return create_client(
        os.environ["NEXT_PUBLIC_SUPABASE_URL"],
        os.environ["SUPABASE_SERVICE_ROLE_KEY"],
    )


def download_original(storage_path: str) -> bytes:
    return get_client().storage.from_("case-images-original").download(storage_path)


def upload_public(image: Image.Image, original_path: str) -> str:
    """Upload blurred WebP to public bucket, return storage path."""
    client = get_client()

    buffer = io.BytesIO()
    image.save(buffer, format="WEBP", quality=85)
    buffer.seek(0)

    public_path = original_path.replace("original/", "public/", 1)
    if not public_path.endswith(".webp"):
        public_path = public_path.rsplit(".", 1)[0] + ".webp"

    client.storage.from_("case-images-public").upload(
        public_path,
        buffer.getvalue(),
        {"content-type": "image/webp", "upsert": "true"},
    )
    return public_path
