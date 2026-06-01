import {
  handlePortfolioIndex,
} from '../_lib/portfolio-handlers';

export default async function handler(req: any, res: any) {
  return handlePortfolioIndex(req, res);
}
