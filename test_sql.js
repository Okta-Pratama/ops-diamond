const db = require('./db');
const dateFilter = ' AND EXTRACT(YEAR FROM sl.work_date) = 2026 AND EXTRACT(MONTH FROM sl.work_date) = 6';
const wFilter = dateFilter.replace(/sl\./g, 'w.').replace(/work_date/g, 'payout_date');
const dsFilter = dateFilter.replace(/sl\./g, 'ds.').replace(/work_date/g, 'sale_date').replace(/ds\.employee_id/g, 'e.id');

const sql = `SELECT 
        combined.work_date as work_date, combined.employee_id as employee_id, e.name, 
        MAX(combined.base_salary) as base_salary, 
        MAX(combined.bonus) as bonus, 
        MAX(combined.deduction) as deduction, 
        MAX(combined.total) as total, 
        BOOL_OR(combined.is_off) as is_off, 
        SUM(combined.withdrawal_amount) as withdrawal_amount
      FROM (
        SELECT 
          TO_CHAR(sl.work_date, 'YYYY-MM-DD') as work_date,
          sl.employee_id,
          CASE WHEN sl.base_salary_applied > 0 THEN sl.base_salary_applied ELSE (SELECT base_salary FROM employees WHERE id = sl.employee_id) END as base_salary,
          COALESCE(sl.bonus, 0) as bonus,
          COALESCE(sl.deduction, 0) as deduction,
          COALESCE(sl.amount, 0) as total,
          COALESCE(sl.is_off, false) as is_off,
          0 as withdrawal_amount
        FROM salary_logs sl
        WHERE sl.employee_id NOT IN (SELECT id FROM employees WHERE name ILIKE '%cadangan%') ${dateFilter}

        UNION ALL

        SELECT
          TO_CHAR(w.payout_date, 'YYYY-MM-DD') as work_date,
          w.employee_id,
          0 as base_salary,
          0 as bonus,
          0 as deduction,
          0 as total,
          false as is_off,
          w.total_amount as withdrawal_amount
        FROM withdrawals w
        WHERE 1=1 ${wFilter}

        UNION ALL

        SELECT 
          TO_CHAR(ds.sale_date, 'YYYY-MM-DD') as work_date,
          e.id as employee_id,
          CASE WHEN SUM(ds.quantity) > 163 THEN (SUM(ds.quantity) - 163) * 400 ELSE 0 END as base_salary,
          0 as bonus,
          0 as deduction,
          CASE WHEN SUM(ds.quantity) > 163 THEN (SUM(ds.quantity) - 163) * 400 ELSE 0 END as total,
          false as is_off,
          0 as withdrawal_amount
        FROM daily_sales ds
        CROSS JOIN employees e
        WHERE e.name ILIKE '%cadangan%' ${dsFilter}
        GROUP BY ds.sale_date, e.id
      ) combined
      JOIN employees e ON e.id = combined.employee_id
      GROUP BY combined.work_date, combined.employee_id, e.name
      ORDER BY combined.work_date ASC, combined.employee_id ASC`;

db.query(sql).then(r => console.log(JSON.stringify(r.rows, null, 2))).catch(console.error).finally(()=>process.exit(0));
