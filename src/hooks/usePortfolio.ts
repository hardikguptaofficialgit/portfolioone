import { useQuery, useQueryClient } from '@tanstack/react-query';
import { defaultPortfolio, getActiveProjects, getFeaturedProjects } from '@/content/defaults';
import type { PortfolioDocument } from '@/content/types';
import { fetchPortfolioDocument } from '@/lib/portfolio/fetch-portfolio';

export const portfolioQueryKey = ['portfolio'] as const;

const fetchPortfolio = async (): Promise<PortfolioDocument> => fetchPortfolioDocument();

export const usePortfolio = () => {
  const query = useQuery({
    queryKey: portfolioQueryKey,
    queryFn: fetchPortfolio,
    staleTime: Infinity,
    placeholderData: defaultPortfolio,
  });
  const doc = query.data ?? defaultPortfolio;

  return {
    ...query,
    portfolio: doc,
    profile: doc.profile,
    projects: getActiveProjects(doc),
    featuredProjects: getFeaturedProjects(doc),
    photoEvents: [...(doc.photoEvents ?? [])]
      .filter((event) => event.images.length > 0)
      .sort((a, b) => (a.pinned === b.pinned ? (a.sortOrder ?? 999) - (b.sortOrder ?? 999) : a.pinned ? -1 : 1)),
    blogPosts: [...(doc.blogPosts ?? [])]
      .filter((post) => !post.archived)
      .sort((a, b) => {
        const sort = (a.sortOrder ?? 999) - (b.sortOrder ?? 999);
        return sort || +new Date(b.publishedAt) - +new Date(a.publishedAt);
      }),
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
