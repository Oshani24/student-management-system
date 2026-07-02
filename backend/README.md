# Student Management System (SMS) — Backend

Microservices backend for the KDU Department of Software Engineering Student Management System.

## Architecture

```
api-gateway  (port 5000)  ─── routes all requests, verifies JWT
auth-service (port 5001)  ─── login / logout / admin profile
student-service (port 5002) ─ student CRUD + auto student number generation
course-service (port 5003)  ─ course CRUD
enrollment-service (port 5004) ─ enrollment & course history
audit-service (port 5005)  ─── audit log read/write
MySQL (port 3306)          ─── 5 separate databases
```

## Student Number Format

Auto-generated on student registration based on degree program:

| Degree | Prefix | Example |
|--------|--------|---------|
| Software Engineering | BSE | `BSE/26/0001` |
| Computer Science | BCS | `BCS/26/0001` |
| Information System | BIS | `BIS/26/0001` |
| Information Technology | BIT | `BIT/26/0001` |

## Default Admin Credentials

Admin credentials are loaded from environment variables. Set `ADMIN_USERNAME` and `ADMIN_PASSWORD` in your `.env` file.

## Quick Start (Docker — Recommended)

### Prerequisites
- Docker Desktop installed and running

### Steps

```bash
cd backend
docker-compose up --build
```

All services will start automatically. MySQL will initialise all 5 databases and seed:
- Default admin account
- 16 initial courses

### Start the Frontend

```bash
cd frontend
npm install
npm start
```

Open http://localhost:3000 in your browser.

---

## Quick Start (Without Docker)

### Prerequisites
- Node.js 18+
- MySQL 8.0 running on port 3306

### Database Setup

```bash
mysql -u root -p < backend/init-db/01-init.sql
```

### Start Each Service

Open 6 separate terminals and run:

```bash
# Terminal 1 — Audit Service (start first)
cd backend/audit-service && npm install && npm start

# Terminal 2 — Auth Service
cd backend/auth-service && npm install && npm start

# Terminal 3 — Student Service
cd backend/student-service && npm install && npm start

# Terminal 4 — Course Service
cd backend/course-service && npm install && npm start

# Terminal 5 — Enrollment Service
cd backend/enrollment-service && npm install && npm start

# Terminal 6 — API Gateway
cd backend/api-gateway && npm install && npm start
```

### Environment Variables

Copy the root [`.env.example`](../.env.example) to `.env` and adjust if needed:

```env
DB_ROOT_PASSWORD=your_db_root_password
JWT_SECRET=your_jwt_secret
ADMIN_USERNAME=your_admin_username
ADMIN_PASSWORD=your_admin_password
INTAKE_YEAR=26
```

Each service also reads its own environment variables. When running without Docker,
create a `.env` file in each service directory:

```env
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_db_root_password
DB_NAME=sms_auth       # (or sms_students / sms_courses / etc.)
JWT_SECRET=your_jwt_secret
ADMIN_USERNAME=your_admin_username
ADMIN_PASSWORD=your_admin_password
AUDIT_SERVICE_URL=http://localhost:5005
INTAKE_YEAR=26
```

## API Endpoints Summary

All routes go through the **API Gateway** at `http://localhost:5000`.

### Auth
| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/auth/login` | Login (returns JWT) |
| POST | `/api/auth/logout` | Logout |
| GET | `/api/auth/profile` | Get admin profile |

### Students
| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/students` | Register student |
| GET | `/api/students` | List all students |
| GET | `/api/students/:studentNumber` | Get student |
| PUT | `/api/students/:studentNumber` | Update student |
| DELETE | `/api/students/:studentNumber` | Delete student |
| GET | `/api/students/stats/count` | Student count stats |

### Courses
| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/courses` | Add course |
| GET | `/api/courses` | List courses |
| GET | `/api/courses/:id` | Get course |
| PUT | `/api/courses/:id` | Update course |
| DELETE | `/api/courses/:id` | Delete course |
| GET | `/api/courses/stats/count` | Course count |

### Enrollments
| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/enrollments` | Enroll student in course |
| GET | `/api/enrollments/:studentNumber` | Get current enrollments |
| DELETE | `/api/enrollments/:id` | Remove enrollment |
| POST | `/api/enrollments/complete-semester` | Move to history |
| GET | `/api/enrollments/history/:studentNumber` | Get history |

### Audit Logs
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/audit` | List logs (with filters) |
| POST | `/api/audit` | Create log entry (internal) |

## Demo Artifact (Submission + Viva)

This section is the official demo artifact for the project. It defines the exact live demo flow, expected outcomes, and evidence to show for each marking criterion.

### Demo Environment

- Date: 15 March 2026
- App URL: http://localhost:3000
- API Gateway URL: http://localhost:5000
- Default login: set via `ADMIN_USERNAME` and `ADMIN_PASSWORD`
- Stack: React frontend, Node.js microservices backend, MySQL, Docker Compose

### Demo Objectives

- Prove all required functionality works end-to-end.
- Prove architecture, maintainability, and testing requirements are met.
- Provide concrete evidence for the marking schema.

### Live Demo Script (Recommended Order)

1. Start services
- Run: `cd backend && docker-compose up --build`
- Then run frontend: `cd ../frontend && npm install && npm start`
- Show all service containers are running.

2. Login and dashboard
- Login with default admin credentials.
- Show dashboard statistics load correctly.

3. Student registration + ID generation
- Register a new student (all required fields).
- Show generated student number format (example: BSE/26/0001).
- Register another student in the same degree and show sequence increment.
- Register one in a different degree and show separate sequence.

4. Course registration and enrollment
- Create a new course.
- Enroll a student in one or more courses.
- Show enrollment appears in student details.

5. Search and retrieve
- Search by student number and by name.
- Open student details and show full profile + current enrollments + course history.

6. Update management
- Edit student details and save.
- Edit course details and save.
- Confirm updated values appear in UI.

7. Delete operations
- Delete one enrollment.
- Delete a course and show related enrollment cleanup.
- Delete a student and show student removal from list.

8. Audit trail evidence
- Open audit logs page.
- Filter by action type (Create, Update, Delete, Login).
- Filter by date range.
- Show entries contain entity id/name, action type, performer, timestamp.

9. Maintainability evidence
- Open environment variable settings (`.env` / compose env values).
- Explain that DB credentials and service URLs are externalized.
- State that credential changes require config update only, not code changes.

10. Testing evidence
- Run: `cd frontend && npm test -- --coverage --watchAll=false --ci`
- Show coverage report is above 20% threshold.

### Evidence Mapping to Marking Schema

- Registration: student + course creation flows demonstrated.
- ID Generation: atomic unique student number generation demonstrated.
- Course/Student Management: update operations demonstrated.
- Search/Retrieve: search and full student details demonstrated.
- Delete: student/course/enrollment deletion demonstrated.
- Audit Trail: filtered logs and full activity tracking demonstrated.
- Design Patterns: API Gateway, Proxy, Singleton, Factory, Interceptor patterns explained.
- Standards: validation, parameterized SQL, bcrypt, JWT, HTTP status codes explained.
- Maintainability: env-driven configuration and Dockerized deployment explained.
- Unit Testing: test suite and coverage report demonstrated.
- Architecture: microservices + Docker Compose + service boundaries explained.
- Documentation & Demo: this artifact plus README setup instructions provided.

### Notes

- This demo artifact is documentation-only and does not modify runtime code or system behavior.
- It is safe to include in submission and use as the viva walkthrough script.
