import { defaultPortfolio, getActiveProjects, getFeaturedProjects } from '@/content/defaults';

export const portfolioQueryKey = ['portfolio'] as const;

export const usePortfolio = () => {
  const doc = defaultPortfolio;

  return {
    data: doc,
    isLoading: false,
    isError: false,
    error: null,
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
  return () => undefined;
};
