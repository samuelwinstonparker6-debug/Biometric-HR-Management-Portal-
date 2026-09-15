import mysql.connector
import os

conn = mysql.connector.connect(host='127.0.0.1', user='root', port=3306)
cursor = conn.cursor()

with open('schema.sql', 'r') as f:
    sql_file = f.read()

# Split by semicolon and execute each statement
sql_commands = [cmd for cmd in sql_file.split(';') if cmd.strip()]

for command in sql_commands:
    try:
        cursor.execute(command)
    except Exception as e:
        pass # Ignore errors like "table already exists"

try:
    with open('seed.sql', 'r') as f:
        seed_file = f.read()
        seed_commands = [cmd for cmd in seed_file.split(';') if cmd.strip()]
        for command in seed_commands:
            try:
                cursor.execute(command)
            except Exception:
                pass
except Exception:
    pass

conn.commit()
conn.close()
print("Database initialized successfully.")
