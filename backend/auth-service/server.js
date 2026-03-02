require('dotenv').config();
const express = require('express');
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const fetch = require('node-fetch');

const app = express();
const PORT = 5001;

app.use(cors());
app.use(express.json());

// DB Connection Pool
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
                database: process.env.DB_NAME || 'sms_auth',
                waitForConnections: true,
                connectionLimit: 10,
            });
            await db.query('SELECT 1');
            console.log('Auth Service: DB connected');
            return;
        } catch (err) {
            console.log(`Auth Service: DB connect attempt ${i + 1} failed. Retrying in 3s...`);
            await new Promise(r => setTimeout(r, 3000));
        }
    }
    throw new Error('Auth Service: Could not connect to DB');
}

// Helper to log audit
async function logAudit(action, actionType, entityType = 'Auth', entityId = '-', entityName = '-') {
    try {
        const auditUrl = process.env.AUDIT_SERVICE_URL || 'http://localhost:5005';
        await fetch(`${auditUrl}/api/audit`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action, action_type: actionType, entity_type: entityType, entity_id: entityId, entity_name: entityName, performed_by: 'admin' }),
        });
    } catch (err) {
        console.error('Audit log error:', err.message);
    }
}

// POST /api/auth/login
app.post('/api/auth/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        if (!username || !password) return res.status(400).json({ message: 'Username and password required' });

        const [rows] = await db.query('SELECT * FROM admin WHERE username = ?', [username]);
        if (rows.length === 0) return res.status(401).json({ message: 'Invalid credentials' });

        const admin = rows[0];
        const match = await bcrypt.compare(password, admin.password_hash);
        if (!match) return res.status(401).json({ message: 'Invalid credentials' });

        // Store the previous last_login before updating
        const previousLogin = admin.last_login;

        // Update last_login timestamp to current time
        const loginTime = new Date();
        await db.query('UPDATE admin SET last_login = ? WHERE id = ?', [loginTime, admin.id]);

        const token = jwt.sign(
            { id: admin.id, username: admin.username, full_name: admin.full_name },
            process.env.JWT_SECRET || 'sms_secret_key_2026',
            { expiresIn: '8h' }
        );

        await logAudit('Admin Login', 'Login');

        res.json({
            token,
            admin: { 
                id: admin.id, 
                username: admin.username, 
                full_name: admin.full_name, 
                email: admin.email,
                last_login: previousLogin  // Return the previous login time
            }
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

// POST /api/auth/logout
app.post('/api/auth/logout', async (req, res) => {
    try {
        await logAudit('Admin Logout', 'Logout');
        res.json({ message: 'Logged out successfully' });
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});

// GET /api/auth/profile
app.get('/api/auth/profile', async (req, res) => {
    try {
        const [rows] = await db.query('SELECT id, username, full_name, email, last_login, created_at FROM admin LIMIT 1');
        if (rows.length === 0) return res.status(404).json({ message: 'Admin not found' });
        res.json(rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

// Health check
app.get('/health', (req, res) => res.json({ status: 'ok', service: 'auth-service' }));

// Seed admin if table is empty
async function seedAdmin() {
    const [rows] = await db.query('SELECT COUNT(*) as cnt FROM admin');
    if (rows[0].cnt === 0) {
        const defaultPassword = 'Admin@1234';
        const hash = await bcrypt.hash(defaultPassword, 10);
        await db.query(
            `INSERT INTO admin (username, password_hash, full_name, email) VALUES (?, ?, ?, ?)`,
            ['admin', hash, 'System Administrator', 'admin@kdu.ac.lk']
        );
        console.log('Auth Service: Default admin seeded (username: admin, password: Admin@1234)');
    }
}

initDB().then(async () => {
    await seedAdmin();
    app.listen(PORT, () => console.log(`Auth Service running on port ${PORT}`));
}).catch(err => {
    console.error('Fatal:', err.message);
    process.exit(1);
});
