import chat from './routes/chat.js';
import config from './routes/config.js';
import portfolio from './routes/portfolio.js';
import portfolioViews from './routes/portfolio-views.js';
import blogs from './routes/blogs/index.js';
import blogBySlug from './routes/blogs/[slug].js';
import doomsWaitlist from './routes/dooms/waitlist.js';

type Handler = (req: any, res: any) => unknown | Promise<unknown>;

type RouteMatch = {
  handler: Handler;
  params?: Record<string, string>;
};

const exactRoutes = new Map<string, Handler>([
  ['chat', chat],
  ['config', config],
  ['portfolio', portfolio],
  ['portfolio/views', portfolioViews],
  ['blogs', blogs],
  ['dooms/waitlist', doomsWaitlist],
]);

const normalizePath = (req: any) => {
  const queryPath = req.query?.path;
  const fromQuery = Array.isArray(queryPath) ? queryPath.join('/') : queryPath;
  if (typeof fromQuery === 'string' && fromQuery.trim()) {
    return fromQuery.replace(/^\/+|\/+$/g, '');
  }

  const pathname = new URL(req.url || '/api', 'http://localhost').pathname;
  return pathname.replace(/^\/api\/?/, '').replace(/^\/+|\/+$/g, '');
};

const matchRoute = (path: string): RouteMatch | null => {
  const normalized = path || 'portfolio';
  const exact = exactRoutes.get(normalized);
  if (exact) return { handler: exact };

  const segments = normalized.split('/').filter(Boolean);
  if (segments[0] === 'blogs' && segments[1] && segments.length === 2) {
    return { handler: blogBySlug, params: { slug: segments[1] } };
  }

  return null;
};

export const handleApiRequest: Handler = async (req, res) => {
  const match = matchRoute(normalizePath(req));
  if (!match) {
    res.status(404).json({ error: 'API route not found.' });
    return;
  }

  req.query = {
    ...(req.query || {}),
    ...(match.params || {}),
  };

  await match.handler(req, res);
};

export default handleApiRequest;
