import chat from './routes/chat.js';
import config from './routes/config.js';
import portfolio from './routes/portfolio.js';
import adminLogin from './routes/admin/login.js';
import adminPortfolio from './routes/admin/portfolio.js';
import adminUpload from './routes/admin/upload.js';
import importDevtoBlogs from './routes/admin/blogs/import-devto.js';
import sendNewsletter from './routes/admin/newsletter/send.js';
import newsletterSubscribers from './routes/admin/newsletter/subscribers.js';
import adminProjects from './routes/admin/projects/index.js';
import adminProjectById from './routes/admin/projects/[id].js';
import blogs from './routes/blogs/index.js';
import blogBySlug from './routes/blogs/[slug].js';
import subscribeNewsletter from './routes/newsletter/subscribe.js';
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
  ['admin/login', adminLogin],
  ['admin/portfolio', adminPortfolio],
  ['admin/upload', adminUpload],
  ['admin/blogs/import-devto', importDevtoBlogs],
  ['admin/newsletter/send', sendNewsletter],
  ['admin/newsletter/subscribers', newsletterSubscribers],
  ['admin/projects', adminProjects],
  ['blogs', blogs],
  ['newsletter/subscribe', subscribeNewsletter],
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
  if (segments[0] === 'admin' && segments[1] === 'projects' && segments[2] && segments.length === 3) {
    return { handler: adminProjectById, params: { id: segments[2] } };
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
