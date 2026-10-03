/**
 * Optional hosted view counter (e.g. Cloudflare Countty).
 * Set VITE_PORTFOLIO_VIEWS_URL to your worker base URL — no Vercel API or KV.
 *
 * Countty: `npx countty init` → deploy → `npx countty create <slug>`
 * Docs: https://github.com/wellwelwel/countty
 */

const baseUrl = () => import.meta.env.VITE_PORTFOLIO_VIEWS_URL?.replace(/\/+$/, '') ?? '';
const slug = () => import.meta.env.VITE_PORTFOLIO_VIEWS_SLUG ?? 'strykerinside:resume';

export const isExternalPortfolioViewsEnabled = () => Boolean(baseUrl());

const parseViews = (payload: unknown): number | null => {
  if (typeof payload === 'number' && Number.isFinite(payload)) return payload;
  if (!payload || typeof payload !== 'object') return null;
  const o = payload as Record<string, unknown>;
  for (const key of ['views', 'count', 'value']) {
    const v = o[key];
    if (typeof v === 'number' && Number.isFinite(v)) return v;
    if (typeof v === 'string' && v.trim()) {
      const n = Number(v);
      if (Number.isFinite(n)) return n;
    }
  }
  return null;
};

async function fetchViews(endpoint: 'views' | 'peek'): Promise<number | null> {
  const base = baseUrl();
  if (!base) return null;
  const url = `${base}/${endpoint}?slug=${encodeURIComponent(slug())}`;
  const res = await fetch(url, { method: 'GET', cache: 'no-store' });
  if (!res.ok) return null;
  const text = await res.text();
  try {
    return parseViews(JSON.parse(text));
  } catch {
    const n = Number(text.trim());
    return Number.isFinite(n) ? n : null;
  }
}

/** First visit in session — increment on host (Countty `/views`). */
export const hitExternalPortfolioViews = () => fetchViews('views');

/** Repeat visit in session — read only (Countty `/peek`). */
export const peekExternalPortfolioViews = () => fetchViews('peek');
