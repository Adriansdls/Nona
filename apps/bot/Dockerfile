FROM python:3.12-slim

WORKDIR /app

RUN pip install --no-cache-dir uv

COPY pyproject.toml uv.lock ./

RUN uv sync --frozen --no-dev

RUN uv run playwright install chromium --with-deps

COPY . .

CMD ["uv", "run", "python", "main.py"]
