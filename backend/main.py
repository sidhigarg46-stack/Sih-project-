"""
backend/main.py
FastAPI application for Onion Quality Grading System MVP.
"""

import uuid
from pathlib import Path
from typing import List, Optional
from datetime import datetime

from fastapi import FastAPI, File, UploadFile, Form, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from .database import init_db, get_db_connection, DB_PATH
from .models import (
    BatchAnalysisResponse,
    BatchSummary,
    OnionResponse,
    PriceBreakdown,
    PriorityBreakdown,
    InspectionRecordResponse,
    BoundingBox,
    DefectFlags
)
from .cv.pipeline import run_vision_pipeline
from .cv.onion_detector import get_onion_model
from .cv.defect_classifier import get_classifier_session
from .engine.grading import evaluate_batch_grading
from .engine.pricing import calculate_pricing_and_priority
from .utils import get_lan_ip, generate_qr_code_base64

app = FastAPI(
    title="KandaGuru - Local Onion Quality Grading System",
    description="Local-only classical CV and AGMARK grading MVP for onions with transparent pricing and sell-priority.",
    version="1.0.0"
)

# Enable CORS for React frontend (localhost and LAN access)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount static file storage for images
STORAGE_DIR = Path(__file__).resolve().parent / "storage"
STORAGE_DIR.mkdir(parents=True, exist_ok=True)
app.mount("/storage", StaticFiles(directory=str(STORAGE_DIR)), name="storage")

@app.on_event("startup")
def startup_event():
    """Initialize database tables and preload deep learning models on server start."""
    init_db()
    get_onion_model()
    get_classifier_session()

@app.get("/")
def read_root():
    return {
        "system": "Onion Quality Grading System MVP",
        "status": "online",
        "lan_ip": get_lan_ip(),
        "standards": "AGMARK & National Horticulture Board (NHB)"
    }

@app.post("/batches/analyze", response_model=BatchAnalysisResponse)
async def analyze_batch(
    file: UploadFile = File(...),
    reference_diameter_mm: float = Form(27.0),
    base_market_price: float = Form(30.0)
):
    """
    Receives image, executes CV pipeline, computes AGMARK grades, saves records,
    and returns comprehensive batch analysis with price and priority breakdowns.
    """
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Uploaded file must be a valid image format.")

    image_bytes = await file.read()
    if len(image_bytes) == 0:
        raise HTTPException(status_code=400, detail="Uploaded image file is empty.")

    # 1. Run Computer Vision Pipeline
    try:
        cv_result = run_vision_pipeline(
            image_bytes=image_bytes,
            known_reference_diameter_mm=reference_diameter_mm,
            output_dir=STORAGE_DIR
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Computer vision pipeline failed: {str(e)}")

    onions_data = cv_result["onions"]
    orig_file = cv_result["original_filename"]
    annotated_file = cv_result["annotated_filename"]

    # 2. Evaluate AGMARK Grading
    grading = evaluate_batch_grading(onions_data)

    # 3. Calculate Transparent Pricing & Priority Breakdown
    evaluation = calculate_pricing_and_priority(grading, base_market_price=base_market_price)
    price_info = evaluation["price_breakdown"]
    priority_info = evaluation["priority_breakdown"]

    batch_id = f"batch_{uuid.uuid4().hex[:8]}"
    record_id = f"rec_{uuid.uuid4().hex[:8]}"

    lan_ip = get_lan_ip()
    # Report URL accessible from any device on local WiFi / LAN
    report_url = f"http://{lan_ip}:5173/report/{batch_id}"
    qr_code_b64 = generate_qr_code_base64(report_url)

    # 4. Persist to SQLite
    with get_db_connection() as conn:
        # Insert Batch
        conn.execute(
            """
            INSERT INTO batches (
                batch_id, total_onions, avg_diameter_mm, uniformity_score,
                grade, grade_a_pct, urs_pct, base_market_price,
                recommended_price, sell_priority, original_image_path, annotated_image_path
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                batch_id,
                grading["total_onions"],
                grading["avg_diameter_mm"],
                grading["uniformity_score"],
                grading["grade"],
                grading["grade_a_pct"],
                grading["urs_pct"],
                price_info["base_market_price_inr"],
                price_info["final_recommended_price_inr"],
                priority_info["priority"],
                orig_file,
                annotated_file
            )
        )

        # Insert Onions
        for o in onions_data:
            conn.execute(
                """
                INSERT INTO onions (
                    onion_id, batch_id, diameter_mm, circularity,
                    defect_rot, defect_sprout, defect_damage, size_class,
                    bbox_x, bbox_y, bbox_w, bbox_h, confidence, classifier_confidence
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    o["onion_id"],
                    batch_id,
                    o["diameter_mm"],
                    o["circularity"],
                    int(o["defects"]["defect_rot"]),
                    int(o["defects"]["defect_sprout"]),
                    int(o["defects"]["defect_damage"]),
                    o["size_class"],
                    o["bbox"]["x"],
                    o["bbox"]["y"],
                    o["bbox"]["w"],
                    o["bbox"]["h"],
                    o.get("confidence"),
                    o.get("classifier_confidence")
                )
            )

        # Insert InspectionRecord
        conn.execute(
            """
            INSERT INTO inspection_records (
                record_id, batch_id, report_url, qr_code_data
            ) VALUES (?, ?, ?, ?)
            """,
            (record_id, batch_id, report_url, report_url)
        )
        conn.commit()

    # 5. Format Response
    onions_response = [
        OnionResponse(
            onion_id=o["onion_id"],
            batch_id=batch_id,
            diameter_mm=o["diameter_mm"],
            circularity=o["circularity"],
            size_class=o["size_class"],
            confidence=o.get("confidence"),
            classifier_confidence=o.get("classifier_confidence"),
            defects=DefectFlags(
                defect_rot=o["defects"]["defect_rot"],
                defect_sprout=o["defects"]["defect_sprout"],
                defect_damage=o["defects"]["defect_damage"]
            ),
            bbox=BoundingBox(
                x=o["bbox"]["x"],
                y=o["bbox"]["y"],
                w=o["bbox"]["w"],
                h=o["bbox"]["h"]
            )
        )
        for o in onions_data
    ]

    batch_summary = BatchSummary(
        batch_id=batch_id,
        timestamp=datetime.utcnow(),
        total_onions=grading["total_onions"],
        avg_diameter_mm=grading["avg_diameter_mm"],
        uniformity_score=grading["uniformity_score"],
        grade=grading["grade"],
        grade_a_pct=grading["grade_a_pct"],
        grade_b_pct=grading["grade_b_pct"],
        urs_pct=grading["urs_pct"],
        rot_pct=grading["rot_pct"],
        sprout_pct=grading["sprout_pct"],
        damage_pct=grading["damage_pct"],
        recommended_price=price_info["final_recommended_price_inr"],
        sell_priority=priority_info["priority"]
    )

    return BatchAnalysisResponse(
        batch=batch_summary,
        onions=onions_response,
        price_breakdown=PriceBreakdown(**price_info),
        priority_breakdown=PriorityBreakdown(**priority_info),
        original_image_url=f"/storage/{orig_file}",
        annotated_image_url=f"/storage/{annotated_file}",
        report_url=report_url,
        qr_code_base64=qr_code_b64
    )

@app.get("/batches/{batch_id}/report", response_model=BatchAnalysisResponse)
def get_batch_report(batch_id: str):
    """
    Retrieves full inspection report and transparent calculations for an existing batch.
    """
    with get_db_connection() as conn:
        batch_row = conn.execute(
            "SELECT * FROM batches WHERE batch_id = ?", (batch_id,)
        ).fetchone()

        if not batch_row:
            raise HTTPException(status_code=404, detail=f"Batch '{batch_id}' not found.")

        onions_rows = conn.execute(
            "SELECT * FROM onions WHERE batch_id = ? ORDER BY diameter_mm DESC", (batch_id,)
        ).fetchall()

        rec_row = conn.execute(
            "SELECT * FROM inspection_records WHERE batch_id = ?", (batch_id,)
        ).fetchone()

    # Reconstruct onions list
    onions_list = []
    onions_dict_for_grading = []
    for r in onions_rows:
        defects_dict = {
            "defect_rot": bool(r["defect_rot"]),
            "defect_sprout": bool(r["defect_sprout"]),
            "defect_damage": bool(r["defect_damage"])
        }
        conf_val = r["confidence"] if "confidence" in r.keys() and r["confidence"] is not None else None
        clf_conf = r["classifier_confidence"] if "classifier_confidence" in r.keys() and r["classifier_confidence"] is not None else None
        onions_list.append(
            OnionResponse(
                onion_id=r["onion_id"],
                batch_id=batch_id,
                diameter_mm=r["diameter_mm"],
                circularity=r["circularity"],
                size_class=r["size_class"],
                confidence=conf_val,
                classifier_confidence=clf_conf,
                defects=DefectFlags(**defects_dict),
                bbox=BoundingBox(x=r["bbox_x"], y=r["bbox_y"], w=r["bbox_w"], h=r["bbox_h"])
            )
        )
        onions_dict_for_grading.append({
            "diameter_mm": r["diameter_mm"],
            "circularity": r["circularity"],
            "defects": defects_dict
        })

    grading = evaluate_batch_grading(onions_dict_for_grading)
    evaluation = calculate_pricing_and_priority(grading, base_market_price=batch_row["base_market_price"])
    
    lan_ip = get_lan_ip()
    report_url = rec_row["report_url"] if rec_row else f"http://{lan_ip}:5173/report/{batch_id}"
    qr_b64 = generate_qr_code_base64(report_url)

    batch_summary = BatchSummary(
        batch_id=batch_id,
        timestamp=datetime.strptime(batch_row["timestamp"], "%Y-%m-%d %H:%M:%S") if isinstance(batch_row["timestamp"], str) else datetime.utcnow(),
        total_onions=batch_row["total_onions"],
        avg_diameter_mm=batch_row["avg_diameter_mm"],
        uniformity_score=batch_row["uniformity_score"],
        grade=batch_row["grade"],
        grade_a_pct=batch_row["grade_a_pct"],
        grade_b_pct=grading.get("grade_b_pct", 0.0),
        urs_pct=batch_row["urs_pct"],
        rot_pct=grading.get("rot_pct", 0.0),
        sprout_pct=grading.get("sprout_pct", 0.0),
        damage_pct=grading.get("damage_pct", 0.0),
        recommended_price=batch_row["recommended_price"],
        sell_priority=batch_row["sell_priority"]
    )

    return BatchAnalysisResponse(
        batch=batch_summary,
        onions=onions_list,
        price_breakdown=PriceBreakdown(**evaluation["price_breakdown"]),
        priority_breakdown=PriorityBreakdown(**evaluation["priority_breakdown"]),
        original_image_url=f"/storage/{batch_row['original_image_path']}" if batch_row['original_image_path'] else "",
        annotated_image_url=f"/storage/{batch_row['annotated_image_path']}" if batch_row['annotated_image_path'] else "",
        report_url=report_url,
        qr_code_base64=qr_b64
    )

@app.get("/batches", response_model=List[BatchSummary])
def list_batches(limit: int = 20):
    """Returns recent evaluated batches."""
    with get_db_connection() as conn:
        rows = conn.execute(
            "SELECT * FROM batches ORDER BY timestamp DESC LIMIT ?", (limit,)
        ).fetchall()

    results = []
    for r in rows:
        results.append(
            BatchSummary(
                batch_id=r["batch_id"],
                timestamp=datetime.strptime(r["timestamp"], "%Y-%m-%d %H:%M:%S") if isinstance(r["timestamp"], str) else datetime.utcnow(),
                total_onions=r["total_onions"],
                avg_diameter_mm=r["avg_diameter_mm"],
                uniformity_score=r["uniformity_score"],
                grade=r["grade"],
                grade_a_pct=r["grade_a_pct"],
                grade_b_pct=0.0,
                urs_pct=r["urs_pct"],
                rot_pct=0.0,
                sprout_pct=0.0,
                damage_pct=0.0,
                recommended_price=r["recommended_price"],
                sell_priority=r["sell_priority"]
            )
        )
    return results
