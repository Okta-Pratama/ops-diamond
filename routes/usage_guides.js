const express = require('express');
const router = express.Router();
const pool = require('../db');
const authMiddleware = require('../middlewares/authMiddleware');

// 1. Ambil Semua Cara Pakai (Public / Admin)
router.get('/', async (req, res) => {
    try {
        const query = `
            SELECT u.*, p.name AS product_name 
            FROM usage_guides u
            LEFT JOIN products p ON u.product_id = p.id
            ORDER BY u.id DESC
        `;
        const result = await pool.query(query);
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 2. Tambah Cara Pakai Baru (Admin Only)
router.post('/', authMiddleware, async (req, res) => {
    const { product_id, title, description, video_url, image_url } = req.body;
    if (!product_id || !title) {
        return res.status(400).json({ error: "Product dan Judul Cara Pakai wajib diisi!" });
    }

    try {
        // Cek apakah produk ini sudah memiliki cara pakai (karena product_id UNIQUE)
        const checkExist = await pool.query("SELECT id FROM usage_guides WHERE product_id = $1", [product_id]);
        if (checkExist.rows.length > 0) {
            return res.status(400).json({ error: "Produk yang dipilih sudah memiliki Cara Pakai!" });
        }

        const query = `
            INSERT INTO usage_guides (product_id, title, description, video_url, image_url)
            VALUES ($1, $2, $3, $4, $5) RETURNING *`;
        const values = [product_id, title, description || null, video_url || null, image_url || null];
        const result = await pool.query(query, values);
        res.status(201).json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 3. Update Cara Pakai (Admin Only)
router.put('/:id', authMiddleware, async (req, res) => {
    const { id } = req.params;
    const { product_id, title, description, video_url, image_url } = req.body;

    if (!product_id || !title) {
        return res.status(400).json({ error: "Product dan Judul Cara Pakai wajib diisi!" });
    }

    try {
        // Cek apakah product_id sudah digunakan oleh cara pakai lain (selain cara pakai saat ini)
        const checkExist = await pool.query("SELECT id FROM usage_guides WHERE product_id = $1 AND id <> $2", [product_id, id]);
        if (checkExist.rows.length > 0) {
            return res.status(400).json({ error: "Produk yang dipilih sudah memiliki Cara Pakai lain!" });
        }

        const query = `
            UPDATE usage_guides 
            SET product_id = $1, title = $2, description = $3, video_url = $4, image_url = $5 
            WHERE id = $6 RETURNING *`;
        const values = [product_id, title, description || null, video_url || null, image_url || null, id];
        const result = await pool.query(query, values);
        
        if (result.rows.length === 0) {
            return res.status(404).json({ error: "Cara Pakai tidak ditemukan" });
        }
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 4. Hapus Cara Pakai (Admin Only)
router.delete('/:id', authMiddleware, async (req, res) => {
    const { id } = req.params;
    const { password } = req.body;

    if (!password) {
        return res.status(400).json({ message: 'Password admin wajib dimasukkan' });
    }

    try {
        // Verifikasi password admin
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

        const result = await pool.query('DELETE FROM usage_guides WHERE id = $1 RETURNING *', [id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: "Cara Pakai tidak ditemukan" });
        }
        res.json({ message: "Cara Pakai berhasil dihapus" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
