import os
import sys

# Ensure backend folder is in path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app import app
from init_db import init_db

# Try to initialize the database (for cloud deployments)
try:
    print("[WSGI] Attempting to initialize/verify database on startup...")
    init_db()
except Exception as e:
    print(f"[WSGI WARNING] Database initialization skipped or failed: {e}")

if __name__ == "__main__":
    app.run()
