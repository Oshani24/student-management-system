import React, { useState, useEffect } from 'react';
import './AdminProfileModal.css';

const AdminProfileModal = ({ isOpen, onClose }) => {
  const [adminData, setAdminData] = useState(null);

  useEffect(() => {
    if (isOpen) {
      // Get admin data from localStorage
      const storedAdmin = localStorage.getItem('admin');
      if (storedAdmin) {
        try {
          const parsedAdmin = JSON.parse(storedAdmin);
          setAdminData(parsedAdmin);
        } catch (err) {
          console.error('Failed to parse admin data:', err);
        }
      }
    }
  }, [isOpen]);

  if (!isOpen) {
    return null;
  }

  const formatDate = (dateString) => {
    if (!dateString) return 'Never';
    try {
      const date = new Date(dateString);
      return date.toLocaleString('en-US', { 
        year: 'numeric', 
        month: '2-digit', 
        day: '2-digit', 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: true 
      });
    } catch (err) {
      return 'N/A';
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Admin Profile</h2>
          <button onClick={onClose} className="close-button">&times;</button>
        </div>
        <p>View and manage your administrator account information</p>
        
        <div className="profile-info">
          <div className="info-group">
            <label>Full Name</label>
            <div className="info-value">{adminData?.full_name || 'N/A'}</div>
          </div>

          <div className="info-group">
            <label>Username</label>
            <div className="info-value">{adminData?.username || 'N/A'}</div>
          </div>

          <div className="info-group">
            <label>Email Address</label>
            <div className="info-value">{adminData?.email || 'N/A'}</div>
          </div>

          <div className="info-group">
            <label>Last Login</label>
            <div className="info-value">{formatDate(adminData?.last_login)}</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminProfileModal;
