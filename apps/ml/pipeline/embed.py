import torch
import timm
import numpy as np
from PIL import Image


def compute_embedding(dog_crop: Image.Image, model: torch.nn.Module, device: torch.device) -> np.ndarray:
    """
    MegaDescriptor-L-384 embedding of dog crop.
    Returns float32 array of shape (1024,).
    """
    data_config = timm.data.resolve_model_data_config(model)
    transform = timm.data.create_transform(**data_config, is_training=False)

    tensor = transform(dog_crop).unsqueeze(0).to(device)
    with torch.no_grad():
        features = model(tensor)
        # L2-normalize: MegaDescriptor trained on hypersphere — raw features need normalization
        features = torch.nn.functional.normalize(features, p=2, dim=-1)

    return features.squeeze().cpu().numpy().astype(np.float32)
