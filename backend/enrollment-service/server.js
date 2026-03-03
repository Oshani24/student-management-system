require('dotenv').config();
const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');
const fetch = require('node-fetch');

const app = express();
const PORT = 5004;

app.use(cors());
app.use(express.json());

let db;
async function initDB() {
    const maxRetries = 10;
    for (let i = 0; i < maxRetries; i++) {
        try {
            db = await mysql.createPool({
                host: process.env.DB_HOST || 'localhost',
                port: process.env.DB_PORT || 3306,
                user: process.env.DB_USER || 'root',
                password: process.env.DB_PASSWORD || 'root1234',
                database: process.env.DB_NAME || 'sms_enrollments',
                waitForConnections: true,
                connectionLimit: 10,
            });
            await db.query('SELECT 1');
            console.log('Enrollment Service: DB connected');
            return;
        } catch (err) {
            console.log(`Enrollment Service: DB connect attempt ${i + 1} failed. Retrying...`);
            await new Promise(r => setTimeout(r, 3000));
        }
    }
    throw new Error('Enrollment Service: Could not connect to DB');
}

async function logAudit(action, actionType, entityId = '-', entityName = '-') {
    try {
        const auditUrl = process.env.AUDIT_SERVICE_URL || 'http://localhost:5005';
        await fetch(`${auditUrl}/api/audit`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                action, action_type: actionType,
                entity_type: 'Enrollment', entity_id: entityId, entity_name: entityName, performed_by: 'admin'
            }),
        });
    } catch (err) {
        console.error('Audit log error:', err.message);
    }
}

// POST /api/enrollments — Enroll student in a course
app.post('/api/enrollments', async (req, res) => {
    try {
        const { student_number, course_id, course_code, course_name, credits, academic_year, semester } = req.body;
        if (!student_number || !course_id || !course_code || !course_name) {
            return res.status(400).json({ message: 'student_number, course_id, course_code, course_name are required' });
        }

        await db.query(
            `INSERT INTO enrollment (student_number, course_id, course_code, course_name, credits, academic_year, semester)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [student_number, course_id, course_code, course_name, credits || 3, academic_year || null, semester || null]
        );

        await logAudit('Course Enrollment Update', 'Enrollment', student_number, course_name);
        res.status(201).json({ message: 'Enrolled successfully' });
    } catch (err) {
        if (err.code === 'ER_DUP_ENTRY') return res.status(409).json({ message: 'Student already enrolled in this course' });
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

// GET /api/enrollments/:studentNumber — Get current enrollments
app.get('/api/enrollments/:studentNumber', async (req, res) => {
    try {
        const { studentNumber } = req.params;
        const [rows] = await db.query(
            'SELECT * FROM enrollment WHERE student_number = ? ORDER BY enrolled_at DESC',
            [studentNumber]
        );
        res.json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

// DELETE /api/enrollments/:id — Remove a specific enrollment
app.delete('/api/enrollments/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const [existing] = await db.query('SELECT * FROM enrollment WHERE id = ?', [id]);
        if (existing.length === 0) return res.status(404).json({ message: 'Enrollment not found' });

        await db.query('DELETE FROM enrollment WHERE id = ?', [id]);
        await logAudit('Course Enrollment Removed', 'Enrollment', existing[0].student_number, existing[0].course_name);
        res.json({ message: 'Enrollment removed successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

// POST /api/enrollments/complete-semester — Move current enrollments to history
app.post('/api/enrollments/complete-semester', async (req, res) => {
    try {
        const { student_number, semester_label, year_num, semester_num } = req.body;
        if (!student_number || !semester_label) {
            return res.status(400).json({ message: 'student_number and semester_label are required' });
        }

        // Get all current enrollments for this student
        const [enrollments] = await db.query(
            'SELECT * FROM enrollment WHERE student_number = ?',
            [student_number]
        );

        if (enrollments.length === 0) {
            return res.status(400).json({ message: 'No enrolled courses found for this student' });
        }

        // Check semester not already in history
        const [existing] = await db.query(
            'SELECT id FROM enrollment_history WHERE student_number = ? AND semester_label = ?',
            [student_number, semester_label]
        );
        if (existing.length > 0) {
            return res.status(409).json({ message: 'This semester already exists in course history' });
        }

        const courses = enrollments.map(e => ({
            id: e.course_id,
            code: e.course_code,
            name: e.course_name,
            credits: e.credits,
        }));

        // Insert into history
        await db.query(
            `INSERT INTO enrollment_history (student_number, semester_label, year_num, semester_num, courses)
       VALUES (?, ?, ?, ?, ?)`,
            [student_number, semester_label, year_num || 1, semester_num || 1, JSON.stringify(courses)]
        );

        // Delete all current enrollments for this student
        await db.query('DELETE FROM enrollment WHERE student_number = ?', [student_number]);

        await logAudit('Semester Completed - Courses Added to History', 'Enrollment', student_number, semester_label);
        res.json({ message: 'Semester completed and courses moved to history', courses });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

// GET /api/enrollments/history/:studentNumber — Get course history
app.get('/api/enrollments/history/:studentNumber', async (req, res) => {
    try {
        const { studentNumber } = req.params;
        const [rows] = await db.query(
            'SELECT * FROM enrollment_history WHERE student_number = ? ORDER BY year_num DESC, semester_num DESC',
            [studentNumber]
        );
        // Parse JSON courses
        const history = rows.map(r => ({
            ...r,
            courses: typeof r.courses === 'string' ? JSON.parse(r.courses) : r.courses
        }));
        res.json(history);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

app.get('/health', (req, res) => res.json({ status: 'ok', service: 'enrollment-service' }));

initDB().then(() => {
    app.listen(PORT, () => console.log(`Enrollment Service running on port ${PORT}`));
}).catch(err => {
    console.error('Fatal:', err.message);
    process.exit(1);
});
