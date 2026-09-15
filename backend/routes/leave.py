from flask import Blueprint, request, jsonify
from db import execute_query

leave_bp = Blueprint('leave', __name__)

@leave_bp.route('/api/leave', methods=['GET'])
def get_leaves():
    status = request.args.get('status')
    employee_id = request.args.get('employee_id')
    
    query = """SELECT l.*, e.full_name, e.emp_code, e.department 
               FROM leave_requests l JOIN employees e ON l.employee_id = e.employee_id WHERE 1=1"""
    params = []
    
    if status:
        query += " AND l.status = %s"
        params.append(status)
    if employee_id:
        query += " AND l.employee_id = %s"
        params.append(employee_id)
    
    query += " ORDER BY l.applied_on DESC"
    records = execute_query(query, params)
    for r in records:
        for k in ['from_date', 'to_date']:
            if r.get(k): r[k] = str(r[k])
        for k in ['applied_on', 'reviewed_on']:
            if r.get(k): r[k] = str(r[k])
    return jsonify(records)

@leave_bp.route('/api/leave', methods=['POST'])
def apply_leave():
    data = request.json
    query = """INSERT INTO leave_requests (employee_id, leave_type, from_date, to_date, reason)
               VALUES (%s, %s, %s, %s, %s)"""
    params = (data['employee_id'], data.get('leave_type', 'casual'), data['from_date'], data['to_date'], data.get('reason', ''))
    leave_id = execute_query(query, params, fetch=False)
    return jsonify({'success': True, 'leave_id': leave_id}), 201

@leave_bp.route('/api/leave/<int:leave_id>', methods=['PUT'])
def update_leave(leave_id):
    data = request.json
    query = "UPDATE leave_requests SET status = %s, reviewed_by = %s, reviewed_on = NOW() WHERE leave_id = %s"
    params = (data['status'], data.get('reviewed_by', 1), leave_id)
    execute_query(query, params, fetch=False)
    return jsonify({'success': True})
