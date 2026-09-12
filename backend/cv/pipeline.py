"""
backend/cv/pipeline.py
Full classical Computer Vision pipeline orchestrator.
Coordinates reference detection, contour segmentation, defect classification,
and generates the annotated visual output.
"""

import cv2
import uuid
import numpy as np
from pathlib import Path
from typing import Dict, Any, List, Tuple

from .reference_detector import detect_reference_object
from .segmentation import segment_onions
from .defect_detector import detect_onion_defects

def run_vision_pipeline(
    image_bytes: bytes,
    known_reference_diameter_mm: float = 27.0,
    output_dir: Path = Path("storage")
) -> Dict[str, Any]:
    """
    Executes the classical CV pipeline on raw image bytes.
    Returns extracted onion objects, reference data, and saves annotated image.
    """
    output_dir.mkdir(parents=True, exist_ok=True)

    # 1. Decode image from bytes
    nparr = np.frombuffer(image_bytes, np.uint8)
    image_bgr = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    if image_bgr is None:
        raise ValueError("Failed to decode uploaded image. Unsupported or corrupted format.")

    orig_h, orig_w = image_bgr.shape[:2]

    # Resize if extraordinarily huge to maintain swift processing (< 2000px)
    max_dim = 1600
    scale = 1.0
    if max(orig_h, orig_w) > max_dim:
        scale = max_dim / float(max(orig_h, orig_w))
        image_bgr = cv2.resize(image_bgr, (int(orig_w * scale), int(orig_h * scale)), interpolation=cv2.INTER_AREA)

    # 2. Reference Object Detection (Pixels-Per-MM Calibration)
    pixels_per_mm, ref_circle, ref_debug = detect_reference_object(
        image_bgr,
        known_diameter_mm=known_reference_diameter_mm
    )

    # 3. Onion Segmentation
    segmented_raw = segment_onions(
        image_bgr,
        pixels_per_mm=pixels_per_mm,
        reference_circle=ref_circle
    )

    # 4. Defect Detection & Metric Aggregation
    annotated = image_bgr.copy()
    processed_onions = []

    # Draw reference marker on annotated image
    if ref_circle is not None:
        rcx, rcy, rr = ref_circle
        cv2.circle(annotated, (rcx, rcy), rr, (255, 200, 0), 2)
        cv2.circle(annotated, (rcx, rcy), 2, (0, 0, 255), -1)
        label_ref = f"Ref Coin: {known_reference_diameter_mm}mm ({pixels_per_mm:.1f} px/mm)"
        cv2.putText(annotated, label_ref, (max(5, rcx - 70), max(20, rcy - rr - 10)),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 220, 50), 2, cv2.LINE_AA)

    for idx, raw in enumerate(segmented_raw, start=1):
        onion_id = f"on_{uuid.uuid4().hex[:8]}"
        defects = detect_onion_defects(
            raw["roi"],
            raw["submask"],
            raw["local_contour"],
            pixels_per_mm
        )

        diameter = raw["diameter_mm"]
        circularity = raw["circularity"]
        bx, by, bw, bh = raw["bbox"]

        # AGMARK Size Classification
        if diameter >= 60.0:
            size_class = "Grade A (>60mm)"
        elif diameter >= 40.0:
            size_class = "Grade B (40-60mm)"
        else:
            size_class = "URS (<40mm)"

        # Visual bounding box styling based on defect severity
        has_rot = defects["defect_rot"]
        has_sprout = defects["defect_sprout"]
        has_damage = defects["defect_damage"]

        if has_rot:
            box_color = (0, 0, 220)       # Red: Rot
            status_text = "ROT"
        elif has_damage:
            box_color = (0, 140, 255)     # Orange: Cut / Damage
            status_text = "DMG"
        elif has_sprout:
            box_color = (0, 215, 255)     # Yellow: Sprout
            status_text = "SPRT"
        else:
            box_color = (50, 205, 50)     # Emerald Green: Healthy
            status_text = "OK"

        # Draw contour & bounding box
        cv2.rectangle(annotated, (bx, by), (bx + bw, by + bh), box_color, 2)
        
        # Tag header badge
        tag_title = f"#{idx} {diameter:.0f}mm [{status_text}]"
        (tw, th), _ = cv2.getTextSize(tag_title, cv2.FONT_HERSHEY_SIMPLEX, 0.45, 1)
        cv2.rectangle(annotated, (bx, max(0, by - th - 6)), (bx + tw + 6, by), box_color, -1)
        cv2.putText(annotated, tag_title, (bx + 3, max(12, by - 3)),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.45, (255, 255, 255), 1, cv2.LINE_AA)

        processed_onions.append({
            "onion_id": onion_id,
            "index": idx,
            "diameter_mm": diameter,
            "circularity": circularity,
            "size_class": size_class,
            "defects": {
                "defect_rot": has_rot,
                "defect_sprout": has_sprout,
                "defect_damage": has_damage
            },
            "defect_details": defects,
            "bbox": {
                "x": bx,
                "y": by,
                "w": bw,
                "h": bh
            }
        })

    # Save original & annotated images to disk
    file_token = uuid.uuid4().hex[:12]
    orig_filename = f"orig_{file_token}.jpg"
    annotated_filename = f"annotated_{file_token}.jpg"
    
    cv2.imwrite(str(output_dir / orig_filename), image_bgr)
    cv2.imwrite(str(output_dir / annotated_filename), annotated)

    return {
        "onions": processed_onions,
        "calibration": {
            "pixels_per_mm": round(pixels_per_mm, 2),
            "known_diameter_mm": known_reference_diameter_mm,
            "ref_detected": ref_circle is not None
        },
        "original_filename": orig_filename,
        "annotated_filename": annotated_filename,
        "image_dims": {"width": image_bgr.shape[1], "height": image_bgr.shape[0]}
    }
