"""
backend/cv/defect_detector.py
Defect screening module:
- Rot & Sprouting: MobileNetV2 deep learning classification (onion_classifier.onnx)
- Mechanical Damage: Classical contour convexity defects for cuts, gouges, and deep notches
"""

import cv2
import numpy as np
from typing import Dict, Any
from .defect_classifier import classify_onion

def detect_onion_defects(
    onion_bgr: np.ndarray,
    onion_submask: np.ndarray,
    local_contour: np.ndarray,
    pixels_per_mm: float
) -> Dict[str, Any]:
    """
    Evaluates an isolated onion for Rot, Sprouting, and Mechanical Damage.
    Rot and Sprouting are predicted via MobileNetV2 ONNX classifier.
    Mechanical damage is detected via classical contour convexity defect analysis.
    """
    if onion_bgr is None or onion_bgr.size == 0 or onion_bgr.shape[0] < 5 or onion_bgr.shape[1] < 5:
        return {
            "defect_rot": False,
            "defect_sprout": False,
            "defect_damage": False,
            "classifier_class": "healthy",
            "classifier_confidence": 0.0,
            "classifier_probabilities": {"healthy": 1.0, "rot": 0.0, "sprout": 0.0},
            "rot_area_ratio": 0.0,
            "sprout_area_ratio": 0.0,
            "max_defect_depth_mm": 0.0
        }

    # 1 & 2. Deep Learning Classification for Rot & Sprouting
    clf_res = classify_onion(onion_bgr)
    pred_class = clf_res["predicted_class"]
    clf_conf = clf_res["confidence"]

    defect_rot = (pred_class == "rot")
    defect_sprout = (pred_class == "sprout")

    # 3. Mechanical Damage Detection (Classical Contour Convexity Defects)
    # Evaluates sharp inward cuts or gouges into the bulb flesh
    defect_damage = False
    max_depth_px = 0.0

    if local_contour is not None and len(local_contour) >= 4:
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
                            _, _, _, d = defects[i, 0]
                            depth = d / 256.0
                            if depth > max_depth_px:
                                max_depth_px = depth
                except Exception:
                    pass

    max_depth_mm = float(max_depth_px / max(pixels_per_mm, 1e-4))

    # Flag mechanical damage if an inward cut exceeds 3.2 mm
    if max_depth_mm >= 3.2:
        defect_damage = True

    return {
        "defect_rot": bool(defect_rot),
        "defect_sprout": bool(defect_sprout),
        "defect_damage": bool(defect_damage),
        "classifier_class": pred_class,
        "classifier_confidence": clf_conf,
        "classifier_probabilities": clf_res.get("probabilities", {}),
        "rot_area_ratio": 1.0 if defect_rot else 0.0,
        "sprout_area_ratio": 1.0 if defect_sprout else 0.0,
        "max_defect_depth_mm": round(max_depth_mm, 2)
    }
