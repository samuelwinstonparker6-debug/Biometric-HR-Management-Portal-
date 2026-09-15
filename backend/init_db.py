import mysql.connector
import os
import sys

def get_base_dir():
    """Get the directory where this script lives, works even when called from another dir."""
    return os.path.dirname(os.path.abspath(__file__))

def connect_to_mysql(with_db=False):
    """Establish a MySQL connection, with optional database selection."""
    from config import DB_CONFIG
    kwargs = DB_CONFIG.copy()
    if not with_db and 'database' in kwargs:
        del kwargs['database']
    return mysql.connector.connect(**kwargs)

def database_exists():
    """Check if payroll_db exists and has the users table (strongly validate)."""
    try:
        conn = connect_to_mysql(with_db=True)
        cursor = conn.cursor()
        cursor.execute("SHOW TABLES LIKE 'users'")
        result = cursor.fetchone()
        cursor.close()
        conn.close()
        return result is not None
    except Exception:
        return False

def admin_user_exists():
    """Check if the admin user exists in the database."""
    try:
        conn = connect_to_mysql(with_db=True)
        cursor = conn.cursor()
        cursor.execute("SELECT COUNT(*) FROM users WHERE username = 'admin'")
        count = cursor.fetchone()[0]
        cursor.close()
        conn.close()
        return count > 0
    except Exception:
        return False

def run_sql_file(cursor, filepath):
    """Execute a SQL file safely, skipping errors for idempotent runs."""
    base_dir = get_base_dir()
    full_path = os.path.join(base_dir, filepath)
    if not os.path.exists(full_path):
        print(f"[WARNING] SQL file not found: {full_path}")
        return
    with open(full_path, 'r', encoding='utf-8') as f:
        content = f.read()
    # Split on semicolons, skip empty statements and MySQL directives
    statements = [s.strip() for s in content.split(';') if s.strip()]
    for stmt in statements:
        try:
            cursor.execute(stmt)
        except mysql.connector.Error as e:
            # Silently skip duplicate key / already exists errors — they're fine
            if e.errno not in (1050, 1062, 1007, 1060):  # table exists, dup key, db exists, dup col
                print(f"[WARN] SQL ignored: {e.msg[:80]}")

def ensure_admin_user(cursor):
    """Insert the admin user only if it doesn't exist."""
    cursor.execute("SELECT COUNT(*) FROM users WHERE username = 'admin'")
    if cursor.fetchone()[0] == 0:
        cursor.execute(
            "INSERT INTO users (username, password, full_name, role) VALUES ('admin', 'admin123', 'System Administrator', 'admin')"
        )
        print("[INFO] Admin user created.")
    else:
        print("[OK] Admin user already exists — not touching it.")

def init_db():
    """
    Safe, idempotent database initialization.
    - If DB + tables exist: ONLY ensures admin user exists. Never deletes data.
    - If DB missing: creates DB, tables, and seeds initial data.
    - This function is SAFE to call every time the server starts.
    """
    base_dir = get_base_dir()

    # Case 1: Database and tables already exist — just verify admin user
    if database_exists():
        print("[OK] Database 'payroll_db' already exists with tables. Skipping initialization.")
        try:
            conn = connect_to_mysql(with_db=True)
            cursor = conn.cursor()
            ensure_admin_user(cursor)
            conn.commit()
            cursor.close()
            conn.close()
        except Exception as e:
            print(f"[WARNING] Could not verify admin user: {e}")
        return

    # Case 2: Database or tables don't exist — full initialization
    print("[INFO] Database not found or incomplete. Initializing fresh database...")

    try:
        # Step 1: Connect without database, try to create payroll_db
        try:
            conn = connect_to_mysql(with_db=False)
            cursor = conn.cursor()
            cursor.execute("CREATE DATABASE IF NOT EXISTS payroll_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;")
            conn.commit()
            cursor.close()
            conn.close()
            print("[OK] Database 'payroll_db' created or already exists.")
        except mysql.connector.Error as e:
            if e.errno == 1044: # Access denied for user to database
                print("[WARN] Access denied to create database. Assuming cloud environment where database already exists.")
            else:
                raise e

        # Step 2: Reconnect to the database (which must exist now)
        conn = connect_to_mysql(with_db=True)
        cursor = conn.cursor()

        # Step 3: Run schema (CREATE TABLE IF NOT EXISTS — totally safe)
        print("[INFO] Creating tables from schema.sql...")
        run_sql_file(cursor, 'schema.sql')
        conn.commit()

        # Step 4: Seed initial data using INSERT IGNORE (safe, won't duplicate)
        print("[INFO] Seeding initial data from seed.sql...")
        run_sql_file(cursor, 'seed.sql')
        conn.commit()

        # Step 5: Ensure admin always exists
        ensure_admin_user(cursor)
        conn.commit()

        cursor.close()
        conn.close()

        print("\n[SUCCESS] Database initialized successfully!")
        print("\n  Default Login Credentials:")
        print("    Username: admin     Password: admin123")
        print("\n  Employee Credentials:")
        print("    Username: rahul     Password: password123")
        print("    Username: priya     Password: password123")

    except mysql.connector.Error as e:
        print(f"\n[ERROR] Database initialization failed: {e}")
        print("[ERROR] Is MySQL running? Is XAMPP started?")
        sys.exit(1)

if __name__ == '__main__':
    init_db()
