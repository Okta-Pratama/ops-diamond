const db = require('./db');

async function checkAndDelete() {
  try {
    const idToDelete = 7;
    await db.query("DELETE FROM salary_logs WHERE withdrawal_id = $1", [idToDelete]);
    console.log("Deleted salary_logs for withdrawal", idToDelete);
    
    await db.query("DELETE FROM withdrawals WHERE id = $1", [idToDelete]);
    console.log("Deleted withdrawal ID:", idToDelete);
  } catch(e) {
    console.error(e);
  } finally {
    process.exit(0);
  }
}
checkAndDelete();
