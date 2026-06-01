import { loadEnv } from 'vite';
import { routePortfolioRequestSafe } from './portfolio-router';

const sendJson = (res: any, status: number, payload: unknown) => {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(payload));
};

const toPathParam = (pathname: string): string | string[] | undefined => {
  const sub = pathname.replace(/^\/api\/portfolio\/?/, '');
  if (!sub) return undefined;
  return sub.split('/').filter(Boolean);
};

export const portfolioLocalApiPlugin = (mode: string) => {
  const env = loadEnv(mode, process.cwd(), '');
  if (env.PORTFOLIO_API_KEY) process.env.PORTFOLIO_API_KEY = env.PORTFOLIO_API_KEY;
  if (env.MCP_PORTFOLIO_API_KEY) process.env.MCP_PORTFOLIO_API_KEY = env.MCP_PORTFOLIO_API_KEY;

  return {
  name: 'portfolio-local-api',
  configureServer(server: any) {
    server.middlewares.use(async (req: any, res: any, next: any) => {
      const rawUrl = String(req.url || '');
      const [pathname, queryString = ''] = rawUrl.split('?');
      if (!pathname.startsWith('/api/portfolio')) {
        next();
        return;
      }

      const query: Record<string, string> = {};
      new URLSearchParams(queryString).forEach((v, k) => {
        query[k] = v;
      });

      const mockReq = {
        method: req.method,
        headers: req.headers as Record<string, string>,
        query,
        body: undefined as unknown,
      };

      if (req.method === 'PATCH' || req.method === 'POST') {
        const chunks: Buffer[] = [];
        for await (const chunk of req) {
          chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
        }
        if (chunks.length > 0) {
          try {
            mockReq.body = JSON.parse(Buffer.concat(chunks).toString('utf-8'));
          } catch {
            mockReq.body = {};
          }
        }
      }

      const mockRes = {
        status(code: number) {
          res.statusCode = code;
          return this;
        },
        json(body: unknown) {
          sendJson(res, res.statusCode || 200, body);
        },
      };

      try {
        await routePortfolioRequestSafe(mockReq, mockRes, toPathParam(pathname));
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Portfolio API error';
        sendJson(res, 500, { error: message });
      }
    });
  },
};
};
