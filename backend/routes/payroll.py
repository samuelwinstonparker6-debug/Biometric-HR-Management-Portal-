from flask import Blueprint, request, jsonify
from db import execute_query

payroll_bp = Blueprint('payroll', __name__)

@payroll_bp.route('/api/payroll', methods=['GET'])
def get_payrolls():
    month = request.args.get('month', 3)
    year = request.args.get('year', 2026)
    employee_id = request.args.get('employee_id')
    
    query = """SELECT p.*, e.full_name, e.emp_code, e.department 
               FROM payroll p JOIN employees e ON p.employee_id = e.employee_id WHERE p.month = %s AND p.year = %s"""
    params = [month, year]
    
    if employee_id:
        query += " AND p.employee_id = %s"
        params.append(employee_id)
    
    query += " ORDER BY e.full_name"
    records = execute_query(query, params)
    for r in records:
        if r.get('generated_on'): r['generated_on'] = str(r['generated_on'])
        for k in ['basic_salary','hra','da','travel_allowance','medical_allowance','bonus','overtime_pay',
                   'gross_salary','pf_deduction','tax_deduction','leave_deduction','other_deductions',
                   'total_deductions','net_salary']:
            if r.get(k) is not None: r[k] = float(r[k])
    return jsonify(records)

@payroll_bp.route('/api/payroll/generate', methods=['POST'])
def generate_payroll():
    data = request.json
    employee_id = data['employee_id']
    month = data.get('month', 3)
    year = data.get('year', 2026)
    bonus = data.get('bonus', 0)
    
    # Get salary structure
    sal = execute_query("SELECT * FROM salary_structure WHERE employee_id = %s", (employee_id,))
    if not sal:
        return jsonify({'error': 'No salary structure found'}), 404
    sal = sal[0]
    
    # Get attendance summary
    att = execute_query("""
        SELECT 
            COUNT(CASE WHEN status='present' THEN 1 END) as present_days,
            COUNT(CASE WHEN status='absent' THEN 1 END) as absent_days,
            COUNT(CASE WHEN status='leave' THEN 1 END) as leave_days,
            COUNT(CASE WHEN status='half-day' THEN 1 END) as half_days,
            COALESCE(SUM(overtime_hours), 0) as total_overtime
        FROM attendance WHERE employee_id = %s AND MONTH(date) = %s AND YEAR(date) = %s
    """, (employee_id, month, year))
    att = att[0] if att else {'present_days':22, 'absent_days':0, 'leave_days':0, 'half_days':0, 'total_overtime':0}
    
    basic = float(sal['basic_salary'])
    hra = float(sal['hra'])
    da = float(sal['da'])
    travel = float(sal['travel_allowance'])
    medical = float(sal['medical_allowance'])
    
    # Overtime pay (basic/22/8 per hour)
    hourly_rate = basic / 22 / 8
    overtime_pay = round(float(att['total_overtime'] or 0) * hourly_rate * 1.5, 2)
    
    # Leave deduction (unpaid leaves + absents)
    daily_rate = basic / 22
    unpaid_days = int(att['absent_days'] or 0)
    leave_deduction = round(unpaid_days * daily_rate, 2)
    
    gross = basic + hra + da + travel + medical + bonus + overtime_pay
    pf = round(basic * float(sal['pf_percent']) / 100, 2)
    tax = round(gross * float(sal['tax_percent']) / 100, 2)
    total_deductions = pf + tax + leave_deduction
    net = round(gross - total_deductions, 2)
    
    # Upsert payroll
    query = """INSERT INTO payroll (employee_id, month, year, basic_salary, hra, da, travel_allowance, 
               medical_allowance, bonus, overtime_pay, gross_salary, pf_deduction, tax_deduction, 
               leave_deduction, other_deductions, total_deductions, net_salary)
               VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)
               ON DUPLICATE KEY UPDATE basic_salary=%s, hra=%s, da=%s, travel_allowance=%s, 
               medical_allowance=%s, bonus=%s, overtime_pay=%s, gross_salary=%s, pf_deduction=%s, 
               tax_deduction=%s, leave_deduction=%s, other_deductions=0, total_deductions=%s, net_salary=%s"""
    params = (employee_id, month, year, basic, hra, da, travel, medical, bonus, overtime_pay, gross,
              pf, tax, leave_deduction, 0, total_deductions, net,
              basic, hra, da, travel, medical, bonus, overtime_pay, gross, pf, tax, leave_deduction,
              total_deductions, net)
    execute_query(query, params, fetch=False)
    
    return jsonify({
        'success': True,
        'payroll': {
            'employee_id': employee_id, 'month': month, 'year': year,
            'basic_salary': basic, 'hra': hra, 'da': da,
            'travel_allowance': travel, 'medical_allowance': medical,
            'bonus': bonus, 'overtime_pay': overtime_pay,
            'gross_salary': gross, 'pf_deduction': pf, 'tax_deduction': tax,
            'leave_deduction': leave_deduction, 'total_deductions': total_deductions,
            'net_salary': net,
            'attendance': {
                'present': int(att['present_days'] or 0),
                'absent': int(att['absent_days'] or 0),
                'leave': int(att['leave_days'] or 0),
                'overtime_hours': float(att['total_overtime'] or 0)
            }
        }
    })

@payroll_bp.route('/api/payroll/generate-all', methods=['POST'])
def generate_all_payroll():
    data = request.json
    month = data.get('month', 3)
    year = data.get('year', 2026)
    
    employees = execute_query("SELECT employee_id FROM employees WHERE status = 'active'")
    results = []
    for emp in employees:
        try:
            from flask import current_app
            with current_app.test_request_context(json={'employee_id': emp['employee_id'], 'month': month, 'year': year, 'bonus': 0}):
                # Just call the logic directly
                pass
            # Simpler approach: just call generate for each
            generate_single(emp['employee_id'], month, year)
            results.append({'employee_id': emp['employee_id'], 'status': 'success'})
        except Exception as e:
            results.append({'employee_id': emp['employee_id'], 'status': 'error', 'message': str(e)})
    
    return jsonify({'success': True, 'results': results})

def generate_single(employee_id, month, year, bonus=0):
    sal = execute_query("SELECT * FROM salary_structure WHERE employee_id = %s", (employee_id,))
    if not sal:
        return
    sal = sal[0]
    
    att = execute_query("""
        SELECT 
            COUNT(CASE WHEN status='present' THEN 1 END) as present_days,
            COUNT(CASE WHEN status='absent' THEN 1 END) as absent_days,
            COALESCE(SUM(overtime_hours), 0) as total_overtime
        FROM attendance WHERE employee_id = %s AND MONTH(date) = %s AND YEAR(date) = %s
    """, (employee_id, month, year))
    att = att[0] if att else {'present_days':22, 'absent_days':0, 'total_overtime':0}
    
    basic = float(sal['basic_salary'])
    hra = float(sal['hra'])
    da = float(sal['da'])
    travel = float(sal['travel_allowance'])
    medical = float(sal['medical_allowance'])
    
    hourly_rate = basic / 22 / 8
    overtime_pay = round(float(att['total_overtime'] or 0) * hourly_rate * 1.5, 2)
    daily_rate = basic / 22
    leave_deduction = round(int(att['absent_days'] or 0) * daily_rate, 2)
    
    gross = basic + hra + da + travel + medical + bonus + overtime_pay
    pf = round(basic * float(sal['pf_percent']) / 100, 2)
    tax = round(gross * float(sal['tax_percent']) / 100, 2)
    total_ded = pf + tax + leave_deduction
    net = round(gross - total_ded, 2)
    
    query = """INSERT INTO payroll (employee_id, month, year, basic_salary, hra, da, travel_allowance,
               medical_allowance, bonus, overtime_pay, gross_salary, pf_deduction, tax_deduction,
               leave_deduction, other_deductions, total_deductions, net_salary)
               VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)
               ON DUPLICATE KEY UPDATE basic_salary=%s, hra=%s, da=%s, travel_allowance=%s,
               medical_allowance=%s, bonus=%s, overtime_pay=%s, gross_salary=%s, pf_deduction=%s,
               tax_deduction=%s, leave_deduction=%s, other_deductions=0, total_deductions=%s, net_salary=%s"""
    params = (employee_id, month, year, basic, hra, da, travel, medical, bonus, overtime_pay, gross,
              pf, tax, leave_deduction, 0, total_ded, net,
              basic, hra, da, travel, medical, bonus, overtime_pay, gross, pf, tax, leave_deduction, total_ded, net)
    execute_query(query, params, fetch=False)
