import type { IncomingMessage, ServerResponse } from 'http';
import handleApiRequest from '../server/router.js';

type VercelLikeRequest = IncomingMessage & {
  method?: string;
  query?: Record<string, string | string[] | undefined>;
  body?: unknown;
};

const wrapResponse = (res: ServerResponse) => {
  let statusCode = 200;
  const apiRes = res as ServerResponse & {
    status: (code: number) => typeof apiRes;
    json: (payload: unknown) => void;
  };

  apiRes.status = (code: number) => {
    statusCode = code;
    return apiRes;
  };

  apiRes.json = (payload: unknown) => {
    if (res.writableEnded) return;
    res.statusCode = statusCode;
    if (!res.getHeader('Content-Type')) {
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
    }
    res.end(JSON.stringify(payload));
  };

  return apiRes;
};

const attachQuery = (req: VercelLikeRequest) => {
  try {
    const url = new URL(req.url || 'http://localhost/api', 'http://localhost');
    const fromUrl = Object.fromEntries(url.searchParams.entries());
    req.query = { ...(req.query || {}), ...fromUrl };
  } catch {
    req.query = req.query || {};
  }
};

export default async function handler(req: VercelLikeRequest, res: ServerResponse) {
  const apiRes = wrapResponse(res);
  try {
    attachQuery(req);
    await handleApiRequest(req, apiRes);
  } catch (error) {
    apiRes.status(500).json({
      error: error instanceof Error ? error.message : 'API handler failed.',
    });
  }
}
