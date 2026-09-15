"""
EMERGENCY FRESH DATABASE RESET
================================
This script DROPS and RECREATES payroll_db from scratch.
USE ONLY when the database is completely broken.
Normal restarts use init_db.py which is safe and non-destructive.
"""
import mysql.connector
import os
import sys

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

def connect(with_db=False):
    kwargs = {'host': '127.0.0.1', 'user': 'root', 'port': 3306, 'connect_timeout': 10}
    if with_db:
        kwargs['database'] = 'payroll_db'
    return mysql.connector.connect(**kwargs)

def run_sql_file(cursor, filename):
    filepath = os.path.join(BASE_DIR, filename)
    if not os.path.exists(filepath):
        print(f"[ERROR] File not found: {filepath}")
        return
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    for stmt in [s.strip() for s in content.split(';') if s.strip()]:
        try:
            cursor.execute(stmt)
        except mysql.connector.Error as e:
            if e.errno not in (1050, 1062, 1007, 1060):
                print(f"  [WARN] {e.msg[:80]}")

print("\n" + "="*55)
print("  EMERGENCY DATABASE RESET - payroll_db")
print("="*55)

try:
    conn = connect(with_db=False)
    cursor = conn.cursor()

    print("\n[1/4] Dropping existing payroll_db...")
    cursor.execute("DROP DATABASE IF EXISTS payroll_db;")
    
    print("[2/4] Creating fresh payroll_db...")
    cursor.execute("CREATE DATABASE payroll_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;")
    conn.commit()
    cursor.close()
    conn.close()

    conn = connect(with_db=True)
    cursor = conn.cursor()

    print("[3/4] Creating tables from schema.sql...")
    run_sql_file(cursor, 'schema.sql')
    conn.commit()

    print("[4/4] Seeding data from seed.sql...")
    run_sql_file(cursor, 'seed.sql')
    conn.commit()

    cursor.close()
    conn.close()

    print("\n[SUCCESS] Database reset complete!")
    print("\n  Login Credentials:")
    print("    Username: admin     Password: admin123")
    print("    Username: rahul     Password: password123")
    print("    Username: priya     Password: password123")
    print("\n" + "="*55)

except mysql.connector.Error as e:
    print(f"\n[ERROR] {e}")
    print("[ERROR] Is MySQL running? Start XAMPP and enable MySQL first!")
    sys.exit(1)
