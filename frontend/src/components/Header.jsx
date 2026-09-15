import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { getQueries } from '../api/client';
import QueriesModal from './QueriesModal';

const PAGE_TITLES = {
  '/':           { title: 'Dashboard',         sub: 'Overview & stats' },
  '/employees':  { title: 'Employees',         sub: 'Manage your workforce' },
  '/attendance': { title: 'Attendance',        sub: 'Daily check-in tracking' },
  '/leave':      { title: 'Leave Management',  sub: 'Time-off requests & approvals' },
  '/payroll':    { title: 'Payroll',           sub: 'Salary processing & payslips' },
  '/scores':     { title: 'Performance Scores',sub: 'AI-assisted employee evaluations' },
  '/reports':    { title: 'Reports',           sub: 'Analytics & summaries' },
  '/assistant':  { title: 'HR Assistant',      sub: 'Ask anything about your team' },
};

export default function Header() {
  const { pathname } = useLocation();
  const page = PAGE_TITLES[pathname] || { title: 'NexGen HR', sub: '' };
  
  const [queries, setQueries] = useState([]);
  const [showModal, setShowModal] = useState(false);
  
  const fetchQueries = () => {
    getQueries().then(setQueries).catch(console.error);
  };

  useEffect(() => {
    fetchQueries();
    const interval = setInterval(fetchQueries, 60000); // Poll every 60s
    return () => clearInterval(interval);
  }, []);

  const unreadCount = queries.filter(q => q.status === 'unread').length;

  return (
    <>
      <header className="top-header">
        <div>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '2px' }}>
            {page.title}
          </h2>
          {page.sub && (
            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{page.sub}</p>
          )}
        </div>
        <div className="header-actions">
          <button className="icon-btn" title="Employee Inbox" onClick={() => setShowModal(true)}>
            <i className="fa-solid fa-inbox" />
            {unreadCount > 0 && (
              <span className="notif-dot" style={{
                position: 'absolute', top: 4, right: 6, width: 10, height: 10, 
                background: 'var(--danger)', borderRadius: '50%', border: '2px solid var(--bg-main)'
              }} />
            )}
          </button>
          <button className="icon-btn" title="Notifications">
            <i className="fa-solid fa-bell" />
          </button>
          <button className="icon-btn" title="Settings">
            <i className="fa-solid fa-gear" />
          </button>
        </div>
      </header>
      
      {showModal && (
        <QueriesModal 
          queries={queries} 
          onClose={() => setShowModal(false)} 
          onRefresh={fetchQueries} 
        />
      )}
    </>
  );
}
