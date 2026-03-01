import React, { useState, useEffect } from 'react';
import { Link, useParams, useLocation, useNavigate } from 'react-router-dom';
import './StudentDetails.css';
import { FaArrowLeft } from 'react-icons/fa';
import Enrollment from '../components/Enrollment';
import CourseHistory from '../components/CourseHistory';
import api from '../utils/api';

const StudentDetails = () => {
  const { studentNumber } = useParams();
  const decodedId = decodeURIComponent(studentNumber);
  const location = useLocation();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('personal');
  const [isEditing, setIsEditing] = useState(false);
  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [courseHistory, setCourseHistory] = useState([]);
  const [currentSemester, setCurrentSemester] = useState('Year 1, Semester 1');
  const [enrolledCourses, setEnrolledCourses] = useState([]);
  const [editedStudent, setEditedStudent] = useState({});

  // Fetch student, enrollments, and history
  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true);
      setError('');
      try {
        const [studentRes, enrollRes, historyRes] = await Promise.all([
          api.get(`/api/students/${encodeURIComponent(decodedId)}`),
          api.get(`/api/enrollments/${encodeURIComponent(decodedId)}`),
          api.get(`/api/enrollments/history/${encodeURIComponent(decodedId)}`),
        ]);
        const s = studentRes.data;
        setStudent(s);
        setEditedStudent({
          firstName: s.first_name,
          lastName: s.last_name,
          email: s.email,
          phone: s.phone,
          address: s.address,
          nic: s.nic || '',
          dob: s.date_of_birth ? s.date_of_birth.split('T')[0] : '',
          degree: s.degree_program,
          academic_year: s.academic_year || '',
          semester: s.semester || '',
        });

        // Map enrollment rows to the shape the Enrollment component expects
        setEnrolledCourses(enrollRes.data.map(e => ({
          id: e.course_id,
          dbId: e.id,
          code: e.course_code,
          name: e.course_name,
          credits: e.credits,
        })));

        setCourseHistory(historyRes.data.map(h => ({
          semester: h.semester_label,
          year: h.year_num,
          semesterNum: h.semester_num,
          courses: h.courses,
        })));

        // Determine current semester from history
        if (historyRes.data.length > 0) {
          const last = historyRes.data[0];
          const nextSem = last.semester_num + 1;
          const nextYear = Math.floor((nextSem - 1) / 2) + 1;
          setCurrentSemester(`Year ${nextYear}, Semester ${nextSem}`);
        } else if (s.semester) {
          let dbYear = s.academic_year || 'Year 1';
          dbYear = dbYear.replace('1st', 'Year 1').replace('2nd', 'Year 2').replace('3rd', 'Year 3').replace('4th', 'Year 4');
          if (!dbYear.startsWith('Year')) dbYear = 'Year 1';
          setCurrentSemester(`${dbYear}, ${s.semester || 'Semester 1'}`);
        }
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load student data.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, [decodedId]);

  useEffect(() => {
    if (location.state?.editMode) {
      setIsEditing(true);
      setActiveTab('personal');
    }
  }, [location.state]);

  const handleEditClick = () => {
    setIsEditing(true);
    setEditedStudent({
      firstName: student.first_name,
      lastName: student.last_name,
      email: student.email,
      phone: student.phone,
      address: student.address,
      nic: student.nic || '',
      dob: student.date_of_birth ? student.date_of_birth.split('T')[0] : '',
      degree: student.degree_program,
      academic_year: student.academic_year || '',
      semester: student.semester || '',
    });
  };

  const handleCancelEdit = async () => {
    try {
      // Refetch enrollment data to discard any changes made during editing
      const enrollRes = await api.get(`/api/enrollments/${encodeURIComponent(decodedId)}`);
      setEnrolledCourses(enrollRes.data.map(e => ({
        id: e.course_id,
        dbId: e.id,
        code: e.course_code,
        name: e.course_name,
        credits: e.credits,
      })));
    } catch (err) {
      console.error('Failed to refresh enrollment data:', err);
    }
    setIsEditing(false);
  };

  const handleSaveEdit = async () => {
    try {
      await api.put(`/api/students/${encodeURIComponent(decodedId)}`, {
        first_name: editedStudent.firstName,
        last_name: editedStudent.lastName,
        email: editedStudent.email,
        phone: editedStudent.phone,
        address: editedStudent.address,
        nic: editedStudent.nic,
        date_of_birth: editedStudent.dob || null,
        degree_program: editedStudent.degree,
        academic_year: editedStudent.academic_year,
        semester: editedStudent.semester,
      });
      
      // Fetch fresh enrollment data to display updated courses
      const enrollRes = await api.get(`/api/enrollments/${encodeURIComponent(decodedId)}`);
      setEnrolledCourses(enrollRes.data.map(e => ({
        id: e.course_id,
        dbId: e.id,
        code: e.course_code,
        name: e.course_name,
        credits: e.credits,
      })));
      
      // Update local state
      setStudent(prev => ({
        ...prev,
        first_name: editedStudent.firstName,
        last_name: editedStudent.lastName,
        email: editedStudent.email,
        phone: editedStudent.phone,
        address: editedStudent.address,
        nic: editedStudent.nic,
        date_of_birth: editedStudent.dob,
        degree_program: editedStudent.degree,
      }));
      setIsEditing(false);
      alert('Student updated successfully!');
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update student.');
    }
  };

  const handleTabChange = (tab) => { setActiveTab(tab); setIsEditing(false); };
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setEditedStudent(prev => ({ ...prev, [name]: value }));
  };

  const handleAddCourseHistory = async (courses) => {
    if (courses.length === 0) { alert('No courses to add to history.'); return false; }
    const semesterMatch = currentSemester.match(/Year (\d+), Semester (\d+)/);
    if (!semesterMatch) { alert('Invalid semester format.'); return false; }

    const yearNum = parseInt(semesterMatch[1]);
    const semesterNum = parseInt(semesterMatch[2]);
    const semesterKey = `Year ${yearNum} - Semester ${semesterNum}`;

    try {
      await api.post('/api/enrollments/complete-semester', {
        student_number: decodedId,
        semester_label: semesterKey,
        year_num: yearNum,
        semester_num: semesterNum,
      });

      // Update local state
      const newEntry = { semester: semesterKey, year: yearNum, semesterNum, courses };
      const updated = [newEntry, ...courseHistory].sort((a, b) => b.year !== a.year ? b.year - a.year : b.semesterNum - a.semesterNum);
      setCourseHistory(updated);
      setEnrolledCourses([]);
      const nextSem = semesterNum + 1;
      const nextYear = Math.floor((nextSem - 1) / 2) + 1;
      setCurrentSemester(`Year ${nextYear}, Semester ${nextSem}`);

      alert('Courses successfully added to history! Semester advanced.');
      return true;
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to complete semester.');
      return false;
    }
  };

  const handleDelete = async () => {
    if (!window.confirm(`Are you sure you want to delete ${student.first_name} ${student.last_name} (${decodedId})? This cannot be undone.`)) return;
    try {
      await api.delete(`/api/students/${encodeURIComponent(decodedId)}`);
      navigate('/student-list');
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete student.');
    }
  };

  if (loading) return <div style={{ padding: '40px', textAlign: 'center' }}>Loading student details...</div>;
  if (error) return <div style={{ padding: '40px', color: 'red' }}>{error}</div>;
  if (!student) return <div>Student not found</div>;

  const totalCredits = enrolledCourses.reduce((sum, c) => sum + (c.credits || 0), 0);
  const registeredDate = student.registered_date ? new Date(student.registered_date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : '-';
  const lastUpdated = student.last_updated ? new Date(student.last_updated).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : '-';

  return (
    <div className="student-details-container">
      <div className="student-details-header">
        <Link to="/student-list" className="back-link"><FaArrowLeft /></Link>
        <div>
          <h2>{student.first_name} {student.last_name}</h2>
          <p>Student Number : {student.student_number}</p>
        </div>
        <div className="header-actions">
          {activeTab === 'personal' && !isEditing && (
            <>
              <button className="edit-btn" onClick={handleEditClick}>Edit</button>
              <button className="delete-btn" onClick={handleDelete}>Delete</button>
            </>
          )}
          {activeTab === 'personal' && isEditing && (
            <>
              <button className="save-btn" onClick={handleSaveEdit}>Save</button>
              <button className="cancel-btn" onClick={handleCancelEdit}>Cancel</button>
            </>
          )}
        </div>
      </div>

      <div className="student-details-tabs">
        <button className={`tab-btn ${activeTab === 'personal' ? 'active' : ''}`} onClick={() => handleTabChange('personal')}>Personal Details</button>
        <button className={`tab-btn ${activeTab === 'history' ? 'active' : ''}`} onClick={() => handleTabChange('history')}>Course History</button>
      </div>

      <div className="student-details-content">
        {activeTab === 'personal' ? (
          <>
            <div className="personal-information-card">
              <h3>Personal Information</h3>
              {!isEditing ? (
                <div className="info-grid">
                  <div className="info-item"><label>First Name</label><p>{student.first_name}</p></div>
                  <div className="info-item"><label>Last Name</label><p>{student.last_name}</p></div>
                  <div className="info-item"><label>Email</label><p>{student.email}</p></div>
                  <div className="info-item"><label>Phone</label><p>{student.phone}</p></div>
                  <div className="info-item full-width"><label>Address</label><p>{student.address}</p></div>
                  <div className="info-item"><label>NIC Number</label><p>{student.nic || '-'}</p></div>
                  <div className="info-item"><label>Date of Birth</label><p>{student.date_of_birth ? new Date(student.date_of_birth).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : '-'}</p></div>
                  <div className="info-item"><label>Degree Program</label><p>{student.degree_program}</p></div>
                </div>
              ) : (
                <div className="info-grid">
                  <div className="info-item"><label>First Name</label><input type="text" name="firstName" value={editedStudent.firstName} onChange={handleInputChange} className="edit-input" /></div>
                  <div className="info-item"><label>Last Name</label><input type="text" name="lastName" value={editedStudent.lastName} onChange={handleInputChange} className="edit-input" /></div>
                  <div className="info-item"><label>Email</label><input type="email" name="email" value={editedStudent.email} onChange={handleInputChange} className="edit-input" /></div>
                  <div className="info-item"><label>Phone</label><input type="text" name="phone" value={editedStudent.phone} onChange={handleInputChange} className="edit-input" /></div>
                  <div className="info-item full-width"><label>Address</label><input type="text" name="address" value={editedStudent.address} onChange={handleInputChange} className="edit-input" /></div>
                  <div className="info-item"><label>NIC Number</label><input type="text" name="nic" value={editedStudent.nic} onChange={handleInputChange} className="edit-input" /></div>
                  <div className="info-item"><label>Date of Birth</label><input type="date" name="dob" value={editedStudent.dob} onChange={handleInputChange} className="edit-input" /></div>
                  <div className="info-item">
                    <label>Degree Program</label>
                    <select name="degree" value={editedStudent.degree} onChange={handleInputChange} className="edit-input">
                      <option value="Software Engineering">Software Engineering</option>
                      <option value="Computer Science">Computer Science</option>
                      <option value="Information Technology">Information Technology</option>
                      <option value="Information System">Information System</option>
                    </select>
                  </div>
                </div>
              )}
            </div>
            <div className="academic-summary-card">
              <h3>Academic Summary</h3>
              <div className="summary-grid">
                <div className="summary-item"><label>Student Number</label><p>{student.student_number}</p></div>
                <div className="summary-item"><label>Registered Date</label><p>{registeredDate}</p></div>
                <div className="summary-item highlight-semester">
                  <label>Current Semester / Year</label>
                  <p>{currentSemester}</p>
                </div>
                <div className="summary-item"><label>Last Updated</label><p>{lastUpdated}</p></div>
                <div className="summary-item"><label>Total Courses</label><p>{enrolledCourses.length}</p></div>
                <div className="summary-item"><label>Total Credits</label><p>{totalCredits}</p></div>
              </div>
            </div>
            <div className="enrollment-section">
              <div className="section-header"><h3>Currently Enrolled Courses</h3></div>
              <Enrollment
                isEditing={isEditing}
                onAddToHistory={handleAddCourseHistory}
                enrolledCourses={enrolledCourses}
                setEnrolledCourses={setEnrolledCourses}
                studentNumber={decodedId}
              />
            </div>
          </>
        ) : (
          <CourseHistory courseHistory={courseHistory} />
        )}
      </div>
    </div>
  );
};

export default StudentDetails;
