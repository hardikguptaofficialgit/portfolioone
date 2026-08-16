import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import pg from 'pg';

const { Client } = pg;

const loadEnv = () => {
  try {
    const raw = readFileSync(new URL('../.env', import.meta.url), 'utf8');
    for (const line of raw.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const idx = trimmed.indexOf('=');
      if (idx === -1) continue;
      const key = trimmed.slice(0, idx).trim();
      const value = trimmed.slice(idx + 1).trim();
      if (!process.env[key]) process.env[key] = value;
    }
  } catch {
    // .env is optional when vars are already exported
  }
};

const getDatabaseUrl = () => {
  if (process.env.DATABASE_URL) return process.env.DATABASE_URL;

  const password = process.env.SUPABASE_DB_PASSWORD;
  const url = process.env.SUPABASE_URL;
  if (!password || !url) return null;

  const ref = url.replace(/^https?:\/\//, '').replace(/\.supabase\.co\/?$/, '');
  const host = process.env.SUPABASE_DB_HOST || `db.${ref}.supabase.co`;
  const port = process.env.SUPABASE_DB_PORT || '5432';
  const user = process.env.SUPABASE_DB_USER || 'postgres';
  const database = process.env.SUPABASE_DB_NAME || 'postgres';

  return `postgresql://${encodeURIComponent(user)}:${encodeURIComponent(password)}@${host}:${port}/${database}`;
};

loadEnv();

const databaseUrl = getDatabaseUrl();
if (!databaseUrl) {
  console.error(
    'Missing database connection. Set DATABASE_URL or SUPABASE_DB_PASSWORD in .env (from Supabase → Project Settings → Database).',
  );
  process.exit(1);
}

const sqlPath = fileURLToPath(new URL('../supabase/dooms_waitlist_schema.sql', import.meta.url));
const sql = readFileSync(sqlPath, 'utf8');

const client = new Client({
  connectionString: databaseUrl,
  ssl: { rejectUnauthorized: false },
});

try {
  await client.connect();
  await client.query(sql);
  const { rows } = await client.query(
    "select to_regclass('public.dooms_waitlist') as table_name",
  );
  console.log(rows[0]?.table_name ? 'dooms_waitlist table is ready.' : 'Migration ran but table was not found.');
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
} finally {
  await client.end();
}
