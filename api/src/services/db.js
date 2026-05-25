import pg from 'pg';

const { Pool } = pg;

const defaultDbUrl = 'postgresql://traffic_user:changeme@localhost:5432/traffic';

export const pool = new Pool({
  connectionString: process.env.DB_URL || defaultDbUrl
});

export async function initDb() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS scenarios (
      id SERIAL PRIMARY KEY,
      municipality_id INT,
      name VARCHAR NOT NULL,
      description TEXT,
      config JSONB NOT NULL DEFAULT '{}'::jsonb,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `);
}
