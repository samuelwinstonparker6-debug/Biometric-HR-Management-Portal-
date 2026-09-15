export default function StatCard({ icon, iconClass, label, value, sub, colorClass }) {
  return (
    <div className={`stat-card ${colorClass}`}>
      <div className={`stat-icon ${colorClass}`}>
        <i className={`fa-solid ${icon}`} />
      </div>
      <div className="stat-info">
        <div className="stat-label">{label}</div>
        <div className="stat-value">{value}</div>
        {sub && <div className="stat-sub">{sub}</div>}
      </div>
    </div>
  );
}
