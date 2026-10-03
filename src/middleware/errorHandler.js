const PG_ERRORS = {
    '23505': { status: 409, message: 'Data sudah ada (duplikat)' },
    '23503': { status: 409, message: 'Data terkait tidak ditemukan atau masih dipakai' },
    '23514': { status: 400, message: 'Data melanggar aturan validasi' },
    '22P02': { status: 400, message: 'Format input tidak valid' },
};

export default (err, req, res, next) => {
    let status, message;

    if (err.type === 'entity.parse.failed') {
        status = 400;
        message = 'Body request bukan JSON yang valid';
    } else if (err.code === '23503') {
        status = 409;
        message = /still referenced/.test(err.detail || '')
            ? 'Data masih dipakai oleh data lain'
            : 'Data referensi (misal category_id) tidak ditemukan';
    } else if (PG_ERRORS[err.code]) {
        ({ status, message } = PG_ERRORS[err.code]);
    } else {
        console.error(err);
        status = err.status || 500;
        message = status === 500 ? 'Internal server error' : err.message;
    }

    res.status(status).json({ payload: { data: null }, message });
};