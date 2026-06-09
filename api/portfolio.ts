import { getPortfolio } from './_lib/portfolio-store.js';

export default async function handler(req: any, res: any) {
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed.' });
    return;
  }

  try {
    const result = await getPortfolio();
    res.status(200).json({ ok: true, data: result.data, meta: { source: result.source, writable: result.writable } });
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : 'Portfolio request failed.' });
  }
}
