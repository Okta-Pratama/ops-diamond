const express = require('express');
const router = express.Router();
const pool = require('../db');
const authMiddleware = require('../middlewares/authMiddleware');

router.get('/stats/chart', authMiddleware, async (req, res) => {
  try {
    // We want the last 6 months of data, grouped by month.
    // We can use generate_series to ensure we get all 6 months even if there's no data.
    const query = `
      WITH months AS (
        SELECT generate_series(
          date_trunc('month', current_date) - interval '5 months',
          date_trunc('month', current_date),
          '1 month'
        ) AS month_start
      )
      SELECT 
        TO_CHAR(m.month_start, 'YYYY-MM') as month,
        TO_CHAR(m.month_start, 'Mon YYYY') as month_label,
        COALESCE(SUM(ds.quantity), 0) as total_sales,
        COALESCE(SUM(sl.amount), 0) as total_salary
      FROM months m
      LEFT JOIN daily_sales ds ON date_trunc('month', ds.sale_date) = m.month_start
      LEFT JOIN salary_logs sl ON date_trunc('month', sl.work_date) = m.month_start
      GROUP BY m.month_start
      ORDER BY m.month_start ASC
    `;
    
    // Wait, the JOIN above will produce a cartesian product if there are multiple sales and multiple salary logs in the same month!
    // We must aggregate them separately first.
    const correctQuery = `
      WITH months AS (
        SELECT generate_series(
          date_trunc('month', current_date) - interval '5 months',
          date_trunc('month', current_date),
          '1 month'
        ) AS month_start
      ),
      monthly_sales AS (
        SELECT date_trunc('month', sale_date) as month_start, SUM(quantity) as total_sales
        FROM daily_sales
        WHERE sale_date >= date_trunc('month', current_date) - interval '5 months'
        GROUP BY 1
      ),
      monthly_salary AS (
        SELECT date_trunc('month', work_date) as month_start, SUM(amount) as total_salary
        FROM salary_logs
        WHERE work_date >= date_trunc('month', current_date) - interval '5 months'
        GROUP BY 1
      )
      SELECT 
        TO_CHAR(m.month_start, 'YYYY-MM') as month,
        TO_CHAR(m.month_start, 'Mon YYYY') as month_label,
        COALESCE(ms.total_sales, 0) as total_sales,
        COALESCE(sl.total_salary, 0) as total_salary
      FROM months m
      LEFT JOIN monthly_sales ms ON m.month_start = ms.month_start
      LEFT JOIN monthly_salary sl ON m.month_start = sl.month_start
      ORDER BY m.month_start ASC
    `;

    const result = await pool.query(correctQuery);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
