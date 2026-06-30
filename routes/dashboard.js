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
        SELECT date_trunc('month', sl.work_date) as month_start, SUM(sl.amount + COALESCE(w.total_amount, 0)) as total_salary
        FROM salary_logs sl
        LEFT JOIN withdrawals w ON sl.withdrawal_id = w.id
        WHERE sl.work_date >= date_trunc('month', current_date) - interval '5 months'
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

router.get('/stats/chart/weekly', authMiddleware, async (req, res) => {
  try {
    const query = `
      WITH days AS (
        SELECT generate_series(
          current_date - interval '6 days',
          current_date,
          '1 day'
        ) AS day_start
      ),
      daily_sales AS (
        SELECT date_trunc('day', sale_date) as day_start, SUM(quantity) as total_sales
        FROM daily_sales
        WHERE sale_date >= current_date - interval '6 days'
        GROUP BY 1
      ),
      daily_salary AS (
        SELECT date_trunc('day', sl.work_date) as day_start, SUM(sl.amount + COALESCE(w.total_amount, 0)) as total_salary
        FROM salary_logs sl
        LEFT JOIN withdrawals w ON sl.withdrawal_id = w.id
        WHERE sl.work_date >= current_date - interval '6 days'
        GROUP BY 1
      )
      SELECT 
        TO_CHAR(d.day_start, 'YYYY-MM-DD') as date,
        TO_CHAR(d.day_start, 'DD Mon') as day_label,
        COALESCE(ds.total_sales, 0) as total_sales,
        COALESCE(sl.total_salary, 0) as total_salary
      FROM days d
      LEFT JOIN daily_sales ds ON d.day_start = ds.day_start
      LEFT JOIN daily_salary sl ON d.day_start = sl.day_start
      ORDER BY d.day_start ASC
    `;

    const result = await pool.query(query);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/stats/stores', authMiddleware, async (req, res) => {
  try {
    const { range } = req.query; 
    let timeFilter = "ds.sale_date >= date_trunc('month', current_date) - interval '5 months'";
    if (range === 'weekly') {
      timeFilter = "ds.sale_date >= current_date - interval '6 days'";
    }

    const query = `
      SELECT 
        s.id, 
        s.name, 
        COALESCE(SUM(ds.quantity), 0) as total_sales
      FROM stores s
      LEFT JOIN daily_sales ds ON s.id = ds.store_id AND ${timeFilter}
      WHERE s.is_active = true
      GROUP BY s.id, s.name
      ORDER BY total_sales DESC
    `;
    const result = await pool.query(query);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/stats/stores/timeseries', authMiddleware, async (req, res) => {
  try {
    const { range } = req.query;
    let timeSeriesCTE = `
      SELECT generate_series(
        date_trunc('month', current_date) - interval '5 months',
        date_trunc('month', current_date),
        '1 month'
      ) AS ts_start
    `;
    let dateTruncUnit = 'month';
    let dateLabelFormat = 'Mon YYYY';
    let dateFormat = 'YYYY-MM';

    if (range === 'weekly') {
      timeSeriesCTE = `
        SELECT generate_series(
          current_date - interval '6 days',
          current_date,
          '1 day'
        ) AS ts_start
      `;
      dateTruncUnit = 'day';
      dateLabelFormat = 'DD Mon';
      dateFormat = 'YYYY-MM-DD';
    }

    const query = `
      WITH time_series AS (
        ${timeSeriesCTE}
      )
      SELECT 
        TO_CHAR(ts.ts_start, '${dateFormat}') as date,
        TO_CHAR(ts.ts_start, '${dateLabelFormat}') as label,
        s.name as store_name,
        COALESCE(SUM(ds.quantity), 0) as total_sales
      FROM time_series ts
      CROSS JOIN stores s
      LEFT JOIN daily_sales ds ON s.id = ds.store_id AND date_trunc('${dateTruncUnit}', ds.sale_date) = ts.ts_start
      WHERE s.is_active = true
      GROUP BY ts.ts_start, s.name
      ORDER BY ts.ts_start ASC, s.name ASC
    `;
    const result = await pool.query(query);
    
    // Pivot data for Recharts
    // Format required: [{ label: '01 Oct', "Store A": 10, "Store B": 5 }, ...]
    const pivot = {};
    result.rows.forEach(row => {
      if (!pivot[row.date]) {
        pivot[row.date] = { label: row.label, date: row.date };
      }
      pivot[row.date][row.store_name] = parseInt(row.total_sales, 10);
    });

    res.json(Object.values(pivot));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
