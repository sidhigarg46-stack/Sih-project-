## Database Schema (SQLite)

| Table | Column | Data Type | Description |
| :--- | :--- | :--- | :--- |
| **Batch** | `batch_id` | TEXT (PK) | Unique identifier for the evaluated batch[cite: 1]. |
| **Batch** | `uniformity_score` | REAL | Coefficient of variation of diameters across the batch[cite: 1]. |
| **Batch** | `grade` | TEXT | Final assigned category (Extra, Standard, Commercial, or Reject)[cite: 1]. |
| **Batch** | `grade_a_pct` | REAL | Calculated percentage of Grade A onions[cite: 1]. |
| **Batch** | `urs_pct` | REAL | Calculated percentage of URS onions[cite: 1]. |
| **Batch** | `recommended_price` | REAL | Final computed price based on base rate and defect penalty[cite: 1]. |
| **Batch** | `sell_priority` | TEXT | Assigned risk action (Hold, Sell Soon, or Sell First)[cite: 1]. |
| **Onion** | `onion_id` | TEXT (PK) | Unique identifier for the individual segmented onion[cite: 1]. |
| **Onion** | `batch_id` | TEXT (FK) | Reference linking the onion to its parent batch[cite: 1]. |
| **Onion** | `diameter_mm` | REAL | Converted physical size[cite: 1]. |
| **Onion** | `circularity` | REAL | Misshapen index calculated as 4π × Area / Perimeter²[cite: 1]. |
| **Onion** | `defect_rot` | BOOLEAN | Flagged via dark/black irregular patch detection[cite: 1]. |
| **Onion** | `defect_sprout` | BOOLEAN | Flagged via green hue extending beyond boundary[cite: 1]. |
| **Onion** | `defect_damage` | BOOLEAN | Flagged via convexity defect rules[cite: 1]. |
| **InspectionRecord** | `record_id` | TEXT (PK) | Unique identifier for the generated digital report[cite: 1]. |
| **InspectionRecord** | `batch_id` | TEXT (FK) | Reference to the evaluated batch[cite: 1]. |
| **InspectionRecord** | `report_url` | TEXT | The local LAN URL path to the report[cite: 1]. |