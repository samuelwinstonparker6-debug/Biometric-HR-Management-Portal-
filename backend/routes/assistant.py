from flask import Blueprint, request, jsonify
from db import execute_query
import re
from datetime import datetime, timedelta

assistant_bp = Blueprint('assistant', __name__)

@assistant_bp.route('/api/assistant/query', methods=['POST'])
def handle_query():
    data = request.json
    query_text = data.get('query', '').strip()
    
    if not query_text:
        return jsonify({'response': 'Please enter a query.', 'type': 'error'})
    
    # RAPY v2.0 Intelligence Logic
    intent = detect_intent(query_text)
    employee = extract_employee_content(query_text)
    time_range = extract_time_range(query_text)
    
    try:
        if intent == 'employee_insight':
            response = handle_employee_insight_v2(employee, time_range)
        elif intent == 'leave_review':
            response = handle_leave_review_v2(employee, time_range)
        elif intent == 'payroll_query':
            response = handle_payroll_query_v2(employee, time_range)
        elif intent == 'comparison':
            names = extract_comparison_entities(query_text)
            response = handle_comparison_v2(names, time_range)
        elif intent == 'best_worst':
            response = handle_performance_ranking(query_text)
        elif intent == 'report':
            response = handle_report_v2(query_text, time_range)
        else:
            response = handle_general_v2(query_text)
        
        return jsonify({
            'response': response, 
            'type': intent,
            'timestamp': datetime.now().isoformat()
        })
    except Exception as e:
        # Avoid printing emojis to Windows terminal to prevent UnicodeEncodeError
        print(f"RAPY Error: {str(e)}") 
        return jsonify({'response': 'RAPY encountered a processing error. Please try a different query.', 'type': 'error'})

def detect_intent(text):
    text_lp = text.lower()
    if any(w in text_lp for w in ['compare', 'vs', 'versus', 'difference']): return 'comparison'
    if any(w in text_lp for w in ['best', 'worst', 'top', 'lowest', 'highest', 'leaderboard', 'rank']): return 'best_worst'
    if any(w in text_lp for w in ['leave', 'approve', 'reject', 'holiday', 'day off', 'vacation', 'should i']): return 'leave_review'
    if any(w in text_lp for w in ['payroll', 'salary', 'pay', 'earning', 'deduction', 'bonus', 'net', 'gross', 'tax']): return 'payroll_query'
    if any(w in text_lp for w in ['report', 'summary', 'overview', 'statistics', 'dashboard', 'trend', 'total']): return 'report'
    if any(w in text_lp for w in ['how is', 'performance', 'details', 'tell me about', 'insight', 'analyze', 'status']): return 'employee_insight'
    return 'general'

def extract_employee_content(text):
    employees = execute_query("SELECT employee_id, full_name, emp_code, department FROM employees")
    text_lp = text.lower()
    best_match = None
    longest_match_len = 0
    for emp in employees:
        full_name = emp['full_name'].lower()
        code = emp['emp_code'].lower()
        first_name = full_name.split()[0]
        if code in text_lp: return emp
        if full_name in text_lp: return emp
        if f" {first_name} " in f" {text_lp} " or text_lp.startswith(first_name):
            if len(first_name) > longest_match_len:
                best_match = emp
                longest_match_len = len(first_name)
    return best_match

def extract_comparison_entities(text):
    employees = execute_query("SELECT employee_id, full_name, emp_code FROM employees")
    text_lp = text.lower()
    found = []
    for emp in employees:
        name = emp['full_name'].lower()
        first = name.split()[0]
        if name in text_lp or (len(first) > 2 and f" {first} " in f" {text_lp} "):
            if emp not in found: found.append(emp)
    return found[:2]

def extract_time_range(text):
    text_lp = text.lower()
    if 'this year' in text_lp: return 365
    if 'this quarter' in text_lp: return 90
    if 'last 6 months' in text_lp: return 180
    match = re.search(r'(\d+)\s*(day|week|month)', text_lp)
    if match:
        val = int(match.group(1))
        unit = match.group(2)
        if 'month' in unit: return val * 30
        if 'week' in unit: return val * 7
        return val
    if 'last week' in text_lp: return 7
    if 'last month' in text_lp: return 30
    return 30

def handle_employee_insight_v2(employee, time_range):
    if not employee: return "🔍 **Identify Error**: I couldn't identify the employee. Please use their full name or code."
    emp_id, name, dept = employee['employee_id'], employee['full_name'], employee['department']
    stats = execute_query("""
        SELECT COUNT(*) as days, COUNT(CASE WHEN status='present' THEN 1 END) as present,
        COALESCE(AVG(work_hours), 0) as avg_hrs, COALESCE(SUM(overtime_hours), 0) as total_ot
        FROM attendance WHERE employee_id = %s AND date >= DATE_SUB(CURDATE(), INTERVAL %s DAY)
    """, (emp_id, time_range))[0]
    scores = execute_query("SELECT total_score, category FROM employee_scores WHERE employee_id = %s ORDER BY year DESC, month DESC LIMIT 2", (emp_id,))
    dept_avg_results = execute_query("SELECT AVG(total_score) as avg FROM employee_scores s JOIN employees e ON s.employee_id = e.employee_id WHERE e.department = %s", (dept,))
    dept_avg = float(dept_avg_results[0]['avg']) if dept_avg_results and dept_avg_results[0]['avg'] else 0
    
    att_rate = (stats['present'] / stats['days'] * 100) if stats['days'] > 0 else 0
    curr_score = float(scores[0]['total_score']) if scores else 0
    trend = "Improving" if len(scores) > 1 and float(scores[0]['total_score']) > float(scores[1]['total_score']) else "Stable"
    
    res = f"# 🧠 Intelligence Brief: {name}\n"
    res += f"> Analyzing last {time_range} days of operational data.\n\n"
    res += f"### 📊 Analytics Matrix\n"
    res += f"| Indicator | Index | Vs Dept Avg | Status |\n|---|---|---|---|\n"
    res += f"| **Perf. Score** | {curr_score} | {'🟢 +' if curr_score > dept_avg else '🟡 -'}{abs(curr_score-dept_avg):.1f} | {trend} |\n"
    res += f"| **Attendance** | {att_rate:.1f}% | 85.0%* | {'🟢 High' if att_rate > 90 else '🟡 Normal'} |\n"
    res += f"| **Workload** | {stats['avg_hrs']:.1f}h/day | 8.0h | {'🔵 Optimal' if 7.5 <= stats['avg_hrs'] <= 8.5 else '⚠️ Variation'} |\n\n"
    
    res += "### ⚡ RAPY's Core Insight\n"
    if stats['total_ot'] > 15: res += f"*   🔥 **Burnout Alert**: Excessive overtime ({stats['total_ot']}h) detected. High risk of fatigue-driven errors.\n"
    if att_rate < 75: res += f"*   ⚠️ **Reliability Review**: Employee attendance is below the 75% stability threshold.\n"
    if curr_score > dept_avg + 10: res += f"*   💎 **Top Performer**: Significant lead over department average. Consider for leadership roles.\n"
    if not (stats['total_ot'] > 15 or att_rate < 75 or curr_score > dept_avg + 10): res += f"*   ✅ **Stable Performance**: No critical operational risks identified at this time.\n"
    
    res += f"\n### 💡 HR Recommendation\n*   {'Coordinate a mental health check-in regarding workload.' if stats['total_ot'] > 15 else 'Continue with current trajectory; no intervention needed.'}"
    return res

def handle_leave_review_v2(employee, time_range):
    if not employee: return "I need an employee name to conduct a leave risk assessment."
    emp_id, name = employee['employee_id'], employee['full_name']
    perf = execute_query("SELECT total_score FROM employee_scores WHERE employee_id = %s ORDER BY year DESC, month DESC LIMIT 1", (emp_id,))
    perf_val = float(perf[0]['total_score']) if perf else 0
    pending = execute_query("SELECT * FROM leave_requests WHERE employee_id = %s AND status = 'pending' LIMIT 1", (emp_id,))
    
    res = f"## 📅 Strategic Leave Review: {name}\n\n"
    if pending:
        res += f"**Current Query**: {pending[0]['leave_type'].title()} request ({pending[0]['from_date']} to {pending[0]['to_date']})\n\n"
    
    overlap = execute_query("SELECT COUNT(*) as c FROM leave_requests lr JOIN employees e ON lr.employee_id = e.employee_id WHERE e.department = %s AND lr.status = 'approved' AND CURDATE() BETWEEN lr.from_date AND lr.to_date", (employee['department'],))[0]['c']
    
    res += f"### 🔍 Decision Matrix\n"
    res += f"*   **Performance Buffer**: {perf_val}/100 ({'Critical' if perf_val < 50 else 'Safe'})\n"
    res += f"*   **Dept. Capacity**: {overlap} members currently on leave.\n\n"
    
    res += "### ⚖️ AI recommendation\n"
    if overlap > 2: res += "> ❌ **Reject**: High department overlap. Minimum operating threshold is at risk."
    elif perf_val < 50: res += "> ⚠️ **Conditional**: Performance is low. Approve only if tasks are caught up."
    else: res += "> ✅ **Approve**: Member is in good standing with no team conflict."
    return res

def handle_payroll_query_v2(employee, time_range):
    if not employee: return "Please specify an employee for financial analysis."
    payroll = execute_query("SELECT * FROM payroll WHERE employee_id = %s ORDER BY year DESC, month DESC LIMIT 1", (employee['employee_id'],))
    if not payroll: return f"Finalized payroll record not found for {employee['full_name']}."
    p = payroll[0]
    res = f"## 💸 Financial Intelligence: {employee['full_name']}\n"
    res += f"**Cycle**: {p['month']}/{p['year']}\n\n"
    res += f"### 💰 Compensation Breakdown\n"
    res += f"| Category | Amount |\n|---|---|\n| **Gross Salary** | ₹{float(p['gross_salary']):,.2f} |\n| **Statutory Tax** | ₹{float(p['tax_deduction'] or 0):,.2f} |\n| **PF/Retirement** | ₹{float(p['pf_deduction'] or 0):,.2f} |\n| **Net Take-Home** | **₹{float(p['net_salary']):,.2f}** |\n\n"
    # Added defensive check for gross_salary to avoid division by zero
    gross = float(p['gross_salary'])
    tax_rate = (float(p['tax_deduction'])/gross*100) if gross > 0 else 0
    res += f"### 📈 Analysis\n*   **Bonus Impact**: Overtime & bonuses contributed ₹{float(p['overtime_pay'])+float(p['bonus']):,.2f} to total earnings.\n"
    res += f"*   **Tax Profile**: {tax_rate:.1f}% effective tax rate."
    return res

def handle_comparison_v2(names, time_range):
    if len(names) < 2: return "Two names are required for a comparison study."
    results = []
    for emp in names:
        s = execute_query("SELECT total_score FROM employee_scores WHERE employee_id = %s ORDER BY year DESC, month DESC LIMIT 1", (emp['employee_id'],))
        a = execute_query("SELECT COUNT(CASE WHEN status='present' THEN 1 END) as p, COUNT(*) as t FROM attendance WHERE employee_id = %s", (emp['employee_id'],))[0]
        results.append({'name': emp['full_name'], 'score': float(s[0]['total_score']) if s else 0, 'att': (a['p']/a['total']*100) if a['total'] > 0 else 0})
    
    e1, e2 = results[0], results[1]
    res = f"## ⚖️ Comparative Logic: {e1['name']} vs {e2['name']}\n\n"
    res += f"| Metric | {e1['name']} | {e2['name']} | Variance |\n|---|---|---|---|\n"
    res += f"| **Perf Score** | {e1['score']} | {e2['score']} | {abs(e1['score']-e2['score']):.1f} |\n"
    res += f"| **Attendance** | {e1['att']:.1f}% | {e2['att']:.1f}% | {abs(e1['att']-e2['att']):.1f}% |\n\n"
    res += f"### 🏆 Primary Recommendation\n**{e1['name'] if e1['score'] > e2['score'] else e2['name']}** demonstrates higher operational metrics in the current cycle."
    return res

def handle_performance_ranking(text):
    order = "ASC" if "worst" in text.lower() or "lowest" in text.lower() else "DESC"
    data = execute_query(f"SELECT e.full_name, e.department, s.total_score, s.category FROM employee_scores s JOIN employees e ON s.employee_id = e.employee_id ORDER BY s.total_score {order} LIMIT 5")
    res = f"## 🏆 Performance Leaderboard ({'Top' if order == 'DESC' else 'Bottom'} 5)\n\n"
    res += "| Rank | Employee | Dept. | Score | Rating |\n|---|---|---|---|---|\n"
    for i, r in enumerate(data, 1): res += f"| {i} | {r['full_name']} | {r['department']} | {float(r['total_score'])} | **{r['category']}** |\n"
    return res

def handle_report_v2(text, time_range):
    active = execute_query("SELECT COUNT(*) as c FROM employees WHERE status = 'active'")[0]['c']
    avg_results = execute_query("SELECT AVG(total_score) as avg FROM employee_scores")
    avg_score = float(avg_results[0]['avg']) if avg_results and avg_results[0]['avg'] else 0
    res = f"## 🏢 Org-Intel Summary\n**Active Workforce**: {active} | **Corp Core Score**: {avg_score:.1f}/100\n\n"
    res += "### 🧩 Top Recommendations\n"
    res += f"*   **Culture**: Corporate score is {avg_score:.1f}. Focus on incentive alignment.\n"
    res += "*   **Growth**: Current allocation is dense in Engineering. Review HR/Sales capacity."
    return res

def handle_general_v2(text):
    return """# 🤖 RAPY v2.0 Tactical Intelligence
Greetings. I am your upgraded **Operational AI Assistant**. I provide deep-data analysis of your human resources ecosystem.

### 🧩 Command Capabilities
*   **Insight**: *"Tell me about Jonathan's performance"*
*   **Governance**: *"Should I approve Jonathan's leave?"*
*   **Financials**: *"Analyze the payroll for EMP001"*
*   **Strategy**: *"Show top 5 engineering performers"*

How can I optimize your HR decision-making today?"""
