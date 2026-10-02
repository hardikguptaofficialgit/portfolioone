import type { VercelRequest, VercelResponse } from '@vercel/node';

const attachQuery = (req: VercelRequest) => {
  try {
    const url = new URL(req.url || 'http://localhost/api', 'http://localhost');
    const fromUrl = Object.fromEntries(url.searchParams.entries());
    req.query = { ...(req.query || {}), ...fromUrl };
  } catch {
    req.query = req.query || {};
  }
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    attachQuery(req);
    const { default: handleApiRequest } = await import('../server/router.js');
    await handleApiRequest(req, res);
  } catch (error) {
    res.status(500).json({
      error: error instanceof Error ? error.message : 'API handler failed.',
    });
  }
}
