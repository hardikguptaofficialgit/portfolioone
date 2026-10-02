import { readFileSync } from 'fs';
import { mergePortfolioContent, type PortfolioContentParts } from '../../lib/portfolio/merge-content.js';
import { resolveContentDir } from './content-path.js';

const readJson = <T>(contentDir: string, file: string): T =>
  JSON.parse(readFileSync(`${contentDir}${file}`, 'utf8')) as T;

export const readPortfolioFromDisk = () => {
  const contentDir = resolveContentDir();
  return mergePortfolioContent({
    site: readJson<PortfolioContentParts['site']>(contentDir, 'site.json'),
    skills: readJson<PortfolioContentParts['skills']>(contentDir, 'skills.json'),
    projects: readJson<PortfolioContentParts['projects']>(contentDir, 'projects.json'),
    experience: readJson<PortfolioContentParts['experience']>(contentDir, 'experience.json'),
    blogs: readJson<PortfolioContentParts['blogs']>(contentDir, 'blogs.json'),
    photos: readJson<PortfolioContentParts['photos']>(contentDir, 'photos.json'),
  });
};
