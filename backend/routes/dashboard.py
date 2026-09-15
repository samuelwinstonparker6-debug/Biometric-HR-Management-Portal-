from flask import Blueprint, jsonify
from db import execute_query

dashboard_bp = Blueprint('dashboard', __name__)

@dashboard_bp.route('/api/dashboard', methods=['GET'])
def get_dashboard():
    # Total employees
    emp_count = execute_query("SELECT COUNT(*) as count FROM employees WHERE status = 'active'")
    
    # Department distribution
    dept_dist = execute_query("SELECT department, COUNT(*) as count FROM employees WHERE status='active' GROUP BY department ORDER BY count DESC")
    
    # Pending leaves
    pending = execute_query("SELECT COUNT(*) as count FROM leave_requests WHERE status = 'pending'")
    
    # Latest payroll totals
    payroll_total = execute_query("""
        SELECT COALESCE(SUM(net_salary), 0) as total_net, COALESCE(SUM(gross_salary), 0) as total_gross,
               month, year
        FROM payroll GROUP BY month, year ORDER BY year DESC, month DESC LIMIT 1
    """)
    
    # Top scorer
    top_scorer = execute_query("""
        SELECT s.total_score, s.category, e.full_name, e.department
        FROM employee_scores s JOIN employees e ON s.employee_id = e.employee_id
        ORDER BY s.total_score DESC LIMIT 1
    """)
    
    # Attendance today
    today_att = execute_query("""
        SELECT 
            COUNT(CASE WHEN status='present' THEN 1 END) as present,
            COUNT(CASE WHEN status='absent' THEN 1 END) as absent,
            COUNT(CASE WHEN status='leave' THEN 1 END) as on_leave
        FROM attendance WHERE date = CURDATE()
    """)
    
    pt = payroll_total[0] if payroll_total else {'total_net': 0, 'total_gross': 0, 'month': 0, 'year': 0}
    ts = top_scorer[0] if top_scorer else {'full_name': 'N/A', 'total_score': 0, 'category': 'N/A'}
    ta = today_att[0] if today_att else {'present': 0, 'absent': 0, 'on_leave': 0}
    
    return jsonify({
        'total_employees': emp_count[0]['count'],
        'department_distribution': dept_dist,
        'pending_leaves': pending[0]['count'],
        'payroll_summary': {
            'total_net': float(pt['total_net']),
            'total_gross': float(pt['total_gross']),
            'month': pt.get('month', 0),
            'year': pt.get('year', 0)
        },
        'top_scorer': {
            'name': ts['full_name'],
            'score': float(ts['total_score']) if ts.get('total_score') else 0,
            'category': ts.get('category', 'N/A'),
            'department': ts.get('department', 'N/A')
        },
        'today_attendance': {
            'present': ta['present'],
            'absent': ta['absent'],
            'on_leave': ta['on_leave']
        }
    })
