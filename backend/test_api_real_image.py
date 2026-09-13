"""
backend/test_api_real_image.py
Tests /batches/analyze with real storage image orig_cd0594470701.jpg
and verifies 6 detected onions with confidence >= 0.2.
"""

from fastapi.testclient import TestClient
from backend.main import app
from pathlib import Path

client = TestClient(app)

def test_api_real_image():
    img_path = Path("backend/storage/orig_cd0594470701.jpg")
    with open(img_path, "rb") as f:
        img_bytes = f.read()

    files = {
        "file": ("orig_cd0594470701.jpg", img_bytes, "image/jpeg")
    }
    data = {
        "reference_diameter_mm": 27.0,
        "base_market_price": 30.0
    }

    res = client.post("/batches/analyze", files=files, data=data)
    assert res.status_code == 200, f"Failed: {res.text}"
    body = res.json()
    batch = body["batch"]
    onions = body["onions"]

    print(f"Batch ID: {batch['batch_id']}")
    print(f"Total Onions: {batch['total_onions']}")
    print(f"Grade: {batch['grade']}")
    print(f"Recommended Price: {batch['recommended_price']} INR/kg")
    
    assert batch["total_onions"] == 6, f"Expected 6 onions, got {batch['total_onions']}"
    assert len(onions) == 6, f"Expected 6 onions list, got {len(onions)}"

    for idx, o in enumerate(onions, 1):
        conf = o.get("confidence")
        print(f"  - Onion #{idx}: ID={o['onion_id']}, conf={conf}, diam={o['diameter_mm']}mm, class={o['size_class']}")
        assert conf is not None and conf >= 0.20, f"Confidence {conf} was < 0.2"

    print("\nREAL IMAGE API TEST PASSED! 6 ONIONS DETECTED CORRECTLY WITH CONF >= 0.2!")

if __name__ == "__main__":
    test_api_real_image()
