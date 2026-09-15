import { useEffect, useState } from 'react';
import { getPayroll, generateAllPayroll } from '../api/client';
import { useApp } from '../context/AppContext';
import Modal from '../components/Modal';

const MONTHS = ['','Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

function fmt(n) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n || 0);
}

export default function Payroll() {
  const { showToast } = useApp();
  const now = new Date();
  const [payrollData, setPayrollData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear]   = useState(now.getFullYear());
  const [running, setRunning] = useState(false);
  const [payslip, setPayslip] = useState(null);

  async function load() {
    setLoading(true);
    try { setPayrollData(await getPayroll(month, year)); }
    catch { showToast('Failed to load payroll', 'error'); }
    finally { setLoading(false); }
  }

  useEffect(() => { load(); }, [month, year]);

  async function handleRunPayroll() {
    if (!confirm(`Generate payroll for all active employees for ${MONTHS[month]} ${year}?`)) return;
    setRunning(true);
    try {
      await generateAllPayroll(month, year);
      showToast('Payroll generated successfully', 'success');
      load();
    } catch (err) { showToast(err.message, 'error'); }
    finally { setRunning(false); }
  }

  const totalNet = payrollData.reduce((s, p) => s + p.net_salary, 0);
  const totalGross = payrollData.reduce((s, p) => s + p.gross_salary, 0);

  return (
    <div>
      <div className="page-header">
        <div className="page-header-left">
          <h1>Payroll Processing</h1>
          <p>Salary generation, breakdown & payslips</p>
        </div>
        <div className="page-header-right">
          <button className="btn btn-primary" onClick={handleRunPayroll} disabled={running}>
            {running
              ? <><i className="fa-solid fa-spinner fa-spin" /> Processing…</>
              : <><i className="fa-solid fa-cogs" /> Run Payroll</>}
          </button>
        </div>
      </div>

      {/* Summary row */}
      {payrollData.length > 0 && (
        <div className="stats-grid" style={{ marginBottom: 24 }}>
          {[
            { icon: 'fa-users', colorClass: 'blue',   label: 'Employees Paid',   value: payrollData.length },
            { icon: 'fa-money-bill-wave', colorClass: 'green', label: 'Total Gross', value: fmt(totalGross) },
            { icon: 'fa-hand-holding-dollar', colorClass: 'teal', label: 'Total Net', value: fmt(totalNet) },
            { icon: 'fa-minus-circle', colorClass: 'orange', label: 'Total Deductions', value: fmt(totalGross - totalNet) },
          ].map(s => (
            <div key={s.label} className={`stat-card ${s.colorClass}`}>
              <div className={`stat-icon ${s.colorClass}`}><i className={`fa-solid ${s.icon}`} /></div>
              <div className="stat-info">
                <div className="stat-label">{s.label}</div>
                <div className="stat-value" style={{ fontSize: '1.4rem' }}>{s.value}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="card">
        <div className="toolbar">
          <select className="form-control" style={{ width: 'auto' }} value={month} onChange={e => setMonth(+e.target.value)}>
            {MONTHS.slice(1).map((m, i) => <option key={i+1} value={i+1}>{m}</option>)}
          </select>
          <select className="form-control" style={{ width: 'auto' }} value={year} onChange={e => setYear(+e.target.value)}>
            {[2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}
          </select>
          <span style={{ marginLeft: 'auto', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
            {MONTHS[month]} {year}
          </span>
        </div>

        <div className="table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>Employee</th>
                <th>Basic</th>
                <th>HRA + Allowances</th>
                <th>Bonus + OT</th>
                <th>Gross</th>
                <th>Deductions</th>
                <th style={{ color: 'var(--accent-green)' }}>Net Salary</th>
                <th>Payslip</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr className="loading-row"><td colSpan={8}><div className="spinner" /></td></tr>
              ) : payrollData.length === 0 ? (
                <tr><td colSpan={8}>
                  <div className="empty-state">
                    <i className="fa-solid fa-file-invoice-dollar" />
                    <p>No payroll generated for this period. Click "Run Payroll" to generate.</p>
                  </div>
                </td></tr>
              ) : payrollData.map(p => (
                <tr key={p.payroll_id}>
                  <td>
                    <div className="emp-cell">
                      <div className="emp-avatar">{p.full_name.charAt(0)}</div>
                      <div>
                        <div className="emp-name">{p.full_name}</div>
                        <div className="emp-code">{p.emp_code} · {p.department}</div>
                      </div>
                    </div>
                  </td>
                  <td style={{ color: 'var(--text-primary)' }}>{fmt(p.basic_salary)}</td>
                  <td style={{ color: 'var(--accent-teal)' }}>+{fmt(p.hra + p.da + p.travel_allowance + p.medical_allowance)}</td>
                  <td style={{ color: 'var(--accent-orange)' }}>+{fmt(p.bonus + p.overtime_pay)}</td>
                  <td style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{fmt(p.gross_salary)}</td>
                  <td style={{ color: 'var(--accent-red)' }}>-{fmt(p.total_deductions)}</td>
                  <td><span style={{ fontFamily: 'var(--font-display)', fontSize: '1rem', fontWeight: 700, color: 'var(--accent-green)' }}>{fmt(p.net_salary)}</span></td>
                  <td>
                    <button className="action-btn view" title="View Payslip" onClick={() => setPayslip(p)}>
                      <i className="fa-solid fa-eye" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Payslip Modal */}
      <Modal
        isOpen={!!payslip}
        onClose={() => setPayslip(null)}
        title="Salary Slip"
        className="payslip"
        wide
      >
        {payslip && <PayslipContent p={payslip} />}
      </Modal>
    </div>
  );
}

function PayslipContent({ p }) {
  return (
    <div>
      <div className="payslip-header">
        <h3>NexGen HR Systems Ltd.</h3>
        <p>Salary Slip for {MONTHS[p.month]} {p.year}</p>
      </div>

      <div className="payslip-info-grid">
        {[
          { key: 'Employee Name', val: p.full_name },
          { key: 'Employee Code', val: p.emp_code },
          { key: 'Department', val: p.department },
          { key: 'Generated On', val: p.generated_on ? new Date(p.generated_on).toLocaleDateString('en-IN') : '—' },
        ].map(item => (
          <div key={item.key} className="payslip-info-item">
            <div className="key">{item.key}</div>
            <div className="val">{item.val}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
        {/* Earnings */}
        <div>
          <table className="payslip-table">
            <thead><tr><th>Earnings</th><th>Amount (₹)</th></tr></thead>
            <tbody>
              {[
                { n: 'Basic Salary',      v: p.basic_salary },
                { n: 'HRA',               v: p.hra },
                { n: 'DA',                v: p.da },
                { n: 'Travel Allowance',  v: p.travel_allowance },
                { n: 'Medical Allowance', v: p.medical_allowance },
                { n: 'Bonus',             v: p.bonus },
                { n: 'Overtime Pay',      v: p.overtime_pay },
              ].filter(r => r.v > 0).map(r => (
                <tr key={r.n}><td>{r.n}</td><td style={{ color: 'var(--accent-green)' }}>+{r.v.toLocaleString('en-IN')}</td></tr>
              ))}
              <tr className="total-row"><td>Gross Salary</td><td style={{ color: 'var(--text-primary)' }}>{p.gross_salary.toLocaleString('en-IN')}</td></tr>
            </tbody>
          </table>
        </div>
        {/* Deductions */}
        <div>
          <table className="payslip-table">
            <thead><tr><th>Deductions</th><th>Amount (₹)</th></tr></thead>
            <tbody>
              {[
                { n: 'PF Contribution', v: p.pf_deduction },
                { n: 'Income Tax',      v: p.tax_deduction },
                { n: 'Leave Deduction', v: p.leave_deduction },
                { n: 'Other',           v: p.other_deductions },
              ].filter(r => r.v > 0).map(r => (
                <tr key={r.n}><td>{r.n}</td><td style={{ color: 'var(--accent-red)' }}>-{r.v.toLocaleString('en-IN')}</td></tr>
              ))}
              <tr className="total-row"><td>Total Deductions</td><td style={{ color: 'var(--accent-red)' }}>{p.total_deductions.toLocaleString('en-IN')}</td></tr>
            </tbody>
          </table>
        </div>
      </div>

      <div className="payslip-net">
        <div>
          <div className="payslip-net-label">NET TAKE HOME PAY</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 2 }}>For {MONTHS[p.month]} {p.year}</div>
        </div>
        <div className="payslip-net-amount">₹{p.net_salary.toLocaleString('en-IN')}</div>
      </div>

      <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.72rem', marginTop: 16 }}>
        * This is a computer-generated document and does not require a signature.
      </p>
    </div>
  );
}
