import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { mergePortfolioContent, type PortfolioContentParts } from '../../lib/portfolio/merge-content.js';

const contentDir = fileURLToPath(new URL('../../content/', import.meta.url));

const readJson = <T>(file: string): T =>
  JSON.parse(readFileSync(`${contentDir}${file}`, 'utf8')) as T;

export const readPortfolioFromDisk = () =>
  mergePortfolioContent({
    site: readJson<PortfolioContentParts['site']>('site.json'),
    skills: readJson<PortfolioContentParts['skills']>('skills.json'),
    projects: readJson<PortfolioContentParts['projects']>('projects.json'),
    experience: readJson<PortfolioContentParts['experience']>('experience.json'),
    blogs: readJson<PortfolioContentParts['blogs']>('blogs.json'),
    photos: readJson<PortfolioContentParts['photos']>('photos.json'),
  });
