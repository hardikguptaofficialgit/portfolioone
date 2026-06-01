import { handlePortfolioProjects } from '../../_lib/portfolio-handlers';

export const config = { runtime: 'nodejs' };

export default async function handler(req: any, res: any) {
  return handlePortfolioProjects(req, res);
}
