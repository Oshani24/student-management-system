import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css';
import Navbar from './components/Navbar';
import Header from './components/Header';
import Footer from './components/Footer';
import Dashboard from './pages/Dashboard';
import AddStudent from './pages/AddStudent';
import StudentList from './pages/StudentList';
import StudentDetails from './pages/StudentDetails';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import CourseManagement from './pages/CourseManagement';
import AuditLogs from './pages/AuditLogs';

const AdminLayout = ({ children }) => (
  <div className="App">
    <Navbar />
    <div className="main-content">
      <Header />
      {children}
      <Footer />
    </div>
  </div>
);

function App() {
  return (
    <Router>
      <Routes>
        
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />

        <Route path="/dashboard" element={
          <AdminLayout>
            <Dashboard />
          </AdminLayout>
        } />
        <Route path="/add-student" element={
          <AdminLayout>
            <AddStudent />
          </AdminLayout>
        } />
        <Route path="/student-list" element={
          <AdminLayout>
            <StudentList />
          </AdminLayout>
        } />
        <Route path="/student/:studentNumber" element={
          <AdminLayout>
            <StudentDetails />
          </AdminLayout>
        }
        />   
        <Route path="/course-management" element={
          <AdminLayout>
            <CourseManagement />
          </AdminLayout>
        } 
        />
        <Route path="/audit-logs" element={
          <AdminLayout>
            <AuditLogs />
          </AdminLayout>
        }
        />
      </Routes>
    </Router>
  );
}
      

export default App;
