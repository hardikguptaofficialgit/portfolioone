import { routePortfolioRequestSafe } from '../../_lib/portfolio-router';

export const config = {
  runtime: 'nodejs',
};

export default async function handler(req: any, res: any) {
  return routePortfolioRequestSafe(req, res, ['projects', String(req.query?.id || '')]);
}
