import { readFileSync, writeFileSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';

const localMetricsPath = fileURLToPath(new URL('../../content/site-metrics.json', import.meta.url));
const KV_KEY = 'portfolio:views';

const readLocalCount = () => {
  try {
    if (!existsSync(localMetricsPath)) return 0;
    const parsed = JSON.parse(readFileSync(localMetricsPath, 'utf8')) as { portfolioViews?: number };
    return typeof parsed.portfolioViews === 'number' ? parsed.portfolioViews : 0;
  } catch {
    return 0;
  }
};

const writeLocalCount = (count: number) => {
  writeFileSync(localMetricsPath, JSON.stringify({ portfolioViews: count }, null, 2), 'utf8');
};

const kvConfigured = () =>
  Boolean(process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN);

const kvHeaders = () => ({
  Authorization: `Bearer ${process.env.KV_REST_API_TOKEN}`,
});

const parseKvNumber = (value: unknown) => {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim()) {
    const n = Number(value);
    return Number.isFinite(n) ? n : null;
  }
  return null;
};

const kvGetCount = async (): Promise<number | null> => {
  if (!kvConfigured()) return null;
  const res = await fetch(`${process.env.KV_REST_API_URL}/get/${KV_KEY}`, { headers: kvHeaders() });
  if (!res.ok) return null;
  const payload = (await res.json()) as { result?: unknown };
  if (payload.result === null || payload.result === undefined) return null;
  return parseKvNumber(payload.result);
};

const kvSetCount = async (count: number) => {
  if (!kvConfigured()) return false;
  const res = await fetch(`${process.env.KV_REST_API_URL}/set/${KV_KEY}/${count}`, { headers: kvHeaders() });
  return res.ok;
};

const kvIncrement = async (): Promise<number | null> => {
  if (!kvConfigured()) return null;
  const existing = await kvGetCount();
  if (existing === null) {
    const seeded = readLocalCount();
    if (!(await kvSetCount(seeded))) return null;
  }
  const res = await fetch(`${process.env.KV_REST_API_URL}/incr/${KV_KEY}`, { headers: kvHeaders() });
  if (!res.ok) return null;
  const payload = (await res.json()) as { result?: unknown };
  return parseKvNumber(payload.result);
};

export const getPortfolioViews = async (): Promise<number> => {
  const fromKv = await kvGetCount();
  if (fromKv !== null) return fromKv;
  return readLocalCount();
};

export const incrementPortfolioViews = async (): Promise<number> => {
  const fromKv = await kvIncrement();
  if (fromKv !== null) return fromKv;

  const next = readLocalCount() + 1;
  try {
    writeLocalCount(next);
    return next;
  } catch {
    return readLocalCount();
  }
};
