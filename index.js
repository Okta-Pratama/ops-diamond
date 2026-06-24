const express = require('express');
const cors = require('cors');
require('dotenv').config();

// Import Routes
const authRoutes = require('./routes/auth');
const payrollRoutes = require('./routes/payroll');
const productRoutes = require('./routes/products');
const storeRoutes = require('./routes/stores');
const faqRoutes = require('./routes/faq');
const categoryRoutes = require('./routes/categories');
const feedbackRoutes = require('./routes/feedbacks');
const usageGuideRoutes = require('./routes/usage_guides');
const dailySalesRoutes = require('./routes/daily_sales');
const dashboardRoutes = require('./routes/dashboard');
const authMiddleware = require('./middlewares/authMiddleware');

const app = express();

app.use(cors());
app.use(express.json());

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/payroll', authMiddleware, payrollRoutes);
app.use('/api/products', productRoutes);
app.use('/api/stores', storeRoutes);
app.use('/api/faqs', faqRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/feedbacks', feedbackRoutes);
app.use('/api/usage-guides', usageGuideRoutes);
app.use('/api/daily-sales', dailySalesRoutes);
app.use('/api/dashboard', dashboardRoutes);

// Health check
app.get('/api/health', async (req, res) => {
    const pool = require('./db');
    try {
        const result = await pool.query('SELECT NOW() as time');
        res.json({ status: 'ok', db: 'connected', time: result.rows[0].time });
    } catch (err) {
        res.status(500).json({
            status: 'error',
            message: err.message,
            code: err.code
        });
    }
});

if (process.env.NODE_ENV !== 'production') {
    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => {
        console.log(`Server jalan di port ${PORT}`);
    });
}

module.exports = app;