const express = require('express');
const router = express.Router();
const pool = require('../db');
const authMiddleware = require('../middlewares/authMiddleware');

// ── 1. GET semua karyawan dengan saldo terakumulasi ──────────────────────────
router.get('/employees/status', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT e.id, e.name, e.base_salary,
        (
          COALESCE(
            (SELECT SUM(
              CASE WHEN s.is_off THEN 0 
                   ELSE (CASE WHEN s.base_salary_applied > 0 THEN s.base_salary_applied ELSE e.base_salary END) 
              END + COALESCE(s.bonus, 0) - COALESCE(s.deduction, 0)
            ) FROM salary_logs s WHERE s.employee_id = e.id), 0
          )
          - 
          COALESCE(
            (SELECT SUM(w.total_amount) FROM withdrawals w WHERE w.employee_id = e.id), 0
          )
        ) as total_saldo
      FROM employees e
      ORDER BY e.id ASC
    `);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── 1.5 GET status uang cadangan ─────────────────────────────────────────────
router.get('/cadangan/status', async (req, res) => {
  try {
    const cadanganQuery = await pool.query(`SELECT id FROM employees WHERE name ILIKE '%cadangan%' LIMIT 1`);
    if (cadanganQuery.rows.length === 0) {
      return res.json({ id: null, total_cadangan: 0 });
    }
    const cadanganId = cadanganQuery.rows[0].id;
    
    // Calculate total positive cadangan
    const salesResult = await pool.query(`
      SELECT SUM(CASE WHEN total_qty > 163 THEN (total_qty - 163) * 400 ELSE 0 END) as total_plus
      FROM (
        SELECT sale_date, SUM(quantity) as total_qty
        FROM daily_sales
        GROUP BY sale_date
      ) sub
    `);
    
    const totalPlus = Number(salesResult.rows[0]?.total_plus) || 0;
    
    // Calculate total withdrawals
    const withdrawResult = await pool.query(
      `SELECT SUM(total_amount) as total_withdrawn FROM withdrawals WHERE employee_id = $1`,
      [cadanganId]
    );
    
    const totalWithdrawn = Number(withdrawResult.rows[0]?.total_withdrawn) || 0;
    const balance = totalPlus - totalWithdrawn;
    
    res.json({ id: cadanganId, total_cadangan: balance });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// ── 2. GET semua karyawan (master data) ──────────────────────────────────────
router.get('/employees', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM employees ORDER BY id ASC');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── 3. POST tambah karyawan baru ─────────────────────────────────────────────
router.post('/employees', authMiddleware, async (req, res) => {
  const { name, base_salary } = req.body;
  if (!name || name.trim() === '') {
    return res.status(400).json({ message: 'Nama karyawan wajib diisi' });
  }
  try {
    const result = await pool.query(
      'INSERT INTO employees (name, base_salary) VALUES ($1, $2) RETURNING *',
      [name.trim(), base_salary || 25000]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── 4. PUT edit karyawan ──────────────────────────────────────────────────────
router.put('/employees/:id', authMiddleware, async (req, res) => {
  const { name, base_salary } = req.body;
  if (!name || name.trim() === '') {
    return res.status(400).json({ message: 'Nama karyawan wajib diisi' });
  }
  try {
    const result = await pool.query(
      'UPDATE employees SET name = $1, base_salary = $2 WHERE id = $3 RETURNING *',
      [name.trim(), base_salary || 25000, req.params.id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── 5. DELETE hapus karyawan ──────────────────────────────────────────────────
router.delete('/employees/:id', authMiddleware, async (req, res) => {
  const { password } = req.body;
  if (!password) return res.status(400).json({ message: 'Password admin wajib dimasukkan' });
  try {
    const userResult = await pool.query('SELECT * FROM users WHERE id = $1', [req.user.id]);
    if (!userResult.rows.length) return res.status(401).json({ message: 'User tidak ditemukan' });
    const bcrypt = require('bcryptjs');
    const isMatch = await bcrypt.compare(password, userResult.rows[0].password);
    if (!isMatch) return res.status(401).json({ message: 'Password admin salah!' });

    await pool.query('BEGIN');
    await pool.query('DELETE FROM salary_logs WHERE employee_id = $1', [req.params.id]);
    await pool.query('DELETE FROM withdrawals WHERE employee_id = $1', [req.params.id]);
    await pool.query('DELETE FROM employees WHERE id = $1', [req.params.id]);
    await pool.query('COMMIT');
    res.json({ message: 'Karyawan berhasil dihapus' });
  } catch (err) {
    await pool.query('ROLLBACK');
    res.status(500).json({ error: err.message });
  }
});

// ── 6. GET data gaji harian per tanggal ──────────────────────────────────────
router.get('/daily-entry', authMiddleware, async (req, res) => {
  const { date } = req.query;
  if (!date) return res.status(400).json({ message: 'Parameter date diperlukan' });
  try {
    // Calculate total products for the day
    const salesRes = await pool.query('SELECT COALESCE(SUM(quantity), 0) as total_qty FROM daily_sales WHERE sale_date = $1', [date]);
    const totalQty = Number(salesRes.rows[0].total_qty) || 0;
    const excess = totalQty > 163 ? totalQty - 163 : 0;
    
    // Return all employees with their entry for that date (if exists)
    const result = await pool.query(`
      SELECT 
        e.id as employee_id, e.name, 
        CASE WHEN e.name ILIKE '%cadangan%' THEN $2 * 400 ELSE e.base_salary END as base_salary,
        COALESCE(sl.bonus, 0) as bonus,
        COALESCE(sl.deduction, 0) as deduction,
        COALESCE(sl.is_off, false) as is_off,
        COALESCE(sl.off_reason, '') as off_reason,
        COALESCE(sl.amount, CASE WHEN e.name ILIKE '%cadangan%' THEN $2 * 400 ELSE e.base_salary END) as amount
      FROM employees e
      LEFT JOIN salary_logs sl ON e.id = sl.employee_id AND sl.work_date = $1
      ORDER BY e.id ASC
    `, [date, excess]);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── 7. POST / simpan gaji harian (upsert) ────────────────────────────────────
router.post('/daily-entry', authMiddleware, async (req, res) => {
  const { date, entries } = req.body;
  // entries: [{ employee_id, base_salary, bonus, deduction, is_off }]
  try {
    const queries = entries.map(entry => {
      const total = (entry.is_off ? 0 : entry.base_salary) + (entry.bonus || 0) - (entry.deduction || 0);
      return pool.query(`
        INSERT INTO salary_logs (employee_id, work_date, amount, bonus, deduction, is_off, status, base_salary_applied, off_reason)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        ON CONFLICT (employee_id, work_date)
        DO UPDATE SET amount = EXCLUDED.amount, bonus = EXCLUDED.bonus,
          deduction = EXCLUDED.deduction, is_off = EXCLUDED.is_off, status = EXCLUDED.status, base_salary_applied = EXCLUDED.base_salary_applied, off_reason = EXCLUDED.off_reason
      `, [
        entry.employee_id, date, total,
        entry.bonus || 0, entry.deduction || 0,
        entry.is_off || false,
        entry.is_off ? 'off' : 'work',
        entry.base_salary || 0,
        entry.off_reason || ''
      ]);
    });
    await Promise.all(queries);
    res.json({ message: 'Data gaji berhasil disimpan!' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── 7b. POST bulk-update dari Buku Gaji ───────────────────────────────────────
router.post('/salary-book/bulk-update', authMiddleware, async (req, res) => {
  const { password, updates } = req.body;
  // updates: [{ employee_id, date, base_salary, bonus, deduction, is_off }]
  if (!password) return res.status(400).json({ message: 'Password admin wajib dimasukkan' });

  try {
    const userResult = await pool.query('SELECT * FROM users WHERE id = $1', [req.user.id]);
    if (!userResult.rows.length) return res.status(401).json({ message: 'User tidak ditemukan' });
    const bcrypt = require('bcryptjs');
    const isMatch = await bcrypt.compare(password, userResult.rows[0].password);
    if (!isMatch) return res.status(401).json({ message: 'Password admin salah!' });

    const queries = updates.map(entry => {
      const total = (entry.is_off ? 0 : entry.base_salary) + (entry.bonus || 0) - (entry.deduction || 0);
      return pool.query(`
        INSERT INTO salary_logs (employee_id, work_date, amount, bonus, deduction, is_off, status, base_salary_applied, off_reason)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        ON CONFLICT (employee_id, work_date)
        DO UPDATE SET amount = EXCLUDED.amount, bonus = EXCLUDED.bonus,
          deduction = EXCLUDED.deduction, is_off = EXCLUDED.is_off, status = EXCLUDED.status, base_salary_applied = EXCLUDED.base_salary_applied, off_reason = EXCLUDED.off_reason
      `, [
        entry.employee_id, entry.date, total,
        entry.bonus || 0, entry.deduction || 0,
        entry.is_off || false,
        entry.is_off ? 'off' : 'work',
        entry.base_salary || 0,
        entry.off_reason || ''
      ]);
    });
    await Promise.all(queries);
    res.json({ message: 'Data gaji berhasil diperbarui!' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── 8. POST pencairan gaji ────────────────────────────────────────────────────
router.post('/withdraw', authMiddleware, async (req, res) => {
  const { employee_id, amount, date, password } = req.body;
  if (!password) return res.status(400).json({ message: 'Password admin wajib dimasukkan' });

  try {
    const userResult = await pool.query('SELECT * FROM users WHERE id = $1', [req.user.id]);
    if (!userResult.rows.length) return res.status(401).json({ message: 'User tidak ditemukan' });
    const bcrypt = require('bcryptjs');
    const isMatch = await bcrypt.compare(password, userResult.rows[0].password);
    if (!isMatch) return res.status(401).json({ message: 'Password admin salah!' });

    await pool.query('BEGIN');
    const withdrawRes = await pool.query(
      'INSERT INTO withdrawals (employee_id, total_amount, payout_date) VALUES ($1, $2, $3) RETURNING id',
      [employee_id, amount, date]
    );

    await pool.query('COMMIT');
    res.json({ message: 'Pencairan berhasil dicatat!' });
  } catch (err) {
    await pool.query('ROLLBACK');
    res.status(500).json({ error: err.message });
  }
});

// ── 9. GET Buku Gaji (laporan rekap) ─────────────────────────────────────────
router.get('/salary-book', authMiddleware, async (req, res) => {
  const { employee_id, start_date, end_date, month, year } = req.query;
  try {
    let dateFilter = '';
    const params = [];
    let paramIdx = 1;

    if (employee_id) {
      params.push(employee_id);
      dateFilter += ` AND sl.employee_id = $${paramIdx++}`;
    }

    if (start_date && end_date) {
      params.push(start_date); params.push(end_date);
      dateFilter += ` AND sl.work_date BETWEEN $${paramIdx++} AND $${paramIdx++}`;
    } else if (month && year) {
      params.push(year); params.push(month);
      dateFilter += ` AND EXTRACT(YEAR FROM sl.work_date) = $${paramIdx++} AND EXTRACT(MONTH FROM sl.work_date) = $${paramIdx++}`;
    } else if (year) {
      params.push(year);
      dateFilter += ` AND EXTRACT(YEAR FROM sl.work_date) = $${paramIdx++}`;
    }

    const wFilter = dateFilter.replace(/sl\./g, 'w.').replace(/work_date/g, 'payout_date');
    const dsFilter = dateFilter.replace(/sl\./g, 'ds.').replace(/work_date/g, 'sale_date').replace(/ds\.employee_id/g, 'e.id');
    const result = await pool.query(`
      SELECT 
        combined.work_date as work_date, combined.employee_id as employee_id, e.name, 
        MAX(combined.base_salary) as base_salary, 
        MAX(combined.bonus) as bonus, 
        MAX(combined.deduction) as deduction, 
        MAX(combined.total) as total, 
        BOOL_OR(combined.is_off) as is_off, 
        MAX(combined.off_reason) as off_reason,
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
          COALESCE(sl.off_reason, '') as off_reason,
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
          '' as off_reason,
          w.total_amount as withdrawal_amount
        FROM withdrawals w
        WHERE 1=1 ${wFilter}

        UNION ALL

        SELECT 
          TO_CHAR(ds.sale_date, 'YYYY-MM-DD') as work_date,
          e.id as employee_id,
          (SUM(ds.quantity) - 163) * 400 as base_salary,
          0 as bonus,
          0 as deduction,
          (SUM(ds.quantity) - 163) * 400 as total,
          false as is_off,
          '' as off_reason,
          0 as withdrawal_amount
        FROM daily_sales ds
        CROSS JOIN employees e
        WHERE e.name ILIKE '%cadangan%' ${dsFilter}
        GROUP BY ds.sale_date, e.id
      ) combined
      JOIN employees e ON e.id = combined.employee_id
      GROUP BY combined.work_date, combined.employee_id, e.name
      ORDER BY combined.work_date ASC, combined.employee_id ASC
    `, params);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── 10. GET history withdraw ──────────────────────────────────────────────────
router.get('/withdraw', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT w.id, w.employee_id, e.name, w.total_amount, w.payout_date as date
      FROM withdrawals w
      JOIN employees e ON e.id = w.employee_id
      ORDER BY w.payout_date DESC, w.id DESC
      LIMIT 100
    `);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── 11. PUT edit history withdraw ───────────────────────────────────────────────
router.put('/withdraw/:id', authMiddleware, async (req, res) => {
  const { amount, date, password } = req.body;
  if (!password) return res.status(400).json({ message: 'Password admin wajib dimasukkan' });

  try {
    const userResult = await pool.query('SELECT * FROM users WHERE id = $1', [req.user.id]);
    if (!userResult.rows.length) return res.status(401).json({ message: 'User tidak ditemukan' });
    const bcrypt = require('bcryptjs');
    const isMatch = await bcrypt.compare(password, userResult.rows[0].password);
    if (!isMatch) return res.status(401).json({ message: 'Password admin salah!' });

    await pool.query(
      'UPDATE withdrawals SET total_amount = $1, payout_date = $2 WHERE id = $3',
      [amount, date, req.params.id]
    );
    res.json({ message: 'Data penarikan berhasil diperbarui' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── 12. DELETE history withdraw ───────────────────────────────────────────────
router.delete('/withdraw/:id', authMiddleware, async (req, res) => {
  const { password } = req.body;
  if (!password) return res.status(400).json({ message: 'Password admin wajib dimasukkan' });

  try {
    const userResult = await pool.query('SELECT * FROM users WHERE id = $1', [req.user.id]);
    if (!userResult.rows.length) return res.status(401).json({ message: 'User tidak ditemukan' });
    const bcrypt = require('bcryptjs');
    const isMatch = await bcrypt.compare(password, userResult.rows[0].password);
    if (!isMatch) return res.status(401).json({ message: 'Password admin salah!' });

    await pool.query('DELETE FROM withdrawals WHERE id = $1', [req.params.id]);
    res.json({ message: 'Data penarikan berhasil dihapus' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;