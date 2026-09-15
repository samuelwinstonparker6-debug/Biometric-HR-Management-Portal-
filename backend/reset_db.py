import mysql.connector

# Force fresh database
conn = mysql.connector.connect(host='127.0.0.1', user='root', port=3306)
cursor = conn.cursor()

print("Dropping payroll_db...")
cursor.execute("DROP DATABASE IF EXISTS payroll_db;")

print("Creating payroll_db...")
cursor.execute("CREATE DATABASE payroll_db;")

conn.commit()
conn.close()

# Reconnect to new database
conn = mysql.connector.connect(host='127.0.0.1', user='root', port=3306, database='payroll_db')
cursor = conn.cursor()

print("Creating tables from schema.sql...")
with open('schema.sql', 'r') as f:
    schema = f.read()

for command in schema.split(';'):
    if command.strip():
        try:
            cursor.execute(command)
        except Exception as e:
            pass

print("Seeding data from seed.sql...")
with open('seed.sql', 'r') as f:
    seed = f.read()

for command in seed.split(';'):
    if command.strip():
        try:
            cursor.execute(command)
        except Exception as e:
            print(f"Seed error (can be ignored): {e}")

conn.commit()

# Verify users were inserted
print("\n=== Verifying Users ===")
cursor.execute("SELECT username, password, full_name, role FROM users;")
for row in cursor.fetchall():
    print(f"  {row[0]} / {row[1]} / {row[2]} / {row[3]}")

cursor.close()
conn.close()

print("\n✓ Database reset complete!")
print("\nLogin Credentials:")
print("  admin / admin123")
print("  rahul / password123")
print("  priya / password123")
print("  jonathan / password123")
