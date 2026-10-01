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
    res.statusCode = statusCode;
    if (!res.getHeader('Content-Type')) {
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
    }
    res.end(JSON.stringify(payload));
  };

  return apiRes;
};

export default async function handler(req: VercelLikeRequest, res: ServerResponse) {
  await handleApiRequest(req, wrapResponse(res));
}
