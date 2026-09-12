import sqlite3

conn = sqlite3.connect('backend/onion_grading.db')
tables = conn.execute("SELECT name FROM sqlite_master WHERE type='table'").fetchall()
print("Tables:", [t[0] for t in tables])

for t in ['batches', 'onions', 'inspection_records']:
    cols = conn.execute(f"PRAGMA table_info({t})").fetchall()
    print(f"Columns in {t}:", [c[1] for c in cols])
