import { useEffect, useState } from 'react';
import { getLeaves, applyLeave, updateLeaveStatus, getEmployees } from '../api/client';
import { useApp } from '../context/AppContext';
import Modal from '../components/Modal';

export default function Leave() {
  const { showToast } = useApp();
  const [leaves, setLeaves]     = useState([]);
  const [loading, setLoading]   = useState(true);
  const [filter, setFilter]     = useState('');
  const [modal, setModal]       = useState(false);
  const [employees, setEmps]    = useState([]);
  const [saving, setSaving]     = useState(false);
  const [form, setForm]         = useState({
    employee_id: '', leave_type: 'casual',
    from_date: '', to_date: '', reason: ''
  });

  async function load(s = filter) {
    setLoading(true);
    try { setLeaves(await getLeaves(s)); }
    catch { showToast('Failed to load leaves', 'error'); }
    finally { setLoading(false); }
  }

  useEffect(() => { load(); }, [filter]);
  useEffect(() => { getEmployees().then(setEmps).catch(() => {}); }, []);

  async function handleApply(e) {
    e.preventDefault();
    setSaving(true);
    try {
      await applyLeave(form);
      showToast('Leave applied successfully', 'success');
      setModal(false);
      load();
    } catch (err) { showToast(err.message, 'error'); }
    finally { setSaving(false); }
  }

  async function handleStatus(id, status) {
    try {
      await updateLeaveStatus(id, { status });
      showToast(`Leave ${status}`, 'success');
      load();
    } catch (err) { showToast(err.message, 'error'); }
  }

  const f = (k, v) => setForm(prev => ({ ...prev, [k]: v }));
  const TABS = [
    { label: 'All',      val: '' },
    { label: 'Pending',  val: 'pending' },
    { label: 'Approved', val: 'approved' },
    { label: 'Rejected', val: 'rejected' },
  ];

  return (
    <div>
      <div className="page-header">
        <div className="page-header-left">
          <h1>Leave Management</h1>
          <p>Review and manage employee time-off requests</p>
        </div>
        <div className="page-header-right">
          <button className="btn btn-primary" onClick={() => setModal(true)}>
            <i className="fa-solid fa-paper-plane" /> Apply Leave
          </button>
        </div>
      </div>

      <div className="card">
        <div className="toolbar">
          <div className="tab-group">
            {TABS.map(t => (
              <button key={t.val} className={`tab-btn ${filter === t.val ? 'active' : ''}`} onClick={() => setFilter(t.val)}>
                {t.label}
              </button>
            ))}
          </div>
          <span style={{ marginLeft: 'auto', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
            {leaves.length} request{leaves.length !== 1 ? 's' : ''}
          </span>
        </div>

        <div className="table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>Employee</th>
                <th>Type</th>
                <th>From</th>
                <th>To</th>
                <th>Reason</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr className="loading-row"><td colSpan={7}><div className="spinner" /></td></tr>
              ) : leaves.length === 0 ? (
                <tr><td colSpan={7}>
                  <div className="empty-state">
                    <i className="fa-solid fa-plane-departure" />
                    <p>No leave requests found</p>
                  </div>
                </td></tr>
              ) : leaves.map(l => (
                <tr key={l.leave_id}>
                  <td>
                    <div className="emp-cell">
                      <div className="emp-avatar">{l.full_name.charAt(0)}</div>
                      <div>
                        <div className="emp-name">{l.full_name}</div>
                        <div className="emp-code">{l.emp_code}</div>
                      </div>
                    </div>
                  </td>
                  <td><span className={`badge ${l.leave_type === 'sick' ? 'badge-absent' : 'badge-leave'}`}>{l.leave_type}</span></td>
                  <td style={{ color: 'var(--text-primary)' }}>{l.from_date}</td>
                  <td style={{ color: 'var(--text-primary)' }}>{l.to_date}</td>
                  <td style={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {l.reason || '—'}
                  </td>
                  <td><span className={`badge badge-${l.status}`}>{l.status}</span></td>
                  <td>
                    {l.status === 'pending' ? (
                      <div className="action-group">
                        <button className="action-btn approve" title="Approve" onClick={() => handleStatus(l.leave_id, 'approved')}><i className="fa-solid fa-check" /></button>
                        <button className="action-btn reject"  title="Reject"  onClick={() => handleStatus(l.leave_id, 'rejected')}><i className="fa-solid fa-times" /></button>
                      </div>
                    ) : (
                      <span className="small text-muted">Reviewed</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Apply Leave Modal */}
      <Modal
        isOpen={modal}
        onClose={() => setModal(false)}
        title="Apply Leave Request"
        footer={
          <>
            <button className="btn btn-outline" onClick={() => setModal(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={handleApply} disabled={saving}>
              {saving ? <><i className="fa-solid fa-spinner fa-spin" /> Applying…</> : <><i className="fa-solid fa-paper-plane" /> Apply</>}
            </button>
          </>
        }
      >
        <form onSubmit={handleApply}>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Employee *</label>
              <select className="form-control" value={form.employee_id} onChange={e => f('employee_id', e.target.value)} required>
                <option value="">Select employee</option>
                {employees.map(e => <option key={e.employee_id} value={e.employee_id}>{e.full_name}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Leave Type *</label>
              <select className="form-control" value={form.leave_type} onChange={e => f('leave_type', e.target.value)}>
                <option value="casual">Casual</option>
                <option value="sick">Sick</option>
                <option value="earned">Earned</option>
                <option value="unpaid">Unpaid</option>
              </select>
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">From Date *</label>
              <input type="date" className="form-control" value={form.from_date} onChange={e => f('from_date', e.target.value)} required />
            </div>
            <div className="form-group">
              <label className="form-label">To Date *</label>
              <input type="date" className="form-control" value={form.to_date} onChange={e => f('to_date', e.target.value)} required />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Reason</label>
            <textarea className="form-control" rows={3} value={form.reason} onChange={e => f('reason', e.target.value)} style={{ resize: 'vertical' }} placeholder="Brief reason for leave…" />
          </div>
        </form>
      </Modal>
    </div>
  );
}
