"""
backend/test_pipeline_e2e.py
Generates a realistic synthetic test image containing:
1. Standard reference coin disc (23mm) in top-left
2. Healthy onion bulb
3. Onion bulb with dark necrotic rot patch
4. Onion bulb with green chlorophyll sprout
5. Onion bulb with mechanical indentation / cut
Then runs the CV pipeline, grading, and pricing modules.
"""

import sys
import cv2
import numpy as np
from pathlib import Path
from backend.cv.pipeline import run_vision_pipeline
from backend.engine.grading import evaluate_batch_grading
from backend.engine.pricing import calculate_pricing_and_priority

from backend.cv.defect_classifier import get_classifier_session, classify_onion

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

def test_classifier_unit():
    print("Testing MobileNetV2 classifier loading...")
    session = get_classifier_session()
    assert session is not None, "Failed to load MobileNetV2 classifier session"
    print(" - Classifier session loaded successfully.")

    # Test with healthy onion color crop
    healthy_crop = np.full((150, 150, 3), (65, 45, 165), dtype=np.uint8)
    res = classify_onion(healthy_crop)
    print(f" - Crop classification result: {res}")
    assert "predicted_class" in res, "Missing predicted_class in classifier response"
    assert "confidence" in res, "Missing confidence in classifier response"
    assert 0.0 <= res["confidence"] <= 1.0, f"Invalid confidence score: {res['confidence']}"
    print(" - Classifier unit test passed!\n")

def create_synthetic_test_image() -> bytes:
    # 1200 x 800 light warm parchment background
    h, w = 900, 1200
    canvas = np.full((h, w, 3), (235, 240, 245), dtype=np.uint8)

    # 1. Reference Coin at (150, 150), radius 46 px -> diameter 92 px => ~4.0 px/mm for 23mm
    cv2.circle(canvas, (150, 150), 46, (70, 180, 220), -1) # Gold coin color in BGR
    cv2.circle(canvas, (150, 150), 46, (40, 120, 160), 3)
    cv2.putText(canvas, "5 INR", (125, 155), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (20, 60, 100), 2)

    # Color palette for red onions: Reddish-purple BGR (e.g. B: 40-70, G: 30-60, R: 140-190)
    onion_color = (65, 45, 165)
    onion_border = (40, 25, 120)

    # 2. Healthy Onion #1: Center (450, 300), radius 100 px (~50mm diameter)
    cv2.circle(canvas, (450, 300), 100, onion_color, -1)
    cv2.circle(canvas, (450, 300), 100, onion_border, 2)

    # 3. Onion #2 with Rot (Dark necrosis patch): Center (800, 300), radius 95 px
    cv2.circle(canvas, (800, 300), 95, onion_color, -1)
    cv2.circle(canvas, (800, 300), 95, onion_border, 2)
    # Dark necrotic spot
    cv2.circle(canvas, (820, 280), 28, (15, 15, 20), -1)

    # 4. Onion #3 with Sprout (Green shoot): Center (450, 650), radius 90 px
    cv2.circle(canvas, (450, 650), 90, onion_color, -1)
    cv2.circle(canvas, (450, 650), 90, onion_border, 2)
    # Green shoot (H: ~60, S: 200, V: 200 -> BGR ~ (20, 180, 30))
    pts_sprout = np.array([[450, 560], [435, 500], [465, 490]], np.int32)
    cv2.fillPoly(canvas, [pts_sprout], (30, 190, 40))

    # 5. Onion #4 with Mechanical Damage (Cut / Notch): Center (800, 650), radius 90 px
    center = (800, 650)
    radius = 90
    poly_pts = []
    for deg in range(0, 360, 5):
        rad = np.deg2rad(deg)
        r = radius
        # Add deep notch between 40 and 60 degrees
        if 40 <= deg <= 60:
            r = radius - 35 # 35px inward notch (>8mm defect)
        px = int(center[0] + r * np.cos(rad))
        py = int(center[1] + r * np.sin(rad))
        poly_pts.append([px, py])
    poly_pts = np.array(poly_pts, np.int32)
    cv2.fillPoly(canvas, [poly_pts], onion_color)
    cv2.polylines(canvas, [poly_pts], True, onion_border, 2)

    _, encoded = cv2.imencode(".jpg", canvas)
    return encoded.tobytes()

if __name__ == "__main__":
    # 1. Run classifier unit test
    test_classifier_unit()

    # 2. Run full CV pipeline
    print("Generating synthetic test batch...")
    img_bytes = create_synthetic_test_image()
    
    print("Running CV pipeline...")
    output_dir = Path("backend/storage")
    res = run_vision_pipeline(img_bytes, known_reference_diameter_mm=23.0, output_dir=output_dir)
    
    print(f"Calibration: {res['calibration']}")
    print(f"Isolated Onions: {len(res['onions'])}")
    assert len(res["onions"]) > 0, "Expected at least 1 onion detected in synthetic batch"

    # Verify Healthy Onion #1 produces defect_rot=False and defect_sprout=False
    onion_1 = res["onions"][0]
    print(f"Onion #1 evaluation: {onion_1['defects']}, clf_class={onion_1.get('classifier_class')}, clf_conf={onion_1.get('classifier_confidence')}")
    assert onion_1["defects"]["defect_rot"] is False, "Healthy Onion #1 should not have defect_rot=True"
    assert onion_1["defects"]["defect_sprout"] is False, "Healthy Onion #1 should not have defect_sprout=True"
    assert onion_1.get("classifier_confidence") is not None, "classifier_confidence should be attached"

    for o in res["onions"]:
        print(f" - Onion #{o['index']}: Diameter={o['diameter_mm']}mm, Circularity={o['circularity']:.2f}, Defects={o['defects']}, ClfConf={o.get('classifier_confidence')}")
        
    print("\nEvaluating AGMARK grading...")
    grading = evaluate_batch_grading(res["onions"])
    print(f"Grading Summary: Grade={grading['grade']}, Uniformity={grading['uniformity_score']}% CV, Rot={grading['rot_pct']}%, Sprout={grading['sprout_pct']}%, Damage={grading['damage_pct']}%")
    
    print("\nCalculating Pricing & Priority...")
    eval_res = calculate_pricing_and_priority(grading, base_market_price=30.0)
    print(f"Price: {eval_res['price_breakdown']['final_recommended_price_inr']} INR/kg")
    print(f"Formula: {eval_res['price_breakdown']['formula_expression']}")
    print(f"Priority: {eval_res['priority_breakdown']['priority']}")
    print(f"Reasoning: {eval_res['priority_breakdown']['decision_reasoning']}")

    print("\nPIPELINE E2E TEST PASSED!")
