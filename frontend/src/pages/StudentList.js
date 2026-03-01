import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import './StudentList.css';
import { FaEye, FaPen, FaTrash } from 'react-icons/fa';
import api from '../utils/api';

const StudentList = () => {
  const location = useLocation();
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchFilter, setSearchFilter] = useState('');
  const [error, setError] = useState('');

  const fetchStudents = async (search = '') => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/api/students', { params: search ? { search } : {} });
      setStudents(res.data);
    } catch (err) {
      setError('Failed to load students. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const term = location.state?.searchTerm || '';
    setSearchFilter(term);
    fetchStudents(term);
  }, [location.state]);

  const handleDelete = async (studentNumber, studentName) => {
    const confirmDelete = window.confirm(
      `Are you sure you want to delete ${studentName} (${studentNumber})? This action cannot be undone.`
    );
    if (!confirmDelete) return;

    try {
      await api.delete(`/api/students/${encodeURIComponent(studentNumber)}`);
      setStudents(prev => prev.filter(s => s.student_number !== studentNumber));
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete student.');
    }
  };

  const handleSearch = (e) => {
    setSearchFilter(e.target.value);
  };

  const filteredStudents = students.filter(student =>
    !searchFilter ||
    `${student.first_name} ${student.last_name}`.toLowerCase().includes(searchFilter.toLowerCase()) ||
    student.student_number.toLowerCase().includes(searchFilter.toLowerCase())
  );

  return (
    <div className="student-list-container">
      <div className="student-list-header">
        <h2>Student List</h2>
        <p>Manage all registered students</p>
      </div>
      <div className="student-list-card">
        <div className="card-title">
          <h3>All Students ({filteredStudents.length})</h3>
          {searchFilter && (
            <p className="search-info">
              Showing results for: <strong>"{searchFilter}"</strong>
              <button onClick={() => { setSearchFilter(''); fetchStudents(''); }} className="clear-search">Clear</button>
            </p>
          )}
        </div>
        {error && <p style={{ color: 'red', padding: '10px' }}>{error}</p>}
        {loading ? (
          <p style={{ padding: '20px', textAlign: 'center' }}>Loading students...</p>
        ) : (
          <table className="student-table">
            <thead>
              <tr>
                <th>Student Number</th>
                <th>Name</th>
                <th>Degree Program</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredStudents.map((student) => (
                <tr key={student.student_number}>
                  <td>{student.student_number}</td>
                  <td>{student.first_name} {student.last_name}</td>
                  <td>{student.degree_program}</td>
                  <td className="actions-cell">
                    <div className="action-icons">
                      <Link to={`/student/${encodeURIComponent(student.student_number)}`}><FaEye /></Link>
                      <Link to={`/student/${encodeURIComponent(student.student_number)}`} state={{ editMode: true }}><FaPen /></Link>
                      <FaTrash
                        onClick={() => handleDelete(student.student_number, `${student.first_name} ${student.last_name}`)}
                        style={{ cursor: 'pointer' }}
                      />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {!loading && filteredStudents.length === 0 && (
          <div className="no-results">
            <p>No students found{searchFilter ? ` matching "${searchFilter}"` : ''}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentList;
