import { handlePortfolioProjects } from '../../_lib/portfolio-handlers';

export default async function handler(req: any, res: any) {
  return handlePortfolioProjects(req, res);
}
