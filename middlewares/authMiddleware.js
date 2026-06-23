const jwt = require('jsonwebtoken');

const authMiddleware = (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1]; // Ambil token dari header "Bearer <token>"

    if (!token) {
        return res.status(401).json({ message: 'Token tidak ditemukan' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
        req.user = decoded; // Simpan user info ke request
        next();
    } catch (error) {
        return res.status(403).json({ message: 'Token tidak valid' });
    }
};

module.exports = authMiddleware;
