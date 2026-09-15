import { useState } from 'react';
import { markQueryStatus } from '../api/client';

export default function QueriesModal({ queries, onClose, onRefresh }) {
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState(null);

  const handleStatusChange = async (id, status) => {
    setLoading(true);
    try {
      await markQueryStatus(id, status);
      await onRefresh();
      setSelected(null); // Go back to list
    } catch (err) {
      alert("Failed to update status");
    } finally {
      setLoading(false);
    }
  };

  const statusBadge = (s) => {
    if (s === 'unread') return <span className="badge" style={{ background: 'var(--danger)', color: '#fff' }}>New</span>;
    if (s === 'read') return <span className="badge" style={{ background: 'var(--warning)', color: '#000' }}>In Review</span>;
    return <span className="badge" style={{ background: 'var(--success)', color: '#fff' }}>Resolved</span>;
  };

  return (
    <div className="modal active" onClick={onClose}>
      <div className="modal-dialog" style={{ maxWidth: '600px', background: 'var(--bg-panel)', border: '1px solid var(--glass-border)' }} onClick={e => e.stopPropagation()}>
        
        <div className="modal-header">
          <h3><i className="fa-solid fa-inbox text-accent-blue mr-2" /> Employee Inbox</h3>
          <button className="close-modal" onClick={onClose}><i className="fa-solid fa-xmark" /></button>
        </div>

        <div className="modal-body" style={{ minHeight: '300px', padding: '0' }}>
          {selected ? (
            <div style={{ padding: '24px' }}>
              <button 
                onClick={() => setSelected(null)} 
                className="btn btn-outline btn-sm mb-4"
              >
                <i className="fa-solid fa-arrow-left" /> Back to List
              </button>
              
              <div style={{ background: 'rgba(255,255,255,0.05)', padding: '20px', borderRadius: '12px' }}>
                <div className="flex-between mb-3">
                  <h4 style={{ fontSize: '1.2rem', color: 'var(--accent-purple)' }}>{selected.subject}</h4>
                  {statusBadge(selected.status)}
                </div>
                <div style={{ display: 'flex', gap: '15px', color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '20px', borderBottom: '1px solid var(--glass-border-light)', paddingBottom: '15px' }}>
                  <span><i className="fa-solid fa-user mr-1" /> {selected.employee_name || 'Anonymous Employee'}</span>
                  <span><i className="fa-regular fa-clock mr-1" /> {new Date(selected.submitted_on).toLocaleDateString()}</span>
                </div>
                <p style={{ lineHeight: '1.6', color: 'white' }}>{selected.message}</p>
                
                <div style={{ marginTop: '30px', display: 'flex', gap: '10px' }}>
                  {selected.status !== 'resolved' && (
                    <button 
                      className="btn btn-primary" 
                      onClick={() => handleStatusChange(selected.query_id, 'resolved')}
                      disabled={loading}
                    >
                      <i className="fa-solid fa-check" /> Mark as Resolved
                    </button>
                  )}
                  {selected.status === 'unread' && (
                    <button 
                      className="btn btn-outline" 
                      onClick={() => handleStatusChange(selected.query_id, 'read')}
                      disabled={loading}
                    >
                      Mark as Read
                    </button>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div style={{ padding: '16px' }}>
              {queries.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '50px 20px', color: 'var(--text-muted)' }}>
                  <i className="fa-solid fa-inbox mb-3" style={{ fontSize: '3rem', opacity: 0.5 }} />
                  <p>You have no employee queries.</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {queries.map(q => (
                    <div 
                      key={q.query_id} 
                      onClick={() => {
                        setSelected(q);
                        if (q.status === 'unread') handleStatusChange(q.query_id, 'read');
                      }}
                      style={{ 
                        padding: '16px', 
                        background: q.status === 'unread' ? 'rgba(92, 111, 255, 0.1)' : 'transparent',
                        border: '1px solid var(--glass-border-light)',
                        borderLeft: q.status === 'unread' ? '3px solid var(--primary-color)' : '1px solid var(--glass-border-light)',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                      }}
                      onMouseOver={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                      onMouseOut={e => e.currentTarget.style.background = q.status === 'unread' ? 'rgba(92, 111, 255, 0.1)' : 'transparent'}
                    >
                      <div className="flex-between mb-2">
                        <strong style={{ color: q.status === 'unread' ? 'white' : 'var(--text-secondary)' }}>{q.subject}</strong>
                        {statusBadge(q.status)}
                      </div>
                      <div className="flex-between" style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        <span>{q.employee_name || 'Anonymous Employee'}</span>
                        <span>{new Date(q.submitted_on).toLocaleDateString()}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
