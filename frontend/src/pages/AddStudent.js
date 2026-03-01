import React, { useState, useRef, useEffect } from 'react';
import './AddStudent.css';
import { FaTimes } from 'react-icons/fa';
import api from '../utils/api';

const AddStudent = () => {
  const [enrolledCourses, setEnrolledCourses] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [allCourses, setAllCourses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const searchRef = useRef(null);

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
    dateOfBirth: '',
    nic: '',
    degreeProgram: '',
    year: '',
    semester: ''
  });

  // Fetch all courses from course service
  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const res = await api.get('/api/courses');
        setAllCourses(res.data);
      } catch (err) {
        console.error('Failed to load courses:', err);
      }
    };
    fetchCourses();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleReset = () => {
    setFormData({ firstName: '', lastName: '', email: '', phone: '', address: '', dateOfBirth: '', nic: '', degreeProgram: '', year: '', semester: '' });
    setEnrolledCourses([]);
    setSearchQuery('');
    setShowSearchResults(false);
    setSuccess('');
    setError('');
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowSearchResults(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearchChange = (e) => {
    const query = e.target.value;
    setSearchQuery(query);
    setShowSearchResults(query.length > 0);
  };

  const handleAddCourse = (course) => {
    const isAlreadyEnrolled = enrolledCourses.some(c => c.id === course.id);
    if (!isAlreadyEnrolled) {
      setEnrolledCourses([...enrolledCourses, course]);
      setSearchQuery('');
      setShowSearchResults(false);
    }
  };

  const handleDeleteCourse = (courseId) => {
    setEnrolledCourses(enrolledCourses.filter(c => c.id !== courseId));
  };

  const getFilteredCourses = () => {
    if (!searchQuery) return [];
    const enrolledIds = enrolledCourses.map(c => c.id);
    return allCourses
      .filter(course => !enrolledIds.includes(course.id))
      .filter(course =>
        course.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        course.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
  };

  const filteredCourses = getFilteredCourses();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!formData.firstName || !formData.lastName || !formData.email || !formData.phone || !formData.address || !formData.degreeProgram || !formData.year || !formData.semester) {
      setError('Please fill in all required fields.');
      return;
    }

    setLoading(true);
    try {
      // 1. Register student
      const studentRes = await api.post('/api/students', {
        first_name: formData.firstName,
        last_name: formData.lastName,
        email: formData.email,
        phone: formData.phone,
        address: formData.address,
        nic: formData.nic,
        date_of_birth: formData.dateOfBirth || null,
        degree_program: formData.degreeProgram,
        academic_year: formData.year,
        semester: formData.semester,
      });

      const studentNumber = studentRes.data.student_number;

      // 2. Enroll in selected courses
      for (const course of enrolledCourses) {
        try {
          await api.post('/api/enrollments', {
            student_number: studentNumber,
            course_id: course.id,
            course_code: course.code,
            course_name: course.name,
            credits: course.credits || 3,
            academic_year: formData.year,
            semester: formData.semester,
          });
        } catch (enrollErr) {
          console.warn('Enrollment error for course:', course.code, enrollErr.message);
        }
      }

      setSuccess(`Student registered successfully! Student Number: ${studentNumber}`);
      handleReset();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to register student. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="add-student-container">
      <div className="add-student-header">
        <h2>Add New Student</h2>
        <p>Fill in the student information below</p>
      </div>

      {success && (
        <div style={{ background: '#d4edda', color: '#155724', padding: '12px 16px', borderRadius: '8px', marginBottom: '16px', fontWeight: '600' }}>
          {success}
        </div>
      )}
      {error && (
        <div style={{ background: '#f8d7da', color: '#721c24', padding: '12px 16px', borderRadius: '8px', marginBottom: '16px' }}>
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="form-section">
          <h3>Personal Information</h3>
          <div className="form-row">
            <div className="form-group">
              <label>First Name *</label>
              <input type="text" name="firstName" value={formData.firstName} onChange={handleInputChange} placeholder="Enter first name" />
            </div>
            <div className="form-group">
              <label>Last Name *</label>
              <input type="text" name="lastName" value={formData.lastName} onChange={handleInputChange} placeholder="Enter last name" />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Email *</label>
              <input type="email" name="email" value={formData.email} onChange={handleInputChange} placeholder="student@kdu.ac.lk" />
            </div>
            <div className="form-group">
              <label>Phone *</label>
              <input type="text" name="phone" value={formData.phone} onChange={handleInputChange} placeholder="Enter phone number" />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group full-width">
              <label>Address *</label>
              <input type="text" name="address" value={formData.address} onChange={handleInputChange} placeholder="Enter full address" />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Date Of Birth</label>
              <input type="date" name="dateOfBirth" value={formData.dateOfBirth} onChange={handleInputChange} />
            </div>
            <div className="form-group">
              <label>NIC Number</label>
              <input type="text" name="nic" value={formData.nic} onChange={handleInputChange} placeholder="e.g., 200352401278" />
            </div>
          </div>
        </div>

        <div className="form-section">
          <h3>Academic Information</h3>
          <div className="form-row">
            <div className="form-group full-width">
              <label>Degree Program *</label>
              <select name="degreeProgram" value={formData.degreeProgram} onChange={handleInputChange} className="placeholder-select">
                <option value="" disabled>Select degree program</option>
                <option value="Software Engineering">Software Engineering</option>
                <option value="Computer Science">Computer Science</option>
                <option value="Information Technology">Information Technology</option>
                <option value="Information System">Information System</option>
              </select>
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Year *</label>
              <select name="year" value={formData.year} onChange={handleInputChange} className="placeholder-select">
                <option value="" disabled>Select academic year</option>
                <option value="Year 1">Year 1 (1st Year)</option>
                <option value="Year 2">Year 2 (2nd Year)</option>
                <option value="Year 3">Year 3 (3rd Year)</option>
                <option value="Year 4">Year 4 (4th Year)</option>
              </select>
            </div>
            <div className="form-group">
              <label>Semester *</label>
              <select name="semester" value={formData.semester} onChange={handleInputChange} className="placeholder-select">
                <option value="" disabled>Select semester</option>
                {[1, 2, 3, 4, 5, 6, 7, 8].map(n => (
                  <option key={n} value={`Semester ${n}`}>Semester {n}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="form-row">
            <div className="form-group full-width">
              <label>Enrolled Courses</label>
              <div className="course-search-container" ref={searchRef}>
                <input
                  type="text"
                  className="course-search-input"
                  placeholder="Search courses by code or name..."
                  value={searchQuery}
                  onChange={handleSearchChange}
                  onFocus={() => searchQuery && setShowSearchResults(true)}
                />
                {showSearchResults && (
                  <div className="search-results-dropdown">
                    {filteredCourses.length > 0 ? (
                      filteredCourses.map(course => (
                        <div key={course.id} className="search-result-item" onClick={() => handleAddCourse(course)}>
                          <div className="search-result-info">
                            <p className="course-code">{course.code}</p>
                            <p className="course-name">{course.name}</p>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="no-results">
                        {searchQuery ? 'No courses found' : 'Start typing to search courses'}
                      </div>
                    )}
                  </div>
                )}
              </div>
              {enrolledCourses.length > 0 && (
                <div className="selected-courses-list">
                  {enrolledCourses.map(course => (
                    <div key={course.id} className="selected-course-item">
                      <div className="selected-course-info">
                        <span className="selected-course-code">{course.code}</span>
                        <span className="selected-course-name">{course.name}</span>
                      </div>
                      <button type="button" className="delete-selected-course-btn" onClick={() => handleDeleteCourse(course.id)} title="Remove course">
                        <FaTimes />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="form-actions">
          <button type="button" className="reset-btn" onClick={handleReset}>Reset</button>
          <button type="submit" className="register-btn" disabled={loading}>
            {loading ? 'Registering...' : 'Register Student'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AddStudent;
