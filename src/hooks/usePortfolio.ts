import { useQuery, useQueryClient } from '@tanstack/react-query';
import { defaultPortfolio, getActiveProjects, getFeaturedProjects } from '@/content/defaults';
import type { PortfolioDocument } from '@/content/types';

export const portfolioQueryKey = ['portfolio'] as const;

const fetchPortfolio = async (): Promise<PortfolioDocument> => {
  try {
    const res = await fetch('/api/portfolio', { cache: 'no-store' });
    if (!res.ok) throw new Error('Portfolio API unavailable');
    const payload = (await res.json()) as { data?: PortfolioDocument };
    return payload.data ?? defaultPortfolio;
  } catch {
    return defaultPortfolio;
  }
};

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
