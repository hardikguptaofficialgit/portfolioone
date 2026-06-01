import { useQuery, useQueryClient } from '@tanstack/react-query';
import { defaultPortfolio, getActiveProjects, getFeaturedProjects } from '@/content/defaults';
import type { PortfolioDocument } from '@/content/types';

type PortfolioResponse = {
  ok: boolean;
  data: PortfolioDocument;
  meta?: { source: string; writable: boolean };
};

const fetchPortfolio = async (): Promise<PortfolioDocument> => {
  try {
    const res = await fetch('/api/portfolio', { cache: 'no-store' });
    if (!res.ok) throw new Error('API unavailable');
    const payload = (await res.json()) as PortfolioResponse;
    if (payload?.data) return payload.data;
    throw new Error('Invalid portfolio response');
  } catch {
    return defaultPortfolio;
  }
};

export const portfolioQueryKey = ['portfolio'] as const;

export const usePortfolio = () => {
  const query = useQuery({
    queryKey: portfolioQueryKey,
    queryFn: fetchPortfolio,
    staleTime: 60_000,
    placeholderData: defaultPortfolio,
  });

  const doc = query.data ?? defaultPortfolio;

  return {
    ...query,
    portfolio: doc,
    profile: doc.profile,
    projects: getActiveProjects(doc),
    featuredProjects: getFeaturedProjects(doc),
    experience: [...doc.experience].sort((a, b) => (a.sortOrder ?? 999) - (b.sortOrder ?? 999)),
    simplifiedExperience: doc.simplifiedExperience ?? [],
    skillCategories: doc.skillCategories,
    skillsFlat: doc.skillsFlat,
    achievements: doc.achievements,
    socialLinks: doc.socialLinks,
    education: doc.education,
    certifications: doc.certifications,
    sections: doc.sections,
  };
};

export const useInvalidatePortfolio = () => {
  const client = useQueryClient();
  return () => client.invalidateQueries({ queryKey: portfolioQueryKey });
};
