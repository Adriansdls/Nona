FROM python:3.12-slim

WORKDIR /app

RUN pip install --no-cache-dir uv

COPY pyproject.toml .

RUN uv pip install --system \
    "python-telegram-bot[job-queue]>=21.0" \
    "anthropic>=0.40" \
    "openai>=1.57" \
    "supabase>=2.9" \
    "httpx>=0.27" \
    "python-dotenv>=1.0" \
    "structlog>=24.0"

COPY . .

CMD ["python", "main.py"]
