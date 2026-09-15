from flask import Blueprint, request, jsonify
from db import execute_query

reports_bp = Blueprint('reports', __name__)

@reports_bp.route('/api/reports/overview', methods=['GET'])
def report_overview():
    """Overall company summary stats"""
    emp_count = execute_query("SELECT COUNT(*) as total FROM employees WHERE status='active'")
    dept_count = execute_query(
        "SELECT department, COUNT(*) as count FROM employees WHERE status='active' GROUP BY department ORDER BY count DESC"
    )
    payroll_sum = execute_query(
        "SELECT COALESCE(SUM(net_salary),0) as total_net, COALESCE(SUM(gross_salary),0) as total_gross "
        "FROM payroll WHERE month=MONTH(CURDATE()) AND year=YEAR(CURDATE())"
    )
    leave_pending = execute_query("SELECT COUNT(*) as count FROM leave_requests WHERE status='pending'")
    score_avg = execute_query(
        "SELECT COALESCE(AVG(total_score),0) as avg_score FROM employee_scores "
        "ORDER BY year DESC, month DESC LIMIT 1"
    )

    return jsonify({
        'total_employees': emp_count[0]['total'] if emp_count else 0,
        'departments': dept_count,
        'payroll': {
            'total_net': float(payroll_sum[0]['total_net']) if payroll_sum else 0,
            'total_gross': float(payroll_sum[0]['total_gross']) if payroll_sum else 0
        },
        'pending_leaves': leave_pending[0]['count'] if leave_pending else 0,
        'avg_score': round(float(score_avg[0]['avg_score']), 1) if score_avg else 0
    })


@reports_bp.route('/api/reports/payroll', methods=['GET'])
def report_payroll():
    """Payroll report for a given month/year with totals"""
    month = request.args.get('month', 3)
    year = request.args.get('year', 2026)

    records = execute_query("""
        SELECT p.*, e.full_name, e.emp_code, e.department, e.designation
        FROM payroll p JOIN employees e ON p.employee_id = e.employee_id
        WHERE p.month = %s AND p.year = %s
        ORDER BY p.net_salary DESC
    """, (month, year))

    for r in records:
        for k in ['basic_salary','hra','da','travel_allowance','medical_allowance','bonus',
                  'overtime_pay','gross_salary','pf_deduction','tax_deduction','leave_deduction',
                  'other_deductions','total_deductions','net_salary']:
            if r.get(k) is not None:
                r[k] = float(r[k])
        if r.get('generated_on'):
            r['generated_on'] = str(r['generated_on'])

    total_gross = sum(r['gross_salary'] for r in records)
    total_net = sum(r['net_salary'] for r in records)
    total_deductions = sum(r['total_deductions'] for r in records)
    total_bonus = sum(r['bonus'] for r in records)
    total_overtime = sum(r['overtime_pay'] for r in records)

    return jsonify({
        'records': records,
        'summary': {
            'total_gross': round(total_gross, 2),
            'total_net': round(total_net, 2),
            'total_deductions': round(total_deductions, 2),
            'total_bonus': round(total_bonus, 2),
            'total_overtime': round(total_overtime, 2),
            'employee_count': len(records)
        }
    })


@reports_bp.route('/api/reports/attendance', methods=['GET'])
def report_attendance():
    """Attendance report for a given month/year"""
    month = request.args.get('month', 3)
    year = request.args.get('year', 2026)

    records = execute_query("""
        SELECT e.employee_id, e.full_name, e.emp_code, e.department,
            COUNT(CASE WHEN a.status='present' THEN 1 END) as present_days,
            COUNT(CASE WHEN a.status='absent' THEN 1 END) as absent_days,
            COUNT(CASE WHEN a.status='leave' THEN 1 END) as leave_days,
            COUNT(CASE WHEN a.status='half-day' THEN 1 END) as half_days,
            COUNT(a.attendance_id) as total_records,
            COALESCE(SUM(a.work_hours), 0) as total_hours,
            COALESCE(SUM(a.overtime_hours), 0) as total_overtime,
            COALESCE(AVG(CASE WHEN a.status='present' THEN a.work_hours END), 0) as avg_hours
        FROM employees e
        LEFT JOIN attendance a ON e.employee_id = a.employee_id
            AND MONTH(a.date) = %s AND YEAR(a.date) = %s
        WHERE e.status = 'active'
        GROUP BY e.employee_id
        ORDER BY present_days DESC
    """, (month, year))

    for r in records:
        r['total_hours'] = round(float(r['total_hours']), 1)
        r['total_overtime'] = round(float(r['total_overtime']), 1)
        r['avg_hours'] = round(float(r['avg_hours']), 1)
        total = r['total_records'] or 1
        r['attendance_pct'] = round(r['present_days'] / total * 100, 1)

    total_present = sum(r['present_days'] for r in records)
    total_absent = sum(r['absent_days'] for r in records)
    total_ot = sum(r['total_overtime'] for r in records)

    return jsonify({
        'records': records,
        'summary': {
            'total_present': total_present,
            'total_absent': total_absent,
            'total_overtime_hours': round(total_ot, 1),
            'employee_count': len(records)
        }
    })


@reports_bp.route('/api/reports/scores', methods=['GET'])
def report_scores():
    """Score distribution report"""
    month = request.args.get('month', 2)
    year = request.args.get('year', 2026)

    records = execute_query("""
        SELECT s.*, e.full_name, e.emp_code, e.department
        FROM employee_scores s JOIN employees e ON s.employee_id = e.employee_id
        WHERE s.month = %s AND s.year = %s
        ORDER BY s.total_score DESC
    """, (month, year))

    for r in records:
        for k in ['attendance_score','work_hours_score','overtime_score',
                  'leave_discipline_score','consistency_score','total_score']:
            if r.get(k) is not None:
                r[k] = float(r[k])

    distribution = {
        'Excellent': len([r for r in records if r['total_score'] >= 90]),
        'Good': len([r for r in records if 75 <= r['total_score'] < 90]),
        'Average': len([r for r in records if 60 <= r['total_score'] < 75]),
        'Needs Improvement': len([r for r in records if r['total_score'] < 60])
    }

    avg_score = round(sum(r['total_score'] for r in records) / max(len(records), 1), 1)

    return jsonify({
        'records': records,
        'distribution': distribution,
        'avg_score': avg_score
    })


@reports_bp.route('/api/reports/department', methods=['GET'])
def report_department():
    """Department-wise headcount, payroll, and scores"""
    month = request.args.get('month', 2)
    year = request.args.get('year', 2026)

    dept_emp = execute_query("""
        SELECT department,
            COUNT(*) as emp_count,
            COUNT(CASE WHEN status='active' THEN 1 END) as active_count
        FROM employees GROUP BY department ORDER BY emp_count DESC
    """)

    dept_payroll = execute_query("""
        SELECT e.department,
            COALESCE(SUM(p.gross_salary), 0) as total_gross,
            COALESCE(SUM(p.net_salary), 0) as total_net,
            COALESCE(AVG(p.net_salary), 0) as avg_net
        FROM payroll p JOIN employees e ON p.employee_id = e.employee_id
        WHERE p.month = %s AND p.year = %s
        GROUP BY e.department
    """, (month, year))

    dept_scores = execute_query("""
        SELECT e.department, COALESCE(AVG(s.total_score), 0) as avg_score
        FROM employee_scores s JOIN employees e ON s.employee_id = e.employee_id
        WHERE s.month = %s AND s.year = %s
        GROUP BY e.department
    """, (month, year))

    # Merge
    payroll_map = {r['department']: r for r in dept_payroll}
    scores_map = {r['department']: r for r in dept_scores}

    merged = []
    for d in dept_emp:
        dept = d['department']
        p = payroll_map.get(dept, {})
        s = scores_map.get(dept, {})
        merged.append({
            'department': dept,
            'emp_count': d['emp_count'],
            'active_count': d['active_count'],
            'total_gross': round(float(p.get('total_gross', 0)), 2),
            'total_net': round(float(p.get('total_net', 0)), 2),
            'avg_net': round(float(p.get('avg_net', 0)), 2),
            'avg_score': round(float(s.get('avg_score', 0)), 1)
        })

    return jsonify(merged)
