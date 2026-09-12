"""
backend/test_api_e2e.py
Tests FastAPI endpoints: /batches/analyze and /batches/{batch_id}/report.
"""

from fastapi.testclient import TestClient
from backend.main import app
from backend.test_pipeline_e2e import create_synthetic_test_image
import io

client = TestClient(app)

def test_api():
    print("Testing / (root endpoint)...")
    res_root = client.get("/")
    assert res_root.status_code == 200
    print("Root response:", res_root.json())

    print("\nTesting POST /batches/analyze...")
    img_bytes = create_synthetic_test_image()
    files = {
        "file": ("test_batch.jpg", io.BytesIO(img_bytes), "image/jpeg")
    }
    data = {
        "reference_diameter_mm": 23.0,
        "base_market_price": 30.0
    }

    res_analyze = client.post("/batches/analyze", files=files, data=data)
    assert res_analyze.status_code == 200, f"Failed: {res_analyze.text}"
    analyze_json = res_analyze.json()
    batch_id = analyze_json["batch"]["batch_id"]
    print(f"Analyze succeeded! Batch ID: {batch_id}")
    print(f"Total Onions: {analyze_json['batch']['total_onions']}")
    print(f"Grade: {analyze_json['batch']['grade']}")
    print(f"Recommended Price: {analyze_json['batch']['recommended_price']} INR/kg")
    print(f"Sell Priority: {analyze_json['batch']['sell_priority']}")
    print(f"Report URL: {analyze_json['report_url']}")
    print(f"QR Code starts with: {analyze_json['qr_code_base64'][:30]}...")

    print(f"\nTesting GET /batches/{batch_id}/report...")
    res_report = client.get(f"/batches/{batch_id}/report")
    assert res_report.status_code == 200
    report_json = res_report.json()
    assert report_json["batch"]["batch_id"] == batch_id
    print("Report endpoint returned matching batch data successfully!")

    print("\nTesting GET /batches (list)...")
    res_list = client.get("/batches")
    assert res_list.status_code == 200
    batches_list = res_list.json()
    print(f"Total batches in history: {len(batches_list)}")
    print("\nALL BACKEND API TESTS PASSED!")

if __name__ == "__main__":
    test_api()
