import mysql.connector

# Check if database exists and what users are in it
try:
    conn = mysql.connector.connect(host='127.0.0.1', user='root', port=3306, database='payroll_db')
    cursor = conn.cursor(dictionary=True)
    
    print("=== Checking Users in Database ===")
    cursor.execute("SELECT * FROM users;")
    users = cursor.fetchall()
    
    if users:
        print(f"Found {len(users)} users:")
        for user in users:
            print(f"  - Username: {user['username']}, Full Name: {user['full_name']}, Role: {user['role']}")
    else:
        print("ERROR: No users found in database!")
    
    cursor.close()
    conn.close()
    
except Exception as e:
    print(f"ERROR: {str(e)}")
