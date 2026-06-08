import seed from '../../../content/portfolio.json';
import {
  portfolioDocumentSchema,
  projectSchema,
  type PortfolioDocument,
  type PortfolioPatch,
  type Project,
} from '../../../lib/portfolio/schema';
import { json, methodNotAllowed, parseJsonBody, unauthorized } from '../../_shared/json';

type Env = {
  PORTFOLIO_API_KEY?: string;
  PORTFOLIO_KV?: KVNamespace;
};

type PagesContext = {
  request: Request;
  env: Env;
  params: {
    path?: string | string[];
  };
};

const CONTENT_KEY = 'portfolio:main';

const getSegments = (path?: string | string[]) => {
  if (!path) return [];
  return Array.isArray(path) ? path : [path];
};

const slugify = (value: string) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80) || 'project';

const assertAuth = (request: Request, env: Env) => {
  if (!env.PORTFOLIO_API_KEY) return false;
  const auth = request.headers.get('authorization') || '';
  return auth === `Bearer ${env.PORTFOLIO_API_KEY}`;
};

const parseSeed = () => portfolioDocumentSchema.parse(seed);

const readPortfolio = async (env: Env): Promise<{ doc: PortfolioDocument; source: 'kv' | 'seed'; writable: boolean }> => {
  if (env.PORTFOLIO_KV) {
    const raw = await env.PORTFOLIO_KV.get(CONTENT_KEY, 'json');
    const parsed = raw ? portfolioDocumentSchema.safeParse(raw) : null;
    if (parsed?.success) {
      return { doc: parsed.data, source: 'kv', writable: Boolean(env.PORTFOLIO_API_KEY) };
    }
  }
  return { doc: parseSeed(), source: 'seed', writable: Boolean(env.PORTFOLIO_KV && env.PORTFOLIO_API_KEY) };
};

const savePortfolio = async (env: Env, doc: PortfolioDocument) => {
  if (!env.PORTFOLIO_KV) {
    return json(
      { error: 'Portfolio writes require a Cloudflare KV binding named PORTFOLIO_KV.' },
      { status: 501 }
    );
  }

  const payload = portfolioDocumentSchema.parse({
    ...doc,
    updatedAt: new Date().toISOString(),
  });
  await env.PORTFOLIO_KV.put(CONTENT_KEY, JSON.stringify(payload));
  return json({ ok: true, data: payload });
};

const mergePortfolioPatch = (current: PortfolioDocument, patch: PortfolioPatch): PortfolioDocument =>
  portfolioDocumentSchema.parse({
    ...current,
    ...patch,
    profile: patch.profile ? { ...current.profile, ...patch.profile } : current.profile,
    sections: patch.sections ? { ...current.sections, ...patch.sections } : current.sections,
    projects: patch.projects ?? current.projects,
    experience: patch.experience ?? current.experience,
    education: patch.education ?? current.education,
    achievements: patch.achievements ?? current.achievements,
    certifications: patch.certifications ?? current.certifications,
    socialLinks: patch.socialLinks ?? current.socialLinks,
    skillCategories: patch.skillCategories ?? current.skillCategories,
    skillsFlat: patch.skillsFlat ?? current.skillsFlat,
    simplifiedExperience: patch.simplifiedExperience ?? current.simplifiedExperience,
    version: patch.version ?? current.version,
    updatedAt: new Date().toISOString(),
  });

const upsertProject = (current: PortfolioDocument, project: Project) => {
  const index = current.projects.findIndex((item) => item.id === project.id);
  const projects =
    index >= 0
      ? current.projects.map((item, currentIndex) => (currentIndex === index ? { ...item, ...project } : item))
      : [...current.projects, project];
  return mergePortfolioPatch(current, { projects });
};

const deleteProject = (current: PortfolioDocument, id: string, soft: boolean) => {
  if (!soft) {
    return mergePortfolioPatch(current, {
      projects: current.projects.filter((project) => project.id !== id),
    });
  }

  const existing = current.projects.find((project) => project.id === id);
  if (!existing) throw new Error(`Project not found: ${id}`);
  return upsertProject(current, { ...existing, archived: true });
};

export const onRequest = async ({ request, env, params }: PagesContext) => {
  const method = request.method.toUpperCase();
  const segments = getSegments(params.path);

  try {
    if (segments.length === 0) {
      if (method === 'GET') {
        const { doc, source, writable } = await readPortfolio(env);
        return json({ ok: true, data: doc, meta: { source, writable } });
      }

      if (method === 'PATCH') {
        if (!assertAuth(request, env)) return unauthorized();
        const body = await parseJsonBody<{ patch?: PortfolioPatch } & PortfolioPatch>(request);
        const { doc } = await readPortfolio(env);
        return savePortfolio(env, mergePortfolioPatch(doc, body.patch ?? body));
      }

      return methodNotAllowed();
    }

    if (segments.length === 1 && segments[0] === 'schema') {
      if (method !== 'GET') return methodNotAllowed();
      return json({
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
        ],
      });
    }

    if (segments.length === 1 && segments[0] === 'projects') {
      const { doc, source, writable } = await readPortfolio(env);

      if (method === 'GET') {
        const url = new URL(request.url);
        const activeOnly = url.searchParams.get('active') !== 'false';
        const projects = activeOnly ? doc.projects.filter((project) => !project.archived) : doc.projects;
        return json({ ok: true, data: projects, meta: { source, writable } });
      }

      if (method === 'POST') {
        if (!assertAuth(request, env)) return unauthorized();
        const body = await parseJsonBody<Partial<Project>>(request);
        const project = projectSchema.parse({
          ...body,
          id: body.id || slugify(String(body.name || 'project')),
        });
        const saved = upsertProject(doc, project);
        const result = await savePortfolio(env, saved);
        if (!result.ok) return result;
        return json({ ok: true, data: saved.projects.find((item) => item.id === project.id) }, { status: 201 });
      }

      return methodNotAllowed();
    }

    if (segments.length === 2 && segments[0] === 'projects') {
      const id = decodeURIComponent(segments[1]);
      const { doc } = await readPortfolio(env);
      const existing = doc.projects.find((project) => project.id === id);

      if (method === 'GET') {
        if (!existing) return json({ error: `Project not found: ${id}` }, { status: 404 });
        return json({ ok: true, data: existing });
      }

      if (method === 'PATCH') {
        if (!assertAuth(request, env)) return unauthorized();
        if (!existing) return json({ error: `Project not found: ${id}` }, { status: 404 });
        const body = await parseJsonBody<Partial<Project>>(request);
        const project = projectSchema.parse({ ...existing, ...body, id });
        const saved = upsertProject(doc, project);
        const result = await savePortfolio(env, saved);
        if (!result.ok) return result;
        return json({ ok: true, data: saved.projects.find((item) => item.id === id) });
      }

      if (method === 'DELETE') {
        if (!assertAuth(request, env)) return unauthorized();
        if (!existing) return json({ error: `Project not found: ${id}` }, { status: 404 });
        const url = new URL(request.url);
        const soft = url.searchParams.get('hard') !== 'true';
        const saved = deleteProject(doc, id, soft);
        const result = await savePortfolio(env, saved);
        if (!result.ok) return result;
        return json({ ok: true, deleted: id, soft });
      }

      return methodNotAllowed();
    }

    return json({ error: 'Not found.' }, { status: 404 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Portfolio request failed.';
    return json({ error: message }, { status: 500 });
  }
};
