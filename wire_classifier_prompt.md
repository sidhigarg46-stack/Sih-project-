Wire the trained onion defect classifier (onion_classifier.onnx) into the
KandaGuru backend, replacing the HSV-threshold-based rot/sprout detection
in Stage 3 with the trained model, while keeping mechanical damage detection
as classical CV (no trained model exists for damage yet).

CONTEXT
- Stage 2 already runs best.onnx (YOLO detector, conf=0.2) to find onion
  bounding boxes — this part is done and working, don't touch it.
- Stage 3 currently classifies rot/sprout via HSV thresholding
  (V < 45 for rot, H:30-88/S>40/V>35 for sprout) inside each onion's bulb mask.
- Model file: onion_classifier.onnx — a MobileNetV2 classifier, 3 classes,
  trained with class order alphabetical: ["healthy", "rot", "sprout"].

REQUIRED CHANGES

1. Model placement
   - Add onion_classifier.onnx to backend/models/ (alongside best.onnx).

2. Dependencies
   - Add onnxruntime to backend/requirements (it should already be present
     if best.onnx integration added it; if not, add it now).
   - No PyTorch dependency needed — inference only requires onnxruntime.

3. Preprocessing (must match training exactly, or predictions will be wrong)
   - Input: a cropped onion image (from the existing bounding box crop
     logic already used for best.onnx's detections).
   - Convert BGR (OpenCV) -> RGB.
   - Resize to 224x224.
   - Scale pixel values to [0, 1] (divide by 255).
   - Normalize per-channel with mean=[0.485, 0.456, 0.406],
     std=[0.229, 0.224, 0.225].
   - Transpose to NCHW format (channels first), add batch dimension of 1.
   - dtype: float32.

4. Inference
   - Load onion_classifier.onnx once at FastAPI startup (same pattern as
     best.onnx's startup loading — reuse that pattern/location in the code).
   - For each onion bounding box already produced by Stage 2, crop the
     region, preprocess as above, run through the classifier session.
   - Apply softmax to the raw output logits to get class probabilities.
   - Take argmax as the predicted class: index 0=healthy, 1=rot, 2=sprout
     (confirm this order against the model's actual output — alphabetical
     class order from ImageFolder during training, but verify before
     assuming).

5. Integrate into Stage 3 pipeline
   - Replace the HSV-based rot mask and sprout mask logic with the
     classifier's prediction per onion: set the onion's defect_rot boolean
     True if predicted class == "rot", defect_sprout True if predicted
     class == "sprout".
   - Keep the existing convexity-defect-based damage detection unchanged —
     there is no trained model for mechanical damage yet.
   - An onion can only get one classifier label (healthy/rot/sprout) since
     this is single-label classification, but damage detection is
     independent/additional — an onion could be both e.g. "rot" from the
     classifier AND flagged for damage from convexity defects. Handle this
     as two separate boolean checks, not mutually exclusive.
   - Store the classifier's confidence score for each onion alongside the
     existing per-onion fields, if there's a natural place to add it to the
     onions table/schema — useful for debugging and later threshold tuning,
     but don't break the existing schema if this requires a migration;
     make it an additive/optional field.

6. Update batch-level aggregate calculations
   - rot_pct and sprout_pct (used in AGMARK grading and pricing formulas)
     should now be computed from the classifier's per-onion predictions
     rather than the old HSV mask area percentages. Confirm the existing
     aggregation logic (counting onions with defect_rot=True /
     total_onions) still applies correctly — it should, since the boolean
     fields are just populated differently now.

7. Update annotated image overlay (Stage 4)
   - Bounding box colors per onion should reflect the classifier's
     prediction: green=healthy, red=rot, amber=sprout, orange=damage
     (existing color scheme) — if an onion is both rot and damaged,
     keep existing precedence rules if any exist, or default to whichever
     the codebase already prioritizes.

8. Tests
   - Update backend/test_pipeline_e2e.py to cover the classifier step:
     confirm a known test image with a healthy onion produces defect_rot=
     False and defect_sprout=False, and that the classifier session loads
     without error.
   - Run the existing test suite (test_pipeline_e2e.py and test_api_e2e.py)
     after changes to confirm nothing else broke.

9. Documentation
   - Update README.md's Computer Vision Pipeline diagram (Stage 3) to
     reflect: "Deep Learning Classification: onion_classifier.onnx
     (MobileNetV2) predicts healthy/rot/sprout per onion crop" replacing
     the HSV threshold description for rot/sprout, while keeping the
     damage detection line as-is (still classical/convexity-based).

DO NOT
- Do not change Stage 1 (coin detection/calibration) or Stage 2 (onion
  detection via best.onnx) — those are working and out of scope.
- Do not remove the classical damage detection logic — it's still needed.
- Do not change the API response schema's field names — only how
  rot_pct/sprout_pct/defect_rot/defect_sprout get computed internally.

Confirm the class index order (0/1/2 -> healthy/rot/sprout) matches what
the ONNX model actually outputs before wiring it in — mistakes here would
silently swap rot and sprout labels without any error being raised.
