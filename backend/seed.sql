USE payroll_db;

-- ============================================================
-- SAFE SEED FILE - Uses INSERT IGNORE everywhere
-- This means: if data already exists, it is SKIPPED, not replaced.
-- Running this multiple times will NEVER cause data corruption.
-- ============================================================

-- Default Users for Login (INSERT IGNORE = skip if already exists)
INSERT IGNORE INTO users (username, password, full_name, role, employee_id) VALUES
('admin', 'admin123', 'System Administrator', 'admin', NULL),
('rahul', 'password123', 'Rahul Sharma', 'employee', 1),
('priya', 'password123', 'Priya Patel', 'employee', 2),
('jonathan', 'password123', 'Jonathan D\'Souza', 'employee', 3);

-- Sample employees (INSERT IGNORE skips if emp_code already exists)
INSERT IGNORE INTO employees (employee_id, emp_code, full_name, email, phone, department, designation, date_of_joining, employment_type, status) VALUES
(1,  'EMP001', 'Rahul Sharma',     'rahul@company.com',    '9876543210', 'Engineering', 'Senior Developer',  '2023-01-15', 'full-time', 'active'),
(2,  'EMP002', 'Priya Patel',      'priya@company.com',    '9876543211', 'HR',          'HR Manager',        '2022-06-01', 'full-time', 'active'),
(3,  'EMP003', 'Jonathan D\'Souza','jonathan@company.com', '9876543212', 'Sales',       'Sales Executive',   '2023-03-20', 'full-time', 'active'),
(4,  'EMP004', 'Arun Kumar',       'arun@company.com',     '9876543213', 'Engineering', 'Junior Developer',  '2024-01-10', 'full-time', 'active'),
(5,  'EMP005', 'Sneha Reddy',      'sneha@company.com',    '9876543214', 'Finance',     'Accountant',        '2023-07-15', 'full-time', 'active'),
(6,  'EMP006', 'Vikram Singh',     'vikram@company.com',   '9876543215', 'Engineering', 'Tech Lead',         '2021-11-01', 'full-time', 'active'),
(7,  'EMP007', 'Meera Nair',       'meera@company.com',    '9876543216', 'Marketing',   'Marketing Manager', '2022-09-10', 'full-time', 'active'),
(8,  'EMP008', 'Karthik Iyer',     'karthik@company.com',  '9876543217', 'Sales',       'Sales Manager',     '2022-02-28', 'full-time', 'active'),
(9,  'EMP009', 'Divya Joshi',      'divya@company.com',    '9876543218', 'HR',          'HR Executive',      '2024-05-15', 'full-time', 'active'),
(10, 'EMP010', 'Arjun Menon',      'arjun@company.com',    '9876543219', 'Finance',     'Finance Manager',   '2021-08-20', 'full-time', 'active');

-- Salary structures
INSERT IGNORE INTO salary_structure (employee_id, basic_salary, hra, da, travel_allowance, medical_allowance, other_allowance, pf_percent, tax_percent) VALUES
(1,  45000, 9000,  4500, 3000, 2000, 1500, 12.00, 10.00),
(2,  40000, 8000,  4000, 2500, 2000, 1000, 12.00, 8.00),
(3,  25000, 5000,  2500, 2000, 1500,  500, 12.00, 5.00),
(4,  22000, 4400,  2200, 1500, 1000,  500, 12.00, 5.00),
(5,  35000, 7000,  3500, 2000, 1500, 1000, 12.00, 8.00),
(6,  55000, 11000, 5500, 3500, 2500, 2000, 12.00, 15.00),
(7,  42000, 8400,  4200, 2500, 2000, 1500, 12.00, 10.00),
(8,  38000, 7600,  3800, 2500, 1500, 1000, 12.00, 8.00),
(9,  20000, 4000,  2000, 1500, 1000,  500, 12.00, 5.00),
(10, 50000, 10000, 5000, 3000, 2500, 2000, 12.00, 12.00);

-- Attendance for March 2026 (INSERT IGNORE = skip if already recorded)
INSERT IGNORE INTO attendance (employee_id, date, status, check_in_time, check_out_time, work_hours, overtime_hours) VALUES
-- Rahul Sharma - good attendance
(1, '2026-03-02', 'present', '09:00', '18:00', 8.00, 1.00),
(1, '2026-03-03', 'present', '09:15', '17:30', 7.50, 0.00),
(1, '2026-03-04', 'present', '08:45', '18:30', 8.50, 1.50),
(1, '2026-03-05', 'present', '09:00', '17:00', 7.00, 0.00),
(1, '2026-03-06', 'present', '09:00', '18:00', 8.00, 1.00),
(1, '2026-03-09', 'present', '09:00', '17:30', 7.50, 0.00),
(1, '2026-03-10', 'present', '08:30', '18:00', 8.50, 1.00),
(1, '2026-03-11', 'leave',   NULL,    NULL,    0.00, 0.00),
(1, '2026-03-12', 'present', '09:00', '18:30', 8.50, 1.50),
(1, '2026-03-13', 'present', '09:00', '17:00', 7.00, 0.00),
(1, '2026-03-16', 'present', '09:00', '18:00', 8.00, 1.00),
(1, '2026-03-17', 'present', '09:15', '17:30', 7.25, 0.00),
(1, '2026-03-18', 'present', '09:00', '19:00', 9.00, 2.00),
(1, '2026-03-19', 'present', '09:00', '17:30', 7.50, 0.00),
(1, '2026-03-20', 'present', '09:00', '18:00', 8.00, 1.00),
(1, '2026-03-23', 'present', '08:45', '17:30', 7.75, 0.00),
(1, '2026-03-24', 'present', '09:00', '18:00', 8.00, 1.00),
(1, '2026-03-25', 'present', '09:00', '17:00', 7.00, 0.00),
-- Jonathan - moderate attendance
(3, '2026-03-02', 'present', '09:30', '17:30', 7.00, 0.00),
(3, '2026-03-03', 'present', '09:00', '18:00', 8.00, 1.00),
(3, '2026-03-04', 'absent',  NULL,    NULL,    0.00, 0.00),
(3, '2026-03-05', 'present', '09:15', '17:00', 6.75, 0.00),
(3, '2026-03-06', 'present', '09:00', '18:30', 8.50, 1.50),
(3, '2026-03-09', 'present', '09:00', '17:30', 7.50, 0.00),
(3, '2026-03-10', 'leave',   NULL,    NULL,    0.00, 0.00),
(3, '2026-03-11', 'present', '09:00', '17:00', 7.00, 0.00),
(3, '2026-03-12', 'present', '09:00', '18:00', 8.00, 1.00),
(3, '2026-03-13', 'present', '09:30', '17:30', 7.00, 0.00),
(3, '2026-03-16', 'present', '09:00', '18:00', 8.00, 1.00),
(3, '2026-03-17', 'absent',  NULL,    NULL,    0.00, 0.00),
(3, '2026-03-18', 'present', '09:00', '17:30', 7.50, 0.00),
(3, '2026-03-19', 'present', '09:00', '18:00', 8.00, 1.00),
(3, '2026-03-20', 'present', '09:00', '17:00', 7.00, 0.00),
(3, '2026-03-23', 'present', '09:15', '17:30', 7.25, 0.00),
(3, '2026-03-24', 'present', '09:00', '18:00', 8.00, 1.00),
(3, '2026-03-25', 'leave',   NULL,    NULL,    0.00, 0.00);

-- Leave requests
INSERT IGNORE INTO leave_requests (leave_id, employee_id, leave_type, from_date, to_date, reason, status) VALUES
(1, 1, 'casual', '2026-03-11', '2026-03-11', 'Personal work',      'approved'),
(2, 3, 'casual', '2026-03-10', '2026-03-10', 'Doctor appointment', 'approved'),
(3, 3, 'casual', '2026-03-25', '2026-03-26', 'Family function',    'pending'),
(4, 4, 'sick',   '2026-03-15', '2026-03-16', 'Fever',              'approved'),
(5, 5, 'earned', '2026-04-01', '2026-04-03', 'Vacation',           'pending'),
(6, 7, 'casual', '2026-03-20', '2026-03-20', 'Personal errand',    'rejected');

-- Employee scores for Feb 2026
INSERT IGNORE INTO employee_scores (employee_id, month, year, attendance_score, work_hours_score, overtime_score, leave_discipline_score, consistency_score, total_score, category) VALUES
(1,  2, 2026, 38.0, 23.0, 13.0, 9.0, 9.0,  92.0, 'Excellent'),
(2,  2, 2026, 36.0, 22.0, 10.0, 8.0, 8.5,  84.5, 'Good'),
(3,  2, 2026, 30.0, 19.0,  8.0, 6.0, 6.0,  69.0, 'Average'),
(4,  2, 2026, 34.0, 21.0,  5.0, 7.0, 7.5,  74.5, 'Average'),
(5,  2, 2026, 37.0, 23.0, 12.0, 9.0, 8.5,  89.5, 'Good'),
(6,  2, 2026, 39.0, 24.0, 14.0, 9.5, 9.5,  96.0, 'Excellent'),
(7,  2, 2026, 35.0, 20.0,  9.0, 7.0, 7.0,  78.0, 'Good'),
(8,  2, 2026, 32.0, 18.0,  7.0, 6.5, 6.5,  70.0, 'Average'),
(9,  2, 2026, 28.0, 17.0,  4.0, 5.0, 5.0,  59.0, 'Needs Improvement'),
(10, 2, 2026, 38.0, 24.0, 13.0, 9.0, 9.0,  93.0, 'Excellent');

-- Payroll for Feb 2026
INSERT IGNORE INTO payroll (employee_id, month, year, basic_salary, hra, da, travel_allowance, medical_allowance, bonus, overtime_pay, gross_salary, pf_deduction, tax_deduction, leave_deduction, other_deductions, total_deductions, net_salary) VALUES
(1,  2, 2026, 45000, 9000,  4500, 3000, 2000, 3000, 4500, 71000, 5400, 4500, 0, 0,  9900, 61100),
(2,  2, 2026, 40000, 8000,  4000, 2500, 2000, 2000, 1500, 60000, 4800, 3200, 0, 0,  8000, 52000),
(3,  2, 2026, 25000, 5000,  2500, 2000, 1500, 1000, 2000, 39000, 3000, 1250, 1200, 0, 5450, 33550),
(6,  2, 2026, 55000, 11000, 5500, 3500, 2500, 5000, 6000, 88500, 6600, 8250, 0, 0, 14850, 73650),
(10, 2, 2026, 50000, 10000, 5000, 3000, 2500, 4000, 3500, 78000, 6000, 6000, 0, 0, 12000, 66000);
