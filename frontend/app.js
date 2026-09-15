// NexGen HR System - Main Application Logic

const API_BASE = 'http://127.0.0.1:5000/api';

// State Management
const state = {
    user: null,
    currentView: 'dashboard',
    employees: [],
    departments: []
};

// DOM Elements
const els = {
    loginOverlay: document.getElementById('login-overlay'),
    appContainer: document.getElementById('app-container'),
    loginForm: document.getElementById('login-form'),
    loginError: document.getElementById('login-error'),
    logoutBtn: document.getElementById('logout-btn'),
    navUser: document.getElementById('nav-user-name'),
    navRole: document.getElementById('nav-user-role'),
    navItems: document.querySelectorAll('.nav-item[data-target]'),
    views: document.querySelectorAll('.view-section'),
    toastContainer: document.getElementById('toast-container')
};

// Initialize App
document.addEventListener('DOMContentLoaded', () => {
    // Check if already logged in (using localStorage simulation for now)
    const storedUser = localStorage.getItem('nexgen_user');
    if (storedUser) {
        state.user = JSON.parse(storedUser);
        initDashboard();
    }
    
    // Bind Events
    bindGlobalEvents();
});

// Utility Functions
const utils = {
    formatCurrency: (amount) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 0
        }).format(amount || 0);
    },
    
    formatDate: (dateString) => {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-IN', {
            day: 'numeric', month: 'short', year: 'numeric'
        });
    },
    
    showToast: (message, type = 'info') => {
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.innerHTML = `<i class="fa-solid fa-info-circle mr-2"></i> ${message}`;
        els.toastContainer.appendChild(toast);
        setTimeout(() => toast.remove(), 3000);
    },
    
    api: async (endpoint, options = {}) => {
        try {
            const defaultOptions = {
                headers: { 'Content-Type': 'application/json' }
            };
            const res = await fetch(`${API_BASE}${endpoint}`, { ...defaultOptions, ...options });
            if (!res.ok) {
                const errorData = await res.json().catch(() => ({}));
                throw new Error(errorData.error || errorData.message || 'API request failed');
            }
            return await res.json();
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    },
    
    openModal: (id) => {
        const modal = document.getElementById(id);
        if (modal) modal.classList.add('active');
    },
    
    closeModals: () => {
        document.querySelectorAll('.modal').forEach(m => m.classList.remove('active'));
    }
};

// Global Events Binding
function bindGlobalEvents() {
    // Login
    els.loginForm.addEventListener('submit', handleLogin);
    
    // Logout
    els.logoutBtn.addEventListener('click', (e) => {
        e.preventDefault();
        localStorage.removeItem('nexgen_user');
        state.user = null;
        els.appContainer.style.display = 'none';
        els.loginOverlay.classList.add('active');
        els.loginForm.reset();
    });
    
    // Navigation
    els.navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const target = item.getAttribute('data-target');
            switchView(target);
        });
    });
    
    // Modal Closing
    document.querySelectorAll('.close-modal, .modal').forEach(el => {
        el.addEventListener('click', (e) => {
            if (e.target === el || e.target.closest('.close-modal')) {
                utils.closeModals();
            }
        });
    });
    
    // Bind View Specific Events
    bindEmployeesEvents();
    bindAttendanceEvents();
    bindLeaveEvents();
    bindPayrollEvents();
    bindScoresEvents();
    bindAssistantEvents();
}

// Authentication Flow
async function handleLogin(e) {
    e.preventDefault();
    const user = document.getElementById('username').value;
    const pass = document.getElementById('password').value;
    const btn = e.target.querySelector('button');
    
    try {
        btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Authenticating...';
        btn.disabled = true;
        
        const res = await utils.api('/login', {
            method: 'POST',
            body: JSON.stringify({ username: user, password: pass })
        });
        
        if (res.success) {
            state.user = res.user;
            localStorage.setItem('nexgen_user', JSON.stringify(res.user));
            els.loginError.style.display = 'none';
            initDashboard();
        }
    } catch (err) {
        els.loginError.textContent = err.message || 'Invalid credentials or server unavailable';
        els.loginError.style.display = 'block';
    } finally {
        btn.innerHTML = 'Sign In';
        btn.disabled = false;
    }
}

// Initialize App View
function initDashboard() {
    els.loginOverlay.classList.remove('active');
    els.appContainer.style.display = 'flex';
    
    // Setup UI
    els.navUser.textContent = state.user.full_name;
    els.navRole.textContent = state.user.role.charAt(0).toUpperCase() + state.user.role.slice(1);
    
    // Load initial data
    loadDepartments();
    switchView('dashboard');
}

// Navigation Logic
function switchView(viewId) {
    state.currentView = viewId;
    
    // Update Nav UI
    els.navItems.forEach(i => i.classList.remove('active'));
    document.querySelector(`.nav-item[data-target="${viewId}"]`).classList.add('active');
    
    // Update View UI
    els.views.forEach(v => v.classList.remove('active'));
    document.getElementById(`view-${viewId}`).classList.add('active');
    
    // Load view specific data
    switch(viewId) {
        case 'dashboard': renderDashboard(); break;
        case 'employees': loadEmployees(); break;
        case 'attendance': loadAttendance(); break;
        case 'leave': loadLeaves(); break;
        case 'payroll': loadPayroll(); break;
        case 'scores': loadScores(); break;
    }
}

// ==========================================
// VIEWS LOGIC
// ==========================================

// Dashboard Logic
async function renderDashboard() {
    try {
        const data = await utils.api('/dashboard');
        
        // Update Stats
        document.getElementById('dash-total-emp').textContent = data.total_employees;
        document.getElementById('dash-total-payroll').textContent = utils.formatCurrency(data.payroll_summary.total_net);
        document.getElementById('dash-pending-leaves').textContent = data.pending_leaves;
        
        const totalAtt = data.today_attendance.present + data.today_attendance.absent + data.today_attendance.on_leave;
        const distPct = totalAtt > 0 ? Math.round((data.today_attendance.present / totalAtt) * 100) : 0;
        document.getElementById('dash-today-att').textContent = distPct + '%';
        
        // Render Department List
        const deptList = document.getElementById('dept-dist-list');
        deptList.innerHTML = '';
        data.department_distribution.forEach(d => {
            deptList.innerHTML += `
                <div class="dept-item">
                    <span class="dept-name">${d.department || 'Unassigned'}</span>
                    <span class="dept-count">${d.count} Employees</span>
                </div>
            `;
        });
        
        // Render Top Scorer
        if (data.top_scorer.name !== 'N/A') {
            document.getElementById('top-scorer-name').textContent = data.top_scorer.name;
            document.getElementById('top-scorer-dept').textContent = data.top_scorer.department;
            document.getElementById('top-scorer-val').textContent = data.top_scorer.score;
            document.getElementById('top-scorer-initial').textContent = data.top_scorer.name.charAt(0);
        } else {
            document.getElementById('top-scorer-name').textContent = 'No scores yet';
        }
        
    } catch (err) {
        utils.showToast('Failed to load dashboard data', 'error');
    }
}

// Employees Logic
async function loadDepartments() {
    try {
        const depts = await utils.api('/departments');
        state.departments = depts;
        const select = document.getElementById('emp-dept-filter');
        const modalSelect = document.getElementById('emp-dept');
        
        select.innerHTML = '<option value="">All Departments</option>';
        depts.forEach(d => {
            select.innerHTML += `<option value="${d}">${d}</option>`;
        });
    } catch (err) {
        console.error('Failed to load departments');
    }
}

function bindEmployeesEvents() {
    document.getElementById('emp-search').addEventListener('input', (e) => {
        loadEmployees(e.target.value, document.getElementById('emp-dept-filter').value);
    });
    
    document.getElementById('emp-dept-filter').addEventListener('change', (e) => {
        loadEmployees(document.getElementById('emp-search').value, e.target.value);
    });
    
    document.getElementById('btn-add-employee').addEventListener('click', () => {
        document.getElementById('form-employee').reset();
        document.getElementById('emp-id').value = '';
        document.getElementById('emp-modal-title').textContent = 'Add Employee';
        document.getElementById('salary-fields').style.display = 'block';
        utils.openModal('modal-employee');
    });
    
    document.getElementById('form-employee').addEventListener('submit', saveEmployee);
}

async function loadEmployees(search = '', dept = '') {
    const tbody = document.querySelector('#employees-table tbody');
    tbody.innerHTML = '<tr><td colspan="6" class="text-center"><div class="loading-spinner"></div></td></tr>';
    
    try {
        let url = '/employees?';
        if (search) url += `search=${encodeURIComponent(search)}&`;
        if (dept) url += `department=${encodeURIComponent(dept)}`;
        
        const emps = await utils.api(url);
        state.employees = emps;
        
        tbody.innerHTML = '';
        if (emps.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" class="text-center">No employees found</td></tr>';
            return;
        }
        
        emps.forEach(emp => {
            const statusClass = emp.status === 'active' ? 'active' : 'inactive';
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td><strong>${emp.emp_code}</strong></td>
                <td>
                    <div style="display:flex; align-items:center; gap:10px;">
                        <div class="avatar" style="width:30px; height:30px; font-size:0.8rem;">${emp.full_name.charAt(0)}</div>
                        <span>${emp.full_name}<br><small class="text-muted">${emp.email || ''}</small></span>
                    </div>
                </td>
                <td>${emp.department || 'N/A'}</td>
                <td>${emp.designation || 'N/A'}</td>
                <td><span class="badge ${statusClass}">${emp.status}</span></td>
                <td>
                    <div class="action-btns">
                        <button class="btn-icon-sm edit" onclick="editEmployee(${emp.employee_id})" title="Edit"><i class="fa-solid fa-pen"></i></button>
                        <button class="btn-icon-sm delete" onclick="deleteEmployee(${emp.employee_id})" title="Delete"><i class="fa-solid fa-trash"></i></button>
                    </div>
                </td>
            `;
            tbody.appendChild(tr);
        });
    } catch (err) {
        tbody.innerHTML = '<tr><td colspan="6" class="text-center text-danger">Failed to load data</td></tr>';
    }
}

async function saveEmployee(e) {
    e.preventDefault();
    const id = document.getElementById('emp-id').value;
    const data = {
        emp_code: document.getElementById('emp-code').value,
        full_name: document.getElementById('emp-name').value,
        email: document.getElementById('emp-email').value,
        phone: document.getElementById('emp-phone').value,
        department: document.getElementById('emp-dept').value,
        designation: document.getElementById('emp-designation').value
    };
    
    if (!id) {
        // Adding new employee, also send initial salary
        data.basic_salary = parseFloat(document.getElementById('emp-basic').value) || 0;
        data.hra = parseFloat(document.getElementById('emp-hra').value) || 0;
        data.da = parseFloat(document.getElementById('emp-da').value) || 0;
    }
    
    try {
        const url = id ? `/employees/${id}` : '/employees';
        const method = id ? 'PUT' : 'POST';
        
        await utils.api(url, {
            method,
            body: JSON.stringify(data)
        });
        
        utils.showToast(id ? 'Employee updated successfully' : 'Employee added successfully', 'success');
        utils.closeModals();
        loadEmployees();
    } catch (err) {
        utils.showToast(`Error: ${err.message}`, 'error');
    }
}

window.editEmployee = async (id) => {
    try {
        const emp = await utils.api(`/employees/${id}`);
        document.getElementById('emp-id').value = emp.employee_id;
        document.getElementById('emp-code').value = emp.emp_code;
        document.getElementById('emp-name').value = emp.full_name;
        document.getElementById('emp-email').value = emp.email || '';
        document.getElementById('emp-phone').value = emp.phone || '';
        document.getElementById('emp-dept').value = emp.department || '';
        document.getElementById('emp-designation').value = emp.designation || '';
        
        document.getElementById('emp-modal-title').textContent = 'Edit Employee';
        document.getElementById('salary-fields').style.display = 'none';
        
        utils.openModal('modal-employee');
    } catch (err) {
        utils.showToast('Failed to fetch employee details', 'error');
    }
};

window.deleteEmployee = async (id) => {
    if (confirm('Are you sure you want to delete this employee? This will also remove their attendance and payroll records.')) {
        try {
            await utils.api(`/employees/${id}`, { method: 'DELETE' });
            utils.showToast('Employee deleted successfully', 'success');
            loadEmployees();
        } catch (err) {
            utils.showToast(`Error: ${err.message}`, 'error');
        }
    }
};

// Attendance Logic
function bindAttendanceEvents() {
    const today = new Date().toISOString().split('T')[0];
    const dateFilter = document.getElementById('att-date-filter');
    dateFilter.value = today;
    
    dateFilter.addEventListener('change', () => {
        loadAttendance(dateFilter.value);
    });
    
    document.getElementById('btn-mark-attendance').addEventListener('click', () => {
        // Mock marking attendance for today for EMP001 (For demo purposes)
        utils.showToast('Smart Attendance: Demo feature. Try the HR Assistant!', 'info');
    });
}

async function loadAttendance(dateStr = '') {
    const tbody = document.querySelector('#attendance-table tbody');
    tbody.innerHTML = '<tr><td colspan="7" class="text-center"><div class="loading-spinner"></div></td></tr>';
    
    try {
        const date = dateStr || document.getElementById('att-date-filter').value;
        const res = await utils.api(`/attendance?from_date=${date}&to_date=${date}`);
        
        tbody.innerHTML = '';
        if (res.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7" class="text-center">No attendance records for this date</td></tr>';
            return;
        }
        
        res.forEach(att => {
            const tr = document.createElement('tr');
            const bt = att.status === 'present' ? 'present' : 
                       att.status === 'absent' ? 'absent' : 
                       att.status === 'half-day' ? 'half-day' : 'leave';
                       
            tr.innerHTML = `
                <td>${utils.formatDate(att.date)}</td>
                <td><strong>${att.full_name}</strong><br><small class="text-muted">${att.emp_code}</small></td>
                <td><span class="badge ${bt}">${att.status}</span></td>
                <td>${att.check_in_time ? String(att.check_in_time).substring(0,5) : '-'}</td>
                <td>${att.check_out_time ? String(att.check_out_time).substring(0,5) : '-'}</td>
                <td>${att.work_hours || 0} hrs</td>
                <td>${att.overtime_hours > 0 ? `<span class="text-warning">${att.overtime_hours} hrs</span>` : '-'}</td>
            `;
            tbody.appendChild(tr);
        });
    } catch (err) {
        tbody.innerHTML = '<tr><td colspan="7" class="text-center text-danger">Failed to load data</td></tr>';
    }
}

// Leave Logic
function bindLeaveEvents() {
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            loadLeaves(e.target.dataset.filter);
        });
    });
}

async function loadLeaves(statusFilter = '') {
    const tbody = document.querySelector('#leave-table tbody');
    tbody.innerHTML = '<tr><td colspan="6" class="text-center"><div class="loading-spinner"></div></td></tr>';
    
    try {
        let url = '/leave';
        if (statusFilter) url += `?status=${statusFilter}`;
        
        const res = await utils.api(url);
        
        tbody.innerHTML = '';
        if (res.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" class="text-center">No leave requests found</td></tr>';
            return;
        }
        
        res.forEach(l => {
            const tr = document.createElement('tr');
            
            let actions = '';
            if (l.status === 'pending') {
                actions = `
                    <button class="btn-icon-sm approve" onclick="updateLeaveStatus(${l.leave_id}, 'approved')" title="Approve"><i class="fa-solid fa-check"></i></button>
                    <button class="btn-icon-sm reject" onclick="updateLeaveStatus(${l.leave_id}, 'rejected')" title="Reject"><i class="fa-solid fa-times"></i></button>
                `;
            } else {
                actions = `<span class="text-muted">Reviewed</span>`;
            }
            
            tr.innerHTML = `
                <td><strong>${l.full_name}</strong><br><small class="text-muted">${l.emp_code}</small></td>
                <td><span class="badge ${l.leave_type === 'sick' ? 'pending' : 'active'}">${l.leave_type}</span></td>
                <td>${utils.formatDate(l.from_date)} to ${utils.formatDate(l.to_date)}</td>
                <td><div style="max-width: 200px; overflow: hidden; text-overflow: ellipsis;">${l.reason || 'No reason provided'}</div></td>
                <td><span class="badge ${l.status}">${l.status}</span></td>
                <td><div class="action-btns">${actions}</div></td>
            `;
            tbody.appendChild(tr);
        });
    } catch (err) {
        tbody.innerHTML = '<tr><td colspan="6" class="text-center text-danger">Failed to load data</td></tr>';
    }
}

window.updateLeaveStatus = async (id, status) => {
    try {
        await utils.api(`/leave/${id}`, {
            method: 'PUT',
            body: JSON.stringify({ status: status, reviewed_by: state.user.user_id })
        });
        
        const currentFilter = document.querySelector('.tab-btn.active').dataset.filter;
        utils.showToast(`Leave ${status} successfully`, 'success');
        loadLeaves(currentFilter);
    } catch (err) {
        utils.showToast(`Error: ${err.message}`, 'error');
    }
}

// Payroll Logic
function bindPayrollEvents() {
    document.getElementById('payroll-month').addEventListener('change', loadPayroll);
    document.getElementById('payroll-year').addEventListener('change', loadPayroll);
    
    document.getElementById('btn-generate-all').addEventListener('click', async () => {
        const month = document.getElementById('payroll-month').value;
        const year = document.getElementById('payroll-year').value;
        const btn = document.getElementById('btn-generate-all');
        const oHtml = btn.innerHTML;
        
        if (!confirm(`Generate payroll for all active employees for ${month}/${year}?`)) return;
        
        try {
            btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Processing...';
            btn.disabled = true;
            
            await utils.api('/payroll/generate-all', {
                method: 'POST',
                body: JSON.stringify({ month, year })
            });
            
            utils.showToast('Payroll generated successfully', 'success');
            loadPayroll();
        } catch (err) {
            utils.showToast(`Error generating payroll: ${err.message}`, 'error');
        } finally {
            btn.innerHTML = oHtml;
            btn.disabled = false;
        }
    });
}

async function loadPayroll() {
    const tbody = document.querySelector('#payroll-table tbody');
    tbody.innerHTML = '<tr><td colspan="7" class="text-center"><div class="loading-spinner"></div></td></tr>';
    
    const month = document.getElementById('payroll-month').value;
    const year = document.getElementById('payroll-year').value;
    
    try {
        const res = await utils.api(`/payroll?month=${month}&year=${year}`);
        
        tbody.innerHTML = '';
        if (res.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7" class="text-center">No payroll generated for this period</td></tr>';
            return;
        }
        
        res.forEach(p => {
            const allowances = p.hra + p.da + p.travel_allowance + p.medical_allowance + p.bonus + p.overtime_pay;
            
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td><strong>${p.full_name}</strong><br><small class="text-muted">${p.emp_code}</small></td>
                <td>${utils.formatCurrency(p.basic_salary)}</td>
                <td><span class="text-success">+${utils.formatCurrency(allowances)}</span></td>
                <td><strong>${utils.formatCurrency(p.gross_salary)}</strong></td>
                <td><span class="text-danger">-${utils.formatCurrency(p.total_deductions)}</span></td>
                <td><strong class="text-info" style="font-size: 1.1em">${utils.formatCurrency(p.net_salary)}</strong></td>
                <td>
                    <button class="btn btn-sm btn-outline" onclick='viewPayslip(${JSON.stringify(p).replace(/'/g, "&#39;")})'>
                        <i class="fa-solid fa-eye"></i> Payslip
                    </button>
                </td>
            `;
            tbody.appendChild(tr);
        });
    } catch (err) {
        tbody.innerHTML = '<tr><td colspan="7" class="text-center text-danger">Failed to load data</td></tr>';
    }
}

window.viewPayslip = (p) => {
    const allowances = [
        { name: 'HRA', val: p.hra },
        { name: 'DA', val: p.da },
        { name: 'Travel', val: p.travel_allowance },
        { name: 'Medical', val: p.medical_allowance },
        { name: 'Bonus', val: p.bonus },
        { name: 'Overtime', val: p.overtime_pay }
    ].filter(i => i.val > 0);
    
    const deductions = [
        { name: 'PF Contribution', val: p.pf_deduction },
        { name: 'Income Tax', val: p.tax_deduction },
        { name: 'Leave Deduction', val: p.leave_deduction }
    ].filter(i => i.val > 0);
    
    let html = `
        <div class="payslip-header">
            <h3>NexGen HR Systems Ltd</h3>
            <p class="text-muted">Salary Slip for ${p.month}/${p.year}</p>
        </div>
        
        <div style="display:flex; justify-content:space-between; margin-bottom: 20px;">
            <div>
                <strong>Name:</strong> ${p.full_name}<br>
                <strong>Code:</strong> ${p.emp_code}
            </div>
            <div class="text-right">
                <strong>Dept:</strong> ${p.department}<br>
                <strong>Date:</strong> ${utils.formatDate(p.generated_on)}
            </div>
        </div>
        
        <div class="payslip-row">
            <strong>Basic Salary</strong>
            <span>${utils.formatCurrency(p.basic_salary)}</span>
        </div>
        
        <div class="payslip-section" style="display:flex; gap:20px;">
            <div style="flex:1;">
                <h4>Earnings</h4>
    `;
    
    allowances.forEach(a => {
        html += `<div class="payslip-row"><span>${a.name}</span> <span class="text-success">+${utils.formatCurrency(a.val)}</span></div>`;
    });
    
    html += `
            </div>
            <div style="flex:1; border-left:1px solid rgba(255,255,255,0.1); padding-left:20px;">
                <h4>Deductions</h4>
    `;
    
    deductions.forEach(d => {
        html += `<div class="payslip-row"><span>${d.name}</span> <span class="text-danger">-${utils.formatCurrency(d.val)}</span></div>`;
    });
    
    html += `
            </div>
        </div>
        
        <div style="margin-top:20px; border-top:1px solid rgba(255,255,255,0.2); padding-top:10px;">
            <div class="payslip-row"><strong>Gross Earnings</strong> <span>${utils.formatCurrency(p.gross_salary)}</span></div>
            <div class="payslip-row"><strong>Total Deductions</strong> <span>${utils.formatCurrency(p.total_deductions)}</span></div>
        </div>
        
        <div class="payslip-total">
            <span>NET PAY</span>
            <span>${utils.formatCurrency(p.net_salary)}</span>
        </div>
        <p class="text-center text-muted mt-4" style="font-size:0.75rem">* This is a computer generated document.</p>
    `;
    
    document.getElementById('payslip-content').innerHTML = html;
    utils.openModal('modal-payslip');
}

// Scores Logic
function bindScoresEvents() {
    document.getElementById('scores-month').addEventListener('change', loadScores);
    document.getElementById('scores-year').addEventListener('change', loadScores);
    
    document.getElementById('btn-calc-scores').addEventListener('click', async () => {
        utils.showToast('Note: AI Score Calculation involves evaluating attendance, hours, and discipline. Run this at month-end.', 'info');
    });
}

async function loadScores() {
    const tbody = document.querySelector('#scores-table tbody');
    tbody.innerHTML = '<tr><td colspan="7" class="text-center"><div class="loading-spinner"></div></td></tr>';
    
    const month = document.getElementById('scores-month').value;
    const year = document.getElementById('scores-year').value;
    
    try {
        const res = await utils.api(`/scores?month=${month}&year=${year}`);
        
        tbody.innerHTML = '';
        if (res.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7" class="text-center">No scores calculated for this period</td></tr>';
            return;
        }
        
        res.forEach((s, idx) => {
            const bdg = s.category === 'Excellent' ? 'excellent-badge' : 
                        s.category === 'Good' ? 'good-badge' : 
                        s.category === 'Average' ? 'average-badge' : 'poor-badge';
                        
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td><strong>#${idx + 1}</strong></td>
                <td><strong>${s.full_name}</strong><br><small class="text-muted">${s.department}</small></td>
                <td>
                    <div style="width:100%; height:6px; background:rgba(255,255,255,0.1); border-radius:3px; overflow:hidden;">
                        <div style="height:100%; width:${(s.attendance_score/40)*100}%; background:#3b82f6;"></div>
                    </div>
                    <small>${s.attendance_score}/40</small>
                </td>
                <td>
                    <div style="width:100%; height:6px; background:rgba(255,255,255,0.1); border-radius:3px; overflow:hidden;">
                        <div style="height:100%; width:${(s.work_hours_score/25)*100}%; background:#10b981;"></div>
                    </div>
                    <small>${s.work_hours_score}/25</small>
                </td>
                <td>${s.overtime_score + s.leave_discipline_score + s.consistency_score} pts</td>
                <td><strong>${s.total_score}</strong>/100</td>
                <td><span class="badge ${bdg}">${s.category}</span></td>
            `;
            tbody.appendChild(tr);
        });
    } catch (err) {
        tbody.innerHTML = '<tr><td colspan="7" class="text-center text-danger">Failed to load data</td></tr>';
    }
}

// AI Assistant Logic
function bindAssistantEvents() {
    const form = document.getElementById('chat-form');
    const input = document.getElementById('chat-input');
    
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const text = input.value.trim();
        if (!text) return;
        
        appendMessage('user', text);
        input.value = '';
        
        appendTypingIndicator();
        
        try {
            const res = await utils.api('/assistant/query', {
                method: 'POST',
                body: JSON.stringify({ query: text })
            });
            
            removeTypingIndicator();
            appendMessage('bot', renderMarkdown(res.response));
        } catch (err) {
            removeTypingIndicator();
            appendMessage('bot', `Error connecting to Assistant AI: ${err.message}`);
        }
    });
    
    // Bind suggesting chips
    document.querySelectorAll('.chip').forEach(chip => {
        chip.addEventListener('click', () => {
            input.value = chip.textContent;
            form.dispatchEvent(new Event('submit'));
        });
    });
}

function appendMessage(sender, text) {
    const history = document.getElementById('chat-history');
    const msg = document.createElement('div');
    msg.className = `message ${sender}-message`;
    msg.style.animation = 'fadeIn 0.3s ease forwards';
    
    const icon = sender === 'bot' ? 'fa-robot' : 'fa-user';
    
    msg.innerHTML = `
        <div class="msg-avatar"><i class="fa-solid ${icon}"></i></div>
        <div class="msg-bubble ${sender === 'bot' ? 'markdown-body' : ''}">${sender === 'bot' ? text : text}</div>
    `;
    
    history.appendChild(msg);
    history.scrollTop = history.scrollHeight;
}

function appendTypingIndicator() {
    const history = document.getElementById('chat-history');
    const msg = document.createElement('div');
    msg.className = `message bot-message typing-indicator-msg`;
    msg.innerHTML = `
        <div class="msg-avatar"><i class="fa-solid fa-robot"></i></div>
        <div class="msg-bubble">Thinking <i class="fa-solid fa-ellipsis fa-bounce"></i></div>
    `;
    history.appendChild(msg);
    history.scrollTop = history.scrollHeight;
}

function removeTypingIndicator() {
    const typing = document.querySelector('.typing-indicator-msg');
    if (typing) typing.remove();
}

function renderMarkdown(text) {
    if (!text) return '';
    // Basic super simple markdown to HTML parser for tables & headers
    let html = text
        .replace(/^### (.*$)/gim, '<h3>$1</h3>')
        .replace(/^## (.*$)/gim, '<h2>$1</h2>')
        .replace(/^# (.*$)/gim, '<h1>$1</h1>')
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/g, '<em>$1</em>')
        .replace(/\n\n/g, '<br><br>');
        
    // Handle specific simple tables
    if (html.includes('|')) {
        let rows = html.split('\n').filter(r => r.trim().startsWith('|'));
        if (rows.length > 2) { // has enough rows to be a table
            let tableHtml = '<div class="table-responsive"><table>';
            rows.forEach((row, i) => {
                if (row.includes('---')) return; // skip header separator
                let mdCells = row.split('|').filter((_, j, arr) => j !== 0 && j !== arr.length - 1);
                tableHtml += '<tr>';
                mdCells.forEach(cell => {
                    tableHtml += i === 0 ? `<th>${cell.trim()}</th>` : `<td>${cell.trim()}</td>`;
                });
                tableHtml += '</tr>';
            });
            tableHtml += '</table></div>';
            
            // Replace first table occurrence
            const firstPipe = html.indexOf('|');
            const lastPipe = html.lastIndexOf('|');
            const beforeTable = html.substring(0, firstPipe);
            const afterTable = html.substring(lastPipe).split('\n').slice(1).join('\n');
            
            html = beforeTable + tableHtml + afterTable;
        }
    }
    
    return html;
}
