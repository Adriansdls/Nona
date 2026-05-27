FROM python:3.12-slim

WORKDIR /app

# System deps for OpenCV headless + Pillow
RUN apt-get update && apt-get install -y --no-install-recommends \
    libglib2.0-0 libgl1 libgomp1 curl \
    && rm -rf /var/lib/apt/lists/*

# Install uv
RUN pip install --no-cache-dir uv

# Copy dependency manifest first (layer cache)
COPY pyproject.toml .

# Install CPU-only PyTorch + timm + SAM2 (force CPU wheels to keep image ~1.5GB not ~4GB)
RUN uv pip install --system \
    torch torchvision timm sam2 \
    --index-url https://download.pytorch.org/whl/cpu

# Install remaining dependencies
RUN uv pip install --system \
    "fastapi>=0.115" "uvicorn[standard]>=0.32" \
    "ultralytics>=8.3" \
    "Pillow>=10" "numpy>=1.26" "opencv-python-headless" \
    "httpx>=0.27" "supabase>=2.9" "python-dotenv>=1.0"

# Copy source
COPY . .

# Model cache lives on a persistent Fly volume at /cache
ENV HF_HOME=/cache/huggingface
ENV ULTRALYTICS_SETTINGS_DIR=/cache/ultralytics
ENV PYTORCH_ENABLE_MPS_FALLBACK=1

EXPOSE 8000

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "1"]
