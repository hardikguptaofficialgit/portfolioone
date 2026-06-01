import { handlePortfolioSchema } from '../_lib/portfolio-handlers';

export default async function handler(req: any, res: any) {
  return handlePortfolioSchema(req, res);
}
