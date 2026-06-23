const express = require('express');
const router = express.Router();
const pool = require('../db');
const authMiddleware = require('../middlewares/authMiddleware');

// ── GET penjualan per tanggal ─────────────────────────────────────────────────
router.get('/', authMiddleware, async (req, res) => {
  const { date } = req.query;
  if (!date) return res.status(400).json({ message: 'Parameter date diperlukan' });
  try {
    const stores = await pool.query('SELECT * FROM stores ORDER BY id ASC');
    const sales = await pool.query(
      'SELECT * FROM daily_sales WHERE sale_date = $1 ORDER BY store_id ASC, platform ASC', [date]
    );
    res.json({ stores: stores.rows, sales: sales.rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── POST simpan penjualan per toko + platform (upsert) ───────────────────────
router.post('/', authMiddleware, async (req, res) => {
  const { date, entries } = req.body;
  try {
    const queries = entries.map(entry =>
      pool.query(`
        INSERT INTO daily_sales (store_id, platform, sale_date, quantity)
        VALUES ($1, $2, $3, $4)
        ON CONFLICT (store_id, platform, sale_date)
        DO UPDATE SET quantity = EXCLUDED.quantity
      `, [entry.store_id, entry.platform, date, entry.quantity || 0])
    );
    await Promise.all(queries);
    res.json({ message: 'Data penjualan berhasil disimpan!' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── POST simpan dropship (store_id = NULL) ───────────────────────────────────
router.post('/dropship', authMiddleware, async (req, res) => {
  const { date, quantity } = req.body;
  try {
    await pool.query(`
      INSERT INTO daily_sales (store_id, platform, sale_date, quantity)
      VALUES (NULL, 'dropship', $1, $2)
      ON CONFLICT (store_id, platform, sale_date)
      DO UPDATE SET quantity = EXCLUDED.quantity
    `, [date, quantity || 0]);
    res.json({ message: 'Data dropship berhasil disimpan!' });
  } catch (err) {
    // If NULL unique conflict fails, use a workaround
    try {
      await pool.query(
        `DELETE FROM daily_sales WHERE store_id IS NULL AND platform = 'dropship' AND sale_date = $1`, [date]
      );
      await pool.query(
        `INSERT INTO daily_sales (store_id, platform, sale_date, quantity) VALUES (NULL, 'dropship', $1, $2)`,
        [date, quantity || 0]
      );
      res.json({ message: 'Data dropship berhasil disimpan!' });
    } catch (err2) {
      res.status(500).json({ error: err2.message });
    }
  }
});

// ── POST bulk-update dari Buku Product ───────────────────────────────────────
router.post('/book/bulk-update', authMiddleware, async (req, res) => {
  const { password, updates } = req.body;
  // updates: [{ date, store_id, platform, quantity }]
  if (!password) return res.status(400).json({ message: 'Password admin wajib dimasukkan' });

  try {
    const userResult = await pool.query('SELECT * FROM users WHERE id = $1', [req.user.id]);
    if (!userResult.rows.length) return res.status(401).json({ message: 'User tidak ditemukan' });
    const bcrypt = require('bcryptjs');
    const isMatch = await bcrypt.compare(password, userResult.rows[0].password);
    if (!isMatch) return res.status(401).json({ message: 'Password admin salah!' });

    const queries = updates.map(entry => {
      if (entry.store_id === null) {
         return pool.query(`
            INSERT INTO daily_sales (store_id, platform, sale_date, quantity)
            VALUES (NULL, 'dropship', $1, $2)
            ON CONFLICT (store_id, platform, sale_date)
            DO UPDATE SET quantity = EXCLUDED.quantity
         `, [entry.date, entry.quantity || 0]).catch(async () => {
             await pool.query(`DELETE FROM daily_sales WHERE store_id IS NULL AND platform = 'dropship' AND sale_date = $1`, [entry.date]);
             return pool.query(`INSERT INTO daily_sales (store_id, platform, sale_date, quantity) VALUES (NULL, 'dropship', $1, $2)`, [entry.date, entry.quantity || 0]);
         });
      } else {
         return pool.query(`
          INSERT INTO daily_sales (store_id, platform, sale_date, quantity)
          VALUES ($1, $2, $3, $4)
          ON CONFLICT (store_id, platform, sale_date)
          DO UPDATE SET quantity = EXCLUDED.quantity
        `, [entry.store_id, entry.platform, entry.date, entry.quantity || 0]);
      }
    });
    await Promise.all(queries);
    res.json({ message: 'Data produk terjual berhasil diperbarui!' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── GET Buku Product (rekap per bulan) ───────────────────────────────────────
router.get('/book', authMiddleware, async (req, res) => {
  const { month, year } = req.query;
  if (!month || !year) return res.status(400).json({ message: 'Parameter month dan year diperlukan' });
  try {
    const result = await pool.query(`
      SELECT 
        TO_CHAR(ds.sale_date, 'YYYY-MM-DD') as sale_date, ds.store_id, 
        COALESCE(s.name, 'Dropship') as store_name,
        ds.platform, ds.quantity
      FROM daily_sales ds
      LEFT JOIN stores s ON s.id = ds.store_id
      WHERE EXTRACT(MONTH FROM ds.sale_date) = $1
        AND EXTRACT(YEAR FROM ds.sale_date) = $2
      ORDER BY ds.sale_date ASC, ds.store_id ASC, ds.platform ASC
    `, [month, year]);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
