import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { portfolioDocumentSchema, projectSchema, slugify } from '../../lib/portfolio/schema.js';
import type { PortfolioDocument, Project } from '../../lib/portfolio/types.js';

const TABLE = 'portfolio_content';
const CONTENT_ID = 'main';
const seedPath = fileURLToPath(new URL('../../content/portfolio.json', import.meta.url));
const seed = JSON.parse(readFileSync(seedPath, 'utf8')) as unknown;

const getSupabaseConfig = () => {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  return url && key ? { url, key } : null;
};

const getSupabase = () => {
  const config = getSupabaseConfig();
  if (!config) return null;
  return createClient(config.url, config.key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
};

const parsePortfolio = (value: unknown): PortfolioDocument =>
  portfolioDocumentSchema.parse(value) as PortfolioDocument;

export const getPortfolio = async () => {
  const supabase = getSupabase();
  if (supabase) {
    const { data, error } = await supabase.from(TABLE).select('data').eq('id', CONTENT_ID).maybeSingle();
    if (!error && data?.data) {
      return { data: parsePortfolio(data.data), source: 'supabase' as const, writable: true };
    }
  }
  return { data: parsePortfolio(seed), source: 'seed' as const, writable: Boolean(supabase) };
};

export const savePortfolio = async (doc: PortfolioDocument) => {
  const supabase = getSupabase();
  if (!supabase) {
    throw new Error('Portfolio storage is not configured. Add SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.');
  }

  const data = parsePortfolio({ ...doc, updatedAt: new Date().toISOString() });
  const { error } = await supabase.from(TABLE).upsert({
    id: CONTENT_ID,
    data,
    version: data.version,
    updated_at: data.updatedAt,
  });
  if (error) throw new Error(error.message || 'Failed to save portfolio.');
  return data;
};

export const listProjects = async () => {
  const { data, source, writable } = await getPortfolio();
  return { data: [...data.projects].sort((a, b) => (a.sortOrder ?? 999) - (b.sortOrder ?? 999)), source, writable };
};

export const createProject = async (input: Partial<Project>) => {
  const { data } = await getPortfolio();
  const id = input.id || slugify(String(input.name || 'project'));
  const project = projectSchema.parse({
    ...input,
    id,
    tech: Array.isArray(input.tech) ? input.tech : [],
    liveUrl: input.liveUrl || '#',
  }) as Project;
  const projects = [...data.projects.filter((item) => item.id !== project.id), project];
  const saved = await savePortfolio({ ...data, projects });
  return saved.projects.find((item) => item.id === project.id);
};

export const updateProject = async (id: string, input: Partial<Project>) => {
  const { data } = await getPortfolio();
  const existing = data.projects.find((item) => item.id === id);
  if (!existing) throw new Error(`Project not found: ${id}`);
  const project = projectSchema.parse({ ...existing, ...input, id }) as Project;
  const saved = await savePortfolio({
    ...data,
    projects: data.projects.map((item) => (item.id === id ? project : item)),
  });
  return saved.projects.find((item) => item.id === id);
};

export const deleteProject = async (id: string) => {
  const { data } = await getPortfolio();
  if (!data.projects.some((item) => item.id === id)) throw new Error(`Project not found: ${id}`);
  await savePortfolio({ ...data, projects: data.projects.filter((item) => item.id !== id) });
};
