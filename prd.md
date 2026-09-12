## Product Requirements Document: Onion Quality Grading System MVP

**Objective:** 
Build a local-only, AI-assisted onion quality assessment system that generates transparent grades, price recommendations, and sell-priority scores without cloud deployment[cite: 1].

**System Architecture:**
* **Backend:** Python/FastAPI running locally on port 8000[cite: 1].
* **Frontend:** React/Vite running locally on port 5173[cite: 1].
* **Constraints:** No Docker, cloud databases, or live external pricing APIs[cite: 1].

**Core Pipeline:**
* **Stage 0-2 (Capture & Sizing):** The web app captures an image with a fixed-size reference object to calculate pixels-per-mm, segment individual onions, and compute physical diameter and circularity[cite: 1].
* **Stage 3 (Defect Detection):** Classical computer vision techniques (HSV thresholding, contour concavity) flag rot, sprouting, and mechanical damage for each onion[cite: 1].
* **Stage 4-5 (Aggregation & Grading):** A configurable rule engine applies AGMARK/NHB specifications to batch statistics to assign a formal grade (Extra, Standard, Commercial, Reject)[cite: 1].
* **Stage 6-7 (Pricing & Priority):** The system calculates a recommended price using a reference table minus defect penalties, and assigns a risk-based sell priority (Hold, Sell Soon, Sell First)[cite: 1].
* **Stage 8 (Reporting):** The UI displays per-onion defect overlays, batch statistics, formula breakdowns, and a QR code linking to a local LAN report[cite: 1].