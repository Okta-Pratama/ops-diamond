const express = require('express');
const router = express.Router();
const pool = require('../db');
const authMiddleware = require('../middlewares/authMiddleware');

// Get all feedbacks (Admin Only)
router.get('/', authMiddleware, async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM feedbacks ORDER BY created_at DESC');
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Add new feedback (Public)
router.post('/', async (req, res) => {
    const { message } = req.body;
    if (!message || message.trim() === '') {
        return res.status(400).json({ message: 'Pesan wajib diisi' });
    }
    try {
        const result = await pool.query(
            'INSERT INTO feedbacks (message) VALUES ($1) RETURNING *',
            [message.trim()]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Delete feedback (Admin Only)
router.delete('/:id', authMiddleware, async (req, res) => {
    try {
        await pool.query('DELETE FROM feedbacks WHERE id = $1', [req.params.id]);
        res.json({ message: 'Pesan berhasil dihapus' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
