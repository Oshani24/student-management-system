import React, { useState } from 'react';
import './AuditLogs.css';
import api from '../utils/api';

const AuditLogs = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetched, setFetched] = useState(false);
  const [selectedAction, setSelectedAction] = useState('All Actions');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const params = {};
      if (selectedAction !== 'All Actions') params.actionType = selectedAction;
      if (fromDate) params.fromDate = fromDate;
      if (toDate) params.toDate = toDate;
      const res = await api.get('/api/audit', { params });
      setLogs(res.data);
      setFetched(true);
    } catch (err) {
      console.error('Failed to fetch audit logs:', err);
    } finally {
      setLoading(false);
    }
  };

  // Auto-fetch on mount and when filters change
  React.useEffect(() => { fetchLogs(); }, []); // eslint-disable-line

  const applyFilters = () => fetchLogs();

  const formatDateTime = (dateTimeString) => {
    const d = new Date(dateTimeString);
    const date = d.toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' });
    const time = d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    return { date, time };
  };

  return (
    <div className="audit-logs-container">
      <div className="audit-logs-header">
        <h2>Audit Logs</h2>
        <p>Track all administrative activities</p>
      </div>
      <div className="audit-logs-content">
        <div className="filters">
          <select value={selectedAction} onChange={(e) => setSelectedAction(e.target.value)}>
            <option>All Actions</option>
            <option>Create</option>
            <option>Update</option>
            <option>Delete</option>
            <option>Enrollment</option>
            <option>Login</option>
            <option>Logout</option>
          </select>
          <input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
          <span>to</span>
          <input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} />
          <button onClick={applyFilters} style={{ padding: '6px 16px', cursor: 'pointer', background: '#1a237e', color: '#fff', border: 'none', borderRadius: '6px' }}>
            Apply
          </button>
        </div>
        {loading ? (
          <p style={{ padding: '20px', textAlign: 'center' }}>Loading logs...</p>
        ) : (
          <table className="logs-table">
            <thead>
              <tr>
                <th>Date & Time</th>
                <th>Student Number / Course Code</th>
                <th>Student Name / Course Name</th>
                <th>Action</th>
                <th>Type</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => {
                const { date, time } = formatDateTime(log.created_at);
                return (
                  <tr key={log.id}>
                    <td>{date}<br />{time}</td>
                    <td>{log.entity_id || '-'}</td>
                    <td>{log.entity_name || '-'}</td>
                    <td>{log.action}</td>
                    <td>{log.action_type}</td>
                  </tr>
                );
              })}
              {!loading && fetched && logs.length === 0 && (
                <tr><td colSpan={5} style={{ textAlign: 'center', padding: '20px' }}>No audit logs found.</td></tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default AuditLogs;
