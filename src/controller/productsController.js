import service from '../service/productService.js';
import response from '../../response.js';
import { parsePrice, parseStock } from '../utils/validators.js';
export const list = async (req, res, next) => {
    try {
        response(200, await service.getAll(), 'Berhasil mengambil data', res);
    } catch (err) { next(err); }
};

export const getById = async (req, res, next) => {
    try {
        const product = await service.getById(req.params.id);
        if (!product) return response(404, null, 'Produk tidak ditemukan', res);
        response(200, product, 'Berhasil mengambil data', res);
    } catch (err) { next(err); }
};

export const create = async (req, res, next) => {
    try {
        let { name, category_id, price, stock } = req.body;
        if (!name || typeof name !== 'string' || !name.trim()) {
            return response(400, null, 'name wajib diisi', res);
        }
        if (category_id === undefined || category_id === null || typeof category_id !== 'number' || category_id <= 0) {
            return response(400, null, 'category_id harus berupa integer positif', res);
        }
        if (price === undefined || price === null) {
            return response(400, null, 'price wajib diisi', res);
        }
        const validPrice = parsePrice(price);
        if (validPrice === null) {
            return response(400, null, 'price harus berupa angka positif', res);
        }
        if (stock === undefined || stock === null) {
            return response(400, null, 'stock wajib diisi', res);
        }
        const validStock = parseStock(stock);
        if (validStock === null) {
            return response(400, null, 'stock harus berupa integer positif', res);
        }
        response(201, await service.create(name.trim(), category_id, price, stock), 'Berhasil membuat data', res);
    } catch (err) { next(err); }
};

export const update = async (req, res, next) => {
    try {
        let { name, category_id, price, stock } = req.body;
        if (!name || typeof name !== 'string' || !name.trim()) {
            return response(400, null, 'name wajib diisi', res);
        }
        if (category_id !== null && (typeof category_id !== 'number' || category_id <= 0 || !Number.isInteger(category_id))) {
            return response(400, null, 'category_id harus berupa integer positif', res);
        }
        if (price !== null) {
            const validPrice = parsePrice(price);
            if (validPrice === null) return response(400, null, 'price harus berupa angka positif', res);
            price = validPrice;
        }
        if (stock !== null) {
            const validStock = parseStock(stock);
            if (validStock === null) return response(400, null, 'stock harus berupa bilangan bulat positif', res);
            stock = validStock;
        }
        const product = await service.update(req.params.id, name.trim(), category_id, price, stock);
        if (!product) return response(404, null, 'Produk tidak ditemukan', res);
        response(200, product, 'Berhasil memperbarui data', res);
    } catch (err) { next(err); }
};

export const remove = async (req, res, next) => {
    try {
        const ok = await service.remove(req.params.id);
        if (!ok) return response(404, null, 'Produk tidak ditemukan', res);
        response(204, null, 'Berhasil menghapus data', res);
    } catch (err) { next(err); }
};

export default { list, getById, create, update, remove };
