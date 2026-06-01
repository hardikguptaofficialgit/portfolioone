import { readFileSync, writeFileSync, existsSync } from 'fs';
import { resolve } from 'path';
import { getSupabaseAdminClient } from './newsletter';
import { portfolioDocumentSchema } from '../../lib/portfolio/schema';
import type { PortfolioDocument, PortfolioPatch, Project } from '../../lib/portfolio/types';
import { defaultPortfolio } from '../../lib/portfolio/defaults';

const CONTENT_ID = 'main';
const TABLE = 'portfolio_content';

const contentPath = () => resolve(process.cwd(), 'content', 'portfolio.json');

const readFilePortfolio = (): PortfolioDocument => {
  const path = contentPath();
  if (!existsSync(path)) return { ...defaultPortfolio, updatedAt: new Date().toISOString() };
  const raw = JSON.parse(readFileSync(path, 'utf-8'));
  return portfolioDocumentSchema.parse(raw) as PortfolioDocument;
};

const writeFilePortfolio = (doc: PortfolioDocument) => {
  const path = contentPath();
  const payload = { ...doc, updatedAt: new Date().toISOString() };
  writeFileSync(path, `${JSON.stringify(payload, null, 2)}\n`, 'utf-8');
  return payload;
};

const canUseSupabase = () => {
  try {
    return Boolean(
      (process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL) &&
        process.env.SUPABASE_SERVICE_ROLE_KEY
    );
  } catch {
    return false;
  }
};

const readSupabasePortfolio = async (): Promise<PortfolioDocument | null> => {
  if (!canUseSupabase()) return null;
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase.from(TABLE).select('data, version').eq('id', CONTENT_ID).maybeSingle();
  if (error) {
    if (/relation.*does not exist/i.test(error.message)) return null;
    throw error;
  }
  if (!data?.data) return null;
  return portfolioDocumentSchema.parse(data.data) as PortfolioDocument;
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
  source: 'supabase' | 'file' | 'default';
  writable: boolean;
};

export const getPortfolio = async (): Promise<{ doc: PortfolioDocument; meta: PortfolioMeta }> => {
  try {
    const remote = await readSupabasePortfolio();
    if (remote) {
      return {
        doc: remote,
        meta: { source: 'supabase', writable: canUseSupabase() && Boolean(process.env.PORTFOLIO_API_KEY) },
      };
    }
  } catch (error) {
    console.warn('[portfolio] Supabase read failed, falling back to file:', error);
  }

  try {
    const fileDoc = readFilePortfolio();
    return {
      doc: fileDoc,
      meta: { source: 'file', writable: true },
    };
  } catch {
    return {
      doc: { ...defaultPortfolio, updatedAt: new Date().toISOString() },
      meta: { source: 'default', writable: true },
    };
  }
};

export const savePortfolio = async (doc: PortfolioDocument): Promise<PortfolioDocument> => {
  const validated = portfolioDocumentSchema.parse(doc) as PortfolioDocument;

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
  return portfolioDocumentSchema.parse(merged) as PortfolioDocument;
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
    return upsertProject(current, {
      ...(current.projects.find((p) => p.id === id) as Project),
      archived: true,
    });
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
