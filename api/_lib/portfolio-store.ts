import { readFileSync, writeFileSync, existsSync } from 'fs';
import { resolve } from 'path';
import { getSupabaseAdminClient } from './supabase-admin';
import {
  portfolioDocumentSchema,
  type PortfolioDocument,
  type PortfolioPatch,
  type Project,
} from './portfolio-schema';
import { loadPortfolioSeed } from './portfolio-seed';

const CONTENT_ID = 'main';
const TABLE = 'portfolio_content';

const contentPath = () => resolve(process.cwd(), 'content', 'portfolio.json');

const parseDocument = (raw: unknown): PortfolioDocument | null => {
  const parsed = portfolioDocumentSchema.safeParse(raw);
  return parsed.success ? parsed.data : null;
};

const readFilePortfolio = (): PortfolioDocument | null => {
  const path = contentPath();
  if (!existsSync(path)) return null;
  try {
    const raw = JSON.parse(readFileSync(path, 'utf-8'));
    return parseDocument(raw);
  } catch {
    return null;
  }
};

const writeFilePortfolio = (doc: PortfolioDocument) => {
  const path = contentPath();
  const payload = { ...doc, updatedAt: new Date().toISOString() };
  writeFileSync(path, `${JSON.stringify(payload, null, 2)}\n`, 'utf-8');
  return payload;
};

const canUseSupabase = () =>
  Boolean(
    (process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL) &&
      process.env.SUPABASE_SERVICE_ROLE_KEY
  );

const readSupabasePortfolio = async (): Promise<PortfolioDocument | null> => {
  if (!canUseSupabase()) return null;

  try {
    const supabase = getSupabaseAdminClient();
    const { data, error } = await supabase
      .from(TABLE)
      .select('data')
      .eq('id', CONTENT_ID)
      .maybeSingle();

    if (error) {
      if (/relation.*does not exist|portfolio_content/i.test(error.message)) return null;
      console.warn('[portfolio] supabase read error:', error.message);
      return null;
    }

    if (!data?.data) return null;
    return parseDocument(data.data);
  } catch (error) {
    console.warn('[portfolio] supabase unavailable:', error);
    return null;
  }
};

const writeSupabasePortfolio = async (doc: PortfolioDocument) => {
  const supabase = getSupabaseAdminClient();
  const payload = { ...doc, updatedAt: new Date().toISOString() };
  const { error } = await supabase.from(TABLE).upsert({
    id: CONTENT_ID,
    data: payload,
    version: payload.version,
    updated_at: payload.updatedAt,
  });
  if (error) throw error;
  return payload;
};

export type PortfolioMeta = {
  source: 'supabase' | 'file' | 'seed';
  writable: boolean;
};

export const getPortfolio = async (): Promise<{ doc: PortfolioDocument; meta: PortfolioMeta }> => {
  const remote = await readSupabasePortfolio();
  if (remote) {
    return {
      doc: remote,
      meta: {
        source: 'supabase',
        writable: canUseSupabase() && Boolean(process.env.PORTFOLIO_API_KEY),
      },
    };
  }

  const fileDoc = readFilePortfolio();
  if (fileDoc) {
    return {
      doc: fileDoc,
      meta: { source: 'file', writable: Boolean(process.env.PORTFOLIO_API_KEY) },
    };
  }

  return {
    doc: loadPortfolioSeed(),
    meta: { source: 'seed', writable: Boolean(process.env.PORTFOLIO_API_KEY) },
  };
};

export const savePortfolio = async (doc: PortfolioDocument): Promise<PortfolioDocument> => {
  const parsed = portfolioDocumentSchema.safeParse(doc);
  if (!parsed.success) {
    throw new Error(parsed.error.errors.map((e) => e.message).join(', ') || 'Invalid portfolio document');
  }
  const validated = parsed.data;

  if (canUseSupabase()) {
    return writeSupabasePortfolio(validated);
  }

  return writeFilePortfolio(validated);
};

export const mergePortfolioPatch = (current: PortfolioDocument, patch: PortfolioPatch): PortfolioDocument => {
  const merged: PortfolioDocument = {
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
  };

  const parsed = portfolioDocumentSchema.safeParse(merged);
  if (!parsed.success) {
    throw new Error(parsed.error.errors.map((e) => e.message).join(', ') || 'Invalid portfolio patch');
  }
  return parsed.data;
};

export const upsertProject = (current: PortfolioDocument, project: Project): PortfolioDocument => {
  const idx = current.projects.findIndex((p) => p.id === project.id);
  const projects =
    idx >= 0
      ? current.projects.map((p, i) => (i === idx ? { ...p, ...project } : p))
      : [...current.projects, project];
  return mergePortfolioPatch(current, { projects });
};

export const deleteProjectById = (current: PortfolioDocument, id: string, soft = true): PortfolioDocument => {
  if (soft) {
    const existing = current.projects.find((p) => p.id === id);
    if (!existing) throw new Error(`Project not found: ${id}`);
    return upsertProject(current, { ...existing, archived: true });
  }
  return mergePortfolioPatch(current, {
    projects: current.projects.filter((p) => p.id !== id),
  });
};

export const parseBody = (req: { body?: unknown }) => {
  if (!req.body) return {};
  if (typeof req.body === 'string') {
    try {
      return JSON.parse(req.body);
    } catch {
      return {};
    }
  }
  return req.body as Record<string, unknown>;
};
