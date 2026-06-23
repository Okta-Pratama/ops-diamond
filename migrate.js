const pool=require('./db.js');
pool.query("ALTER TABLE salary_logs ADD COLUMN base_salary_applied NUMERIC;")
  .then(() => pool.query("UPDATE salary_logs SET base_salary_applied = CASE WHEN is_off THEN 0 ELSE amount + COALESCE(deduction,0) - COALESCE(bonus,0) END"))
  .then(() => { console.log('Migrated'); process.exit(); })
  .catch(e => { console.error(e); process.exit(); });
