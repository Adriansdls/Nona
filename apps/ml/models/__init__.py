from dataclasses import dataclass
import torch
import timm
from ultralytics import YOLO
from sam2.build_sam import build_sam2_hf
from sam2.sam2_image_predictor import SAM2ImagePredictor


@dataclass
class AppModels:
    yolo: YOLO
    megadescriptor: torch.nn.Module
    sam2: SAM2ImagePredictor
    device: torch.device

    @classmethod
    def load(cls, device: torch.device) -> "AppModels":
        # YOLOv11s — dog/person detection (~20MB, CPU)
        yolo = YOLO("yolo11s.pt")

        # MegaDescriptor-L-384 — SOTA individual animal re-ID (~1.3GB)
        # ViT-L/14 fine-tuned on wildlife + domestic animal re-ID datasets
        megadescriptor = timm.create_model(
            "hf-hub:BVRA/MegaDescriptor-L-384",
            pretrained=True,
            num_classes=0,  # feature extraction mode, output dim=1024
        ).to(device).eval()

        # SAM2-Tiny — precise dog segmentation (~40MB)
        # build_sam2_hf downloads config + weights from HuggingFace automatically
        sam2_model = build_sam2_hf("facebook/sam2-hiera-tiny", device=str(device))
        sam2 = SAM2ImagePredictor(sam2_model)

        return cls(yolo=yolo, megadescriptor=megadescriptor, sam2=sam2, device=device)
