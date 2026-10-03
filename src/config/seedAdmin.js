import dotenv from 'dotenv';
dotenv.config();
import pool from '../config/db.js';
import bcrypt from 'bcrypt';

async function seedAdmin() {
    const { ADMIN_EMAIL, ADMIN_PASSWORD } = process.env;
    if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
        throw new Error('ADMIN_EMAIL dan ADMIN_PASSWORD wajib diisi di .env');
    }
    const hash = await bcrypt.hash(ADMIN_PASSWORD, 10);
    await pool.query(
        `INSERT INTO users (name, email, password_hash, role, created_at)
        VALUES ('Admin', $1, $2, 'admin', $3)
        ON CONFLICT (email) DO UPDATE 
        SET password_hash = EXCLUDED.password_hash, role = 'admin'
`,
        [ADMIN_EMAIL.trim().toLowerCase(), hash, new Date()]
    );
    console.log('Admin siap:', ADMIN_EMAIL);
}

seedAdmin()
    .catch(err => { console.error(err.message); process.exitCode = 1; })
    .finally(() => pool.end());