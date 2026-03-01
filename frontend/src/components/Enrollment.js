import React, { useState, useEffect, useRef } from 'react';
import './Enrollment.css';
import { FaTimes } from 'react-icons/fa';
import api from '../utils/api';

const Enrollment = ({ isEditing, onAddToHistory, enrolledCourses, setEnrolledCourses, studentNumber }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const coursesBeforeEdit = useRef([]);
  const wasEditing = useRef(false);
  const searchRef = useRef(null);

  useEffect(() => {
    if (isEditing && !wasEditing.current) {
      coursesBeforeEdit.current = [...enrolledCourses];
      setSearchQuery('');
      setShowSearchResults(false);
    } else if (!isEditing && !wasEditing.current) {
      // Update the snapshot when not editing and courses change (after save)
      coursesBeforeEdit.current = [...enrolledCourses];
    }
    wasEditing.current = isEditing;
  }, [isEditing, enrolledCourses]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) setShowSearchResults(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch courses from API when typing
  useEffect(() => {
    if (!searchQuery || searchQuery.length < 1) { setSearchResults([]); return; }
    const timeout = setTimeout(async () => {
      try {
        const res = await api.get('/api/courses', { params: { search: searchQuery } });
        const enrolledIds = enrolledCourses.map(c => c.id);
        setSearchResults(res.data.filter(c => !enrolledIds.includes(c.id)));
      } catch (err) {
        console.error('Course search error:', err);
      }
    }, 300);
    return () => clearTimeout(timeout);
  }, [searchQuery, enrolledCourses]);

  const handleDeleteCourse = async (course, e) => {
    e.stopPropagation();
    if (course.dbId) {
      try {
        await api.delete(`/api/enrollments/${course.dbId}`);
      } catch (err) {
        console.error('Failed to remove enrollment:', err);
      }
    }
    setEnrolledCourses(enrolledCourses.filter(c => c.id !== course.id));
  };

  const handleAddCourse = async (course) => {
    const isAlreadyEnrolled = enrolledCourses.some(c => c.id === course.id);
    if (isAlreadyEnrolled) return;

    try {
      if (studentNumber) {
        await api.post('/api/enrollments', {
          student_number: studentNumber,
          course_id: course.id,
          course_code: course.code,
          course_name: course.name,
          credits: course.credits || 3,
        });
      }
      setEnrolledCourses([...enrolledCourses, { id: course.id, code: course.code, name: course.name, credits: course.credits }]);
      setSearchQuery('');
      setShowSearchResults(false);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to enroll in course.');
    }
  };

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
    setShowSearchResults(e.target.value.length > 0);
  };

  const handleAddToHistory = () => {
    if (enrolledCourses.length === 0) { alert('No courses to add to history.'); return; }
    const confirmAdd = window.confirm(
      `Are you sure you want to add ${enrolledCourses.length} course${enrolledCourses.length > 1 ? 's' : ''} to course history?\n\nThis will:\n• Move all current courses to history\n• Clear your currently enrolled courses\n• Advance to the next semester\n\nThis action cannot be undone.`
    );
    if (confirmAdd && onAddToHistory) onAddToHistory(enrolledCourses);
  };

  return (
    <>
      {isEditing && (
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
              {searchResults.length > 0 ? (
                searchResults.map(course => (
                  <div key={course.id} className="search-result-item" onClick={() => handleAddCourse(course)}>
                    <div className="search-result-info">
                      <p className="course-code">{course.code}</p>
                      <p className="course-name">{course.name}</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="no-results">{searchQuery ? 'No courses found' : 'Start typing to search'}</div>
              )}
            </div>
          )}
        </div>
      )}

      <div className="enrolled-courses-list">
        {enrolledCourses.length > 0 ? (
          enrolledCourses.map(course => (
            <div key={course.id} className="course-card">
              <div className="course-info">
                <p className="course-code">{course.code}</p>
                <p className="course-name">{course.name}</p>
              </div>
              {isEditing && (
                <button className="delete-course-btn" onClick={(e) => handleDeleteCourse(course, e)} title="Delete course">
                  <FaTimes />
                </button>
              )}
            </div>
          ))
        ) : (
          <p className="no-courses">No enrolled courses.</p>
        )}
      </div>

      {!isEditing && (
        <div className="enrollment-actions">
          <button className="add-history-btn" onClick={handleAddToHistory}>Add Course History</button>
        </div>
      )}
    </>
  );
};

export default Enrollment;
