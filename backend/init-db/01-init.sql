-- ==============================================
-- Database Initialization Script
-- Creates all databases for SMS microservices
-- ==============================================

-- Auth Database
CREATE DATABASE IF NOT EXISTS sms_auth;
USE sms_auth;

CREATE TABLE IF NOT EXISTS admin (
  id INT PRIMARY KEY AUTO_INCREMENT,
  username VARCHAR(50) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  full_name VARCHAR(100) NOT NULL,
  email VARCHAR(100) NOT NULL,
  last_login TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Admin will be seeded by auth-service at first startup with a properly bcrypt-hashed password
-- Default credentials: username=admin, password=Admin@1234

-- ==============================================
-- Student Database
-- ==============================================
CREATE DATABASE IF NOT EXISTS sms_students;
USE sms_students;

CREATE TABLE IF NOT EXISTS student (
  id INT PRIMARY KEY AUTO_INCREMENT,
  student_number VARCHAR(20) NOT NULL UNIQUE,
  first_name VARCHAR(50) NOT NULL,
  last_name VARCHAR(50) NOT NULL,
  email VARCHAR(100) NOT NULL,
  phone VARCHAR(20) NOT NULL,
  address TEXT NOT NULL,
  nic VARCHAR(20),
  date_of_birth DATE,
  degree_program ENUM('Software Engineering','Computer Science','Information System','Information Technology') NOT NULL,
  academic_year VARCHAR(20),
  semester VARCHAR(20),
  registered_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS student_number_counter (
  degree_code VARCHAR(10) PRIMARY KEY,
  last_sequence INT NOT NULL DEFAULT 0
);

-- Initialise counters for all 4 degree programs
INSERT INTO student_number_counter (degree_code, last_sequence) VALUES
  ('BSE', 0),
  ('BCS', 0),
  ('BIS', 0),
  ('BIT', 0)
ON DUPLICATE KEY UPDATE degree_code = degree_code;

-- ==============================================
-- Course Database
-- ==============================================
CREATE DATABASE IF NOT EXISTS sms_courses;
USE sms_courses;

CREATE TABLE IF NOT EXISTS course (
  id INT PRIMARY KEY AUTO_INCREMENT,
  code VARCHAR(20) NOT NULL UNIQUE,
  name VARCHAR(100) NOT NULL,
  credits INT NOT NULL DEFAULT 3,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Seed initial courses
INSERT INTO course (code, name, credits) VALUES
  ('CS101', 'Introduction to Programming', 3),
  ('CS102', 'Computer Architecture', 3),
  ('CS103', 'Discrete Mathematics', 3),
  ('CS201', 'Data Structures', 3),
  ('CS202', 'Database Systems', 3),
  ('CS203', 'Web Development', 3),
  ('CS301', 'Linear Algebra', 3),
  ('CS302', 'Algorithms', 3),
  ('CS303', 'Operating Systems', 3),
  ('CS401', 'Software Engineering', 3),
  ('CS402', 'Artificial Intelligence', 3),
  ('CS403', 'Computer Networks', 3),
  ('MATH101', 'Calculus I', 4),
  ('MATH201', 'Statistics', 3),
  ('ENG101', 'Technical Writing', 2),
  ('PHYS101', 'Physics I', 4)
ON DUPLICATE KEY UPDATE code = code;

-- ==============================================
-- Enrollment Database
-- ==============================================
CREATE DATABASE IF NOT EXISTS sms_enrollments;
USE sms_enrollments;

CREATE TABLE IF NOT EXISTS enrollment (
  id INT PRIMARY KEY AUTO_INCREMENT,
  student_number VARCHAR(20) NOT NULL,
  course_id INT NOT NULL,
  course_code VARCHAR(20) NOT NULL,
  course_name VARCHAR(100) NOT NULL,
  credits INT NOT NULL DEFAULT 3,
  academic_year VARCHAR(20),
  semester VARCHAR(20),
  enrolled_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY unique_enrollment (student_number, course_id)
);

CREATE TABLE IF NOT EXISTS enrollment_history (
  id INT PRIMARY KEY AUTO_INCREMENT,
  student_number VARCHAR(20) NOT NULL,
  semester_label VARCHAR(50) NOT NULL,
  year_num INT NOT NULL,
  semester_num INT NOT NULL,
  courses JSON NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY unique_history (student_number, semester_label)
);

-- ==============================================
-- Audit Database
-- ==============================================
CREATE DATABASE IF NOT EXISTS sms_audit;
USE sms_audit;

CREATE TABLE IF NOT EXISTS audit_log (
  id INT PRIMARY KEY AUTO_INCREMENT,
  entity_type VARCHAR(50),
  entity_id VARCHAR(50),
  entity_name VARCHAR(100),
  action VARCHAR(100) NOT NULL,
  action_type VARCHAR(30) NOT NULL,
  performed_by VARCHAR(50) DEFAULT 'admin',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
