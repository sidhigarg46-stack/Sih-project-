"""
backend/database.py
SQLite database connection and DDL table creation logic for Onion Quality Grading System.
"""

import sqlite3
from pathlib import Path
from typing import Generator
from contextlib import contextmanager

# Local database file path
DB_DIR = Path(__file__).resolve().parent
DB_PATH = DB_DIR / "onion_grading.db"

# SQL DDL for Batch, Onion, and InspectionRecord tables as specified in database_schema.md
CREATE_TABLES_SQL = """
PRAGMA foreign_keys = ON;

-- 1. Batch Table
CREATE TABLE IF NOT EXISTS batches (
    batch_id TEXT PRIMARY KEY,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    total_onions INTEGER NOT NULL DEFAULT 0,
    avg_diameter_mm REAL NOT NULL DEFAULT 0.0,
    uniformity_score REAL NOT NULL,          -- Coefficient of variation of diameters across the batch
    grade TEXT NOT NULL,                     -- Final assigned category (Extra, Standard, Commercial, Reject)
    grade_a_pct REAL NOT NULL,               -- Calculated percentage of Grade A onions (>60mm)
    urs_pct REAL NOT NULL,                   -- Calculated percentage of URS onions (<40mm)
    base_market_price REAL NOT NULL DEFAULT 30.0, -- Base reference rate in INR/kg
    recommended_price REAL NOT NULL,         -- Final computed price based on base rate and defect penalty
    sell_priority TEXT NOT NULL,             -- Assigned risk action (Hold, Sell Soon, Sell First)
    original_image_path TEXT,
    annotated_image_path TEXT
);

-- 2. Onion Table
CREATE TABLE IF NOT EXISTS onions (
    onion_id TEXT PRIMARY KEY,
    batch_id TEXT NOT NULL,
    diameter_mm REAL NOT NULL,               -- Converted physical size
    circularity REAL NOT NULL,               -- Misshapen index calculated as 4*pi*Area / Perimeter^2
    defect_rot BOOLEAN NOT NULL DEFAULT 0,   -- Flagged via dark/black irregular patch detection
    defect_sprout BOOLEAN NOT NULL DEFAULT 0,-- Flagged via green hue extending beyond boundary
    defect_damage BOOLEAN NOT NULL DEFAULT 0,-- Flagged via convexity defect rules
    size_class TEXT NOT NULL,                -- Grade A (>60mm), Grade B (40-60mm), URS (<40mm)
    bbox_x INTEGER NOT NULL DEFAULT 0,       -- Bounding box X coordinate (pixels)
    bbox_y INTEGER NOT NULL DEFAULT 0,       -- Bounding box Y coordinate (pixels)
    bbox_w INTEGER NOT NULL DEFAULT 0,       -- Bounding box Width (pixels)
    bbox_h INTEGER NOT NULL DEFAULT 0,       -- Bounding box Height (pixels)
    confidence REAL DEFAULT 1.0,             -- YOLO detection confidence score
    FOREIGN KEY (batch_id) REFERENCES batches (batch_id) ON DELETE CASCADE
);

-- 3. InspectionRecord Table
CREATE TABLE IF NOT EXISTS inspection_records (
    record_id TEXT PRIMARY KEY,
    batch_id TEXT NOT NULL,
    report_url TEXT NOT NULL,                -- The local LAN URL path to the report
    qr_code_data TEXT,                       -- QR code payload data
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (batch_id) REFERENCES batches (batch_id) ON DELETE CASCADE
);

-- Indices for performance
CREATE INDEX IF NOT EXISTS idx_onions_batch_id ON onions (batch_id);
CREATE INDEX IF NOT EXISTS idx_inspection_records_batch_id ON inspection_records (batch_id);
CREATE INDEX IF NOT EXISTS idx_batches_timestamp ON batches (timestamp DESC);
"""

def init_db(db_path: Path = DB_PATH) -> None:
    """Initialize SQLite database file and execute DDL table definitions."""
    db_path.parent.mkdir(parents=True, exist_ok=True)
    with sqlite3.connect(db_path) as conn:
        conn.execute("PRAGMA foreign_keys = ON;")
        conn.executescript(CREATE_TABLES_SQL)
        # Migration: ensure confidence column exists in existing databases
        try:
            conn.execute("ALTER TABLE onions ADD COLUMN confidence REAL DEFAULT 1.0;")
            conn.commit()
        except sqlite3.OperationalError:
            pass

@contextmanager
def get_db_connection(db_path: Path = DB_PATH) -> Generator[sqlite3.Connection, None, None]:
    """Context manager for SQLite connections with row_factory enabled."""
    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON;")
    try:
        yield conn
    finally:
        conn.close()
