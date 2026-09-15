from flask import Blueprint, request, jsonify
from db import execute_query

queries_bp = Blueprint('queries', __name__)

@queries_bp.route('/api/queries', methods=['GET'])
def get_queries():
    try:
        results = execute_query("""
            SELECT q.*, e.full_name as employee_name, e.department, e.emp_code
            FROM employee_queries q
            LEFT JOIN employees e ON q.employee_id = e.employee_id
            ORDER BY q.status = 'unread' DESC, q.submitted_on DESC
        """)
        return jsonify(results)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@queries_bp.route('/api/queries', methods=['POST'])
def submit_query():
    data = request.json
    employee_id = data.get('employee_id')
    subject = data.get('subject')
    message = data.get('message')
    
    if not subject or not message:
        return jsonify({'error': 'Subject and message are required'}), 400
        
    try:
        execute_query(
            "INSERT INTO employee_queries (employee_id, subject, message) VALUES (%s, %s, %s)",
            (employee_id, subject, message),
            fetch=False
        )
        return jsonify({'success': True, 'message': 'Query submitted successfully'})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@queries_bp.route('/api/queries/<int:query_id>/status', methods=['PUT'])
def update_status(query_id):
    data = request.json
    status = data.get('status')
    
    if status not in ['unread', 'read', 'resolved']:
        return jsonify({'error': 'Invalid status'}), 400
        
    try:
        execute_query(
            "UPDATE employee_queries SET status = %s WHERE query_id = %s",
            (status, query_id),
            fetch=False
        )
        return jsonify({'success': True, 'message': f'Query marked as {status}'})
    except Exception as e:
        return jsonify({'error': str(e)}), 500
