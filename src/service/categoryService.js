import pool from '../config/db.js';


export const getAll = async () => {
    const { rows } = await pool.query('SELECT id, name FROM categories ORDER BY name');
    return rows;
}

export const create = async (name) => {
    const { rows } = await pool.query(
        'INSERT INTO categories (name) VALUES ($1) RETURNING id, name',
        [name]
    );
    return rows[0];
}

export const update = async (id, name) => {
    const { rows } = await pool.query(
        'UPDATE categories SET name = $1 WHERE id = $2 RETURNING id, name',
        [name, id]
    );
    return rows[0];
}

export const remove = async (id) => {
    const { rowCount } = await pool.query('DELETE FROM categories WHERE id = $1', [id]);
    return rowCount > 0;
}

export default { getAll, create, update, remove };