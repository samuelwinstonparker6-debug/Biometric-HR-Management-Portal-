from flask import Blueprint, request, jsonify
from db import execute_query

scores_bp = Blueprint('scores', __name__)

@scores_bp.route('/api/scores', methods=['GET'])
def get_scores():
    month = request.args.get('month', 2)
    year = request.args.get('year', 2026)
    
    query = """SELECT s.*, e.full_name, e.emp_code, e.department 
               FROM employee_scores s JOIN employees e ON s.employee_id = e.employee_id 
               WHERE s.month = %s AND s.year = %s ORDER BY s.total_score DESC"""
    records = execute_query(query, (month, year))
    for r in records:
        for k in ['attendance_score','work_hours_score','overtime_score','leave_discipline_score','consistency_score','total_score']:
            if r.get(k) is not None: r[k] = float(r[k])
    return jsonify(records)

@scores_bp.route('/api/scores/<int:employee_id>', methods=['GET'])
def get_employee_score(employee_id):
    month = request.args.get('month', 2)
    year = request.args.get('year', 2026)
    
    records = execute_query(
        "SELECT * FROM employee_scores WHERE employee_id = %s AND month = %s AND year = %s",
        (employee_id, month, year)
    )
    if not records:
        return jsonify({'error': 'Score not found'}), 404
    r = records[0]
    for k in ['attendance_score','work_hours_score','overtime_score','leave_discipline_score','consistency_score','total_score']:
        if r.get(k) is not None: r[k] = float(r[k])
    return jsonify(r)

@scores_bp.route('/api/scores/calculate', methods=['POST'])
def calculate_score():
    data = request.json
    employee_id = data['employee_id']
    month = data.get('month', 3)
    year = data.get('year', 2026)
    
    # Get attendance data
    att = execute_query("""
        SELECT 
            COUNT(*) as total_days,
            COUNT(CASE WHEN status='present' THEN 1 END) as present_days,
            COUNT(CASE WHEN status='absent' THEN 1 END) as absent_days,
            COUNT(CASE WHEN status='leave' THEN 1 END) as leave_days,
            COALESCE(AVG(CASE WHEN status='present' THEN work_hours END), 0) as avg_hours,
            COALESCE(SUM(overtime_hours), 0) as total_overtime
        FROM attendance WHERE employee_id = %s AND MONTH(date) = %s AND YEAR(date) = %s
    """, (employee_id, month, year))
    
    if not att or att[0]['total_days'] == 0:
        return jsonify({'error': 'No attendance data found for this period'}), 404
    
    att = att[0]
    total_days = max(int(att['total_days']), 1)
    present = int(att['present_days'] or 0)
    absent = int(att['absent_days'] or 0)
    leaves = int(att['leave_days'] or 0)
    avg_hours = float(att['avg_hours'] or 0)
    overtime = float(att['total_overtime'] or 0)
    
    # Attendance score (40 marks)
    attendance_pct = present / total_days
    attendance_score = round(attendance_pct * 40, 1)
    
    # Work hours score (25 marks) - based on 8hr expected
    hours_pct = min(avg_hours / 8.0, 1.25)
    work_hours_score = round(hours_pct * 20, 1)  # max 25 if consistently over 8hrs
    if avg_hours >= 8:
        work_hours_score = min(25, work_hours_score + 5)
    
    # Overtime score (15 marks)
    ot_per_day = overtime / max(present, 1)
    overtime_score = round(min(ot_per_day / 2.0, 1.0) * 15, 1)
    
    # Leave discipline (10 marks) - fewer leaves = better
    leave_ratio = (absent + leaves) / total_days
    leave_discipline = round((1 - min(leave_ratio * 2, 1.0)) * 10, 1)
    
    # Consistency (10 marks) - presence stability
    consistency = round(min(attendance_pct * 1.1, 1.0) * 10, 1)
    
    total = round(attendance_score + work_hours_score + overtime_score + leave_discipline + consistency, 1)
    
    if total >= 90: category = 'Excellent'
    elif total >= 75: category = 'Good'
    elif total >= 60: category = 'Average'
    elif total >= 40: category = 'Needs Improvement'
    else: category = 'Poor'
    
    # Upsert score
    query = """INSERT INTO employee_scores (employee_id, month, year, attendance_score, work_hours_score, 
               overtime_score, leave_discipline_score, consistency_score, total_score, category)
               VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)
               ON DUPLICATE KEY UPDATE attendance_score=%s, work_hours_score=%s, overtime_score=%s, 
               leave_discipline_score=%s, consistency_score=%s, total_score=%s, category=%s"""
    params = (employee_id, month, year, attendance_score, work_hours_score, overtime_score,
              leave_discipline, consistency, total, category,
              attendance_score, work_hours_score, overtime_score, leave_discipline, consistency, total, category)
    execute_query(query, params, fetch=False)
    
    return jsonify({
        'employee_id': employee_id,
        'attendance_score': attendance_score,
        'work_hours_score': work_hours_score,
        'overtime_score': overtime_score,
        'leave_discipline_score': leave_discipline,
        'consistency_score': consistency,
        'total_score': total,
        'category': category
    })
