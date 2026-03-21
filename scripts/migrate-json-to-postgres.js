const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

const ROOT = path.resolve(__dirname, '..');
const defaultDbPath = path.join(ROOT, 'data', 'db.json');
const dbPath = path.resolve(process.env.DB_PATH || defaultDbPath);
const databaseUrl = String(process.env.DATABASE_URL || '').trim();

async function run() {
  if (!databaseUrl) {
    throw new Error('DATABASE_URL is required for migration.');
  }

  if (!fs.existsSync(dbPath)) {
    throw new Error(`Source JSON DB not found at ${dbPath}`);
  }

  const source = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
  const useSsl = process.env.PGSSLMODE === 'require' || process.env.NODE_ENV === 'production';

  const pool = new Pool({
    connectionString: databaseUrl,
    ssl: useSsl ? { rejectUnauthorized: false } : false,
  });

  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS app_state (
        id SMALLINT PRIMARY KEY,
        data JSONB NOT NULL,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

    await pool.query(
      `
      INSERT INTO app_state (id, data, updated_at)
      VALUES ($1, $2::jsonb, NOW())
      ON CONFLICT (id)
      DO UPDATE SET data = EXCLUDED.data, updated_at = NOW()
      `,
      [1, JSON.stringify(source)],
    );

    console.log('Migration complete: JSON DB copied into Postgres app_state row id=1.');
  } finally {
    await pool.end();
  }
}

run().catch((error) => {
  console.error(error.message || 'Migration failed.');
  process.exit(1);
});
