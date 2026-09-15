import { useEffect, useState } from 'react';
import { getDashboard } from '../api/client';
import { useApp } from '../context/AppContext';
import StatCard from '../components/StatCard';

function fmt(n) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n || 0);
}

export default function Dashboard() {
  const { showToast } = useApp();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getDashboard()
      .then(setData)
      .catch(() => showToast('Failed to load dashboard', 'error'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '300px' }}>
      <div className="spinner lg" />
    </div>
  );

  const att = data?.today_attendance || {};
  const totalAtt = (att.present || 0) + (att.absent || 0) + (att.on_leave || 0);
  const attPct = totalAtt > 0 ? Math.round((att.present / totalAtt) * 100) : 0;

  return (
    <div className="main-dashboard-container">
      {/* Stats */}
      <div className="stats-grid">
        <StatCard icon="fa-users"              colorClass="blue"   label="Total Employees"    value={data?.total_employees || 0} />
        <StatCard icon="fa-money-check-dollar" colorClass="green"  label="Monthly Payroll"    value={fmt(data?.payroll_summary?.total_net)} sub="Net disbursed" />
        <StatCard icon="fa-hourglass-half"     colorClass="orange" label="Pending Leaves"     value={data?.pending_leaves || 0} />
        <StatCard icon="fa-user-check"         colorClass="purple" label="Today's Attendance" value={`${attPct}%`} sub={`${att.present || 0} present`} />
      </div>

      {/* Row 2: 40/30/30 */}
      <div className="dashboard-row-2">
        {/* Department Distribution */}
        <div className="card dashboard-card">
          <div className="card-header">
            <span className="card-title"><i className="fa-solid fa-building" style={{ marginRight: 8, color: 'var(--accent-blue)' }} />Department Distribution</span>
          </div>
          <div className="card-body">
            {(data?.department_distribution || []).map((d, i) => {
              const maxCount = Math.max(...(data?.department_distribution || []).map(x => x.count));
              const pct = maxCount > 0 ? (d.count / maxCount) * 100 : 0;
              const colors = ['var(--accent-blue)', 'var(--accent-purple)', 'var(--accent-green)', 'var(--accent-orange)', 'var(--accent-teal)', 'var(--accent-pink)'];
              return (
                <div key={i} className="dept-bar-item">
                  <span className="dept-name">{d.department || 'Unassigned'}</span>
                  <div style={{ flex: 1, marginLeft: 12 }}>
                    <div className="progress-bar">
                      <div className="progress-fill" style={{ width: `${pct}%`, background: colors[i % colors.length] }} />
                    </div>
                  </div>
                  <span className="dept-count">{d.count}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Top Performer */}
        <div className="card dashboard-card" style={{ background: 'linear-gradient(135deg, rgba(79,142,247,0.08), rgba(139,92,246,0.06))' }}>
          <div className="card-header">
            <span className="card-title"><i className="fa-solid fa-crown" style={{ marginRight: 8, color: 'var(--accent-orange)' }} />Star Performer</span>
            <span className="badge badge-excellent">This Month</span>
          </div>
          <div className="card-body" style={{ textAlign: 'center', padding: '32px 24px' }}>
            {data?.top_scorer?.name !== 'N/A' ? (
              <>
                <div style={{
                  width: 72, height: 72, borderRadius: '50%',
                  background: 'linear-gradient(135deg, var(--accent-blue), var(--accent-purple))',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '1.8rem', fontWeight: 700, color: '#fff',
                  margin: '0 auto 16px', boxShadow: '0 8px 24px rgba(79,142,247,0.4)'
                }}>
                  {data.top_scorer.name.charAt(0)}
                </div>
                <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem', fontWeight: 700, marginBottom: 4 }}>
                  {data.top_scorer.name}
                </h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: 16 }}>{data.top_scorer.department}</p>
                <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'center', gap: 4 }}>
                  <span style={{ fontFamily: 'var(--font-display)', fontSize: '3rem', fontWeight: 800, color: 'var(--accent-blue)', lineHeight: 1 }}>
                    {data.top_scorer.score}
                  </span>
                  <span style={{ color: 'var(--text-muted)', fontSize: '1rem' }}>/100</span>
                </div>
              </>
            ) : (
              <div className="empty-state">
                <i className="fa-solid fa-star" />
                <p>No scores calculated yet</p>
              </div>
            )}
          </div>
        </div>

        {/* Attendance Breakdown */}
        <div className="card dashboard-card">
          <div className="card-header">
            <span className="card-title"><i className="fa-solid fa-calendar-day" style={{ marginRight: 8, color: 'var(--accent-green)' }} />Today's Breakdown</span>
          </div>
          <div className="card-body">
            {[
              { label: 'Present', val: att.present || 0, color: 'var(--accent-green)', icon: 'fa-user-check' },
              { label: 'Absent',  val: att.absent  || 0, color: 'var(--accent-red)',   icon: 'fa-user-xmark' },
              { label: 'On Leave',val: att.on_leave || 0, color: 'var(--accent-orange)', icon: 'fa-plane-departure' },
            ].map(item => (
              <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                <div style={{ width: 36, height: 36, borderRadius: '8px', background: `${item.color}22`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: item.color }}>
                  <i className={`fa-solid ${item.icon}`} />
                </div>
                <span style={{ color: 'var(--text-secondary)', flex: 1 }}>{item.label}</span>
                <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1.3rem', color: item.color }}>{item.val}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Row 3: 50/50 */}
      <div className="dashboard-row-3">
        {/* Quick Stats */}
        <div className="card dashboard-card">
          <div className="card-header">
            <span className="card-title"><i className="fa-solid fa-bolt" style={{ marginRight: 8, color: 'var(--accent-orange)' }} />Quick Stats</span>
          </div>
          <div className="card-body">
            {[
              { label: 'Gross Payroll', val: fmt(data?.payroll_summary?.total_gross), icon: 'fa-money-bill-wave', color: 'var(--accent-blue)' },
              { label: 'Total Deductions', val: fmt((data?.payroll_summary?.total_gross || 0) - (data?.payroll_summary?.total_net || 0)), icon: 'fa-minus-circle', color: 'var(--accent-red)' },
              { label: 'Approved Leaves', val: data?.leave_stats?.approved || 0, icon: 'fa-check-circle', color: 'var(--accent-green)' },
            ].map(item => (
              <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                <div style={{ width: 36, height: 36, borderRadius: '8px', background: `${item.color}22`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: item.color }}>
                  <i className={`fa-solid ${item.icon}`} />
                </div>
                <span style={{ color: 'var(--text-secondary)', flex: 1 }}>{item.label}</span>
                <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, color: 'var(--text-primary)' }}>{item.val}</span>
              </div>
            ))}
          </div>
        </div>

        {/* System Activity Widget */}
        <div className="card dashboard-card">
          <div className="card-header">
            <span className="card-title"><i className="fa-solid fa-clock-rotate-left" style={{ marginRight: 8, color: 'var(--accent-teal)' }} />System Activity</span>
          </div>
          <div className="card-body">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                <div style={{ width: 10, height: 10, borderRadius: '50%', background: 'var(--accent-blue)', marginTop: 6, boxShadow: '0 0 10px rgba(79,142,247,0.5)' }} />
                <div>
                  <p style={{ margin: 0, fontSize: '0.875rem', fontWeight: 500, color: 'var(--text-primary)' }}>Payroll approved for completion</p>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>2 hours ago by System Admin</span>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                <div style={{ width: 10, height: 10, borderRadius: '50%', background: 'var(--accent-orange)', marginTop: 6, boxShadow: '0 0 10px rgba(245,158,11,0.5)' }} />
                <div>
                  <p style={{ margin: 0, fontSize: '0.875rem', fontWeight: 500, color: 'var(--text-primary)' }}>12 new leave requests entered queue</p>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>5 hours ago</span>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                <div style={{ width: 10, height: 10, borderRadius: '50%', background: 'var(--accent-green)', marginTop: 6, boxShadow: '0 0 10px rgba(16,185,129,0.5)' }} />
                <div>
                  <p style={{ margin: 0, fontSize: '0.875rem', fontWeight: 500, color: 'var(--text-primary)' }}>AI evaluations complete for Engineering</p>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>1 day ago</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
