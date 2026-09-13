"""
backend/cv/defect_classifier.py
Loads onion_classifier.onnx MobileNetV2 deep learning classifier and performs
defect classification (healthy, rot, sprout) on cropped onion regions.
"""

import os
import cv2
import logging
from pathlib import Path
from typing import Dict, Any, Optional
import numpy as np
import onnxruntime as ort

logger = logging.getLogger(__name__)

# Alphabetical class mapping from ImageFolder training
CLASSES = ["healthy", "rot", "sprout"]

_SESSION_INSTANCE: Optional[ort.InferenceSession] = None
_INPUT_NAME: Optional[str] = None

# Preprocessing normalization constants (standard ImageNet)
IMAGENET_MEAN = np.array([0.485, 0.456, 0.406], dtype=np.float32)
IMAGENET_STD = np.array([0.229, 0.224, 0.225], dtype=np.float32)

def get_classifier_model_path() -> Path:
    """Resolves the location of onion_classifier.onnx across workspace environments."""
    if "CLASSIFIER_ONNX_PATH" in os.environ:
        custom_path = Path(os.environ["CLASSIFIER_ONNX_PATH"])
        if custom_path.exists():
            return custom_path

    candidates = [
        Path(__file__).resolve().parent.parent / "models" / "onion_classifier.onnx",
        Path(__file__).resolve().parent.parent.parent / "onion_classifier.onnx",
        Path(__file__).resolve().parent.parent / "onion_classifier.onnx",
        Path.cwd() / "onion_classifier.onnx",
        Path.cwd() / "backend" / "models" / "onion_classifier.onnx",
    ]

    for candidate in candidates:
        if candidate.exists():
            return candidate

    raise FileNotFoundError(
        f"onion_classifier.onnx model not found in candidate paths: {[str(c) for c in candidates]}"
    )

def get_classifier_session() -> ort.InferenceSession:
    """Singleton getter for the MobileNetV2 ONNX InferenceSession."""
    global _SESSION_INSTANCE, _INPUT_NAME
    if _SESSION_INSTANCE is None:
        model_path = get_classifier_model_path()
        logger.info(f"Loading onion_classifier.onnx from {model_path}")
        # Initialize session with CPU provider and fallback options
        opts = ort.SessionOptions()
        opts.enable_cpu_mem_arena = True
        opts.execution_mode = ort.ExecutionMode.ORT_SEQUENTIAL
        _SESSION_INSTANCE = ort.InferenceSession(str(model_path), sess_options=opts, providers=["CPUExecutionProvider"])
        _INPUT_NAME = _SESSION_INSTANCE.get_inputs()[0].name
    return _SESSION_INSTANCE

def preprocess_onion_crop(crop_bgr: np.ndarray) -> np.ndarray:
    """
    Preprocesses a cropped BGR onion region to match MobileNetV2 training:
    - BGR -> RGB
    - Resize to 224x224
    - Scale to [0, 1]
    - Normalize per-channel with ImageNet mean and std
    - Transpose to NCHW format with batch dimension 1
    - dtype: float32
    """
    if crop_bgr is None or crop_bgr.size == 0:
        raise ValueError("Cannot preprocess empty or None crop")

    rgb = cv2.cvtColor(crop_bgr, cv2.COLOR_BGR2RGB)
    resized = cv2.resize(rgb, (224, 224), interpolation=cv2.INTER_LINEAR)
    scaled = resized.astype(np.float32) / 255.0
    normalized = (scaled - IMAGENET_MEAN) / IMAGENET_STD
    chw = np.transpose(normalized, (2, 0, 1))  # (3, 224, 224)
    batch = np.expand_dims(chw, axis=0)       # (1, 3, 224, 224)
    return batch.astype(np.float32)

def classify_onion(crop_bgr: np.ndarray) -> Dict[str, Any]:
    """
    Executes MobileNetV2 inference on an isolated onion crop.
    Returns predicted class label, confidence, and per-class probability distribution.
    """
    if crop_bgr is None or crop_bgr.shape[0] < 5 or crop_bgr.shape[1] < 5:
        return {
            "predicted_class": "healthy",
            "predicted_index": 0,
            "confidence": 0.0,
            "probabilities": {"healthy": 1.0, "rot": 0.0, "sprout": 0.0}
        }

    session = get_classifier_session()
    global _INPUT_NAME
    if _INPUT_NAME is None:
        _INPUT_NAME = session.get_inputs()[0].name

    tensor = preprocess_onion_crop(crop_bgr)
    raw_outputs = session.run(None, {_INPUT_NAME: tensor})
    logits = raw_outputs[0][0]  # Shape: (3,)

    # Numerically stable softmax
    exp_logits = np.exp(logits - np.max(logits))
    probs = exp_logits / np.sum(exp_logits)

    pred_idx = int(np.argmax(probs))
    pred_class = CLASSES[pred_idx]
    confidence = float(probs[pred_idx])

    return {
        "predicted_class": pred_class,
        "predicted_index": pred_idx,
        "confidence": round(confidence, 4),
        "probabilities": {
            CLASSES[i]: round(float(probs[i]), 4) for i in range(len(CLASSES))
        }
    }
