from flask import Blueprint, request, jsonify
from db import execute_query

auth_bp = Blueprint('auth', __name__)

@auth_bp.route('/api/login', methods=['POST'])
def login():
    try:
        data = request.json
        username = data.get('username', '')
        password = data.get('password', '')
        
        if not username or not password:
            return jsonify({'success': False, 'message': 'Username and password are required'}), 400
        
        # Query database for user
        query = "SELECT user_id, username, full_name, role, employee_id FROM users WHERE username = %s AND password = %s"
        results = execute_query(query, (username, password))
        
        if results and len(results) > 0:
            user = results[0]
            return jsonify({
                'success': True, 
                'user': {
                    'user_id': user['user_id'],
                    'username': user['username'],
                    'full_name': user['full_name'],
                    'role': user['role'],
                    'employee_id': user['employee_id']
                }
            })
        else:
            return jsonify({'success': False, 'message': 'Invalid username or password'}), 401
    except Exception as e:
        print(f"Login error: {str(e)}")
        return jsonify({'success': False, 'message': f'Server error: {str(e)}'}), 500
