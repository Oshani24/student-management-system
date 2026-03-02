require('dotenv').config();
const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');
const fetch = require('node-fetch');

const app = express();
const PORT = 5002;

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
                database: process.env.DB_NAME || 'sms_students',
                waitForConnections: true,
                connectionLimit: 10,
            });
            await db.query('SELECT 1');
            console.log('Student Service: DB connected');
            return;
        } catch (err) {
            console.log(`Student Service: DB connect attempt ${i + 1} failed. Retrying...`);
            await new Promise(r => setTimeout(r, 3000));
        }
    }
    throw new Error('Student Service: Could not connect to DB');
}

// Helper to log audit
async function logAudit(action, actionType, entityId = '-', entityName = '-') {
    try {
        const auditUrl = process.env.AUDIT_SERVICE_URL || 'http://localhost:5005';
        await fetch(`${auditUrl}/api/audit`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                action, action_type: actionType,
                entity_type: 'Student', entity_id: entityId, entity_name: entityName, performed_by: 'admin'
            }),
        });
    } catch (err) {
        console.error('Audit log error:', err.message);
    }
}

// Degree program → prefix map
const DEGREE_PREFIX = {
    'Software Engineering': 'BSE',
    'Computer Science': 'BCS',
    'Information System': 'BIS',
    'Information Technology': 'BIT',
};

// Generate unique student number atomically
async function generateStudentNumber(degreeProgram) {
    const prefix = DEGREE_PREFIX[degreeProgram];
    if (!prefix) throw new Error('Invalid degree program');

    const intakeYear = process.env.INTAKE_YEAR || '26';

    const conn = await db.getConnection();
    try {
        await conn.beginTransaction();

        await conn.query(
            'SELECT last_sequence FROM student_number_counter WHERE degree_code = ? FOR UPDATE',
            [prefix]
        );
        await conn.query(
            'UPDATE student_number_counter SET last_sequence = last_sequence + 1 WHERE degree_code = ?',
            [prefix]
        );
        const [rows] = await conn.query(
            'SELECT last_sequence FROM student_number_counter WHERE degree_code = ?',
            [prefix]
        );
        await conn.commit();

        const seq = String(rows[0].last_sequence).padStart(4, '0');
        return `${prefix}/${intakeYear}/${seq}`;
    } catch (err) {
        await conn.rollback();
        throw err;
    } finally {
        conn.release();
    }
}

// POST /api/students — Register new student
app.post('/api/students', async (req, res) => {
    try {
        const { first_name, last_name, email, phone, address, nic, date_of_birth, degree_program, academic_year, semester } = req.body;

        if (!first_name || !last_name || !email || !phone || !address || !degree_program) {
            return res.status(400).json({ message: 'Required fields: first_name, last_name, email, phone, address, degree_program' });
        }

        const student_number = await generateStudentNumber(degree_program);

        await db.query(
            `INSERT INTO student 
       (student_number, first_name, last_name, email, phone, address, nic, date_of_birth, degree_program, academic_year, semester)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [student_number, first_name, last_name, email, phone, address, nic || null, date_of_birth || null, degree_program, academic_year || null, semester || null]
        );

        await logAudit('Student Registered', 'Create', student_number, `${first_name} ${last_name}`);

        res.status(201).json({ message: 'Student registered successfully', student_number });
    } catch (err) {
        console.error(err);
        if (err.code === 'ER_DUP_ENTRY') return res.status(409).json({ message: 'Duplicate email or student number' });
        res.status(500).json({ message: 'Server error', detail: err.message });
    }
});

// GET /api/students — List all students (with optional ?search=)
app.get('/api/students', async (req, res) => {
    try {
        const { search } = req.query;
        let query = 'SELECT * FROM student';
        let params = [];
        if (search) {
            query += ' WHERE student_number LIKE ? OR first_name LIKE ? OR last_name LIKE ? OR CONCAT(first_name, " ", last_name) LIKE ?';
            const like = `%${search}%`;
            params = [like, like, like, like];
        }
        query += ' ORDER BY registered_date DESC';
        const [rows] = await db.query(query, params);
        res.json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

// GET /api/students/:studentNumber — Get student details
app.get('/api/students/:studentNumber', async (req, res) => {
    try {
        const { studentNumber } = req.params;
        const [rows] = await db.query('SELECT * FROM student WHERE student_number = ?', [studentNumber]);
        if (rows.length === 0) return res.status(404).json({ message: 'Student not found' });
        res.json(rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

// PUT /api/students/:studentNumber — Update student
app.put('/api/students/:studentNumber', async (req, res) => {
    try {
        const { studentNumber } = req.params;
        const { first_name, last_name, email, phone, address, nic, date_of_birth, degree_program, academic_year, semester } = req.body;

        const [existing] = await db.query('SELECT * FROM student WHERE student_number = ?', [studentNumber]);
        if (existing.length === 0) return res.status(404).json({ message: 'Student not found' });

        await db.query(
            `UPDATE student SET first_name=?, last_name=?, email=?, phone=?, address=?, nic=?, date_of_birth=?, degree_program=?, academic_year=?, semester=?
       WHERE student_number=?`,
            [
                first_name || existing[0].first_name,
                last_name || existing[0].last_name,
                email || existing[0].email,
                phone || existing[0].phone,
                address || existing[0].address,
                nic !== undefined ? nic : existing[0].nic,
                date_of_birth !== undefined ? date_of_birth : existing[0].date_of_birth,
                degree_program || existing[0].degree_program,
                academic_year !== undefined ? academic_year : existing[0].academic_year,
                semester !== undefined ? semester : existing[0].semester,
                studentNumber
            ]
        );

        await logAudit('Student Updated', 'Update', studentNumber, `${first_name || existing[0].first_name} ${last_name || existing[0].last_name}`);
        res.json({ message: 'Student updated successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

// DELETE /api/students/:studentNumber — Delete student
app.delete('/api/students/:studentNumber', async (req, res) => {
    try {
        const { studentNumber } = req.params;
        const [existing] = await db.query('SELECT * FROM student WHERE student_number = ?', [studentNumber]);
        if (existing.length === 0) return res.status(404).json({ message: 'Student not found' });

        const studentName = `${existing[0].first_name} ${existing[0].last_name}`;
        await db.query('DELETE FROM student WHERE student_number = ?', [studentNumber]);
        await logAudit('Student Deleted', 'Delete', studentNumber, studentName);

        res.json({ message: 'Student deleted successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

// GET /api/students/count — Count stats
app.get('/api/students/stats/count', async (req, res) => {
    try {
        const [total] = await db.query('SELECT COUNT(*) as total FROM student');
        const [byCourse] = await db.query('SELECT degree_program, COUNT(*) as count FROM student GROUP BY degree_program');
        res.json({ total: total[0].total, by_degree: byCourse });
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});

// Health check
app.get('/health', (req, res) => res.json({ status: 'ok', service: 'student-service' }));

initDB().then(() => {
    app.listen(PORT, () => console.log(`Student Service running on port ${PORT}`));
}).catch(err => {
    console.error('Fatal:', err.message);
    process.exit(1);
});
