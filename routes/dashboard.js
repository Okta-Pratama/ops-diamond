const express = require('express');
const router = express.Router();
const pool = require('../db');
const authMiddleware = require('../middlewares/authMiddleware');

router.get('/stats/chart', authMiddleware, async (req, res) => {
  try {
    const range = req.query.range || '6m';
    
    let isDaily = false;
    let intervalCount = 0;

    if (range === '3d') {
      isDaily = true;
      intervalCount = 2;
    } else if (range === '7d') {
      isDaily = true;
      intervalCount = 6;
    } else if (range === '1m') {
      isDaily = true;
      intervalCount = 29;
    } else if (range === '1y') {
      isDaily = false;
      intervalCount = 11;
    } else {
      isDaily = false;
      intervalCount = 5;
    }

    let query = '';
    if (isDaily) {
      query = `
        WITH days AS (
          SELECT generate_series(
            current_date - interval '${intervalCount} days',
            current_date,
            '1 day'
          ) AS period_start
        ),
        daily_sales AS (
          SELECT date_trunc('day', sale_date) as period_start, SUM(quantity) as total_sales
          FROM daily_sales
          WHERE sale_date >= current_date - interval '${intervalCount} days'
          GROUP BY 1
        ),
        daily_salary AS (
          SELECT date_trunc('day', work_date) as period_start, SUM(amount) as total_salary
          FROM salary_logs
          WHERE work_date >= current_date - interval '${intervalCount} days'
          GROUP BY 1
        )
        SELECT 
          TO_CHAR(d.period_start, 'YYYY-MM-DD') as date,
          TO_CHAR(d.period_start, 'DD Mon') as day_label,
          COALESCE(ds.total_sales, 0) as total_sales,
          COALESCE(sl.total_salary, 0) as total_salary
        FROM days d
        LEFT JOIN daily_sales ds ON d.period_start = ds.period_start
        LEFT JOIN daily_salary sl ON d.period_start = sl.period_start
        ORDER BY d.period_start ASC
      `;
    } else {
      query = `
        WITH months AS (
          SELECT generate_series(
            date_trunc('month', current_date) - interval '${intervalCount} months',
            date_trunc('month', current_date),
            '1 month'
          ) AS period_start
        ),
        monthly_sales AS (
          SELECT date_trunc('month', sale_date) as period_start, SUM(quantity) as total_sales
          FROM daily_sales
          WHERE sale_date >= date_trunc('month', current_date) - interval '${intervalCount} months'
          GROUP BY 1
        ),
        monthly_salary AS (
          SELECT date_trunc('month', work_date) as period_start, SUM(amount) as total_salary
          FROM salary_logs
          WHERE work_date >= date_trunc('month', current_date) - interval '${intervalCount} months'
          GROUP BY 1
        )
        SELECT 
          TO_CHAR(m.period_start, 'YYYY-MM') as date,
          TO_CHAR(m.period_start, 'Mon YYYY') as day_label,
          COALESCE(ms.total_sales, 0) as total_sales,
          COALESCE(sl.total_salary, 0) as total_salary
        FROM months m
        LEFT JOIN monthly_sales ms ON m.period_start = ms.period_start
        LEFT JOIN monthly_salary sl ON m.period_start = sl.period_start
        ORDER BY m.period_start ASC
      `;
    }

    const result = await pool.query(query);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/stats/stores', authMiddleware, async (req, res) => {
  try {
    const range = req.query.range || '6m'; 
    let timeFilter = "";
    if (range === '3d') {
      timeFilter = "ds.sale_date >= current_date - interval '2 days'";
    } else if (range === '7d') {
      timeFilter = "ds.sale_date >= current_date - interval '6 days'";
    } else if (range === '1m') {
      timeFilter = "ds.sale_date >= current_date - interval '29 days'";
    } else if (range === '1y') {
      timeFilter = "ds.sale_date >= date_trunc('month', current_date) - interval '11 months'";
    } else {
      timeFilter = "ds.sale_date >= date_trunc('month', current_date) - interval '5 months'";
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
    const range = req.query.range || '6m';
    
    let isDaily = false;
    let intervalCount = 0;

    if (range === '3d') {
      isDaily = true;
      intervalCount = 2;
    } else if (range === '7d') {
      isDaily = true;
      intervalCount = 6;
    } else if (range === '1m') {
      isDaily = true;
      intervalCount = 29;
    } else if (range === '1y') {
      isDaily = false;
      intervalCount = 11;
    } else {
      isDaily = false;
      intervalCount = 5;
    }

    let timeSeriesCTE = '';
    let dateTruncUnit = '';
    let dateFormat = '';

    if (isDaily) {
      timeSeriesCTE = `
        SELECT generate_series(
          current_date - interval '${intervalCount} days',
          current_date,
          '1 day'
        ) AS ts_start
      `;
      dateTruncUnit = 'day';
      dateFormat = 'YYYY-MM-DD';
    } else {
      timeSeriesCTE = `
        SELECT generate_series(
          date_trunc('month', current_date) - interval '${intervalCount} months',
          date_trunc('month', current_date),
          '1 month'
        ) AS ts_start
      `;
      dateTruncUnit = 'month';
      dateFormat = 'YYYY-MM';
    }

    const query = `
      WITH time_series AS (
        ${timeSeriesCTE}
      )
      SELECT 
        TO_CHAR(ts.ts_start, '${dateFormat}') as date,
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
    
    const pivot = {};
    result.rows.forEach(row => {
      if (!pivot[row.date]) {
        pivot[row.date] = { date: row.date };
      }
      pivot[row.date][row.store_name] = parseInt(row.total_sales, 10);
    });

    res.json(Object.values(pivot));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
