from dataclasses import dataclass
import torch
from ultralytics import YOLO
from transformers import AutoImageProcessor, AutoModel


@dataclass
class AppModels:
    yolo: YOLO
    dinov2: AutoModel
    processor: AutoImageProcessor
    device: torch.device

    @classmethod
    def load(cls, device: torch.device) -> "AppModels":
        # YOLOv11s — auto-downloads on first run (~20MB)
        # Keep on CPU: fast enough for detection, avoids MPS quirks
        yolo = YOLO("yolo11s.pt")

        # DINOv2-large — auto-downloads on first run (~1.3GB)
        # float32 required: float16 has correctness issues on MPS
        processor = AutoImageProcessor.from_pretrained("facebook/dinov2-large")
        dinov2 = (
            AutoModel.from_pretrained(
                "facebook/dinov2-large",
                torch_dtype=torch.float32,
            )
            .to(device)
            .eval()
        )

        return cls(yolo=yolo, dinov2=dinov2, processor=processor, device=device)
