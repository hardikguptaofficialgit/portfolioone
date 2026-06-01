import {
  handlePortfolioIndex,
  handlePortfolioProjectById,
  handlePortfolioProjects,
  handlePortfolioSchema,
} from './portfolio-handlers';
import { loadPortfolioSeed } from './portfolio-seed';

type Req = {
  method?: string;
  headers?: Record<string, string | string[] | undefined>;
  query?: Record<string, string | string[] | undefined>;
  body?: unknown;
};

type Res = {
  status: (code: number) => Res;
  json: (body: unknown) => void;
};

const normalizeSegments = (pathParam: string | string[] | undefined): string[] => {
  if (!pathParam) return [];
  return Array.isArray(pathParam) ? pathParam : [pathParam];
};

export const routePortfolioRequest = async (req: Req, res: Res, pathParam?: string | string[]) => {
  const segments = normalizeSegments(pathParam);

  if (segments.length === 0) {
    return handlePortfolioIndex(req, res);
  }

  if (segments.length === 1 && segments[0] === 'schema') {
    return handlePortfolioSchema(req, res);
  }

  if (segments.length === 1 && segments[0] === 'projects') {
    return handlePortfolioProjects(req, res);
  }

  if (segments.length === 2 && segments[0] === 'projects' && segments[1]) {
    return handlePortfolioProjectById(req, res, decodeURIComponent(segments[1]));
  }

  return res.status(404).json({ error: 'Not found.' });
};

export const routePortfolioRequestSafe = async (
  req: Req,
  res: Res,
  pathParam?: string | string[]
) => {
  try {
    await routePortfolioRequest(req, res, pathParam);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('[portfolio] router error:', message);

    if (req.method === 'GET' && normalizeSegments(pathParam).length <= 1) {
      return res.status(200).json({
        ok: true,
        data: loadPortfolioSeed(),
        meta: { source: 'seed', writable: false, degraded: true },
      });
    }

    return res.status(500).json({ error: message });
  }
};
