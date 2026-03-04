require('dotenv').config();
const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');

const app = express();
const PORT = 5005;

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
                database: process.env.DB_NAME || 'sms_audit',
                waitForConnections: true,
                connectionLimit: 10,
            });
            await db.query('SELECT 1');
            console.log('Audit Service: DB connected');
            return;
        } catch (err) {
            console.log(`Audit Service: DB connect attempt ${i + 1} failed. Retrying...`);
            await new Promise(r => setTimeout(r, 3000));
        }
    }
    throw new Error('Audit Service: Could not connect to DB');
}

// POST /api/audit — Create a log entry (called internally by other services)
app.post('/api/audit', async (req, res) => {
    try {
        const { action, action_type, entity_type, entity_id, entity_name, performed_by } = req.body;
        if (!action || !action_type) return res.status(400).json({ message: 'action and action_type are required' });

        await db.query(
            `INSERT INTO audit_log (action, action_type, entity_type, entity_id, entity_name, performed_by)
       VALUES (?, ?, ?, ?, ?, ?)`,
            [action, action_type, entity_type || null, entity_id || null, entity_name || null, performed_by || 'admin']
        );
        res.status(201).json({ message: 'Log created' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

// GET /api/audit — List logs with optional filters
app.get('/api/audit', async (req, res) => {
    try {
        const { actionType, fromDate, toDate } = req.query;

        let query = 'SELECT * FROM audit_log WHERE 1=1';
        const params = [];

        if (actionType && actionType !== 'All Actions') {
            query += ' AND action_type = ?';
            params.push(actionType);
        }
        if (fromDate) {
            query += ' AND DATE(created_at) >= ?';
            params.push(fromDate);
        }
        if (toDate) {
            query += ' AND DATE(created_at) <= ?';
            params.push(toDate);
        }

        query += ' ORDER BY created_at DESC';

        const [rows] = await db.query(query, params);
        res.json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

app.get('/health', (req, res) => res.json({ status: 'ok', service: 'audit-service' }));

initDB().then(() => {
    app.listen(PORT, () => console.log(`Audit Service running on port ${PORT}`));
}).catch(err => {
    console.error('Fatal:', err.message);
    process.exit(1);
});
