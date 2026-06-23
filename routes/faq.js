const express = require('express');
const router = express.Router();
const pool = require('../db');
const authMiddleware = require('../middlewares/authMiddleware');

// Get all FAQ (Public)
router.get('/', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM faqs ORDER BY id ASC');
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// CRUD FAQ (Admin Only)
router.post('/', authMiddleware, async (req, res) => {
    const { question, answer } = req.body;
    try {
        const result = await pool.query(
            'INSERT INTO faqs (question, answer) VALUES ($1, $2) RETURNING *',
            [question, answer]
        );
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.put('/:id', authMiddleware, async (req, res) => {
    const { question, answer } = req.body;
    try {
        const result = await pool.query(
            'UPDATE faqs SET question = $1, answer = $2 WHERE id = $3 RETURNING *',
            [question, answer, req.params.id]
        );
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.delete('/:id', authMiddleware, async (req, res) => {
    try {
        await pool.query('DELETE FROM faqs WHERE id = $1', [req.params.id]);
        res.json({ message: "FAQ dihapus" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;