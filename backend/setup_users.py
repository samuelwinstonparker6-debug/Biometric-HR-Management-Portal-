import mysql.connector

conn = mysql.connector.connect(host='127.0.0.1', user='root', port=3306)
cursor = conn.cursor()

# Drop and recreate completely fresh
cursor.execute("DROP DATABASE IF EXISTS payroll_db;")
cursor.execute("CREATE DATABASE payroll_db;")
conn.commit()
conn.close()

# Reconnect 
conn = mysql.connector.connect(host='127.0.0.1', user='root', port=3306, database='payroll_db')
cursor = conn.cursor()

# Create users table directly
print("Creating users table...")
cursor.execute("""
CREATE TABLE IF NOT EXISTS users (
    user_id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    role ENUM('admin', 'employee') DEFAULT 'admin',
    employee_id INT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
""")

# Insert users directly
print("Inserting users...")
users_data = [
    ('admin', 'admin123', 'System Administrator', 'admin', None),
    ('rahul', 'password123', 'Rahul Sharma', 'employee', 1),
    ('priya', 'password123', 'Priya Patel', 'employee', 2),
    ('jonathan', 'password123', 'Jonathan D\'Souza', 'employee', 3),
]

for user in users_data:
    try:
        cursor.execute(
            "INSERT INTO users (username, password, full_name, role, employee_id) VALUES (%s, %s, %s, %s, %s)",
            user
        )
        print(f"  ✓ Inserted {user[0]}")
    except Exception as e:
        print(f"  ✗ Error inserting {user[0]}: {e}")

conn.commit()

# Verify
print("\n=== Users in Database ===")
cursor.execute("SELECT user_id, username, password, full_name FROM users ORDER BY user_id;")
for row in cursor.fetchall():
    print(f"  ID {row[0]}: {row[1]} / {row[2]} / {row[3]}")

cursor.close()
conn.close()

print("\n✓ Users table created and populated!")
