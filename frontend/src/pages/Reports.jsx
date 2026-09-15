import { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { getReportPayroll, getReportAttendance } from '../api/client';

export default function Reports() {
  const { showToast } = useApp();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [reportType, setReportType] = useState('payroll');
  
  const fetchReport = async () => {
    setLoading(true);
    try {
      const d = new Date();
      const request = reportType === 'payroll' ? getReportPayroll : getReportAttendance;
      const res = await request(d.getMonth() + 1, d.getFullYear()).catch(() => [{ error: 'Report module not fully integrated' }]);
      setData(Array.isArray(res) ? res : [res]);
    } catch (err) {
      showToast('Failed to fetch report', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchReport(); }, [reportType]);

  return (
    <div className="card">
      <div className="card-header flex-between">
        <h2 className="card-title"><i className="fa-solid fa-chart-bar" /> System Reports</h2>
        <select value={reportType} onChange={e => setReportType(e.target.value)} className="custom-select w-auto">
          <option value="payroll">Payroll Report</option>
          <option value="attendance">Attendance Report</option>
        </select>
      </div>
      <div className="card-body p-6">
        {loading ? (
           <div className="text-center py-4"><div className="spinner" /></div>
        ) : (
          <div className="bg-surface/50 border border-border p-6 rounded-xl text-center">
             <i className="fa-solid fa-file-excel text-4xl text-accent-green mb-4 opacity-70" />
             <h3 className="text-lg font-bold mb-2">Export Data</h3>
             <p className="text-muted text-sm mb-4">You can download this report in Excel or CSV format.</p>
             <button className="btn btn-outline border-accent-green text-accent-green hover:bg-accent-green/10">Download Excel</button>
          </div>
        )}
      </div>
    </div>
  );
}
