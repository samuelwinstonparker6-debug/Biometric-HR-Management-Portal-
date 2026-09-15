import mysql.connector
from config import DB_CONFIG

try:
    conn = mysql.connector.connect(**DB_CONFIG)
    c = conn.cursor()
    c.execute("""
    CREATE TABLE IF NOT EXISTS employee_queries (
        query_id INT AUTO_INCREMENT PRIMARY KEY,
        employee_id INT NULL,
        subject VARCHAR(255) NOT NULL,
        message TEXT NOT NULL,
        status ENUM('unread', 'read', 'resolved') DEFAULT 'unread',
        submitted_on TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (employee_id) REFERENCES employees(employee_id) ON DELETE SET NULL
    )""")
    
    # Check if we already have queries
    c.execute("SELECT COUNT(*) FROM employee_queries")
    count = c.fetchone()[0]
    
    if count == 0:
        c.execute("""
        INSERT INTO employee_queries (employee_id, subject, message) 
        VALUES 
        (NULL, 'Missing Overtime', 'Please check my overtime hours from last week, they seem missing in the portal.'), 
        (NULL, 'Software Request', 'Can I get a license for Adobe Creative Cloud? It is required for my upcoming project.')
        """)
        conn.commit()
        print("Table created and seeded.")
    else:
        print("Table exists and has data.")
except Exception as e:
    print(f"Error: {e}")
