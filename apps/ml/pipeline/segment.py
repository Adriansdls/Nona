from PIL import Image
import numpy as np


def segment_dog(image: Image.Image, bbox: dict, sam2) -> Image.Image:
    """
    Use SAM2 to get precise dog mask from YOLO bbox hint.
    Returns masked crop with background replaced by mean color.
    Falls back to plain bbox crop if SAM2 fails.
    """
    try:
        img_np = np.array(image)
        sam2.set_image(img_np)

        x, y, w, h = bbox["x"], bbox["y"], bbox["w"], bbox["h"]
        input_box = np.array([[x, y, x + w, y + h]], dtype=np.float32)

        masks, _, _ = sam2.predict(
            point_coords=None,
            point_labels=None,
            box=input_box,
            multimask_output=False,
        )
        mask = masks[0].astype(bool)

        result = img_np.copy()
        if (~mask).any():
            bg_color = img_np[~mask].mean(axis=0).astype(np.uint8)
        else:
            bg_color = np.array([128, 128, 128], dtype=np.uint8)
        result[~mask] = bg_color

        cropped = result[y : y + h, x : x + w]
        return Image.fromarray(cropped)
    except Exception:
        # Fall back to plain bbox crop if segmentation fails
        x, y, w, h = bbox["x"], bbox["y"], bbox["w"], bbox["h"]
        return image.crop((x, y, x + w, y + h))
