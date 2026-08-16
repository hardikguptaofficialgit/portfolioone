import { requireAdmin } from '../../_lib/admin-auth.js';
import { getPortfolio, savePortfolio } from '../../_lib/portfolio-store.js';
import { portfolioDocumentSchema } from '../../../lib/portfolio/schema.js';
import type { PortfolioDocument } from '../../../lib/portfolio/types.js';

const parseBody = (req: any) => {
  if (!req.body) return {};
  if (typeof req.body === 'string') {
    try {
      return JSON.parse(req.body);
    } catch {
      return {};
    }
  }
  return req.body;
};

export default async function handler(req: any, res: any) {
  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }

  if (!requireAdmin(req, res)) return;

  try {
    if (req.method === 'GET') {
      const result = await getPortfolio();
      res.status(200).json({ ok: true, ...result });
      return;
    }

    if (req.method === 'PUT' || req.method === 'POST') {
      const body = parseBody(req);
      const document = portfolioDocumentSchema.parse(body.data || body) as PortfolioDocument;
      const data = await savePortfolio(document);
      res.status(200).json({ ok: true, data });
      return;
    }

    res.status(405).json({ error: 'Method not allowed.' });
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : 'Portfolio save failed.' });
  }
}
