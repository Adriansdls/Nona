import torch
import numpy as np
from PIL import Image


def compute_embedding(
    dog_crop: Image.Image,
    model,
    processor,
    device: torch.device,
) -> np.ndarray:
    """
    DINOv2-large CLS token embedding of dog crop.
    Returns float32 array of shape (768,).
    """
    inputs = processor(images=dog_crop, return_tensors="pt").to(device)

    with torch.no_grad():
        outputs = model(**inputs)

    # CLS token = first token of last hidden state
    embedding = outputs.last_hidden_state[:, 0, :].squeeze().cpu().numpy()
    return embedding.astype(np.float32)
