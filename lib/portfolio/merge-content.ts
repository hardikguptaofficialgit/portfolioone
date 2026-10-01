import { portfolioDocumentSchema } from './schema';
import type { PortfolioDocument } from './types';

export type PortfolioContentParts = {
  site: {
    version?: number;
    profile: PortfolioDocument['profile'];
    socialLinks: PortfolioDocument['socialLinks'];
    sections?: PortfolioDocument['sections'];
    education: PortfolioDocument['education'];
    achievements: PortfolioDocument['achievements'];
    certifications: PortfolioDocument['certifications'];
    newsletterSettings?: PortfolioDocument['newsletterSettings'];
  };
  skills: {
    skillCategories: PortfolioDocument['skillCategories'];
    skillsFlat: PortfolioDocument['skillsFlat'];
  };
  projects: { projects: PortfolioDocument['projects'] };
  experience: {
    experience: PortfolioDocument['experience'];
    simplifiedExperience?: PortfolioDocument['simplifiedExperience'];
  };
  blogs: { blogPosts?: PortfolioDocument['blogPosts'] };
  photos: { photoEvents?: PortfolioDocument['photoEvents'] };
};

export const mergePortfolioContent = (parts: PortfolioContentParts): PortfolioDocument => {
  const doc = {
    version: parts.site.version ?? 1,
    profile: parts.site.profile,
    socialLinks: parts.site.socialLinks,
    sections: parts.site.sections ?? {},
    education: parts.site.education,
    achievements: parts.site.achievements,
    certifications: parts.site.certifications,
    skillCategories: parts.skills.skillCategories,
    skillsFlat: parts.skills.skillsFlat,
    projects: parts.projects.projects,
    experience: parts.experience.experience,
    simplifiedExperience: parts.experience.simplifiedExperience ?? [],
    blogPosts: parts.blogs.blogPosts ?? [],
    photoEvents: parts.photos.photoEvents ?? [],
    ...(parts.site.newsletterSettings ? { newsletterSettings: parts.site.newsletterSettings } : {}),
  };
  return portfolioDocumentSchema.parse(doc) as PortfolioDocument;
};
