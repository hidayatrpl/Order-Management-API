import pool from "../config/db.js";

export const getAll = async () => {
    const { rows } = await pool.query(`SELECT p.id, p.name, p.description, p.price, p.stock, c.id AS category_id, c.name AS category_name FROM products p LEFT JOIN categories c ON c.id = p.category_id ORDER BY p.id`);
    return rows;
}

export const getById = async (id) => {
    const { rows } = await pool.query(`SELECT p.id, p.name, p.description, p.price, p.stock, c.id AS category_id, c.name AS category_name FROM products p LEFT JOIN categories c ON c.id = p.category_id WHERE p.id = $1`, [id]);
    return rows[0];
}

export const create = async (name, category_id, price, stock) => {
    const { rows } = await pool.query(`INSERT INTO products (name, category_id, price, stock) VALUES ($1, $2, $3, $4) RETURNING id, name, category_id, price, stock`, [name, category_id, price, stock]);
    return rows[0];
}

export const update = async (id, name, category_id, price, stock) => {
    const { rows } = await pool.query(`UPDATE products SET name = $1, category_id = $2, price = $3, stock = $4 WHERE id = $5 RETURNING id, name, category_id, price, stock`, [name, category_id, price, stock, id]);
    return rows[0];
}

export const remove = async (id) => {
    const { rowCount } = await pool.query('DELETE FROM products WHERE id = $1', [id]);
    return rowCount > 0;
}

export default { getAll, getById, create, update, remove };
