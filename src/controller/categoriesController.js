import service from '../service/categoryService.js';
import response from '../../response.js';

export const list = async (req, res, next) => {
    try {
        response(200, await service.getAll(), 'Berhasil mengambil data', res);
    } catch (err) { next(err); }
};

export const create = async (req, res, next) => {
    try {
        const { name } = req.body;
        if (!name || typeof name !== 'string' || !name.trim()) {
            return response(400, null, 'name wajib diisi', res);
        }
        response(201, await service.create(name.trim()), 'Berhasil membuat data', res);
    } catch (err) { next(err); }
};

export const update = async (req, res, next) => {
    try {
        const { name } = req.body;
        if (!name || typeof name !== 'string' || !name.trim()) {
            return response(400, null, 'name wajib diisi', res);
        }
        const category = await service.update(req.params.id, name.trim());
        if (!category) return response(404, null, 'Kategori tidak ditemukan', res);
        response(200, category, 'Berhasil memperbarui data', res);
    } catch (err) { next(err); }
};

export const remove = async (req, res, next) => {
    try {
        const ok = await service.remove(req.params.id);
        if (!ok) return response(404, null, 'Kategori tidak ditemukan', res);
        response(204, null, 'Berhasil menghapus data', res);
    } catch (err) { next(err); }
};

export default { list, create, update, remove };