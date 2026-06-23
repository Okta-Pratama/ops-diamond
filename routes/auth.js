const express = require('express'); // Tambahkan ini
const router = express.Router();    // Tambahkan ini
const pool = require('../db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

router.post('/login', async (req, res) => {
    const { username, password } = req.body;

    try {
        // 1. Cari user di database
        const userResult = await pool.query('SELECT * FROM users WHERE username = $1', [username]);

        if (userResult.rows.length === 0) {
            return res.status(401).json({ message: "Username tidak terdaftar!" });
        }

        const user = userResult.rows[0];

        // 2. Bandingkan password input dengan hash di database
        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            return res.status(401).json({ message: "Password salah!" });
        }

        // Update last_login
        await pool.query('UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = $1', [user.id]);

        // 3. Jika cocok, buatkan Token JWT
        const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: '24h' });

        res.json({ success: true, token });

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});
module.exports = router;