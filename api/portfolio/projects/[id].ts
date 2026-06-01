import { handlePortfolioProjectById } from '../../_lib/portfolio-handlers';

export default async function handler(req: any, res: any) {
  const id = String(req.query?.id || '');
  if (!id) {
    res.status(400).json({ error: 'Missing project id.' });
    return;
  }
  return handlePortfolioProjectById(req, res, id);
}
