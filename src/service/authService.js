import pool from "../config/db.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import dotenv from "dotenv";
dotenv.config();

export const register = async (name, email, password, role = 'customer', created_at = new Date()) => {
    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const result = await pool.query(
            'INSERT INTO users (name, email, password_hash, role, created_at) VALUES ($1, $2, $3, $4, $5) RETURNING id, name, email, role, created_at',
            [name.trim(), email.trim().toLowerCase(), hashedPassword, role, created_at]
        );
        return result.rows[0];
    } catch (error) {
        if (error.code === '23505') {
            const err = new Error('Email sudah terdaftar');
            err.status = 409;
            throw err;
        }
        throw error;
    }
}

export const login = async (email, password) => {
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email.trim().toLowerCase()]);
    const user = result.rows[0];

    if (!user || !(await bcrypt.compare(password, user.password_hash))) {
        const err = new Error('Email atau password salah');
        err.status = 401;
        throw err;
    }

    const token = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_IN
    });

    return {
        token,
        user: {
            id: user.id,
            role: user.role
        }
    };
};


export const me = async (id) => {
    try {
        const result = await pool.query('SELECT id, name, email, role FROM users WHERE id = $1', [id]);
        return result.rows[0];
    } catch (error) {
        throw error;
    }
}

export default {
    register,
    login,
    me
}