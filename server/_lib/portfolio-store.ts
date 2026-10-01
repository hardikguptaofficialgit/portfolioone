import type { PortfolioDocument, Project } from '../../lib/portfolio/types.js';
import { readPortfolioFromDisk } from './read-portfolio.js';

const readOnlyError = () =>
  new Error('Portfolio is read-only. Edit files under content/ and redeploy.');

export const getPortfolio = async () => {
  const data = readPortfolioFromDisk();
  return { data, source: 'json' as const, writable: false };
};

export const savePortfolio = async (_doc: PortfolioDocument) => {
  throw readOnlyError();
};

export const listProjects = async () => {
  const { data, source, writable } = await getPortfolio();
  return {
    data: [...data.projects].sort((a, b) => (a.sortOrder ?? 999) - (b.sortOrder ?? 999)),
    source,
    writable,
  };
};

export const createProject = async (_input: Partial<Project>) => {
  throw readOnlyError();
};

export const updateProject = async (_id: string, _input: Partial<Project>) => {
  throw readOnlyError();
};

export const deleteProject = async (_id: string) => {
  throw readOnlyError();
};
