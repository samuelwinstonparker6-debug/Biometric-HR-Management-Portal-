import { useEffect, useState } from 'react';
import { getAttendance, markAttendance, getEmployees } from '../api/client';
import { useApp } from '../context/AppContext';
import Modal from '../components/Modal';

const STATUS_COLORS = { present: 'badge-present', absent: 'badge-absent', leave: 'badge-leave', 'half-day': 'badge-half-day' };

export default function Attendance() {
  const { showToast } = useApp();
  const today = new Date().toISOString().split('T')[0];
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [date, setDate]       = useState(today);
  const [modal, setModal]     = useState(false);
  const [employees, setEmps]  = useState([]);
  const [saving, setSaving]   = useState(false);
  const [form, setForm]       = useState({
    employee_id: '', date: today, status: 'present',
    check_in_time: '09:00', check_out_time: '17:00',
    work_hours: 8, overtime_hours: 0
  });

  async function load(d = date) {
    setLoading(true);
    try { setRecords(await getAttendance(d, d)); }
    catch { showToast('Failed to load attendance', 'error'); }
    finally { setLoading(false); }
  }

  useEffect(() => { load(); }, [date]);
  useEffect(() => { getEmployees().then(setEmps).catch(() => {}); }, []);

  async function handleMark(e) {
    e.preventDefault();
    setSaving(true);
    try {
      await markAttendance(form);
      showToast('Attendance marked', 'success');
      setModal(false);
      load(form.date);
      setDate(form.date);
    } catch (err) { showToast(err.message, 'error'); }
    finally { setSaving(false); }
  }

  const f = (k, v) => setForm(prev => ({ ...prev, [k]: v }));

  return (
    <div>
      <div className="page-header">
        <div className="page-header-left">
          <h1>Attendance Tracking</h1>
          <p>Monitor daily check-ins and work hours</p>
        </div>
        <div className="page-header-right">
          <button className="btn btn-primary" onClick={() => setModal(true)}>
            <i className="fa-solid fa-clipboard-user" /> Mark Attendance
          </button>
        </div>
      </div>

      <div className="card">
        <div className="toolbar">
          <label style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Filter by Date:</label>
          <input type="date" className="form-control" style={{ width: 'auto' }} value={date} onChange={e => setDate(e.target.value)} />
          <button className="btn btn-outline btn-sm" onClick={() => setDate(today)}>
            <i className="fa-solid fa-rotate-right" /> Today
          </button>
          <span style={{ marginLeft: 'auto', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
            {records.length} record{records.length !== 1 ? 's' : ''}
          </span>
        </div>

        <div className="table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>Employee</th>
                <th>Date</th>
                <th>Status</th>
                <th>Check In</th>
                <th>Check Out</th>
                <th>Work Hours</th>
                <th>Overtime</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr className="loading-row"><td colSpan={7}><div className="spinner" /></td></tr>
              ) : records.length === 0 ? (
                <tr><td colSpan={7}>
                  <div className="empty-state">
                    <i className="fa-solid fa-calendar-xmark" />
                    <p>No attendance records for this date</p>
                  </div>
                </td></tr>
              ) : records.map(r => (
                <tr key={r.attendance_id}>
                  <td>
                    <div className="emp-cell">
                      <div className="emp-avatar">{r.full_name.charAt(0)}</div>
                      <div>
                        <div className="emp-name">{r.full_name}</div>
                        <div className="emp-code">{r.emp_code}</div>
                      </div>
                    </div>
                  </td>
                  <td style={{ color: 'var(--text-primary)' }}>{r.date}</td>
                  <td><span className={`badge ${STATUS_COLORS[r.status] || 'badge-leave'}`}>{r.status}</span></td>
                  <td>{r.check_in_time ? String(r.check_in_time).substring(0, 5) : '—'}</td>
                  <td>{r.check_out_time ? String(r.check_out_time).substring(0, 5) : '—'}</td>
                  <td>{r.work_hours ? `${r.work_hours} hrs` : '—'}</td>
                  <td>
                    {r.overtime_hours > 0
                      ? <span style={{ color: 'var(--accent-orange)', fontWeight: 600 }}>{r.overtime_hours} hrs</span>
                      : <span style={{ color: 'var(--text-muted)' }}>—</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mark Attendance Modal */}
      <Modal
        isOpen={modal}
        onClose={() => setModal(false)}
        title="Mark Attendance"
        footer={
          <>
            <button className="btn btn-outline" onClick={() => setModal(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={handleMark} disabled={saving}>
              {saving ? <><i className="fa-solid fa-spinner fa-spin" /> Saving…</> : <><i className="fa-solid fa-check" /> Mark</>}
            </button>
          </>
        }
      >
        <form onSubmit={handleMark}>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Employee *</label>
              <select className="form-control" value={form.employee_id} onChange={e => f('employee_id', e.target.value)} required>
                <option value="">Select employee</option>
                {employees.map(e => <option key={e.employee_id} value={e.employee_id}>{e.full_name} ({e.emp_code})</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Date *</label>
              <input type="date" className="form-control" value={form.date} onChange={e => f('date', e.target.value)} required />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Status *</label>
            <select className="form-control" value={form.status} onChange={e => f('status', e.target.value)}>
              <option value="present">Present</option>
              <option value="absent">Absent</option>
              <option value="leave">On Leave</option>
              <option value="half-day">Half Day</option>
            </select>
          </div>
          {form.status !== 'absent' && (
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Check In</label>
                <input type="time" className="form-control" value={form.check_in_time} onChange={e => f('check_in_time', e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Check Out</label>
                <input type="time" className="form-control" value={form.check_out_time} onChange={e => f('check_out_time', e.target.value)} />
              </div>
            </div>
          )}
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Work Hours</label>
              <input type="number" step="0.5" min="0" max="24" className="form-control" value={form.work_hours} onChange={e => f('work_hours', e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Overtime Hours</label>
              <input type="number" step="0.5" min="0" max="12" className="form-control" value={form.overtime_hours} onChange={e => f('overtime_hours', e.target.value)} />
            </div>
          </div>
        </form>
      </Modal>
    </div>
  );
}
