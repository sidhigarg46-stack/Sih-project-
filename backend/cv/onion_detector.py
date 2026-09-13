"""
backend/cv/onion_detector.py
Loads best.onnx YOLO model and performs deep-learning-based onion detection
at a configurable confidence score (default: 0.2).
Extracts bounding boxes, ROIs, local contours, physical diameters (mm), and circularity.
"""

import os
import cv2
import logging
import numpy as np
from pathlib import Path
from typing import List, Dict, Any, Tuple, Optional
from ultralytics import YOLO

logger = logging.getLogger(__name__)

_MODEL_INSTANCE: Optional[YOLO] = None

def get_model_path() -> Path:
    """Resolves the location of best.onnx across workspace environments."""
    if "BEST_ONNX_PATH" in os.environ:
        custom_path = Path(os.environ["BEST_ONNX_PATH"])
        if custom_path.exists():
            return custom_path

    candidates = [
        Path(__file__).resolve().parent.parent.parent / "best.onnx",  # Workspace root
        Path(__file__).resolve().parent.parent / "best.onnx",         # backend/best.onnx
        Path.cwd() / "best.onnx",                                     # Current working directory
    ]

    for candidate in candidates:
        if candidate.exists():
            return candidate

    raise FileNotFoundError(
        f"best.onnx model not found in candidates: {[str(c) for c in candidates]}"
    )

def get_onion_model() -> YOLO:
    """Singleton getter for the YOLO ONNX model instance."""
    global _MODEL_INSTANCE
    if _MODEL_INSTANCE is None:
        model_path = get_model_path()
        logger.info(f"Loading best.onnx model from {model_path}")
        _MODEL_INSTANCE = YOLO(str(model_path), task="detect")
    return _MODEL_INSTANCE

def detect_onions_onnx(
    image_bgr: np.ndarray,
    pixels_per_mm: float,
    reference_circle: Optional[Tuple[int, int, int]] = None,
    conf_threshold: float = 0.2
) -> List[Dict[str, Any]]:
    """
    Detects onions using best.onnx YOLO model with confidence >= conf_threshold.
    Returns structured onion metadata dictionaries compatible with the grading pipeline.
    """
    model = get_onion_model()
    results = model(image_bgr, conf=conf_threshold, verbose=False)
    if not results or len(results) == 0:
        return []

    boxes = results[0].boxes
    if boxes is None or len(boxes) == 0:
        return []

    h_img, w_img = image_bgr.shape[:2]
    segmented_onions = []

    # Pre-calculate reference coin mask if present for overlap filtering
    ref_mask = None
    if reference_circle is not None:
        rcx, rcy, rr = reference_circle
        ref_mask = np.zeros((h_img, w_img), dtype=np.uint8)
        cv2.circle(ref_mask, (rcx, rcy), int(rr * 1.25), 255, -1)

    for box in boxes:
        conf = float(box.conf[0].cpu().numpy())
        xyxy = box.xyxy[0].cpu().numpy().astype(int)

        x1 = max(0, min(w_img - 1, int(xyxy[0])))
        y1 = max(0, min(h_img - 1, int(xyxy[1])))
        x2 = max(x1 + 1, min(w_img, int(xyxy[2])))
        y2 = max(y1 + 1, min(h_img, int(xyxy[3])))

        bw = x2 - x1
        bh = y2 - y1
        if bw < 5 or bh < 5:
            continue

        # Check overlap with reference circle
        if ref_mask is not None:
            box_ref_overlap = np.sum(ref_mask[y1:y2, x1:x2] > 0)
            box_area = bw * bh
            if (box_ref_overlap / max(box_area, 1)) > 0.40:
                # Detected region is primarily the reference coin
                continue

        roi = image_bgr[y1:y2, x1:x2].copy()
        rh, rw = roi.shape[:2]

        # Construct bulb submask inside bounding box using elliptical prior + color thresholding
        ellipse_mask = np.zeros((rh, rw), dtype=np.uint8)
        cv2.ellipse(ellipse_mask, (rw // 2, rh // 2), (rw // 2, rh // 2), 0, 0, 360, 255, -1)

        # Refined thresholding inside the localized bounding box
        gray_roi = cv2.cvtColor(roi, cv2.COLOR_BGR2GRAY)
        hsv_roi = cv2.cvtColor(roi, cv2.COLOR_BGR2HSV)
        blurred_roi = cv2.GaussianBlur(gray_roi, (5, 5), 0)

        _, fg_gray = cv2.threshold(blurred_roi, 0, 255, cv2.THRESH_BINARY_INV + cv2.THRESH_OTSU)
        _, fg_sat = cv2.threshold(hsv_roi[:, :, 1], 25, 255, cv2.THRESH_BINARY)
        fg_combined = cv2.bitwise_or(fg_gray, fg_sat)
        fg_combined = cv2.bitwise_and(fg_combined, ellipse_mask)

        cnts, _ = cv2.findContours(fg_combined, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        min_expected_area = 0.20 * (rw * rh)

        if cnts and cv2.contourArea(max(cnts, key=cv2.contourArea)) >= min_expected_area:
            local_c = max(cnts, key=cv2.contourArea)
            submask = np.zeros((rh, rw), dtype=np.uint8)
            cv2.drawContours(submask, [local_c], -1, 255, -1)
        else:
            cnts_ell, _ = cv2.findContours(ellipse_mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
            local_c = cnts_ell[0]
            submask = ellipse_mask

        area = float(cv2.contourArea(local_c))
        perimeter = float(cv2.arcLength(local_c, True))
        if perimeter > 0:
            circularity = (4.0 * np.pi * area) / (perimeter ** 2)
            circularity = min(1.0, max(0.0, float(circularity)))
        else:
            circularity = 0.85

        # Physical diameter calculation in mm
        (cx_rel, cy_rel), radius = cv2.minEnclosingCircle(local_c)
        enc_diameter_px = 2.0 * radius
        equiv_diameter_px = 2.0 * np.sqrt(area / np.pi) if area > 0 else enc_diameter_px
        box_dim_px = float(max(bw, bh))
        # Weighted estimate from enclosing geometry
        diameter_px = 0.5 * (0.5 * (enc_diameter_px + equiv_diameter_px) + box_dim_px)
        diameter_mm = float(diameter_px / max(pixels_per_mm, 1e-4))

        # Absolute contour in whole image coordinate space
        global_c = local_c.copy()
        global_c[:, 0, 0] += x1
        global_c[:, 0, 1] += y1

        center_x = int(x1 + rw / 2)
        center_y = int(y1 + rh / 2)

        segmented_onions.append({
            "contour": global_c,
            "local_contour": local_c,
            "area_px": area,
            "perimeter_px": perimeter,
            "circularity": round(circularity, 2),
            "diameter_mm": round(diameter_mm, 1),
            "bbox": (int(x1), int(y1), int(bw), int(bh)),
            "center": (center_x, center_y),
            "roi": roi,
            "submask": submask,
            "confidence": round(conf, 2)
        })

    # Sort in standard reading order: row-by-row then left-to-right
    segmented_onions.sort(key=lambda o: (o["bbox"][1] // 120, o["bbox"][0]))
    return segmented_onions
