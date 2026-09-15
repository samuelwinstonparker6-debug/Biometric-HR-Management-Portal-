from flask import Blueprint, request, jsonify
from db import execute_query

attendance_bp = Blueprint('attendance', __name__)

@attendance_bp.route('/api/attendance', methods=['GET'])
def get_attendance():
    employee_id = request.args.get('employee_id')
    from_date = request.args.get('from_date')
    to_date = request.args.get('to_date')
    
    query = """SELECT a.*, e.full_name, e.emp_code, e.department 
               FROM attendance a JOIN employees e ON a.employee_id = e.employee_id WHERE 1=1"""
    params = []
    
    if employee_id:
        query += " AND a.employee_id = %s"
        params.append(employee_id)
    if from_date:
        query += " AND a.date >= %s"
        params.append(from_date)
    if to_date:
        query += " AND a.date <= %s"
        params.append(to_date)
    
    query += " ORDER BY a.date DESC, e.full_name"
    records = execute_query(query, params)
    for r in records:
        if r.get('date'): r['date'] = str(r['date'])
        if r.get('check_in_time'): r['check_in_time'] = str(r['check_in_time'])
        if r.get('check_out_time'): r['check_out_time'] = str(r['check_out_time'])
        for k in ['work_hours', 'overtime_hours']:
            if r.get(k) is not None: r[k] = float(r[k])
    return jsonify(records)

@attendance_bp.route('/api/attendance', methods=['POST'])
def mark_attendance():
    data = request.json
    query = """INSERT INTO attendance (employee_id, date, status, check_in_time, check_out_time, work_hours, overtime_hours)
               VALUES (%s, %s, %s, %s, %s, %s, %s)
               ON DUPLICATE KEY UPDATE status=%s, check_in_time=%s, check_out_time=%s, work_hours=%s, overtime_hours=%s"""
    params = (
        data['employee_id'], data['date'], data.get('status', 'present'),
        data.get('check_in_time'), data.get('check_out_time'),
        data.get('work_hours', 0), data.get('overtime_hours', 0),
        data.get('status', 'present'), data.get('check_in_time'), data.get('check_out_time'),
        data.get('work_hours', 0), data.get('overtime_hours', 0)
    )
    execute_query(query, params, fetch=False)
    return jsonify({'success': True}), 201

@attendance_bp.route('/api/attendance/summary/<int:employee_id>', methods=['GET'])
def attendance_summary(employee_id):
    month = request.args.get('month', 3)
    year = request.args.get('year', 2026)
    
    records = execute_query("""
        SELECT status, COUNT(*) as count, 
               SUM(work_hours) as total_hours, SUM(overtime_hours) as total_overtime
        FROM attendance WHERE employee_id = %s AND MONTH(date) = %s AND YEAR(date) = %s
        GROUP BY status
    """, (employee_id, month, year))
    
    summary = {'present': 0, 'absent': 0, 'leave': 0, 'half-day': 0, 'total_hours': 0, 'total_overtime': 0}
    for r in records:
        summary[r['status']] = r['count']
        summary['total_hours'] += float(r['total_hours'] or 0)
        summary['total_overtime'] += float(r['total_overtime'] or 0)
    
    total_days = summary['present'] + summary['absent'] + summary['leave'] + summary['half-day']
    summary['total_days'] = total_days
    summary['attendance_percent'] = round((summary['present'] + summary['half-day'] * 0.5) / max(total_days, 1) * 100, 1)
    summary['avg_daily_hours'] = round(summary['total_hours'] / max(summary['present'], 1), 1)
    
    return jsonify(summary)
