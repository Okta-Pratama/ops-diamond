const express = require('express');
const router = express.Router();
const pool = require('../db');
const authMiddleware = require('../middlewares/authMiddleware');

// Ambil semua daftar toko (Public)
router.get('/', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM stores ORDER BY id ASC');
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Update data toko (Admin Only) - Misal ganti link Shopee
router.put('/:id', authMiddleware, async (req, res) => {
    const { id } = req.params;
    const { name, shopee_url, lazada_url, topedia_url, tiktok_url, is_active, is_shopee_active, is_lazada_active, is_tokopedia_active, is_tiktok_active } = req.body;
    try {
        const result = await pool.query(
            'UPDATE stores SET name = $1, shopee_url = $2, lazada_url = $3, topedia_url = $4, tiktok_url = $5, is_active = $6, is_shopee_active = $7, is_lazada_active = $8, is_tokopedia_active = $9, is_tiktok_active = $10 WHERE id = $11 RETURNING *',
            [name, shopee_url, lazada_url, topedia_url, tiktok_url, is_active !== undefined ? is_active : true, is_shopee_active !== undefined ? is_shopee_active : true, is_lazada_active !== undefined ? is_lazada_active : true, is_tokopedia_active !== undefined ? is_tokopedia_active : true, is_tiktok_active !== undefined ? is_tiktok_active : true, id]
        );
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Tambah toko baru (Admin Only)
router.post('/', authMiddleware, async (req, res) => {
    const { name, shopee_url, lazada_url, topedia_url, tiktok_url, is_active, is_shopee_active, is_lazada_active, is_tokopedia_active, is_tiktok_active } = req.body;
    if (!name || name.trim() === '') {
        return res.status(400).json({ message: 'Nama toko wajib diisi' });
    }
    try {
        const result = await pool.query(
            'INSERT INTO stores (name, shopee_url, lazada_url, topedia_url, tiktok_url, is_active, is_shopee_active, is_lazada_active, is_tokopedia_active, is_tiktok_active) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *',
            [name.trim(), shopee_url || null, lazada_url || null, topedia_url || null, tiktok_url || null, is_active !== undefined ? is_active : true, is_shopee_active !== undefined ? is_shopee_active : true, is_lazada_active !== undefined ? is_lazada_active : true, is_tokopedia_active !== undefined ? is_tokopedia_active : true, is_tiktok_active !== undefined ? is_tiktok_active : true]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Hapus toko (Admin Only)
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

        // 2. Hapus toko
        await pool.query('DELETE FROM stores WHERE id = $1', [id]);
        res.json({ message: 'Toko berhasil dihapus' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;