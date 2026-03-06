require('dotenv').config();
const express = require('express');
const proxy = require('express-http-proxy');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const morgan = require('morgan');

const app = express();
const PORT = 5000;

// Service URLs
const AUTH_URL = process.env.AUTH_SERVICE_URL || 'http://localhost:5001';
const STUDENT_URL = process.env.STUDENT_SERVICE_URL || 'http://localhost:5002';
const COURSE_URL = process.env.COURSE_SERVICE_URL || 'http://localhost:5003';
const ENROLL_URL = process.env.ENROLLMENT_SERVICE_URL || 'http://localhost:5004';
const AUDIT_URL = process.env.AUDIT_SERVICE_URL || 'http://localhost:5005';

// CORS — allow React dev server
app.use(cors({
    origin: ['http://localhost:3000', 'http://127.0.0.1:3000'],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
}));

app.use(morgan('dev'));

// JWT Verification Middleware
function verifyToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ message: 'No token provided' });
    }
    const token = authHeader.split(' ')[1];
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'sms_secret_key_2026');
        req.headers['x-admin-id'] = String(decoded.id);
        req.headers['x-admin-username'] = decoded.username;
        next();
    } catch (err) {
        return res.status(401).json({ message: 'Invalid or expired token' });
    }
}

// Health check
app.get('/health', (req, res) => res.json({ status: 'ok', service: 'api-gateway' }));

// Proxy options to preserve original path
const proxyOptions = {
    proxyReqPathResolver: (req) => req.originalUrl
};

// ── Auth routes (public: login only) ─────────────────────────────────────────
app.use('/api/auth/login', proxy(AUTH_URL, proxyOptions));
app.use('/api/auth', verifyToken, proxy(AUTH_URL, proxyOptions));

// ── Protected routes ──────────────────────────────────────────────────────────
app.use('/api/students', verifyToken, proxy(STUDENT_URL, proxyOptions));
app.use('/api/courses', verifyToken, proxy(COURSE_URL, proxyOptions));
app.use('/api/enrollments', verifyToken, proxy(ENROLL_URL, proxyOptions));
app.use('/api/audit', verifyToken, proxy(AUDIT_URL, proxyOptions));

app.listen(PORT, () => {
    console.log(`API Gateway running on port ${PORT}`);
    console.log(`  → Auth:       ${AUTH_URL}`);
    console.log(`  → Students:   ${STUDENT_URL}`);
    console.log(`  → Courses:    ${COURSE_URL}`);
    console.log(`  → Enrollment: ${ENROLL_URL}`);
    console.log(`  → Audit:      ${AUDIT_URL}`);
});
