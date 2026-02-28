import React, { useState, useEffect } from 'react';
import { FaUserFriends, FaBookOpen } from 'react-icons/fa';
import './Dashboard.css';
import api from '../utils/api';

const Dashboard = () => {
  const [stats, setStats] = useState({ totalStudents: 0, totalCourses: 0, byDegree: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [studentsRes, coursesRes] = await Promise.all([
          api.get('/api/students/stats/count'),
          api.get('/api/courses/stats/count'),
        ]);
        setStats({
          totalStudents: studentsRes.data.total || 0,
          totalCourses: coursesRes.data.total || 0,
          byDegree: studentsRes.data.by_degree || [],
        });
      } catch (err) {
        console.error('Failed to load dashboard stats:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  const getDegreeCount = (program) => {
    const found = stats.byDegree.find(d => d.degree_program === program);
    return found ? found.count : 0;
  };

  const maxCount = Math.max(...stats.byDegree.map(d => d.count), 1);
  const getWidth = (count) => `${Math.max((count / maxCount) * 100, 5)}%`;

  return (
    <main className="dashboard">
      <div className="welcome-banner">
        <h2>Welcome back, Administrator!</h2>
        <p>Here's what's happening with your student management system today.</p>
      </div>
      <div className="stats-cards">
        <div className="card">
          <div className="card-info">
            <p>Total Students</p>
            <h3>{loading ? '...' : stats.totalStudents.toLocaleString()}</h3>
          </div>
          <div className="card-icon students-icon">
            <FaUserFriends />
          </div>
        </div>
        <div className="card">
          <div className="card-info">
            <p>Total Courses</p>
            <h3>{loading ? '...' : stats.totalCourses.toLocaleString()}</h3>
          </div>
          <div className="card-icon courses-icon">
            <FaBookOpen />
          </div>
        </div>
      </div>
      <div className="enrollment-overview">
        <h3>Enrollment Overview</h3>
        <ul>
          {[
            { name: 'Software Engineering', key: 'Software Engineering', css: 'se' },
            { name: 'Computer Science', key: 'Computer Science', css: 'cs' },
            { name: 'Information Technology', key: 'Information Technology', css: 'it' },
            { name: 'Information System', key: 'Information System', css: 'is' },
          ].map(deg => {
            const count = getDegreeCount(deg.key);
            return (
              <li key={deg.key}>
                <span className="degree-name">{deg.name}</span>
                <div className="progress-bar">
                  <div className={`progress ${deg.css}`} style={{ width: loading ? '0%' : getWidth(count) }}></div>
                </div>
                <span className="student-count">{loading ? '...' : count}</span>
              </li>
            );
          })}
        </ul>
      </div>
    </main>
  );
};

export default Dashboard;
