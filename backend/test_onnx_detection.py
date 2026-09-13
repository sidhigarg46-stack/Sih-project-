"""
backend/test_onnx_detection.py
Verification test for best.onnx deep learning onion detection with confidence score 0.2.
Tests multiple real storage images and asserts correct onion counts and metadata.
"""

from pathlib import Path
from backend.cv.pipeline import run_vision_pipeline

def test_onnx_detection():
    images_to_test = [
        ("backend/storage/orig_cd0594470701.jpg", 6),
        ("backend/storage/orig_04d2e3c48cff.jpg", 4),
        ("backend/storage/orig_b85c441448aa.jpg", 4),
    ]

    print("=== TESTING ONNX DETECTION (conf=0.2) ON REAL IMAGES ===")
    for img_path, expected_count in images_to_test:
        path = Path(img_path)
        if not path.exists():
            print(f"Skipping {img_path} (not found)")
            continue

        with open(path, "rb") as f:
            img_bytes = f.read()

        res = run_vision_pipeline(img_bytes, known_reference_diameter_mm=27.0)
        onions = res["onions"]
        count = len(onions)
        print(f"\n{img_path}: Detected {count} onions (Expected: {expected_count})")
        for o in onions:
            conf = o.get("confidence")
            print(f"  - #{o['index']}: conf={conf}, diam={o['diameter_mm']}mm, size={o['size_class']}, defects={o['defects']}")
            assert conf is not None and conf >= 0.20, f"Confidence {conf} was below threshold 0.2"

        assert count == expected_count, f"Expected {expected_count} onions in {img_path}, got {count}"

    print("\nALL ONNX REAL IMAGE TESTS PASSED WITH CONFIDENCE >= 0.2!")

if __name__ == "__main__":
    test_onnx_detection()
