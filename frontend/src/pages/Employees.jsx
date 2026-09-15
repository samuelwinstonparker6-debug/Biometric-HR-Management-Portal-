import { useEffect, useState, useCallback } from 'react';
import { getEmployees, getDepartments, getEmployee, createEmployee, updateEmployee, deleteEmployee } from '../api/client';
import { useApp } from '../context/AppContext';
import Modal from '../components/Modal';

export default function Employees() {
  const { showToast } = useApp();
  const [employees, setEmployees]   = useState([]);
  const [departments, setDepts]     = useState([]);
  const [loading, setLoading]       = useState(true);
  const [search, setSearch]         = useState('');
  const [deptFilter, setDeptFilter] = useState('');
  const [modal, setModal]           = useState(false);
  const [editing, setEditing]       = useState(null);
  const [saving, setSaving]         = useState(false);
  const [form, setForm]             = useState(defaultForm());

  function defaultForm() {
    return { emp_code: '', full_name: '', email: '', phone: '', department: '', designation: '', basic_salary: 25000, hra: 5000, da: 2500 };
  }

  const load = useCallback(async () => {
    setLoading(true);
    try { setEmployees(await getEmployees(search, deptFilter)); }
    catch { showToast('Failed to load employees', 'error'); }
    finally { setLoading(false); }
  }, [search, deptFilter]);

  useEffect(() => { getDepartments().then(setDepts).catch(() => {}); }, []);
  useEffect(() => { load(); }, [load]);

  function openAdd() {
    setEditing(null);
    setForm(defaultForm());
    setModal(true);
  }

  async function openEdit(id) {
    try {
      const emp = await getEmployee(id);
      setEditing(emp.employee_id);
      setForm({ emp_code: emp.emp_code, full_name: emp.full_name, email: emp.email || '', phone: emp.phone || '', department: emp.department || '', designation: emp.designation || '', basic_salary: 0, hra: 0, da: 0 });
      setModal(true);
    } catch { showToast('Failed to load employee', 'error'); }
  }

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true);
    try {
      if (editing) {
        await updateEmployee(editing, form);
        showToast('Employee updated', 'success');
      } else {
        await createEmployee(form);
        showToast('Employee added', 'success');
      }
      setModal(false);
      load();
    } catch (err) {
      showToast(err.message, 'error');
    } finally { setSaving(false); }
  }

  async function handleDelete(id, name) {
    if (!confirm(`Delete ${name}? This will also remove their records.`)) return;
    try {
      await deleteEmployee(id);
      showToast('Employee deleted', 'success');
      load();
    } catch (err) { showToast(err.message, 'error'); }
  }

  const f = (k, v) => setForm(prev => ({ ...prev, [k]: v }));

  return (
    <div>
      <div className="page-header">
        <div className="page-header-left">
          <h1>Employees</h1>
          <p>Manage your workforce directory</p>
        </div>
        <div className="page-header-right">
          <button className="btn btn-primary" onClick={openAdd}>
            <i className="fa-solid fa-plus" /> Add Employee
          </button>
        </div>
      </div>

      <div className="card">
        {/* Toolbar */}
        <div className="toolbar">
          <div className="search-box" style={{ flex: 1, maxWidth: 340 }}>
            <i className="fa-solid fa-search" />
            <input placeholder="Search by name, code, email…" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <select className="form-control" style={{ width: 'auto' }} value={deptFilter} onChange={e => setDeptFilter(e.target.value)}>
            <option value="">All Departments</option>
            {departments.map(d => <option key={d} value={d}>{d}</option>)}
          </select>
        </div>

        {/* Table */}
        <div className="table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>Code</th>
                <th>Employee</th>
                <th>Department</th>
                <th>Designation</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr className="loading-row"><td colSpan={6}><div className="spinner" /></td></tr>
              ) : employees.length === 0 ? (
                <tr><td colSpan={6}><div className="empty-state"><i className="fa-solid fa-users" /><p>No employees found</p></div></td></tr>
              ) : employees.map(emp => (
                <tr key={emp.employee_id}>
                  <td><span style={{ fontFamily: 'var(--font-display)', fontWeight: 600, color: 'var(--accent-blue)' }}>{emp.emp_code}</span></td>
                  <td>
                    <div className="emp-cell">
                      <div className="emp-avatar">{emp.full_name.charAt(0)}</div>
                      <div>
                        <div className="emp-name">{emp.full_name}</div>
                        <div className="emp-code">{emp.email || '—'}</div>
                      </div>
                    </div>
                  </td>
                  <td style={{ color: 'var(--text-primary)' }}>{emp.department || '—'}</td>
                  <td>{emp.designation || '—'}</td>
                  <td><span className={`badge badge-${emp.status}`}>{emp.status}</span></td>
                  <td>
                    <div className="action-group">
                      <button className="action-btn edit" title="Edit" onClick={() => openEdit(emp.employee_id)}><i className="fa-solid fa-pen" /></button>
                      <button className="action-btn delete" title="Delete" onClick={() => handleDelete(emp.employee_id, emp.full_name)}><i className="fa-solid fa-trash" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add/Edit Modal */}
      <Modal
        isOpen={modal}
        onClose={() => setModal(false)}
        title={editing ? 'Edit Employee' : 'Add New Employee'}
        footer={
          <>
            <button className="btn btn-outline" onClick={() => setModal(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
              {saving ? <><i className="fa-solid fa-spinner fa-spin" /> Saving…</> : <><i className="fa-solid fa-check" /> Save</>}
            </button>
          </>
        }
      >
        <form onSubmit={handleSave}>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Employee Code *</label>
              <input className="form-control" value={form.emp_code} onChange={e => f('emp_code', e.target.value)} required />
            </div>
            <div className="form-group">
              <label className="form-label">Full Name *</label>
              <input className="form-control" value={form.full_name} onChange={e => f('full_name', e.target.value)} required />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Email</label>
              <input className="form-control" type="email" value={form.email} onChange={e => f('email', e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Phone</label>
              <input className="form-control" value={form.phone} onChange={e => f('phone', e.target.value)} />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Department</label>
              <input className="form-control" value={form.department} onChange={e => f('department', e.target.value)} list="dept-list" />
              <datalist id="dept-list">{departments.map(d => <option key={d} value={d} />)}</datalist>
            </div>
            <div className="form-group">
              <label className="form-label">Designation</label>
              <input className="form-control" value={form.designation} onChange={e => f('designation', e.target.value)} />
            </div>
          </div>

          {!editing && (
            <>
              <div style={{ borderTop: '1px solid var(--glass-border)', paddingTop: 16, marginTop: 4 }}>
                <p style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 12 }}>
                  <i className="fa-solid fa-indian-rupee-sign" style={{ marginRight: 6 }} />Initial Salary Structure
                </p>
                <div className="form-row-3">
                  <div className="form-group">
                    <label className="form-label">Basic (₹)</label>
                    <input className="form-control" type="number" value={form.basic_salary} onChange={e => f('basic_salary', e.target.value)} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">HRA (₹)</label>
                    <input className="form-control" type="number" value={form.hra} onChange={e => f('hra', e.target.value)} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">DA (₹)</label>
                    <input className="form-control" type="number" value={form.da} onChange={e => f('da', e.target.value)} />
                  </div>
                </div>
              </div>
            </>
          )}
        </form>
      </Modal>
    </div>
  );
}
