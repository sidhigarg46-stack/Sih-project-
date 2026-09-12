"""
backend/engine/pricing.py
Calculates transparent penalty-adjusted price and risk-weighted sell-priority.
"""

from typing import Dict, Any
from .grading import load_grading_config

def calculate_pricing_and_priority(
    grading_summary: Dict[str, Any],
    base_market_price: float = 30.0
) -> Dict[str, Any]:
    """
    Computes transparent price breakdown and sell priority with full mathematical reasoning.
    """
    config = load_grading_config()
    pricing_cfg = config.get("pricing_model", {})
    priority_cfg = config.get("sell_priority_model", {})

    base_price = float(base_market_price if base_market_price > 0 else pricing_cfg.get("default_base_price_inr", 30.0))
    min_floor = float(pricing_cfg.get("min_price_floor_inr", 5.0))

    cv = grading_summary.get("uniformity_score", 0.0)
    rot_pct = grading_summary.get("rot_pct", 0.0)
    sprout_pct = grading_summary.get("sprout_pct", 0.0)
    damage_pct = grading_summary.get("damage_pct", 0.0)
    urs_pct = grading_summary.get("urs_pct", 0.0)

    # 1. Uniformity Adjustment
    uniformity_adj_pct = 0.0
    for bracket in pricing_cfg.get("uniformity_thresholds", []):
        if cv <= bracket["max_cv"]:
            uniformity_adj_pct = float(bracket["adjustment_pct"])
            break
    
    uniformity_adj_inr = (uniformity_adj_pct / 100.0) * base_price

    # 2. Defect Penalties
    multipliers = pricing_cfg.get("penalty_multipliers", {})
    rot_mult = float(multipliers.get("rot", 3.5))
    sprout_mult = float(multipliers.get("sprout", 2.0))
    damage_mult = float(multipliers.get("damage", 1.2))
    urs_mult = float(multipliers.get("urs", 0.8))

    rot_penalty_inr = (rot_pct / 100.0) * rot_mult * base_price
    sprout_penalty_inr = (sprout_pct / 100.0) * sprout_mult * base_price
    damage_penalty_inr = (damage_pct / 100.0) * damage_mult * base_price
    urs_penalty_inr = (urs_pct / 100.0) * urs_mult * base_price

    total_deductions_inr = rot_penalty_inr + sprout_penalty_inr + damage_penalty_inr + urs_penalty_inr
    net_price_before_floor = base_price + uniformity_adj_inr - total_deductions_inr
    final_price = max(min_floor, round(net_price_before_floor, 2))

    net_penalty_pct = round(((base_price - final_price) / max(base_price, 1e-4)) * 100.0, 1)

    # Human-readable formula string
    sign_u = "+" if uniformity_adj_inr >= 0 else "-"
    formula_str = (
        f"₹{base_price:.2f} base {sign_u} ₹{abs(uniformity_adj_inr):.2f} (uniformity CV {cv:.1f}%) "
        f"- ₹{rot_penalty_inr:.2f} (rot {rot_pct:.1f}%) "
        f"- ₹{sprout_penalty_inr:.2f} (sprout {sprout_pct:.1f}%) "
        f"- ₹{damage_penalty_inr:.2f} (damage {damage_pct:.1f}%) "
        f"- ₹{urs_penalty_inr:.2f} (urs {urs_pct:.1f}%) "
        f"= ₹{final_price:.2f}/kg"
    )

    # 3. Sell Priority & Weighted Risk Score
    weights = priority_cfg.get("risk_weights", {})
    w_rot = float(weights.get("rot", 0.50))
    w_sprout = float(weights.get("sprout", 0.35))
    w_damage = float(weights.get("damage", 0.15))

    rot_risk = rot_pct * w_rot
    sprout_risk = sprout_pct * w_sprout
    damage_risk = damage_pct * w_damage
    composite_risk = round(rot_risk + sprout_risk + damage_risk, 2)

    thresh = priority_cfg.get("thresholds", {})
    t_first_risk = float(thresh.get("sell_first_composite_risk", 10.0))
    t_first_rot = float(thresh.get("sell_first_min_rot_pct", 3.0))
    t_soon_risk = float(thresh.get("sell_soon_composite_risk", 4.5))

    if composite_risk >= t_first_risk or rot_pct >= t_first_rot:
        priority = "Sell First"
        reasoning = (
            f"High spoilage risk (Composite Risk {composite_risk:.1f}/100, Rot {rot_pct:.1f}%). "
            "Rot accelerates exponentially in transit or storage. Liquidate immediately to prevent total batch decay."
        )
    elif composite_risk >= t_soon_risk or sprout_pct >= 5.0:
        priority = "Sell Soon"
        reasoning = (
            f"Moderate risk (Composite Risk {composite_risk:.1f}/100, Sprouting {sprout_pct:.1f}%). "
            "Internal moisture loss and vegetative growth starting. Dispatch to local retail within 3-5 days."
        )
    else:
        priority = "Hold"
        reasoning = (
            f"Low risk (Composite Risk {composite_risk:.1f}/100). Bulbs are sound and dormant. "
            "Suitable for ventilated warehouse storage or holding for favorable market pricing."
        )

    return {
        "price_breakdown": {
            "base_market_price_inr": round(base_price, 2),
            "uniformity_adjustment_inr": round(uniformity_adj_inr, 2),
            "rot_penalty_inr": round(rot_penalty_inr, 2),
            "sprout_penalty_inr": round(sprout_penalty_inr, 2),
            "damage_penalty_inr": round(damage_penalty_inr, 2),
            "urs_penalty_inr": round(urs_penalty_inr, 2),
            "net_penalty_percentage": net_penalty_pct,
            "final_recommended_price_inr": final_price,
            "formula_expression": formula_str
        },
        "priority_breakdown": {
            "rot_risk_contribution": round(rot_risk, 2),
            "sprout_risk_contribution": round(sprout_risk, 2),
            "damage_risk_contribution": round(damage_risk, 2),
            "composite_risk_score": composite_risk,
            "decision_reasoning": reasoning,
            "priority": priority
        }
    }
