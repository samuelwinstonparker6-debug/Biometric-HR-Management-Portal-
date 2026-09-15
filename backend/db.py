import time
import mysql.connector
from mysql.connector import pooling
from config import DB_CONFIG

connection_pool = None

def init_db(retries=5, delay=3):
    """Initialize the MySQL connection pool with retries."""
    global connection_pool
    print("Initializing database connection pool...")
    for i in range(retries):
        try:
            connection_pool = pooling.MySQLConnectionPool(
                pool_name="payroll_pool",
                pool_size=5,
                **DB_CONFIG
            )
            print("[OK] Successfully connected to MySQL database.")
            return True
        except mysql.connector.Error as err:
            print(f"[WARN] DB pool connection failed (Attempt {i+1}/{retries}): {err}")
            if i < retries - 1:
                print(f"[INFO] Retrying in {delay}s...")
                time.sleep(delay)
            else:
                print("[ERROR] Failed to initialize database pool after all retries.")
                return False

def get_db():
    """Get a connection from the pool, re-initializing if necessary."""
    global connection_pool
    if connection_pool is None:
        print("[WARN] Connection pool not initialized. Attempting to reconnect...")
        if not init_db(retries=3, delay=2):
            raise Exception("Database connection pool not initialized and could not be established.")
    try:
        return connection_pool.get_connection()
    except mysql.connector.errors.PoolExhausted:
        # Pool exhausted — wait a moment and try again
        time.sleep(1)
        return connection_pool.get_connection()

def execute_query(query, params=None, fetch=True):
    """Execute a SQL query and return results or last inserted row ID."""
    conn = get_db()
    cursor = conn.cursor(dictionary=True)
    try:
        cursor.execute(query, params or ())
        if fetch:
            result = cursor.fetchall()
            return result
        else:
            conn.commit()
            return cursor.lastrowid
    except mysql.connector.Error as e:
        conn.rollback()
        raise e
    finally:
        cursor.close()
        conn.close()

def execute_many(query, data_list):
    """Execute a batch SQL statement."""
    conn = get_db()
    cursor = conn.cursor()
    try:
        cursor.executemany(query, data_list)
        conn.commit()
        return cursor.rowcount
    except mysql.connector.Error as e:
        conn.rollback()
        raise e
    finally:
        cursor.close()
        conn.close()
