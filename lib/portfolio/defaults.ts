import seed from '../../content/portfolio.json';
import type { PortfolioDocument } from './types';
import { portfolioDocumentSchema } from './schema';

const parsed = portfolioDocumentSchema.safeParse(seed);
if (!parsed.success) {
  console.error('Invalid content/portfolio.json', parsed.error.flatten());
}

export const defaultPortfolio: PortfolioDocument = (parsed.success
  ? parsed.data
  : seed) as PortfolioDocument;

export const getActiveProjects = (doc: PortfolioDocument) =>
  [...doc.projects]
    .filter((p) => !p.archived)
    .sort((a, b) => (a.sortOrder ?? 999) - (b.sortOrder ?? 999));

export const getFeaturedProjects = (doc: PortfolioDocument) =>
  getActiveProjects(doc).filter((p) => p.featured !== false);

export const formatExperienceRange = (startDate: string, endDate?: string | null, current?: boolean) => {
  const fmt = (iso: string) => {
    const [y, m] = iso.split('-');
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const mi = Number(m) - 1;
    return `${months[mi] || m} ${y}`;
  };
  const end = current || !endDate ? 'Present' : fmt(endDate);
  return `${fmt(startDate)} - ${end}`;
};
