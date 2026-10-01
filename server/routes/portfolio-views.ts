import { getPortfolioViews, incrementPortfolioViews } from '../_lib/portfolio-views-store.js';

export default async function handler(req: any, res: any) {
  try {
    if (req.method === 'GET') {
      const count = await getPortfolioViews();
      res.status(200).json({ ok: true, count });
      return;
    }

    if (req.method === 'POST') {
      const count = await incrementPortfolioViews();
      res.status(200).json({ ok: true, count });
      return;
    }

    res.status(405).json({ error: 'Method not allowed.' });
  } catch (error) {
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Portfolio views request failed.',
    });
  }
}
