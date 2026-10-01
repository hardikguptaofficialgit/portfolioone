import { readFileSync, writeFileSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';

const localMetricsPath = fileURLToPath(new URL('../../content/site-metrics.json', import.meta.url));

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

export const getPortfolioViews = async (): Promise<number> => readLocalCount();

export const incrementPortfolioViews = async (): Promise<number> => {
  const next = readLocalCount() + 1;
  writeLocalCount(next);
  return next;
};
