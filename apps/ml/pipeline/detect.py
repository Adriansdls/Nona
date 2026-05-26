from PIL import Image

COCO_DOG_CLASS = 16


def detect_dog(image: Image.Image, yolo) -> tuple[Image.Image, dict]:
    """
    Detect dog in image and return cropped region + bounding box.
    Falls back to full image if no dog detected (quality score will reflect this).
    """
    results = yolo(image, classes=[COCO_DOG_CLASS], verbose=False)

    if not results or not results[0].boxes or len(results[0].boxes) == 0:
        w, h = image.size
        return image, {"x": 0, "y": 0, "w": w, "h": h, "confidence": 0.0}

    boxes = results[0].boxes
    best_idx = int(boxes.conf.argmax().item())
    x1, y1, x2, y2 = [int(v) for v in boxes.xyxy[best_idx].tolist()]
    confidence = float(boxes.conf[best_idx].item())

    crop = image.crop((x1, y1, x2, y2))
    return crop, {"x": x1, "y": y1, "w": x2 - x1, "h": y2 - y1, "confidence": confidence}
