// Central API client — uses relative URLs locally, and env URL in production
const BASE = import.meta.env.VITE_API_URL || '/api';

async function request(endpoint, options = {}) {
  const res = await fetch(`${BASE}${endpoint}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || err.message || `HTTP ${res.status}`);
  }
  return res.json();
}

export const api = {
  get:    (url)         => request(url),
  post:   (url, body)   => request(url, { method: 'POST',   body: JSON.stringify(body) }),
  put:    (url, body)   => request(url, { method: 'PUT',    body: JSON.stringify(body) }),
  delete: (url)         => request(url, { method: 'DELETE' }),
};

// Auth
export const login = (username, password) =>
  api.post('/login', { username, password });

// Dashboard
export const getDashboard = () => api.get('/dashboard');

// Employees
export const getEmployees = (search = '', dept = '') => {
  const params = new URLSearchParams();
  if (search) params.set('search', search);
  if (dept)   params.set('department', dept);
  return api.get(`/employees?${params}`);
};
export const getEmployee   = (id)       => api.get(`/employees/${id}`);
export const createEmployee = (data)    => api.post('/employees', data);
export const updateEmployee = (id, data)=> api.put(`/employees/${id}`, data);
export const deleteEmployee = (id)      => api.delete(`/employees/${id}`);
export const getDepartments = ()        => api.get('/departments');

// Attendance
export const getAttendance = (from, to) =>
  api.get(`/attendance?from_date=${from}&to_date=${to}`);
export const markAttendance = (data) => api.post('/attendance', data);

// Leave
export const getLeaves         = (status = '') => api.get(`/leave${status ? `?status=${status}` : ''}`);
export const applyLeave        = (data)        => api.post('/leave', data);
export const updateLeaveStatus = (id, data)   => api.put(`/leave/${id}`, data);

// Payroll
export const getPayroll        = (month, year) => api.get(`/payroll?month=${month}&year=${year}`);
export const generateAllPayroll= (month, year) => api.post('/payroll/generate-all', { month, year });

// Scores
export const getScores     = (month, year) => api.get(`/scores?month=${month}&year=${year}`);
export const calcScores    = (month, year) => api.post('/scores/calculate', { month, year });

// AI Assistant
export const askAssistant = (query) => api.post('/assistant/query', { query });

// Queries / Complaints
export const getQueries = () => api.get('/queries');
export const submitQuery = (data) => api.post('/queries', data);
export const markQueryStatus = (id, status) => api.put(`/queries/${id}/status`, { status });

// Reports
export const getReportOverview    = ()                 => api.get('/reports/overview');
export const getReportPayroll     = (month, year)      => api.get(`/reports/payroll?month=${month}&year=${year}`);
export const getReportAttendance  = (month, year)      => api.get(`/reports/attendance?month=${month}&year=${year}`);
export const getReportScores      = (month, year)      => api.get(`/reports/scores?month=${month}&year=${year}`);
export const getReportDepartment  = (month, year)      => api.get(`/reports/department?month=${month}&year=${year}`);
