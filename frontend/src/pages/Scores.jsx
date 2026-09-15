import { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { getScores } from '../api/client';

export default function Scores() {
  const { showToast } = useApp();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear]   = useState(new Date().getFullYear());

  const fetchScores = async () => {
    setLoading(true);
    try {
      const res = await getScores(month, year);
      setData(res);
    } catch (err) {
      showToast(err.message || 'Failed to fetch scores', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchScores(); }, [month, year]);

  return (
    <div className="card">
      <div className="card-header flex-between">
        <h2 className="card-title"><i className="fa-solid fa-star" /> AI Performance Scores</h2>
        <div className="filter-group">
          <select value={month} onChange={e => setMonth(e.target.value)} className="custom-select w-auto">
            {Array.from({length:12}, (_, i) => i+1).map(m => (
              <option key={m} value={m}>{new Date(2000, m-1).toLocaleString('default', { month: 'long' })}</option>
            ))}
          </select>
          <select value={year} onChange={e => setYear(e.target.value)} className="custom-select w-auto">
            {[2023, 2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
      </div>
      <div className="card-body p-0">
        <div className="table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>Rank</th>
                <th>Employee</th>
                <th>Attendance</th>
                <th>Work Hours</th>
                <th>Total Score</th>
                <th>Category</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="6" className="text-center py-4"><div className="spinner" /></td></tr>
              ) : data.length === 0 ? (
                <tr><td colSpan="6" className="text-center py-4 text-muted">No scores available</td></tr>
              ) : (
                data.map((s, i) => (
                  <tr key={s.score_id}>
                    <td>#{i + 1}</td>
                    <td>
                      <div className="font-medium">{s.full_name}</div>
                      <div className="text-xs text-muted">{s.department}</div>
                    </td>
                    <td>{s.attendance_score}/40</td>
                    <td>{s.work_hours_score}/25</td>
                    <td className="font-bold text-accent-blue">{s.total_score}/100</td>
                    <td>
                      <span className={`badge badge-${s.category.toLowerCase()}`}>{s.category}</span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
