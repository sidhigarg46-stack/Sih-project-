"""
backend/cv/segmentation.py
Isolates individual onions via deep-learning ONNX object detection (best.onnx at conf=0.2)
with fallback to classical multi-channel thresholding and watershed segmentation.
Computes physical diameter (mm) and circularity index (4*pi*Area/Perimeter^2).
"""

import cv2
import numpy as np
from typing import List, Dict, Any, Tuple, Optional
from .onion_detector import detect_onions_onnx

def segment_onions_classical(
    image_bgr: np.ndarray,
    pixels_per_mm: float,
    reference_circle: Tuple[int, int, int] = None,
    min_onion_diameter_mm: float = 15.0
) -> List[Dict[str, Any]]:
    """
    Classical CV fallback: Segments onions using color spaces + distance transform + watershed.
    """
    h, w = image_bgr.shape[:2]
    min_onion_radius_px = max(8, int((min_onion_diameter_mm / 2.0) * pixels_per_mm))
    min_area_px = int(np.pi * (min_onion_radius_px ** 2) * 0.45)

    # 1. Mask out reference object if detected
    ref_mask = np.zeros((h, w), dtype=np.uint8)
    if reference_circle is not None:
        rcx, rcy, rr = reference_circle
        cv2.circle(ref_mask, (rcx, rcy), int(rr * 1.35), 255, -1)

    # 2. Multi-channel foreground segmentation
    gray = cv2.cvtColor(image_bgr, cv2.COLOR_BGR2GRAY)
    hsv = cv2.cvtColor(image_bgr, cv2.COLOR_BGR2HSV)
    lab = cv2.cvtColor(image_bgr, cv2.COLOR_BGR2LAB)

    corners = [gray[0:15, 0:15], gray[0:15, -15:], gray[-15:, 0:15], gray[-15:, -15:]]
    corner_mean = np.mean([np.mean(c) for c in corners])
    
    blurred_gray = cv2.GaussianBlur(gray, (7, 7), 0)
    if corner_mean > 120:
        _, fg_gray = cv2.threshold(blurred_gray, 0, 255, cv2.THRESH_BINARY_INV + cv2.THRESH_OTSU)
    else:
        _, fg_gray = cv2.threshold(blurred_gray, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)

    _, fg_sat = cv2.threshold(hsv[:, :, 1], 30, 255, cv2.THRESH_BINARY)
    a_channel = lab[:, :, 1]
    _, fg_lab = cv2.threshold(a_channel, 132, 255, cv2.THRESH_BINARY)

    fg_combined = cv2.bitwise_or(fg_gray, fg_sat)
    fg_combined = cv2.bitwise_or(fg_combined, fg_lab)
    fg_combined[ref_mask > 0] = 0

    kernel_close = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (9, 9))
    closed = cv2.morphologyEx(fg_combined, cv2.MORPH_CLOSE, kernel_close, iterations=2)
    
    kernel_open = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (5, 5))
    opened = cv2.morphologyEx(closed, cv2.MORPH_OPEN, kernel_open, iterations=1)

    # 3. Distance Transform + Watershed
    dist_transform = cv2.distanceTransform(opened, cv2.DIST_L2, 5)
    if dist_transform.max() > 0:
        _, sure_fg = cv2.threshold(dist_transform, 0.42 * dist_transform.max(), 255, 0)
        sure_fg = np.uint8(sure_fg)
        sure_bg = cv2.dilate(opened, kernel_open, iterations=3)
        unknown = cv2.subtract(sure_bg, sure_fg)
        _, markers = cv2.connectedComponents(sure_fg)
        markers = markers + 1
        markers[unknown == 255] = 0
        markers = cv2.watershed(image_bgr.copy(), markers)
    else:
        markers = np.zeros((h, w), dtype=np.int32)

    # 4. Extract individual onion contours
    segmented_onions = []
    unique_markers = np.unique(markers)

    for marker_id in unique_markers:
        if marker_id <= 1:
            continue

        onion_mask = np.uint8(markers == marker_id) * 255
        
        if np.any((onion_mask > 0) & (ref_mask > 0)):
            overlap_ratio = np.sum((onion_mask > 0) & (ref_mask > 0)) / (np.sum(onion_mask > 0) + 1e-5)
            if overlap_ratio > 0.2:
                continue

        contours, _ = cv2.findContours(onion_mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        if not contours:
            continue

        c = max(contours, key=cv2.contourArea)
        area = cv2.contourArea(c)
        if area < min_area_px:
            continue

        perimeter = cv2.arcLength(c, True)
        if perimeter == 0:
            continue

        circularity = (4.0 * np.pi * area) / (perimeter ** 2)
        circularity = min(1.0, max(0.0, float(circularity)))

        (cx, cy), radius = cv2.minEnclosingCircle(c)
        enc_diameter_px = 2.0 * radius
        equiv_diameter_px = 2.0 * np.sqrt(area / np.pi)
        diameter_px = 0.5 * (enc_diameter_px + equiv_diameter_px)
        diameter_mm = float(diameter_px / max(pixels_per_mm, 1e-4))

        if diameter_mm > 160.0 or diameter_mm < min_onion_diameter_mm:
            continue

        bx, by, bw, bh = cv2.boundingRect(c)
        onion_submask = onion_mask[by:by+bh, bx:bx+bw]
        onion_roi = image_bgr[by:by+bh, bx:bx+bw].copy()

        local_contour = c.copy()
        local_contour[:, 0, 0] -= bx
        local_contour[:, 0, 1] -= by

        segmented_onions.append({
            "contour": c,
            "local_contour": local_contour,
            "area_px": float(area),
            "perimeter_px": float(perimeter),
            "circularity": round(circularity, 2),
            "diameter_mm": round(diameter_mm, 1),
            "bbox": (int(bx), int(by), int(bw), int(bh)),
            "center": (int(cx), int(cy)),
            "roi": onion_roi,
            "submask": onion_submask,
            "confidence": 1.0
        })

    segmented_onions.sort(key=lambda o: (o["bbox"][1] // 120, o["bbox"][0]))
    return segmented_onions

def segment_onions(
    image_bgr: np.ndarray,
    pixels_per_mm: float,
    reference_circle: Tuple[int, int, int] = None,
    min_onion_diameter_mm: float = 15.0,
    conf_threshold: float = 0.2
) -> List[Dict[str, Any]]:
    """
    Primary entry point: Detects and segments onions using best.onnx model
    with a confidence score threshold of 0.2.
    Falls back to classical CV segmentation if no detections are produced.
    """
    try:
        onnx_onions = detect_onions_onnx(
            image_bgr=image_bgr,
            pixels_per_mm=pixels_per_mm,
            reference_circle=reference_circle,
            conf_threshold=conf_threshold
        )
        if onnx_onions and len(onnx_onions) > 0:
            return onnx_onions
    except Exception as exc:
        # Fall back if error occurs during model execution
        pass

    return segment_onions_classical(
        image_bgr=image_bgr,
        pixels_per_mm=pixels_per_mm,
        reference_circle=reference_circle,
        min_onion_diameter_mm=min_onion_diameter_mm
    )
