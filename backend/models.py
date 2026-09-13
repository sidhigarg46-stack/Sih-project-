"""
backend/models.py
Pydantic schemas for Onion Quality Grading System MVP.
"""

from enum import Enum
from typing import List, Optional
from datetime import datetime
from pydantic import BaseModel, Field, ConfigDict

# ==========================================
# Enums
# ==========================================

class BatchGrade(str, Enum):
    EXTRA = "Extra"
    STANDARD = "Standard"
    COMMERCIAL = "Commercial"
    REJECT = "Reject"

class SellPriority(str, Enum):
    HOLD = "Hold"
    SELL_SOON = "Sell Soon"
    SELL_FIRST = "Sell First"

class SizeClass(str, Enum):
    GRADE_A = "Grade A (>60mm)"
    GRADE_B = "Grade B (40-60mm)"
    URS = "URS (<40mm)"

class ReferenceObjectType(str, Enum):
    INR_5_COIN = "INR_5_COIN"     # 23.0 mm standard
    INR_10_COIN = "INR_10_COIN"   # 27.0 mm standard
    CREDIT_CARD = "CREDIT_CARD"   # 85.6 mm standard
    CUSTOM_DISC = "CUSTOM_DISC"   # User-specified

# ==========================================
# Per-Onion Schemas
# ==========================================

class BoundingBox(BaseModel):
    x: int = Field(..., description="Top-left X pixel coordinate")
    y: int = Field(..., description="Top-left Y pixel coordinate")
    w: int = Field(..., description="Width in pixels")
    h: int = Field(..., description="Height in pixels")

class DefectFlags(BaseModel):
    defect_rot: bool = Field(..., description="Flagged via dark/black necrotic patch detection")
    defect_sprout: bool = Field(..., description="Flagged via green chlorophyll hue extending beyond boundary")
    defect_damage: bool = Field(..., description="Flagged via contour convexity defect notches")

class OnionBase(BaseModel):
    diameter_mm: float = Field(..., ge=0.0, description="Calibrated physical diameter in mm")
    circularity: float = Field(..., ge=0.0, le=1.0, description="Misshapen index: 4*pi*Area / Perimeter^2")
    size_class: SizeClass = Field(..., description="Categorized size class according to AGMARK/NHB")
    defects: DefectFlags = Field(..., description="Defect detection boolean flags")
    bbox: BoundingBox = Field(..., description="Bounding box location in original image")
    confidence: Optional[float] = Field(None, description="YOLO detection confidence score (>= 0.2)")
    classifier_confidence: Optional[float] = Field(None, description="MobileNetV2 defect classifier confidence score")

class OnionCreate(OnionBase):
    onion_id: str = Field(..., description="Unique UUID for the segmented onion")
    batch_id: str = Field(..., description="Reference ID to parent batch")

class OnionResponse(OnionBase):
    onion_id: str
    batch_id: str

    model_config = ConfigDict(from_attributes=True)

# ==========================================
# Transparent Formula Breakdown Schemas
# ==========================================

class PriceBreakdown(BaseModel):
    base_market_price_inr: float = Field(..., description="Baseline mandi price in INR/kg (e.g. 30.0)")
    uniformity_adjustment_inr: float = Field(..., description="Bonus/penalty from diameter uniformity score")
    rot_penalty_inr: float = Field(..., description="Deduction proportional to rot prevalence")
    sprout_penalty_inr: float = Field(..., description="Deduction proportional to sprouting prevalence")
    damage_penalty_inr: float = Field(..., description="Deduction proportional to mechanical damage")
    urs_penalty_inr: float = Field(..., description="Deduction for under-sized onion share")
    net_penalty_percentage: float = Field(..., description="Aggregate percentage deducted from base rate")
    final_recommended_price_inr: float = Field(..., description="Final price per kg after all deductions")
    formula_expression: str = Field(..., description="Human-readable mathematical expression for display")

class PriorityBreakdown(BaseModel):
    rot_risk_contribution: float = Field(..., description="Rot prevalence multiplied by risk weight (0.50)")
    sprout_risk_contribution: float = Field(..., description="Sprout prevalence multiplied by risk weight (0.35)")
    damage_risk_contribution: float = Field(..., description="Damage prevalence multiplied by risk weight (0.15)")
    composite_risk_score: float = Field(..., description="Total weighted risk index (0.0 to 100.0)")
    decision_reasoning: str = Field(..., description="Plain-language justification for Hold, Sell Soon, or Sell First")
    priority: SellPriority = Field(..., description="Final operational action recommendation")

# ==========================================
# Batch & Inspection Schemas
# ==========================================

class BatchSummary(BaseModel):
    batch_id: str = Field(..., description="Unique UUID for the evaluated batch")
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    total_onions: int = Field(..., ge=0, description="Total isolated onions in batch")
    avg_diameter_mm: float = Field(..., ge=0.0, description="Mean diameter across all onions")
    uniformity_score: float = Field(..., ge=0.0, description="Coefficient of variation (CV = sigma/mu * 100)")
    grade: BatchGrade = Field(..., description="Final AGMARK assigned grade (Extra, Standard, Commercial, Reject)")
    grade_a_pct: float = Field(..., ge=0.0, le=100.0, description="Percentage of Grade A onions (>60mm)")
    grade_b_pct: float = Field(..., ge=0.0, le=100.0, description="Percentage of Grade B onions (40-60mm)")
    urs_pct: float = Field(..., ge=0.0, le=100.0, description="Percentage of URS onions (<40mm)")
    rot_pct: float = Field(..., ge=0.0, le=100.0, description="Batch-wide percentage exhibiting rot")
    sprout_pct: float = Field(..., ge=0.0, le=100.0, description="Batch-wide percentage exhibiting sprouting")
    damage_pct: float = Field(..., ge=0.0, le=100.0, description="Batch-wide percentage exhibiting mechanical cuts")
    recommended_price: float = Field(..., ge=0.0, description="Recommended mandi price in INR/kg")
    sell_priority: SellPriority = Field(..., description="Assigned risk priority (Hold, Sell Soon, Sell First)")

class BatchAnalysisResponse(BaseModel):
    batch: BatchSummary
    onions: List[OnionResponse]
    price_breakdown: PriceBreakdown
    priority_breakdown: PriorityBreakdown
    original_image_url: str = Field(..., description="URL to the uploaded input image")
    annotated_image_url: str = Field(..., description="URL to image with rendered bounding boxes and defect badges")
    report_url: str = Field(..., description="Local LAN web report URL")
    qr_code_base64: str = Field(..., description="Base64-encoded PNG image of the shareable QR code")

class InspectionRecordResponse(BaseModel):
    record_id: str
    batch_id: str
    report_url: str
    qr_code_data: Optional[str] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

class CalibrationConfig(BaseModel):
    reference_type: ReferenceObjectType = Field(default=ReferenceObjectType.INR_10_COIN)
    known_dimension_mm: float = Field(default=27.0, description="Diameter or width in mm of calibration reference")
    base_market_price: float = Field(default=30.0, description="Base reference mandi price in INR/kg")
