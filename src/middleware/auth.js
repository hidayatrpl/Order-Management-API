import jwt from "jsonwebtoken";
import dotenv from "dotenv";
dotenv.config();

export const unathourized = (res, message) => {
    return res.status(401).json({ payload: { data: null }, message });
};

export const authenticate = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return unathourized(res, 'Token tidak ditemukan');
    }
    const [schema, token] = authHeader.split(' ');
    if (schema !== 'Bearer' || !token) {
        return unathourized(res, 'Token tidak ditemukan');
    }
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    } catch (error) {
        const message = error.name === 'TokenExpiredError' ? 'Token kadaluarsa' : 'Token tidak valid';
        return unathourized(res, message);
    }
};

export const authorize = (...roles) => (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
        return res.status(403).json({ payload: { data: null }, message: 'Akses ditolak' });
    }
    next();
};