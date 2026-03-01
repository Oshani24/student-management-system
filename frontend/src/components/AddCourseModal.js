import React, { useState, useEffect } from 'react';
import './AddCourseModal.css';
import api from '../utils/api';

const AddCourseModal = ({ isOpen, onClose, mode = 'add', courseData = null }) => {
  const [formData, setFormData] = useState({ code: '', name: '', credits: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (mode === 'edit' && courseData) {
      setFormData({
        code: courseData.code || '',
        name: courseData.name || '',
        credits: courseData.credits || '',
      });
    } else {
      setFormData({ code: '', name: '', credits: '' });
    }
    setError('');
  }, [mode, courseData, isOpen]);

  const handleChange = (e) => {
    const { id, value } = e.target;
    setFormData(prev => ({ ...prev, [id]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!formData.code || !formData.name || !formData.credits) {
      setError('Course code, name, and credits are required.');
      return;
    }
    setLoading(true);
    try {
      if (mode === 'edit' && courseData) {
        await api.put(`/api/courses/${courseData.id}`, {
          code: formData.code,
          name: formData.name,
          credits: parseInt(formData.credits),
        });
      } else {
        await api.post('/api/courses', {
          code: formData.code,
          name: formData.name,
          credits: parseInt(formData.credits),
        });
      }
      onClose(true); // pass true to trigger refresh
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save course.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h2>{mode === 'edit' ? 'Edit Course' : 'Add New Course'}</h2>
          <button onClick={() => onClose(false)} className="close-button">&times;</button>
        </div>
        <p>{mode === 'edit' ? 'Update course information' : 'Enter course details below'}</p>
        {error && <p style={{ color: 'red', marginBottom: '8px' }}>{error}</p>}
        <form onSubmit={handleSubmit}>
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="code">Course Code</label>
              <input type="text" id="code" placeholder="e.g., CS101" value={formData.code} onChange={handleChange} />
            </div>
            <div className="form-group">
              <label htmlFor="credits">Credits</label>
              <input type="number" id="credits" placeholder="3" value={formData.credits} onChange={handleChange} min="1" max="6" />
            </div>
          </div>
          <div className="form-group">
            <label htmlFor="name">Course Name</label>
            <input type="text" id="name" placeholder="e.g., Introduction to Programming" value={formData.name} onChange={handleChange} />
          </div>

          <div className="form-actions">
            <button type="button" onClick={() => onClose(false)} className="cancel-btn">Cancel</button>
            <button type="submit" className="create-btn" disabled={loading}>
              {loading ? 'Saving...' : (mode === 'edit' ? 'Update Course' : 'Create Course')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddCourseModal;
