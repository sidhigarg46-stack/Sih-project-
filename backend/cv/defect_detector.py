"""
backend/cv/defect_detector.py
Classical computer vision defect detection module:
- Rot: HSV thresholding for dark/black necrotic patches
- Sprouting: HSV thresholding for green chlorophyll hues
- Mechanical Damage: Contour convexity defects for cuts, gouges, and deep notches
"""

import cv2
import numpy as np
from typing import Dict, Any

def detect_onion_defects(
    onion_bgr: np.ndarray,
    onion_submask: np.ndarray,
    local_contour: np.ndarray,
    pixels_per_mm: float
) -> Dict[str, Any]:
    """
    Evaluates an isolated onion for Rot, Sprouting, and Mechanical Damage.
    """
    total_onion_pixels = int(np.sum(onion_submask > 0))
    if total_onion_pixels == 0:
        return {
            "defect_rot": False,
            "defect_sprout": False,
            "defect_damage": False,
            "rot_area_ratio": 0.0,
            "sprout_area_ratio": 0.0,
            "max_defect_depth_mm": 0.0
        }

    # Convert to HSV color space
    hsv = cv2.cvtColor(onion_bgr, cv2.COLOR_BGR2HSV)

    # 1. Rot Detection (Dark necrosis / black mould)
    # Characterized by very low Value/Brightness (V < 45) within the onion area.
    # A higher cutoff incorrectly treats normal brown skin and root shadows as rot.
    rot_lower = np.array([0, 0, 0], dtype=np.uint8)
    rot_upper = np.array([180, 255, 45], dtype=np.uint8)
    
    raw_rot_mask = cv2.inRange(hsv, rot_lower, rot_upper)
    valid_rot_mask = cv2.bitwise_and(raw_rot_mask, raw_rot_mask, mask=onion_submask)
    
    rot_kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (3, 3))
    cleaned_rot_mask = cv2.morphologyEx(valid_rot_mask, cv2.MORPH_OPEN, rot_kernel)
    rot_pixels = int(np.sum(cleaned_rot_mask > 0))
    rot_area_ratio = float(rot_pixels / total_onion_pixels)
    
    # Rot threshold: >= 1.5% dark necrotic area
    defect_rot = rot_area_ratio >= 0.015

    # 2. Sprouting Detection (Emergence of chlorophyll-rich green shoots)
    # Green in HSV: Hue ~ 30 to 88
    sprout_lower = np.array([30, 40, 35], dtype=np.uint8)
    sprout_upper = np.array([88, 255, 255], dtype=np.uint8)
    
    raw_sprout_mask = cv2.inRange(hsv, sprout_lower, sprout_upper)
    valid_sprout_mask = cv2.bitwise_and(raw_sprout_mask, raw_sprout_mask, mask=onion_submask)
    
    sprout_kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (3, 3))
    cleaned_sprout_mask = cv2.morphologyEx(valid_sprout_mask, cv2.MORPH_OPEN, sprout_kernel)
    sprout_pixels = int(np.sum(cleaned_sprout_mask > 0))
    sprout_area_ratio = float(sprout_pixels / total_onion_pixels)
    
    # Sprouting threshold: >= 0.7% or >= 20 green pixels
    defect_sprout = (sprout_area_ratio >= 0.007) or (sprout_pixels >= 20)

    # 3. Mechanical Damage Detection (Convexity Defects)
    # Evaluates sharp inward cuts or gouges into the bulb flesh
    defect_damage = False
    max_depth_px = 0.0
    
    # Simplify contour slightly
    epsilon = 0.005 * cv2.arcLength(local_contour, True)
    approx_contour = cv2.approxPolyDP(local_contour, epsilon, True)
    
    if len(approx_contour) >= 4:
        hull_indices = cv2.convexHull(approx_contour, returnPoints=False)
        if hull_indices is not None and len(hull_indices) > 3:
            try:
                defects = cv2.convexityDefects(approx_contour, hull_indices)
                if defects is not None:
                    for i in range(defects.shape[0]):
                        s_idx, e_idx, f_idx, d = defects[i, 0]
                        depth = d / 256.0
                        
                        # Point coordinates of the deepest defect point
                        far_pt = approx_contour[f_idx][0]
                        fx, fy = int(far_pt[0]), int(far_pt[1])
                        
                        # Verify that this concavity isn't simply the junction of a green sprout
                        is_near_sprout = False
                        if defect_sprout:
                            # Sample small neighborhood around the defect point in the sprout mask
                            ny_min, ny_max = max(0, fy - 8), min(onion_bgr.shape[0], fy + 8)
                            nx_min, nx_max = max(0, fx - 8), min(onion_bgr.shape[1], fx + 8)
                            if np.any(cleaned_sprout_mask[ny_min:ny_max, nx_min:nx_max] > 0):
                                is_near_sprout = True
                        
                        if not is_near_sprout and depth > max_depth_px:
                            max_depth_px = depth
            except Exception:
                pass

    max_depth_mm = float(max_depth_px / max(pixels_per_mm, 1e-4))
    
    # Flag mechanical damage if an inward cut exceeds 3.2 mm (or ~12px)
    if max_depth_mm >= 3.2:
        defect_damage = True

    return {
        "defect_rot": bool(defect_rot),
        "defect_sprout": bool(defect_sprout),
        "defect_damage": bool(defect_damage),
        "rot_area_ratio": round(rot_area_ratio, 4),
        "sprout_area_ratio": round(sprout_area_ratio, 4),
        "max_defect_depth_mm": round(max_depth_mm, 2)
    }
