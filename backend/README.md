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

| Field | Value |
|-------|-------|
| Username | `admin` |
| Password | `Admin@1234` |

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

Copy `.env.example` to `.env` in the backend root and adjust if needed:

```env
DB_ROOT_PASSWORD=root1234
JWT_SECRET=sms_secret_key_2026
INTAKE_YEAR=26
```

Each service also reads its own environment variables. When running without Docker,
create a `.env` file in each service directory:

```env
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=root1234
DB_NAME=sms_auth       # (or sms_students / sms_courses / etc.)
JWT_SECRET=sms_secret_key_2026
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
