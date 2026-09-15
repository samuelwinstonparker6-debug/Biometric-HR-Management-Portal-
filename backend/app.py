from flask import Flask
from flask_cors import CORS
import time
import sys
import os

# Change working directory to where app.py lives so relative paths work
os.chdir(os.path.dirname(os.path.abspath(__file__)))

from db import init_db
from init_db import init_db as init_database

from routes.auth import auth_bp
from routes.employees import employees_bp
from routes.attendance import attendance_bp
from routes.leave import leave_bp
from routes.payroll import payroll_bp
from routes.scores import scores_bp
from routes.assistant import assistant_bp
from routes.dashboard import dashboard_bp
from routes.reports import reports_bp
from routes.queries import queries_bp

app = Flask(__name__)
CORS(app, supports_credentials=True, origins=['http://localhost:3000', 'http://127.0.0.1:3000'])

app.register_blueprint(auth_bp)
app.register_blueprint(employees_bp)
app.register_blueprint(attendance_bp)
app.register_blueprint(leave_bp)
app.register_blueprint(payroll_bp)
app.register_blueprint(scores_bp)
app.register_blueprint(assistant_bp)
app.register_blueprint(dashboard_bp)
app.register_blueprint(reports_bp)
app.register_blueprint(queries_bp)

@app.route('/api/health', methods=['GET'])
def health():
    return {'status': 'ok', 'message': 'Payroll API is running'}

if __name__ == '__main__':
    print("=" * 55)
    print("  NexGen Payroll System - Backend Server Starting")
    print("=" * 55)

    # Step 1: Initialize database (safe, idempotent - won't delete data)
    print("\n[STEP 1] Checking database...")
    try:
        init_database()
    except SystemExit:
        print("[ERROR] Database initialization failed. Make sure MySQL/XAMPP is running!")
        print("[ERROR] Start XAMPP, enable MySQL, then run this again.")
        input("\nPress Enter to exit...")
        sys.exit(1)
    except Exception as e:
        print(f"[ERROR] Unexpected error during DB init: {e}")
        input("\nPress Enter to exit...")
        sys.exit(1)

    # Step 2: Establish connection pool with retries
    print("\n[STEP 2] Connecting to database pool...")
    pool_ok = False
    for attempt in range(1, 6):
        if init_db(retries=3, delay=2):
            pool_ok = True
            break
        print(f"[WARN] Pool init failed (attempt {attempt}/5). Retrying in 3s...")
        time.sleep(3)

    if not pool_ok:
        print("[ERROR] Could not establish database connection pool after 5 attempts.")
        print("[ERROR] Is MySQL running on port 3307?")
        input("\nPress Enter to exit...")
        sys.exit(1)

    # Step 3: Start Flask server
    print("\n[STEP 3] Starting Flask server on port 5001...")
    print("\n  Backend ready! API available at http://127.0.0.1:5001")
    print("  Health check: http://127.0.0.1:5001/api/health")
    print("\n  Login Credentials:")
    print("    admin / admin123")
    print("=" * 55 + "\n")

    app.run(debug=False, port=5001, threaded=True, host='127.0.0.1')
