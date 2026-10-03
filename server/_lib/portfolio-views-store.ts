import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';
import { resolveContentDir } from './content-path.js';

const metricsPath = () => join(resolveContentDir(), 'site-metrics.json');

const readLocalCount = () => {
  try {
    const path = metricsPath();
    if (!existsSync(path)) return 0;
    const parsed = JSON.parse(readFileSync(path, 'utf8')) as { portfolioViews?: number };
    return typeof parsed.portfolioViews === 'number' ? parsed.portfolioViews : 0;
  } catch {
    return 0;
  }
};

const writeLocalCount = (count: number) => {
  writeFileSync(metricsPath(), JSON.stringify({ portfolioViews: count }, null, 2), 'utf8');
};

/** Local dev only — production should use VITE_PORTFOLIO_VIEWS_URL (Countty) or static JSON. */
export const getPortfolioViews = async (): Promise<number> => readLocalCount();

export const incrementPortfolioViews = async (): Promise<number> => {
  const next = readLocalCount() + 1;
  try {
    writeLocalCount(next);
    return next;
  } catch {
    return readLocalCount();
  }
};
