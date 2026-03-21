const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const defaultDbPath = path.join(ROOT, 'data', 'db.json');
const dbPath = path.resolve(process.env.DB_PATH || defaultDbPath);
const backupDir = path.join(ROOT, 'backups');

function run() {
  if (!fs.existsSync(dbPath)) {
    throw new Error(`DB file not found at ${dbPath}`);
  }

  fs.mkdirSync(backupDir, { recursive: true });
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const target = path.join(backupDir, `db-backup-${stamp}.json`);
  fs.copyFileSync(dbPath, target);

  console.log(`Backup created: ${target}`);
}

try {
  run();
} catch (error) {
  console.error(error.message || 'DB backup failed.');
  process.exit(1);
}
