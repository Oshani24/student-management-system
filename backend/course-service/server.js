require('dotenv').config();
const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');
const fetch = require('node-fetch');

const app = express();
const PORT = 5003;

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
                database: process.env.DB_NAME || 'sms_courses',
                waitForConnections: true,
                connectionLimit: 10,
            });
            await db.query('SELECT 1');
            console.log('Course Service: DB connected');
            return;
        } catch (err) {
            console.log(`Course Service: DB connect attempt ${i + 1} failed. Retrying...`);
            await new Promise(r => setTimeout(r, 3000));
        }
    }
    throw new Error('Course Service: Could not connect to DB');
}

async function logAudit(action, actionType, entityId = '-', entityName = '-') {
    try {
        const auditUrl = process.env.AUDIT_SERVICE_URL || 'http://localhost:5005';
        await fetch(`${auditUrl}/api/audit`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                action, action_type: actionType,
                entity_type: 'Course', entity_id: entityId, entity_name: entityName, performed_by: 'admin'
            }),
        });
    } catch (err) {
        console.error('Audit log error:', err.message);
    }
}

// POST /api/courses
app.post('/api/courses', async (req, res) => {
    try {
        const { code, name, credits } = req.body;
        if (!code || !name || !credits) return res.status(400).json({ message: 'code, name, and credits are required' });

        await db.query(
            'INSERT INTO course (code, name, credits) VALUES (?, ?, ?)',
            [code, name, credits]
        );

        await logAudit('Course Added', 'Create', code, name);
        res.status(201).json({ message: 'Course created successfully' });
    } catch (err) {
        if (err.code === 'ER_DUP_ENTRY') return res.status(409).json({ message: 'Course code already exists' });
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

// GET /api/courses
app.get('/api/courses', async (req, res) => {
    try {
        const { search } = req.query;
        let query = 'SELECT *, (SELECT COUNT(*) FROM sms_enrollments.enrollment WHERE course_id = course.id) as enrollment FROM course';
        let params = [];
        if (search) {
            query += ' WHERE code LIKE ? OR name LIKE ?';
            const like = `%${search}%`;
            params = [like, like];
        }
        query += ' ORDER BY code ASC';
        const [rows] = await db.query(query, params);
        res.json(rows);
    } catch (err) {
        console.error(err);
        // If cross-db join fails, fall back without enrollment count
        try {
            const { search } = req.query;
            let query = 'SELECT * FROM course';
            let params = [];
            if (search) {
                query += ' WHERE code LIKE ? OR name LIKE ?';
                const like = `%${search}%`;
                params = [like, like];
            }
            query += ' ORDER BY code ASC';
            const [rows] = await db.query(query, params);
            res.json(rows);
        } catch (err2) {
            res.status(500).json({ message: 'Server error' });
        }
    }
});

// GET /api/courses/:id
app.get('/api/courses/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const [rows] = await db.query('SELECT * FROM course WHERE id = ?', [id]);
        if (rows.length === 0) return res.status(404).json({ message: 'Course not found' });
        res.json(rows[0]);
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});

// PUT /api/courses/:id
app.put('/api/courses/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { code, name, credits } = req.body;

        const [existing] = await db.query('SELECT * FROM course WHERE id = ?', [id]);
        if (existing.length === 0) return res.status(404).json({ message: 'Course not found' });

        await db.query(
            'UPDATE course SET code=?, name=?, credits=? WHERE id=?',
            [code || existing[0].code, name || existing[0].name, credits || existing[0].credits, id]
        );
        await logAudit('Course Updated', 'Update', code || existing[0].code, name || existing[0].name);
        res.json({ message: 'Course updated successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

// DELETE /api/courses/:id
app.delete('/api/courses/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const [existing] = await db.query('SELECT * FROM course WHERE id = ?', [id]);
        if (existing.length === 0) return res.status(404).json({ message: 'Course not found' });

        await db.query('DELETE FROM course WHERE id = ?', [id]);
        await logAudit('Course Deleted', 'Delete', existing[0].code, existing[0].name);
        res.json({ message: 'Course deleted successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

// GET /api/courses/stats/count
app.get('/api/courses/stats/count', async (req, res) => {
    try {
        const [total] = await db.query('SELECT COUNT(*) as total FROM course');
        res.json({ total: total[0].total });
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});

app.get('/health', (req, res) => res.json({ status: 'ok', service: 'course-service' }));

initDB().then(() => {
    app.listen(PORT, () => console.log(`Course Service running on port ${PORT}`));
}).catch(err => {
    console.error('Fatal:', err.message);
    process.exit(1);
});
