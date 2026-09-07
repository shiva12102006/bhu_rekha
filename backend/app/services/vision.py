import cv2
import numpy as np
import difflib

def deskew_image(image_bytes: bytes) -> bytes:
    """Deskews an image using OpenCV minAreaRect if it is rotated > 5 degrees."""
    nparr = np.frombuffer(image_bytes, np.uint8)
    img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    if img is None:
        return image_bytes

    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    # Invert image for better thresholding of text
    gray = cv2.bitwise_not(gray)
    thresh = cv2.threshold(gray, 0, 255, cv2.THRESH_BINARY | cv2.THRESH_OTSU)[1]
    
    coords = np.column_stack(np.where(thresh > 0))
    if coords.size == 0:
        return image_bytes
        
    angle = cv2.minAreaRect(coords)[-1]
    if angle < -45:
        angle = -(90 + angle)
    else:
        angle = -angle

    if abs(angle) > 5:
        (h, w) = img.shape[:2]
        center = (w // 2, h // 2)
        M = cv2.getRotationMatrix2D(center, angle, 1.0)
        rotated = cv2.warpAffine(img, M, (w, h), flags=cv2.INTER_CUBIC, borderMode=cv2.BORDER_REPLICATE)
        success, encoded = cv2.imencode('.jpg', rotated)
        if success:
            return encoded.tobytes()

    return image_bytes

def denoise_image(image_bytes: bytes) -> bytes:
    """Cleans faded ink / bleeding using Adaptive Thresholding and Morphological Operations."""
    nparr = np.frombuffer(image_bytes, np.uint8)
    img = cv2.imdecode(nparr, cv2.IMREAD_GRAYSCALE)
    if img is None:
        return image_bytes

    # Adaptive Thresholding (Otsu-like localized)
    thresh = cv2.adaptiveThreshold(img, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, cv2.THRESH_BINARY, 11, 2)
    # Morphological opening to remove noise
    kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (2, 2))
    opened = cv2.morphologyEx(thresh, cv2.MORPH_OPEN, kernel)
    
    success, encoded = cv2.imencode('.jpg', opened)
    if success:
        return encoded.tobytes()
    return image_bytes

def fuzzy_match(text1: str, text2: str) -> float:
    """Returns a similarity score between 0 and 1 for two strings."""
    if not text1 and not text2:
        return 1.0
    if not text1 or not text2:
        return 0.0
    return difflib.SequenceMatcher(None, str(text1).lower().strip(), str(text2).lower().strip()).ratio()
