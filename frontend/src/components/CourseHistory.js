import React from 'react';
import './CourseHistory.css';

const CourseHistory = ({ courseHistory = [] }) => {
  return (
    <div className="course-history-container">
      <h3>Academic History</h3>

      {courseHistory.length === 0 ? (
        <p className="no-history">No course history available.</p>
      ) : (
        courseHistory.map((semesterData, index) => (
          <div key={index} className="semester-section">
            <h4>{semesterData.semester}</h4>
            <table className="history-table">
              <thead>
                <tr>
                  <th>Code</th>
                  <th>Course Name</th>
                  <th>Credits</th>
                </tr>
              </thead>
              <tbody>
                {semesterData.courses.map((course, courseIndex) => (
                  <tr key={courseIndex}>
                    <td>{course.code}</td>
                    <td>{course.name}</td>
                    <td>{course.credits}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )))
      }
    </div>
  );
};

export default CourseHistory;
