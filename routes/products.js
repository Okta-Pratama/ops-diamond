const express = require('express');
const router = express.Router();
const pool = require('../db');
const authMiddleware = require('../middlewares/authMiddleware');

// 1. Ambil Semua Produk (Public - Untuk Client)
router.get('/', async (req, res) => {
    try {
        const { category, minPrice, maxPrice, store_id } = req.query;
        let query = `
            SELECT p.*, 
                   u.id AS usage_guide_id,
                   u.title AS usage_guide_title,
                   u.description AS usage_guide_description,
                   u.video_url AS usage_guide_video_url,
                   u.image_url AS usage_guide_image_url
            FROM products p
            LEFT JOIN usage_guides u ON p.id = u.product_id
            WHERE p.is_deleted = FALSE
        `;
        let params = [];

        // Logika Filter
        if (category) {
            params.push(category);
            query += ` AND p.category ILIKE '%' || $${params.length} || '%'`;
        }
        if (minPrice) {
            params.push(minPrice);
            query += ` AND COALESCE(p.price_max, p.price) >= $${params.length}`;
        }
        if (maxPrice) {
            params.push(maxPrice);
            query += ` AND p.price <= $${params.length}`;
        }
        if (store_id) {
            params.push(store_id);
            query += ` AND $${params.length}::text = ANY(string_to_array(p.store_id, ','))`;
        }
        if (req.query.inStock === 'true') {
            query += ` AND p.stock > 0`;
        }

        const result = await pool.query(query, params);
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 2. Tambah Produk Baru (Admin Only)
router.post('/', authMiddleware, async (req, res) => {
    const { store_id, name, description, price, price_max, stock, weight, size, category, shelf_life, image_url, store_links } = req.body;
    try {
        const query = `
            INSERT INTO products (store_id, name, description, price, price_max, stock, weight, size, category, shelf_life, image_url, store_links)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) RETURNING *`;
        const values = [store_id, name, description, price, price_max || null, stock, weight, size, category, shelf_life || null, image_url, store_links || {}];
        const result = await pool.query(query, values);
        res.status(201).json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 3. Update Produk (Admin Only)
router.put('/:id', authMiddleware, async (req, res) => {
    const { id } = req.params;
    const fields = { ...req.body };
    
    // Clean out joined fields and non-columns
    const allowedColumns = ['store_id', 'name', 'description', 'price', 'price_max', 'stock', 'weight', 'size', 'category', 'shelf_life', 'image_url', 'store_links', 'is_deleted'];
    Object.keys(fields).forEach(key => {
        if (!allowedColumns.includes(key)) {
            delete fields[key];
        }
    });

    if (Object.keys(fields).length === 0) {
        return res.status(400).json({ error: "Tidak ada field valid yang diperbarui" });
    }

    const setClause = Object.keys(fields).map((key, index) => `${key} = $${index + 1}`).join(', ');
    const values = Object.values(fields);

    try {
        const query = `UPDATE products SET ${setClause} WHERE id = $${values.length + 1} RETURNING *`;
        const result = await pool.query(query, [...values, id]);
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 4. Soft Delete Produk (Admin Only)
router.delete('/:id', authMiddleware, async (req, res) => {
    const { id } = req.params;
    const { password } = req.body;
    if (!password) {
        return res.status(400).json({ message: 'Password admin wajib dimasukkan' });
    }

    try {
        // 1. Verifikasi password admin
        const userResult = await pool.query('SELECT * FROM users WHERE id = $1', [req.user.id]);
        if (userResult.rows.length === 0) {
            return res.status(401).json({ message: 'User tidak ditemukan' });
        }
        const adminUser = userResult.rows[0];

        const bcrypt = require('bcryptjs');
        const isMatch = await bcrypt.compare(password, adminUser.password);
        if (!isMatch) {
            return res.status(401).json({ message: 'Password admin salah!' });
        }

        // 2. Soft Delete
        await pool.query('UPDATE products SET is_deleted = TRUE WHERE id = $1', [id]);
        res.json({ message: "Produk berhasil dihapus (soft delete)" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;