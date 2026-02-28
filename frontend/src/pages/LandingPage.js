import React from 'react';
import { Link } from 'react-router-dom';
import './LandingPage.css';
import logo from '../assets/logo.png';
 // Assuming you have the logo in your assets folder

const LandingPage = () => {
  return (
    <div className="landing-page">
      <header className="landing-header">
        <img src={logo} alt="KDU Logo" className="landing-logo" />
        <div className="header-text">
          <h2>General Sir John Kotelawala Defence University</h2>
          <p>Department of Software Engineering</p>
        </div>
      </header>
      <main className="landing-main">
        <img src={logo} alt="KDU Logo" className="main-logo" />
        <h1>Student Management System</h1>
        <h2>Registration Module</h2>
        <p className="description">
          A comprehensive platform for managing student registration, course enrollment, and
          academic records for the Department of Software Engineering.
        </p>
        <Link to="/login" className="login-button">
          Administrator Login
        </Link>
      </main>
      <footer className="landing-footer">
        <p>General Sir John Kotelawala Defence University - Department of Software Engineering</p>
        <p>© 2026 KDU. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default LandingPage;
