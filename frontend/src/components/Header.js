import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaSearch, FaUserCircle } from 'react-icons/fa';
import './Header.css';
import AdminProfileModal from './AdminProfileModal';

const Header = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const navigate = useNavigate();

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      navigate('/student-list', { state: { searchTerm: searchTerm.trim() } });
      setSearchTerm('');
    }
  };

  const admin = JSON.parse(localStorage.getItem('admin') || '{}');

  return (
    <header className="header">
      <div className="header-left">
        <h2>Student Management</h2>
      </div>
      <div className="header-center">
        <form onSubmit={handleSearch} className="search-form">
          <div className="search-container">
            <FaSearch className="search-icon" />
            <input
              type="text"
              placeholder="Search by Student ID or Name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>
        </form>
      </div>
      <div className="header-right">
        <div className="admin-profile" onClick={() => setIsProfileModalOpen(true)}>
          <FaUserCircle />
          <span>{admin.full_name || 'Administrator'}</span>
        </div>
      </div>
      <AdminProfileModal isOpen={isProfileModalOpen} onClose={() => setIsProfileModalOpen(false)} />
    </header>
  );
};

export default Header;
