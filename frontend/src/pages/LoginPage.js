import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './LoginPage.css';
import logo from '../assets/logo.png';
import { FaEye, FaEyeSlash } from 'react-icons/fa';
import api from '../utils/api';

const LoginPage = () => {
  const [passwordShown, setPasswordShown] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const togglePasswordVisibility = () => setPasswordShown(!passwordShown);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    if (!username || !password) {
      setError('Please enter both username and password.');
      return;
    }
    setLoading(true);
    try {
      const res = await api.post('/api/auth/login', { username, password });
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('admin', JSON.stringify(res.data.admin));
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-header">
        <img src={logo} alt="KDU Logo" className="login-logo-header" />
        <h2>General Sir John Kotelawala Defence University</h2>
        <p>Department of Software Engineering</p>
      </div>
      <div className="login-box">
        <h3>Admin Login</h3>
        <p className="login-prompt">Enter your credentials to access the system</p>
        {error && <p className="login-error" style={{ color: 'red', marginBottom: '10px' }}>{error}</p>}
        <form onSubmit={handleLogin}>
          <div className="input-group">
            <label>Username</label>
            <input
              type="text"
              placeholder="Enter your username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>
          <div className="input-group">
            <label>Password</label>
            <div className="password-wrapper">
              <input
                type={passwordShown ? 'text' : 'password'}
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <span onClick={togglePasswordVisibility} className="password-icon">
                {passwordShown ? <FaEyeSlash /> : <FaEye />}
              </span>
            </div>
          </div>
          <button type="submit" className="sign-in-button" disabled={loading}>
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default LoginPage;
