"""
backend/engine/grading.py
Parses configurable onion grading rules from grading_config.json and evaluates
batch-level metrics, size distribution, uniformity, and assigned grade.
"""

import json
from pathlib import Path
from typing import List, Dict, Any, Tuple
import numpy as np

CONFIG_PATH = Path(__file__).resolve().parent.parent / "grading_config.json"

def load_grading_config() -> Dict[str, Any]:
    with open(CONFIG_PATH, "r", encoding="utf-8") as f:
        return json.load(f)

def evaluate_batch_grading(onions: List[Dict[str, Any]]) -> Dict[str, Any]:
    """
    Evaluates a batch of segmented onions against the configured
    onion quality and grading rules.
    """
    
    config = load_grading_config()
    total = len(onions)
    if total == 0:
        return {
            "total_onions": 0,
            "avg_diameter_mm": 0.0,
            "uniformity_score": 0.0,
            "grade": "Reject",
            "grade_a_pct": 0.0,
            "grade_b_pct": 0.0,
            "urs_pct": 0.0,
            "rot_pct": 0.0,
            "sprout_pct": 0.0,
            "damage_pct": 0.0,
            "avg_circularity": 0.0
        }

    diameters = np.array([o["diameter_mm"] for o in onions], dtype=float)
    circularities = np.array([o["circularity"] for o in onions], dtype=float)

    mean_diameter = float(np.mean(diameters))
    std_diameter = float(np.std(diameters))
    
    # Uniformity score is Coefficient of Variation (CV = std / mean * 100)
    # Lower CV means higher uniformity
    uniformity_score = float((std_diameter / max(mean_diameter, 1e-4)) * 100.0)
    avg_circularity = float(np.mean(circularities))

    # Size counts
    grade_a_count = sum(1 for o in onions if o["diameter_mm"] >= 60.0)
    grade_b_count = sum(1 for o in onions if 40.0 <= o["diameter_mm"] < 60.0)
    urs_count = sum(1 for o in onions if o["diameter_mm"] < 40.0)

    grade_a_pct = (grade_a_count / total) * 100.0
    grade_b_pct = (grade_b_count / total) * 100.0
    urs_pct = (urs_count / total) * 100.0

    # Defect counts
    rot_count = sum(1 for o in onions if o["defects"]["defect_rot"])
    sprout_count = sum(1 for o in onions if o["defects"]["defect_sprout"])
    damage_count = sum(1 for o in onions if o["defects"]["defect_damage"])

    rot_pct = (rot_count / total) * 100.0
    sprout_pct = (sprout_count / total) * 100.0
    damage_pct = (damage_count / total) * 100.0
    # Grade Evaluation hierarchy based on configured rules
    specs = config.get("grade_specifications", {})
    assigned_grade = "Reject"

    # Test for Extra Class
    extra_spec = specs.get("Extra", {})
    if (rot_pct <= extra_spec.get("max_rot_pct", 0.0) and
        sprout_pct <= extra_spec.get("max_sprout_pct", 0.0) and
        damage_pct <= extra_spec.get("max_damage_pct", 3.0) and
        grade_a_pct >= extra_spec.get("min_grade_a_pct", 50.0) and
        urs_pct <= extra_spec.get("max_urs_pct", 3.0) and
        avg_circularity >= extra_spec.get("min_circularity", 0.85)):
        assigned_grade = "Extra"
    else:
        # Test for Standard Class
        std_spec = specs.get("Standard", {})
        if (rot_pct <= std_spec.get("max_rot_pct", 2.0) and
            sprout_pct <= std_spec.get("max_sprout_pct", 3.0) and
            damage_pct <= std_spec.get("max_damage_pct", 8.0) and
            grade_a_pct >= std_spec.get("min_grade_a_pct", 20.0) and
            urs_pct <= std_spec.get("max_urs_pct", 10.0) and
            avg_circularity >= std_spec.get("min_circularity", 0.75)):
            assigned_grade = "Standard"
        else:
            # Test for Commercial Class
            comm_spec = specs.get("Commercial", {})
            if (rot_pct <= comm_spec.get("max_rot_pct", 5.0) and
                sprout_pct <= comm_spec.get("max_sprout_pct", 8.0) and
                damage_pct <= comm_spec.get("max_damage_pct", 15.0) and
                urs_pct <= comm_spec.get("max_urs_pct", 25.0) and
                avg_circularity >= comm_spec.get("min_circularity", 0.65)):
                assigned_grade = "Commercial"
            else:
                assigned_grade = "Reject"

    return {
        "total_onions": total,
        "avg_diameter_mm": round(mean_diameter, 1),
        "std_diameter_mm": round(std_diameter, 1),
        "uniformity_score": round(uniformity_score, 1),
        "grade": assigned_grade,
        "grade_a_pct": round(grade_a_pct, 1),
        "grade_b_pct": round(grade_b_pct, 1),
        "urs_pct": round(urs_pct, 1),
        "rot_pct": round(rot_pct, 1),
        "sprout_pct": round(sprout_pct, 1),
        "damage_pct": round(damage_pct, 1),
        "avg_circularity": round(avg_circularity, 2)
    }
