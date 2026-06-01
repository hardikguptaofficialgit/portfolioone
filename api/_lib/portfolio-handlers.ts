import { assertPortfolioAuth } from './portfolio-auth';
import { projectSchema, slugify } from './portfolio-schema';
import type { Project } from './portfolio-schema';
import { loadPortfolioSeed } from './portfolio-seed';
import {
  deleteProjectById,
  getPortfolio,
  mergePortfolioPatch,
  parseBody,
  savePortfolio,
  upsertProject,
} from './portfolio-store';

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

const methodNotAllowed = (res: Res) => res.status(405).json({ error: 'Method not allowed.' });

export const handlePortfolioIndex = async (req: Req, res: Res) => {
  try {
    if (req.method === 'GET') {
      try {
        const { doc, meta } = await getPortfolio();
        return res.status(200).json({ ok: true, data: doc, meta });
      } catch (error) {
        console.error('[portfolio] GET failed, serving seed:', error);
        return res.status(200).json({
          ok: true,
          data: loadPortfolioSeed(),
          meta: { source: 'seed', writable: false, degraded: true },
        });
      }
    }

    if (req.method === 'PATCH') {
      assertPortfolioAuth(req);
      const body = parseBody(req);
      const { doc: current } = await getPortfolio();
      const next = mergePortfolioPatch(current, body.patch ?? body);
      const saved = await savePortfolio(next);
      return res.status(200).json({ ok: true, data: saved });
    }

    return methodNotAllowed(res);
  } catch (error) {
    const status = (error as Error & { statusCode?: number }).statusCode ?? 500;
    const message = error instanceof Error ? error.message : 'Portfolio request failed.';
    return res.status(status).json({ error: message });
  }
};

export const handlePortfolioProjects = async (req: Req, res: Res) => {
  try {
    const { doc, meta } = await getPortfolio();

    if (req.method === 'GET') {
      const activeOnly = req.query?.active !== 'false';
      const projects = activeOnly ? doc.projects.filter((p) => !p.archived) : doc.projects;
      return res.status(200).json({ ok: true, data: projects, meta });
    }

    if (req.method === 'POST') {
      assertPortfolioAuth(req);
      const body = parseBody(req);
      const input = projectSchema.parse({
        ...body,
        id: body.id || slugify(String(body.name || 'project')),
      }) as Project;
      const saved = await savePortfolio(upsertProject(doc, input));
      return res.status(201).json({
        ok: true,
        data: saved.projects.find((p) => p.id === input.id),
      });
    }

    return methodNotAllowed(res);
  } catch (error) {
    const status = (error as Error & { statusCode?: number }).statusCode ?? 500;
    const message = error instanceof Error ? error.message : 'Projects request failed.';
    return res.status(status).json({ error: message });
  }
};

export const handlePortfolioProjectById = async (req: Req, res: Res, id: string) => {
  try {
    const { doc } = await getPortfolio();
    const existing = doc.projects.find((p) => p.id === id);

    if (req.method === 'GET') {
      if (!existing) return res.status(404).json({ error: `Project not found: ${id}` });
      return res.status(200).json({ ok: true, data: existing });
    }

    if (req.method === 'PATCH') {
      assertPortfolioAuth(req);
      if (!existing) return res.status(404).json({ error: `Project not found: ${id}` });
      const body = parseBody(req);
      const input = projectSchema.parse({ ...existing, ...body, id }) as Project;
      const saved = await savePortfolio(upsertProject(doc, input));
      return res.status(200).json({ ok: true, data: saved.projects.find((p) => p.id === id) });
    }

    if (req.method === 'DELETE') {
      assertPortfolioAuth(req);
      if (!existing) return res.status(404).json({ error: `Project not found: ${id}` });
      const soft = req.query?.hard !== 'true';
      const saved = await savePortfolio(deleteProjectById(doc, id, soft));
      return res.status(200).json({ ok: true, deleted: id, soft });
    }

    return methodNotAllowed(res);
  } catch (error) {
    const status = (error as Error & { statusCode?: number }).statusCode ?? 500;
    const message = error instanceof Error ? error.message : 'Project request failed.';
    return res.status(status).json({ error: message });
  }
};

export const handlePortfolioSchema = async (req: Req, res: Res) => {
  if (req.method !== 'GET') return methodNotAllowed(res);
  return res.status(200).json({
    ok: true,
    resources: {
      'portfolio://schema': 'JSON Schema for portfolio document',
      'portfolio://projects': 'List of projects',
      'portfolio://profile': 'Profile and social links',
      'portfolio://skills': 'Skill categories',
      'portfolio://experience': 'Work experience',
    },
    tools: [
      'get_portfolio',
      'list_projects',
      'get_project',
      'create_project',
      'update_project',
      'delete_project',
      'update_skills',
      'update_experience',
      'update_profile',
      'create_blog_draft',
    ],
  });
};
