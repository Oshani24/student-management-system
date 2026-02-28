# Student Management System (SMS)

A comprehensive Student Management System developed for the KDU Department of Software Engineering. This system manages student registration, course enrollment, and academic records with a microservices architecture.

## 🏗️ Architecture

This project follows a **microservices architecture** with the following components:

### Backend Services
- **API Gateway** (Port 5000) - Central entry point, JWT authentication
- **Auth Service** (Port 5001) - User authentication and authorization  
- **Student Service** (Port 5002) - Student CRUD operations, auto student number generation
- **Course Service** (Port 5003) - Course management
- **Enrollment Service** (Port 5004) - Course enrollment and history
- **Audit Service** (Port 5005) - System audit logging

### Frontend
- **React Application** (Port 3000) - Modern, responsive user interface

### Database
- **MySQL 8.0** - 5 separate databases for each service (independently scalable)

## ✨ Features

### Student Management
- ✅ Automated student number generation by degree program
  - Software Engineering: `BSE/26/0001`
  - Computer Science: `BCS/26/0001`
  - Information System: `BIS/26/0001`
  - Information Technology: `BIT/26/0001`
- ✅ Student registration with complete profile information
- ✅ Search and filter students
- ✅ Update student details
- ✅ Delete student records

### Course Management
- ✅ Add, edit, and delete courses
- ✅ View enrollment statistics per course
- ✅ Search courses by code or name

### Enrollment Management
- ✅ Enroll students in multiple courses
- ✅ Track current enrollments
- ✅ Remove enrollments
- ✅ Complete semester and move courses to history
- ✅ View course history by student

### Audit & Security
- ✅ Comprehensive audit logging for all operations
- ✅ JWT-based authentication
- ✅ Secure password hashing with bcrypt
- ✅ Token-based session management
- ✅ Filter audit logs by action type and date range

### Dashboard & Analytics
- ✅ Total student and course statistics
- ✅ Enrollment overview by degree program
- ✅ Visual progress bars for enrollment data
- ✅ Admin profile management

## 🛠️ Technology Stack

### Backend
- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MySQL 8.0 with mysql2 driver
- **Authentication**: JWT (jsonwebtoken), bcryptjs
- **Containerization**: Docker & Docker Compose
- **API Design**: RESTful architecture

### Frontend
- **Framework**: React 18
- **Routing**: React Router DOM v6
- **HTTP Client**: Axios
- **Icons**: React Icons
- **Styling**: CSS3 (Custom)
- **State Management**: React Hooks (useState, useEffect)

### DevOps
- **Containerization**: Docker
- **Orchestration**: Docker Compose
- **Database Init**: Automated SQL scripts

## 📋 Prerequisites

- **Docker Desktop** (Recommended for quick setup)
- OR
- **Node.js** (v16 or higher)
- **MySQL 8.0**
- **npm** or **yarn**

## 🚀 Installation & Setup

### Option 1: Docker (Recommended)

1. **Clone the repository**
```bash
git clone <your-repo-url>
cd SCTT-SMS
```

2. **Start all services with Docker Compose**
```bash
cd backend
docker-compose up --build
```

3. **Start the frontend**
```bash
cd ../frontend
npm install
npm start
```

4. **Access the application**
- Frontend: http://localhost:3000
- API Gateway: http://localhost:5000

### Option 2: Manual Setup

#### Backend Services

1. **Set up MySQL databases**
Run the SQL script in `backend/init-db/01-init.sql`

2. **Install and start each service**
```bash
# Auth Service
cd backend/auth-service
npm install
npm start

# Student Service
cd backend/student-service
npm install
npm start

# Course Service
cd backend/course-service
npm install
npm start

# Enrollment Service
cd backend/enrollment-service
npm install
npm start

# Audit Service
cd backend/audit-service
npm install
npm start

# API Gateway
cd backend/api-gateway
npm install
npm start
```

#### Frontend

```bash
cd frontend
npm install
npm start
```

## 🔐 Default Credentials

| Field | Value |
|-------|-------|
| **Username** | `admin` |
| **Password** | `Admin@1234` |

## 📁 Project Structure

```
SCTT-SMS/
├── backend/
│   ├── api-gateway/          # API Gateway service
│   ├── auth-service/         # Authentication service
│   ├── student-service/      # Student management service
│   ├── course-service/       # Course management service
│   ├── enrollment-service/   # Enrollment management service
│   ├── audit-service/        # Audit logging service
│   ├── init-db/              # Database initialization scripts
│   ├── docker-compose.yml    # Docker orchestration
│   └── README.md            # Backend documentation
├── frontend/
│   ├── public/              # Static assets
│   ├── src/
│   │   ├── components/      # Reusable React components
│   │   ├── pages/           # Page components
│   │   ├── utils/           # Utility functions (API client)
│   │   ├── App.js           # Main application component
│   │   └── index.js         # Application entry point
│   └── package.json
└── README.md                # Main documentation
```

## 🎯 API Endpoints

### Authentication
- `POST /api/auth/login` - Admin login
- `POST /api/auth/logout` - Admin logout
- `GET /api/auth/profile` - Get admin profile

### Students
- `POST /api/students` - Register new student
- `GET /api/students` - List all students (with search)
- `GET /api/students/:studentNumber` - Get student details
- `PUT /api/students/:studentNumber` - Update student
- `DELETE /api/students/:studentNumber` - Delete student
- `GET /api/students/stats/count` - Get student statistics

### Courses
- `POST /api/courses` - Create new course
- `GET /api/courses` - List all courses (with search)
- `GET /api/courses/:id` - Get course details
- `PUT /api/courses/:id` - Update course
- `DELETE /api/courses/:id` - Delete course
- `GET /api/courses/stats/count` - Get course statistics

### Enrollments
- `POST /api/enrollments` - Enroll student in course
- `GET /api/enrollments/:studentNumber` - Get current enrollments
- `DELETE /api/enrollments/:id` - Remove enrollment
- `POST /api/enrollments/:studentNumber/complete-semester` - Complete semester
- `GET /api/enrollments/:studentNumber/history` - Get course history

### Audit Logs
- `POST /api/audit` - Create audit log (internal)
- `GET /api/audit` - Get audit logs (with filters)

## 🎨 Design Patterns Implemented

1. **Microservices Architecture** - Independent, loosely coupled services
2. **API Gateway Pattern** - Centralized routing and authentication
3. **Proxy Pattern** - API Gateway proxies requests to backend services
4. **Factory Pattern** - Database connection pool creation
5. **Singleton Pattern** - Single Axios instance with interceptors
6. **Observer Pattern** - React hooks for state management
7. **Component Pattern** - Reusable React components
8. **Interceptor Pattern** - Axios request/response interceptors

## 🧩 SOLID Principles

- **Single Responsibility**: Each service handles one domain
- **Open/Closed**: Services can be extended without modification
- **Liskov Substitution**: Components follow React patterns correctly
- **Interface Segregation**: REST APIs are focused and specific
- **Dependency Inversion**: Environment variables for configuration

## 🧪 Testing

Run frontend tests:
```bash
cd frontend
npm test
```

Run tests with coverage:
```bash
npm test -- --coverage --watchAll=false
```

## 🐳 Docker Services

All backend services are containerized and orchestrated with Docker Compose:
- Automatic database initialization
- Health checks for MySQL
- Service dependency management
- Restart policies configured

## 📝 Database Schema

The system uses 5 separate MySQL databases:
- `sms_auth` - Admin accounts
- `sms_students` - Student records
- `sms_courses` - Course catalog
- `sms_enrollments` - Enrollment records and history
- `sms_audit` - Audit logs

## 🔒 Security Features

- JWT token-based authentication
- Password hashing with bcrypt (10 rounds)
- Token expiration (8 hours)
- CORS configuration
- Environment variable protection
- SQL injection prevention (parameterized queries)

## 🎓 Academic Context

**Institution**: General Sir John Kotelawala Defence University (KDU)  
**Department**: Department of Software Engineering  
**Project Type**: Student Management System - Registration Module  
**Year**: 2026

## 👨‍💻 Development

### Adding a New Microservice

1. Create service directory in `backend/`
2. Add Dockerfile
3. Update docker-compose.yml
4. Add database initialization if needed
5. Update API Gateway routing

### Code Standards

- Use ES6+ features
- Follow REST API conventions
- Use async/await for asynchronous operations
- Implement proper error handling
- Add audit logging for state-changing operations

## 📄 License

This project is developed for academic purposes at KDU.

## 🤝 Contributing

This is an academic project. For issues or questions, please contact the development team.

---

**© 2026 KDU Department of Software Engineering. All rights reserved.**
