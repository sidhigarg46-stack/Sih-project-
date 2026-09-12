"""
backend/cv/reference_detector.py
Detects calibration reference object (e.g. INR 5 coin: 23mm, INR 10 coin: 27mm, or circular disc)
to determine the pixels-per-millimeter (PPM) calibration ratio.
"""

import cv2
import numpy as np
from typing import Tuple, Optional, Dict, Any

def detect_reference_object(
    image_bgr: np.ndarray,
    known_diameter_mm: float = 23.0, # Standard INR 5 coin diameter
    roi_fraction_x: float = 0.28,    # Guide area in top-left
    roi_fraction_y: float = 0.28
) -> Tuple[float, Optional[Tuple[int, int, int]], Dict[str, Any]]:
    """
    Detects the reference coin/marker in the designated top-left calibration guide zone.
    Returns (pixels_per_mm, circle_tuple, debug_info).
    circle_tuple: (center_x, center_y, radius) in original image coordinates.
    """
    h, w = image_bgr.shape[:2]
    gray = cv2.cvtColor(image_bgr, cv2.COLOR_BGR2GRAY)
    
    # 1. Search strictly inside the top-left calibration guide quadrant
    roi_h = max(60, int(h * roi_fraction_y))
    roi_w = max(60, int(w * roi_fraction_x))
    roi_gray = gray[0:roi_h, 0:roi_w]
    roi_bgr = image_bgr[0:roi_h, 0:roi_w]
    
    # Blur to suppress noise
    blurred_roi = cv2.GaussianBlur(roi_gray, (7, 7), 1.5)
    
    # Expected coin radius constraints within the ROI
    min_radius = max(10, int(min(roi_h, roi_w) * 0.08))
    max_radius = int(min(roi_h, roi_w) * 0.65)
    
    detected_circle = None
    
    # Run Hough Circle Transform tuned for coins
    circles = cv2.HoughCircles(
        blurred_roi,
        cv2.HOUGH_GRADIENT,
        dp=1.2,
        minDist=min_radius * 2,
        param1=45,
        param2=25,
        minRadius=min_radius,
        maxRadius=max_radius
    )
    
    candidates = []
    if circles is not None:
        for c in np.round(circles[0, :]).astype("int"):
            cx, cy, r = int(c[0]), int(c[1]), int(c[2])
            # Ensure circle is fully inside the ROI
            if (cx - r >= -5) and (cy - r >= -5) and (cx + r <= roi_w + 5) and (cy + r <= roi_h + 5):
                candidates.append((cx, cy, r))

    # Contour search fallback in guide ROI
    if not candidates:
        edges = cv2.Canny(blurred_roi, 40, 120)
        kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (3, 3))
        edges = cv2.dilate(edges, kernel)
        contours, _ = cv2.findContours(edges, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        
        for c in contours:
            area = cv2.contourArea(c)
            perimeter = cv2.arcLength(c, True)
            if perimeter == 0 or area < 100:
                continue
            circularity = (4 * np.pi * area) / (perimeter ** 2)
            if circularity > 0.70:
                (x, y), radius = cv2.minEnclosingCircle(c)
                if min_radius <= radius <= max_radius:
                    candidates.append((int(x), int(y), int(radius)))

    if candidates:
        # Choose candidate closest to the center of the guide zone
        guide_center = (roi_w // 2, roi_h // 2)
        candidates.sort(key=lambda item: (item[0] - guide_center[0])**2 + (item[1] - guide_center[1])**2)
        cx, cy, rad = candidates[0]
        detected_circle = (cx, cy, rad)

    # Compute pixels_per_mm
    if detected_circle is not None:
        cx, cy, r = detected_circle
        diameter_px = 2.0 * r
        pixels_per_mm = diameter_px / known_diameter_mm
        debug_info = {
            "status": "detected",
            "center": (cx, cy),
            "radius_px": r,
            "diameter_px": diameter_px,
            "pixels_per_mm": round(pixels_per_mm, 2),
            "known_diameter_mm": known_diameter_mm
        }
    else:
        # Fallback estimation
        fallback_ppm = max(w, h) / 380.0
        fallback_r = int(fallback_ppm * (known_diameter_mm / 2.0))
        detected_circle = (roi_w // 2, roi_h // 2, fallback_r)
        pixels_per_mm = fallback_ppm
        debug_info = {
            "status": "estimated_fallback",
            "center": detected_circle[:2],
            "radius_px": fallback_r,
            "diameter_px": fallback_ppm * known_diameter_mm,
            "pixels_per_mm": round(fallback_ppm, 2),
            "known_diameter_mm": known_diameter_mm
        }

    return pixels_per_mm, detected_circle, debug_info
