import { NavLink, useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';

const NAV_MAIN = [
  { to: '/',           icon: 'fa-chart-pie',            label: 'Dashboard'   },
  { to: '/employees',  icon: 'fa-users',                label: 'Employees'   },
  { to: '/attendance', icon: 'fa-calendar-check',       label: 'Attendance'  },
  { to: '/leave',      icon: 'fa-plane-departure',      label: 'Leave'       },
  { to: '/payroll',    icon: 'fa-file-invoice-dollar',  label: 'Payroll'     },
  { to: '/scores',     icon: 'fa-star',                 label: 'Scores'      },
  { to: '/reports',    icon: 'fa-chart-bar',            label: 'Reports'     },
];

export default function Sidebar() {
  const { user, signOut } = useApp();
  const navigate = useNavigate();

  function handleLogout() {
    signOut();
    navigate('/login');
  }

  return (
    <aside className="sidebar">
      {/* Logo */}
      <div className="sidebar-header">
        <div className="logo-mark"><i className="fa-solid fa-layer-group" /></div>
        <div>
          <div className="logo-text">NexGen HR</div>
          <div className="logo-sub">Payroll Management</div>
        </div>
      </div>

      {/* User info */}
      <div className="sidebar-user">
        <div className="user-avatar">{user?.full_name?.charAt(0) || 'A'}</div>
        <div>
          <div className="user-name">{user?.full_name || 'Admin'}</div>
          <div className="user-role">{user?.role || 'Administrator'}</div>
        </div>
      </div>

      {/* Main Nav */}
      <div className="nav-section">
        <div className="nav-label">Main Menu</div>
        {NAV_MAIN.map(n => (
          <NavLink
            key={n.to}
            to={n.to}
            end={n.to === '/'}
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
          >
            <span className="nav-item-icon"><i className={`fa-solid ${n.icon}`} /></span>
            <span>{n.label}</span>
          </NavLink>
        ))}
      </div>

      {/* AI Section */}
      <div className="nav-section" style={{ marginTop: '8px' }}>
        <div className="nav-label">AI Tools</div>
        <NavLink
          to="/assistant"
          className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
        >
          <span className="nav-item-icon"><i className="fa-solid fa-robot" /></span>
          <span>RAPY AI</span>
          <span className="nav-badge">AI</span>
        </NavLink>
      </div>

      {/* Footer */}
      <div className="sidebar-footer">
        <button className="nav-item danger" onClick={handleLogout}>
          <span className="nav-item-icon"><i className="fa-solid fa-arrow-right-from-bracket" /></span>
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
}
