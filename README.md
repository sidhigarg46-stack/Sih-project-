# 🧅 OnionIQ — AI Onion Quality Grading & Mandi Valuation System

> **A local-only, classical Computer Vision (OpenCV) and AGMARK-compliant grading MVP for onions with transparent mandi pricing, storage risk evaluation, and LAN QR code sharing.**

[![FastAPI](https://img.shields.io/badge/Backend-FastAPI-009688.svg?style=flat&logo=fastapi)](https://fastapi.tiangolo.com)
[![OpenCV](https://img.shields.io/badge/Vision-OpenCV%204-5C3EE8.svg?style=flat&logo=opencv)](https://opencv.org)
[![SQLite](https://img.shields.io/badge/Database-SQLite3-003B57.svg?style=flat&logo=sqlite)](https://sqlite.org)
[![React](https://img.shields.io/badge/Frontend-React%2018%20(Vite)-61DAFB.svg?style=flat&logo=react)](https://react.dev)
[![Standards](https://img.shields.io/badge/Standards-AGMARK%20%2F%20NHB-D97706.svg?style=flat)](#agmark-grading-specifications)
[![Local Only](https://img.shields.io/badge/Deployment-100%25%20Local%20Offline-15803D.svg?style=flat)](#architectural-principles)

---

## 📖 Table of Contents
- [Architectural Principles](#architectural-principles)
- [Key Features](#key-features)
- [Computer Vision Pipeline](#computer-vision-pipeline)
- [Mathematical Formulations](#mathematical-formulations)
- [AGMARK Grading Specifications](#agmark-grading-specifications)
- [Database Schema](#database-schema)
- [Project Directory Structure](#project-directory-structure)
- [API Reference](#api-reference)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Backend Setup](#backend-setup)
  - [Frontend Setup](#frontend-setup)
- [Mobile & LAN Workflow](#mobile--lan-workflow)

---

## 🏛️ Architectural Principles

OnionIQ was engineered to address the real-world operational challenges of Indian Agricultural Produce Market Committees (APMC Mandis) and rural cold storage warehouses:
1. **100% Local & Offline**: Operates completely without internet connectivity, cloud APIs, external paid services, or Docker containers.
2. **Hybrid Edge Vision (Lightweight DL + Classical CV)**: Combines edge-optimized ONNX models (YOLO bulb detection via `best.onnx` + MobileNetV2 defect classification via `onion_classifier.onnx`).
3. **Transparent Mathematical Valuation**: Every rupee deducted from the mandi price is fully explained with itemized formulas.
4. **Culturally Rooted Aesthetics**: Embedded with authentic Indian agricultural motifs (Warli accents, Jali dividers, Rangoli quality stamps, and Rupee `₹` typography).

---

## ✨ Key Features

- **Standard Coin Metric Calibration**: Detects an Indian coin (standard ₹5 coin = 23.0 mm or ₹10 coin = 27.0 mm) positioned in the viewfinder guide to calculate real-world physical scale.
- **Contour & Watershed Segmentation**: Separates touching onion bulbs and extracts contour area, perimeter, equivalent diameter, and circularity.
- **Three-Defect Screening Engine**:
  - **Necrotic Rot & Sprouting**: Deep learning classification via MobileNetV2 (`onion_classifier.onnx`) running on individual bulb crops.
  - **Mechanical Damage**: Inward cuts, gouges, or slicing detected using classical contour convexity defects (`cv2.convexityDefects`).
- **AGMARK & NHB Grade Classifier**: Maps batch statistics against official Indian standards into **Extra**, **Standard**, **Commercial**, or **Reject**.
- **Transparent Penalty Pricing Model**: Adjusts baseline mandi rates with uniformity bonuses and proportional defect penalties.
- **Risk-Weighted Sell Priority**: Recommends **Hold**, **Sell Soon**, or **Sell First** to prevent spoilage in warehouses.
- **Mobile Camera Capture & Guide**: HTML5 `<input type="file" accept="image/*" capture="environment">` with a static viewfinder overlay guide.
- **Instant Digital Mandi Pass (QR Code)**: Generates a high-contrast QR code encoding the local Wi-Fi / LAN URL for farmers and mandi buyers.

---

## 🔬 Computer Vision Pipeline

```
+-------------------------------------------------------------------------+
|                              INPUT IMAGE                                |
|          (Captured via phone/camera on neutral backdrop with coin)      |
+------------------------------------+------------------------------------+
                                     |
                                     v
+-------------------------------------------------------------------------+
|                  STAGE 1: REFERENCE COIN DETECTION                      |
|  - Crop Top-Left Guide Zone                                             |
|  - Hough Circle Transform & Circularity search                          |
|  - pixels_per_mm = detected_diameter_px / known_diameter_mm             |
+------------------------------------+------------------------------------+
                                     |
                                     v
+-------------------------------------------------------------------------+
|             STAGE 2: ONION BULB DETECTION & SEGMENTATION                |
|  - Deep Learning Detection: best.onnx (YOLO) with confidence >= 0.2     |
|  - Mask out reference coin region & extract localized bulb ROIs         |
|  - Morphological closing & elliptical prior submask generation          |
|  - Fallback: Multi-channel thresholding (Grayscale + HSV + LAB)         |
|  - Compute diameter_mm and circularity (4 * pi * Area / Perimeter^2)   |
+------------------------------------+------------------------------------+
                                     |
                                     v
+-------------------------------------------------------------------------+
|              STAGE 3: DEEP LEARNING & CV DEFECT SCREENING               |
|  - Deep Learning Classification: onion_classifier.onnx (MobileNetV2)    |
|    predicts healthy / rot / sprout per onion crop                       |
|  - Damage: Convexity Defect depth >= 3.2mm (classical contour analysis) |
+------------------------------------+------------------------------------+
                                     |
                                     v
+-------------------------------------------------------------------------+
|                  STAGE 4: VISUAL OVERLAY ANNOTATION                     |
|  - Color-coded Bounding Boxes: Green (OK), Red (ROT),                   |
|    Amber (SPRT), Orange (DMG)                                           |
|  - Render metric badges: #Index, Diameter (mm), Defect tag              |
+-------------------------------------------------------------------------+
```

---

## 📐 Mathematical Formulations

### 1. Shape Circularity (Misshapen Index)
$$\mathcal{C} = \frac{4\pi \times \text{Area}}{\text{Perimeter}^2} \quad (0 \le \mathcal{C} \le 1)$$
- Values near $1.0$ denote spherical/ellipsoid bulbs. Lower values indicate misshapen, twinned, or damaged onions.

### 2. Size Uniformity (Coefficient of Variation)
$$CV = \left(\frac{\sigma}{\mu}\right) \times 100\%$$
- $CV \le 10\%$: High Uniformity (+5% price bonus)
- $10\% < CV \le 20\%$: Standard Uniformity (neutral rate)
- $20\% < CV \le 30\%$: Moderate Variation (-5% penalty)
- $CV > 30\%$: Poor Uniformity (-10% penalty)

### 3. Penalty-Adjusted Mandi Price
$$\text{Final Price} = \max\left(\text{MinFloor}, P_{\text{base}} + \text{Adj}_{\text{uniformity}} - P_{\text{rot}} - P_{\text{sprout}} - P_{\text{damage}} - P_{\text{urs}}\right)$$
Where:
- $P_{\text{rot}} = P_{\text{base}} \times (\text{Rot\%} / 100) \times 3.5$
- $P_{\text{sprout}} = P_{\text{base}} \times (\text{Sprout\%} / 100) \times 2.0$
- $P_{\text{damage}} = P_{\text{base}} \times (\text{Damage\%} / 100) \times 1.2$
- $P_{\text{urs}} = P_{\text{base}} \times (\text{URS\%} / 100) \times 0.8$

### 4. Storage Risk & Sell Priority
$$\text{Composite Risk} = 0.50 \times \text{Rot\%} + 0.35 \times \text{Sprout\%} + 0.15 \times \text{Damage\%}$$
- **Sell First**: $\text{Composite Risk} \ge 10.0$ or $\text{Rot\%} \ge 3.0\%$ (urgent spoilage hazard; liquidate immediately).
- **Sell Soon**: $\text{Composite Risk} \ge 4.5$ or $\text{Sprout\%} \ge 5.0\%$ (vegetative growth starting; dispatch to retail within 3-5 days).
- **Hold**: $\text{Composite Risk} < 4.5$ (dormant, sound bulbs; suitable for warehouse storage).

---

## 🏷️ AGMARK Grading Specifications

Based on the Agricultural Produce (Grading and Marking) Act, Directorate of Marketing & Inspection (DMI), Govt. of India:

| AGMARK Grade | Max Rot % | Max Sprout % | Max Damage % | Min Grade A (>60mm) | Max URS (<40mm) | Min Circularity |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| **Extra Class** | 0.0% | 0.0% | 3.0% | 50.0% | 3.0% | 0.85 |
| **Standard Class** | 2.0% | 3.0% | 8.0% | 20.0% | 10.0% | 0.75 |
| **Commercial Class**| 5.0% | 8.0% | 15.0% | 0.0% | 25.0% | 0.65 |
| **Reject** | >5.0% | >8.0% | >15.0% | N/A | >25.0% | <0.65 |

---

## 🗄️ Database Schema

Implemented in SQLite ([backend/database.py](backend/database.py)) with foreign keys and cascaded deletion:

```
+----------------------------------+       +-----------------------------------+
|             batches              |       |              onions               |
+----------------------------------+       +-----------------------------------+
| batch_id (PK, TEXT)              |<-----\| onion_id (PK, TEXT)               |
| timestamp (DATETIME)             |      || batch_id (FK, TEXT)               |
| total_onions (INTEGER)           |      || diameter_mm (REAL)                |
| avg_diameter_mm (REAL)           |      || circularity (REAL)                |
| uniformity_score (REAL)          |      || defect_rot (BOOLEAN)              |
| grade (TEXT)                     |      || defect_sprout (BOOLEAN)           |
| grade_a_pct (REAL)               |      || defect_damage (BOOLEAN)           |
| urs_pct (REAL)                   |      || size_class (TEXT)                 |
| base_market_price (REAL)         |      || bbox_x, bbox_y (INTEGER)          |
| recommended_price (REAL)         |      || bbox_w, bbox_h (INTEGER)          |
| sell_priority (TEXT)             |      +-----------------------------------+
| original_image_path (TEXT)       |
| annotated_image_path (TEXT)      |
+----------------------------------+
                 ^
                 |
+----------------+-----------------+
|        inspection_records        |
+----------------------------------+
| record_id (PK, TEXT)             |
| batch_id (FK, TEXT)              |
| report_url (TEXT)                |
| qr_code_data (TEXT)              |
| created_at (DATETIME)            |
+----------------------------------+
```

---

## 📂 Project Directory Structure

```
onion/
├── backend/
│   ├── cv/
│   │   ├── __init__.py
│   │   ├── defect_detector.py     # Classical HSV rot/sprout & convexity defect logic
│   │   ├── pipeline.py            # Computer Vision pipeline orchestrator & overlay renderer
│   │   ├── reference_detector.py  # Coin Hough/contour detector (pixels_per_mm)
│   │   └── segmentation.py        # Multi-channel color & watershed segmentation
│   ├── engine/
│   │   ├── __init__.py
│   │   ├── grading.py             # AGMARK grade classifier & batch aggregator
│   │   └── pricing.py             # Transparent penalty pricing & risk score engine
│   ├── storage/                   # Saved input and annotated batch images
│   ├── database.py                # SQLite DDL creation and connection managers
│   ├── grading_config.json        # Official AGMARK thresholds and penalty coefficients
│   ├── main.py                    # FastAPI server & endpoints
│   ├── models.py                  # Pydantic v2 schemas and enums
│   ├── utils.py                   # LAN IP auto-detector & Base64 QR code generator
│   ├── test_pipeline_e2e.py       # Automated CV pipeline unit test
│   └── test_api_e2e.py            # Automated FastAPI endpoint integration test
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── AgmarkModal.jsx    # AGMARK specs & formula reference popup
│   │   │   ├── Header.jsx         # Mandi header with traditional branding
│   │   │   ├── HistoryView.jsx    # Historical batch records browser
│   │   │   ├── ResultsDashboard.jsx # Bounding box visualizer, formulas & QR modal
│   │   │   └── UploadSection.jsx  # Camera capture, viewfinder overlay & parameters
│   │   ├── App.jsx                # Application view orchestration & LAN URL router
│   │   ├── index.css              # Custom Indian agricultural design tokens
│   │   └── main.jsx               # React entry point
│   ├── index.html                 # HTML shell with Google Fonts
│   └── package.json
├── database_schema.md             # Specification reference
├── prd.md                         # Product requirements reference
└── README.md                      # Complete system documentation
```

---

## 🔌 API Reference

### `POST /batches/analyze`
Accepts a multipart image upload along with calibration parameters and returns the complete inspection report.

**Request Form Data:**
- `file`: Image file (`image/jpeg`, `image/png`)
- `reference_diameter_mm`: Float (default `23.0` for ₹5 coin)
- `base_market_price`: Float (default `30.0` ₹/kg)

**Response:**
```json
{
  "batch": {
    "batch_id": "batch_bc0671e2",
    "timestamp": "2026-09-12T13:54:20.123456",
    "total_onions": 4,
    "avg_diameter_mm": 47.1,
    "uniformity_score": 7.1,
    "grade": "Reject",
    "grade_a_pct": 0.0,
    "grade_b_pct": 100.0,
    "urs_pct": 0.0,
    "rot_pct": 25.0,
    "sprout_pct": 25.0,
    "damage_pct": 25.0,
    "recommended_price": 5.0,
    "sell_priority": "Sell First"
  },
  "onions": [ ... ],
  "price_breakdown": {
    "base_market_price_inr": 30.0,
    "uniformity_adjustment_inr": 1.5,
    "rot_penalty_inr": 26.25,
    "sprout_penalty_inr": 15.0,
    "damage_penalty_inr": 9.0,
    "urs_penalty_inr": 0.0,
    "net_penalty_percentage": 83.3,
    "final_recommended_price_inr": 5.0,
    "formula_expression": "₹30.00 base + ₹1.50 (uniformity CV 7.1%) - ₹26.25 (rot 25.0%) ..."
  },
  "priority_breakdown": {
    "composite_risk_score": 25.0,
    "decision_reasoning": "High spoilage risk (Composite Risk 25.0/100, Rot 25.0%). Rot accelerates exponentially in transit or storage. Liquidate immediately to prevent total batch decay.",
    "priority": "Sell First"
  },
  "annotated_image_url": "/storage/annotated_12345.jpg",
  "report_url": "http://192.168.1.7:5173/report/batch_bc0671e2",
  "qr_code_base64": "data:image/png;base64,iVBORw0K..."
}
```

### `GET /batches/{batch_id}/report`
Retrieves the saved inspection report, transparent breakdowns, and QR code for a specific evaluated batch.

### `GET /batches`
Returns the list of recently evaluated batches for history browsing.

---

## 🚀 Getting Started

### Prerequisites
- **Python**: Version 3.10+ (tested with Python 3.13)
- **Node.js**: Version 18+ (tested with Node v24)
- **npm**: Version 9+

---

### Backend Setup

1. Open a terminal and navigate to the project directory:
   ```bash
   cd onion
   ```

2. (Optional) Create and activate a Python virtual environment:
   ```bash
   python -m venv venv
   # On Windows:
   .\venv\Scripts\activate
   # On Linux/macOS:
   source venv/bin/activate
   ```

3. Install required Python packages:
   ```bash
   pip install fastapi uvicorn opencv-python numpy pydantic python-multipart pillow qrcode httpx
   ```

4. Run the automated tests to verify the pipeline:
   ```bash
   python -m backend.test_pipeline_e2e
   python -m backend.test_api_e2e
   ```

5. Launch the FastAPI server:
   ```bash
   python -m uvicorn backend.main:app --host 0.0.0.0 --port 8000
   ```
   The backend API will be available at `http://localhost:8000` (and interactive Swagger documentation at `http://localhost:8000/docs`).

---

### Frontend Setup

1. Open a second terminal and navigate to the `frontend` directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the Vite development server with LAN host sharing enabled:
   ```bash
   npm run dev -- --host 0.0.0.0
   ```

4. Open your web browser and navigate to:
   - **Local Browser**: `http://localhost:5173`
   - **LAN / Mobile Phone**: `http://<your-lan-ip>:5173` (e.g. `http://192.168.1.7:5173`)

---

## 📱 Mobile & LAN Workflow

1. Connect your smartphone and PC/laptop to the **same Wi-Fi network**.
2. On your phone, open the browser and enter `http://<your-lan-ip>:5173`.
3. Tap **Capture Photo** — your phone's native camera opens via `capture="environment"`.
4. Place a standard ₹5 coin in the top-left circle of the camera guide and spread the onions evenly.
5. Tap **Run AGMARK Grading & Valuation**.
6. View the instant results, bounding box overlays, and tap **Mandi Pass & QR** to share the verifiable report with other traders.

---

## 📜 License

Local MVP for Onion Quality Assessment and Mandi Valuation. Conforms to Directorate of Marketing & Inspection (DMI) AGMARK guidelines.
