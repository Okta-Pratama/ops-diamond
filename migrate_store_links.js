const pool = require('./db');

async function migrate() {
  try {
    await pool.query("ALTER TABLE products ADD COLUMN store_links JSONB DEFAULT '{}'");
    console.log("Migration successful");
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

migrate();
