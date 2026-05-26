import asyncio
import io
import os
from contextlib import asynccontextmanager

import torch
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from PIL import Image
from pydantic import BaseModel

# Must be set before importing torch MPS ops
os.environ.setdefault("PYTORCH_ENABLE_MPS_FALLBACK", "1")

load_dotenv("../../.env.local")

from models import AppModels
from pipeline.detect import detect_dog
from pipeline.blur import blur_pii
from pipeline.quality import compute_quality
from pipeline.embed import compute_embedding
from clients.supabase import download_original, upload_public

DEVICE = torch.device("mps" if torch.backends.mps.is_available() else "cpu")

# Limit concurrent ML inference — MPS is not safe for concurrent GPU ops
INFERENCE_SEMAPHORE = asyncio.Semaphore(2)


@asynccontextmanager
async def lifespan(app: FastAPI):
    app.state.models = AppModels.load(device=DEVICE)
    print(f"Models loaded on device: {DEVICE}")
    yield
    del app.state.models


app = FastAPI(title="SalvaCão ML Service", version="0.1.0", lifespan=lifespan)


class ProcessImageRequest(BaseModel):
    storage_path: str
    case_image_id: str


class ProcessImageResponse(BaseModel):
    embedding: list[float]
    bbox: dict
    quality_score: float
    public_path: str


@app.post("/process-image", response_model=ProcessImageResponse)
async def process_image(req: ProcessImageRequest):
    async with INFERENCE_SEMAPHORE:
        try:
            result = await asyncio.to_thread(
                _process_sync,
                req.storage_path,
                app.state.models,
            )
            return result
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))


def _process_sync(storage_path: str, models: AppModels) -> dict:
    raw = download_original(storage_path)
    image = Image.open(io.BytesIO(raw)).convert("RGB")

    dog_crop, bbox = detect_dog(image, models.yolo)
    blurred = blur_pii(image, models.yolo)
    quality = compute_quality(dog_crop)
    embedding = compute_embedding(dog_crop, models.dinov2, models.processor, models.device)
    public_path = upload_public(blurred, storage_path)

    return {
        "embedding": embedding.tolist(),
        "bbox": bbox,
        "quality_score": quality,
        "public_path": public_path,
    }


class EmbedOnlyRequest(BaseModel):
    storage_path: str


class EmbedOnlyResponse(BaseModel):
    embedding: list[float]
    quality_score: float


@app.post("/embed-only", response_model=EmbedOnlyResponse)
async def embed_only(req: EmbedOnlyRequest):
    """Embed a staged photo without uploading a public version. Used by bot similarity search."""
    async with INFERENCE_SEMAPHORE:
        try:
            result = await asyncio.to_thread(
                _embed_only_sync,
                req.storage_path,
                app.state.models,
            )
            return result
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))


def _embed_only_sync(storage_path: str, models: AppModels) -> dict:
    raw = download_original(storage_path)
    image = Image.open(io.BytesIO(raw)).convert("RGB")
    dog_crop, _ = detect_dog(image, models.yolo)
    quality = compute_quality(dog_crop)
    embedding = compute_embedding(dog_crop, models.dinov2, models.processor, models.device)
    return {"embedding": embedding.tolist(), "quality_score": quality}


@app.get("/health")
async def health():
    return {"status": "ok", "device": str(DEVICE)}
