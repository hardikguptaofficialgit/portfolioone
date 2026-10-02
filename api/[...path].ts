import type { VercelRequest, VercelResponse } from '@vercel/node';

const attachQuery = (req: VercelRequest) => {
  const pathParam = req.query.path;
  const fromCatchAll = Array.isArray(pathParam)
    ? pathParam.join('/')
    : typeof pathParam === 'string'
      ? pathParam
      : '';

  try {
    const url = new URL(req.url || 'http://localhost/api', 'http://localhost');
    const fromUrl = url.searchParams.get('path') || '';
    const path = (fromCatchAll || fromUrl).replace(/^\/+|\/+$/g, '');
    if (path) {
      req.query = { ...(req.query || {}), path };
    }
  } catch {
    req.query = req.query || {};
  }
};

import handleApiRequest from '../server/router.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    attachQuery(req);
    await handleApiRequest(req, res);
  } catch (error) {
    res.status(500).json({
      error: error instanceof Error ? error.message : 'API handler failed.',
    });
  }
}
