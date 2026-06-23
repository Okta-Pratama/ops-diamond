const express = require('express');
const router = express.Router();
const pool = require('../db');
const authMiddleware = require('../middlewares/authMiddleware');

// Get all categories (Public)
router.get('/', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM categories ORDER BY name ASC');
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Add new category (Admin/User)
router.post('/', authMiddleware, async (req, res) => {
    const { name } = req.body;
    if (!name || name.trim() === '') {
        return res.status(400).json({ message: 'Nama kategori wajib diisi' });
    }
    try {
        const result = await pool.query(
            'INSERT INTO categories (name) VALUES ($1) ON CONFLICT (name) DO NOTHING RETURNING *',
            [name.trim()]
        );
        if (result.rows.length === 0) {
            const existing = await pool.query('SELECT * FROM categories WHERE name = $1', [name.trim()]);
            return res.status(200).json(existing.rows[0]);
        }
        res.status(201).json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
