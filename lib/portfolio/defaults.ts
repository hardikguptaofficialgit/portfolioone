import site from '../../content/site.json';
import skills from '../../content/skills.json';
import projects from '../../content/projects.json';
import experience from '../../content/experience.json';
import blogs from '../../content/blogs.json';
import photos from '../../content/photos.json';
import type { PortfolioDocument } from './types';
import { mergePortfolioContent } from './merge-content';

const parsed = mergePortfolioContent({
  site,
  skills,
  projects,
  experience,
  blogs,
  photos,
});

export const defaultPortfolio: PortfolioDocument = parsed;

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
