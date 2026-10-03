import authService from "../service/authService.js";
import response from "../../response.js";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const register = async (req, res, next) => {
    try {
        const { name, email, password } = req.body;
        if (!name || typeof name !== 'string' || !name.trim()) {
            return response(400, null, 'Nama wajib diisi', res);
        }
        if (!email || typeof email !== 'string' || !email.trim()) {
            return response(400, null, 'Email wajib diisi', res);
        }
        if (!EMAIL_REGEX.test(email.trim())) {
            return response(400, null, 'Format email tidak valid', res);
        }
        if (!password || typeof password !== 'string' || password.length < 6) {
            return response(400, null, 'Password minimal 6 karakter', res);
        }
        const user = await authService.register(name.trim(), email.trim(), password);
        response(201, user, 'Berhasil membuat data', res);
    } catch (err) {
        next(err);
    }
};

export const login = async (req, res, next) => {
    try {
        const { email, password } = req.body;
        if (!email || typeof email !== 'string' || !email.trim()) {
            return response(400, null, 'Email wajib diisi', res);
        }
        if (!password || typeof password !== 'string' || !password.trim()) {
            return response(400, null, 'Password wajib diisi', res);
        }
        const data = await authService.login(email.trim(), password.trim());
        response(200, data, 'Login berhasil', res);
    } catch (err) {
        next(err);
    }
};

export const me = async (req, res, next) => {
    try {
        const user = await authService.me(req.user.id);
        if (!user) {
            return response(404, null, 'User tidak ditemukan', res);
        }
        response(200, user, 'Data profil berhasil diambil', res);
    } catch (err) {
        next(err);
    }
};

export default { register, login, me };