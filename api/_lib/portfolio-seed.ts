import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { portfolioDocumentSchema, type PortfolioDocument } from './portfolio-schema';

const seedPaths = () => [
  join(process.cwd(), 'content', 'portfolio.json'),
  join(process.cwd(), '..', 'content', 'portfolio.json'),
];

let cachedSeed: PortfolioDocument | null = null;

export const loadPortfolioSeed = (): PortfolioDocument => {
  if (cachedSeed) return cachedSeed;

  for (const path of seedPaths()) {
    try {
      if (!existsSync(path)) continue;
      const raw = JSON.parse(readFileSync(path, 'utf-8'));
      const parsed = portfolioDocumentSchema.safeParse(raw);
      if (parsed.success) {
        cachedSeed = parsed.data;
        return cachedSeed;
      }
      console.warn('[portfolio] invalid seed at', path, parsed.error.flatten());
    } catch (error) {
      console.warn('[portfolio] failed reading seed at', path, error);
    }
  }

  cachedSeed = {
    version: 1,
    profile: {
      name: 'Hardik Gupta',
      headline: 'Full Stack Developer',
      location: 'India',
      email: 'hardikgupta8792@gmail.com',
      website: 'https://strykerinside.vercel.app',
    },
    socialLinks: [],
    skillCategories: [],
    skillsFlat: [],
    projects: [],
    experience: [],
    education: [],
    achievements: [],
    certifications: [],
    sections: {},
    updatedAt: new Date().toISOString(),
  };

  return cachedSeed;
};
