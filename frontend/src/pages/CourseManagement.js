import React, { useState, useEffect } from 'react';
import './CourseManagement.css';
import { FaPen, FaTrash } from 'react-icons/fa';
import AddCourseModal from '../components/AddCourseModal';
import api from '../utils/api';

const CourseManagement = () => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('add');
  const [selectedCourse, setSelectedCourse] = useState(null);

  const fetchCourses = async (search = '') => {
    setLoading(true);
    try {
      const res = await api.get('/api/courses', { params: search ? { search } : {} });
      setCourses(res.data);
    } catch (err) {
      console.error('Failed to load courses:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchCourses(); }, []);

  const filteredCourses = courses.filter(course =>
    course.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    course.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAddCourseClick = () => { setModalMode('add'); setSelectedCourse(null); setModalOpen(true); };
  const handleEditCourse = (course) => { setModalMode('edit'); setSelectedCourse(course); setModalOpen(true); };
  const handleCloseModal = (refresh) => { setModalOpen(false); setSelectedCourse(null); if (refresh) fetchCourses(); };

  const handleDeleteCourse = async (course) => {
    if (!window.confirm(`Are you sure you want to delete ${course.name} (${course.code})? This action cannot be undone.`)) return;
    try {
      await api.delete(`/api/courses/${course.id}`);
      setCourses(prev => prev.filter(c => c.id !== course.id));
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete course.');
    }
  };

  return (
    <div className="course-management-container">
      <div className="course-management-header">
        <h2>Course Management</h2>
        <p>Manage university courses and enrollment</p>
      </div>
      <div className="course-list-container">
        <div className="course-list-header">
          <h3>All Courses ({filteredCourses.length})</h3>
          <div className="course-list-actions">
            <div className="course-search-bar">
              <input
                type="text"
                placeholder="Search Courses..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <button className="add-course-btn" onClick={handleAddCourseClick}>+ Add Course</button>
          </div>
        </div>
        {loading ? (
          <p style={{ padding: '20px', textAlign: 'center' }}>Loading courses...</p>
        ) : (
          <table className="courses-table">
            <thead>
              <tr>
                <th>Code</th>
                <th>Course Name</th>
                <th>Credits</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredCourses.map((course) => (
                <tr key={course.id}>
                  <td>{course.code}</td>
                  <td>{course.name}</td>
                  <td>{course.credits}</td>
                  <td className="action-icons">
                    <FaPen className="edit-icon" onClick={() => handleEditCourse(course)} />
                    <FaTrash className="delete-icon" onClick={() => handleDeleteCourse(course)} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      <AddCourseModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        mode={modalMode}
        courseData={selectedCourse}
      />
    </div>
  );
};

export default CourseManagement;
