import numpy as np
from PIL import Image


def compute_quality(dog_crop: Image.Image) -> float:
    """
    Quality score 0.0–1.0 based on sharpness, exposure, and minimum area.
    """
    import cv2

    img = np.array(dog_crop.convert("L"))
    h, w = img.shape

    # Sharpness: Laplacian variance
    laplacian_var = cv2.Laplacian(img, cv2.CV_64F).var()
    sharpness = min(laplacian_var / 500.0, 1.0)

    # Exposure: standard deviation of pixel histogram
    hist = np.histogram(img, bins=32, range=(0, 256))[0].astype(float)
    hist /= hist.sum() + 1e-9
    exposure = min(float(hist.std()) * 20, 1.0)

    # Size: penalise crops smaller than 64×64
    size = min((h * w) / (200.0 * 200.0), 1.0)

    score = 0.4 * sharpness + 0.3 * exposure + 0.3 * size
    return round(float(score), 4)
