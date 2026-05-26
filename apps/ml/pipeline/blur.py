from PIL import Image, ImageFilter

COCO_PERSON_CLASS = 0


def blur_pii(image: Image.Image, yolo) -> Image.Image:
    """
    Blur faces (top 35% of person bounding boxes) in a copy of the image.
    Plate detection is deferred — requires a specialized model.
    """
    img_copy = image.copy()
    results = yolo(image, classes=[COCO_PERSON_CLASS], verbose=False)

    if not results or not results[0].boxes or len(results[0].boxes) == 0:
        return img_copy

    for box in results[0].boxes.xyxy.tolist():
        x1, y1, x2, y2 = map(int, box)
        # Face is approximately the top 35% of the person bounding box
        face_y2 = y1 + int((y2 - y1) * 0.35)
        face_region = img_copy.crop((x1, y1, x2, face_y2))
        blurred = face_region.filter(ImageFilter.GaussianBlur(radius=25))
        img_copy.paste(blurred, (x1, y1))

    return img_copy
