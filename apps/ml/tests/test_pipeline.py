"""Basic pipeline tests — no ML models needed, uses synthetic images."""
import numpy as np
from PIL import Image

from pipeline.quality import compute_quality


def make_test_image(w: int = 300, h: int = 300) -> Image.Image:
    arr = np.random.randint(0, 255, (h, w, 3), dtype=np.uint8)
    return Image.fromarray(arr)


def test_quality_returns_float():
    img = make_test_image()
    score = compute_quality(img)
    assert isinstance(score, float)
    assert 0.0 <= score <= 1.0


def test_quality_small_image_penalised():
    big = make_test_image(400, 400)
    small = make_test_image(32, 32)
    assert compute_quality(big) >= compute_quality(small)
