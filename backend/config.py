import os

DB_CONFIG = {
    'host': os.environ.get('DB_HOST', '127.0.0.1'),
    'user': os.environ.get('DB_USER', 'root'),
    'password': os.environ.get('DB_PASSWORD', ''),
    'database': os.environ.get('DB_NAME', 'payroll_db'),
    'port': int(os.environ.get('DB_PORT', 3307)),
    'connect_timeout': 5
}

SECRET_KEY = os.environ.get('SECRET_KEY', 'payroll-secret-key-2026')
