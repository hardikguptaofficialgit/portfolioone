export type SocialLink = {
  id: string;
  name: string;
  icon: string;
  url: string;
  description?: string;
};

export type SkillCategory = {
  label: string;
  items: string[];
};

export type Project = {
  id: string;
  name: string;
  tag?: string;
  description: string;
  tech: string[];
  liveUrl: string;
  githubUrl?: string;
  imageUrl?: string | null;
  caseStudy?: string;
  featured?: boolean;
  sortOrder?: number;
  archived?: boolean;
};

export type PhotoEvent = {
  id: string;
  title: string;
  description: string;
  date: string;
  pinned?: boolean;
  images: string[];
  sortOrder?: number;
};

export type BlogPost = {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  body: string;
  coverImage?: string | null;
  tags: string[];
  publishedAt: string;
  readingTimeMinutes?: number;
  featured?: boolean;
  archived?: boolean;
  sortOrder?: number;
  sourceUrl?: string;
};

export type Experience = {
  id: string;
  role: string;
  company: string;
  startDate: string;
  endDate?: string | null;
  current?: boolean;
  url?: string;
  highlights: string[];
  sortOrder?: number;
};

export type Education = {
  id: string;
  institution: string;
  degree: string;
  startYear: number;
  endYear: number;
};

export type Achievement = {
  id: string;
  title: string;
  detail: string;
  badge?: string;
  iconKey?: string;
};

export type Certification = {
  id: string;
  name: string;
  issuer: string;
  issueDate?: string;
  url?: string;
  credentialId?: string;
};

export type Profile = {
  name: string;
  headline: string;
  title?: string;
  location: string;
  email: string;
  website: string;
  resumePdfUrl?: string;
  githubUsername?: string;
  summary?: string;
};

export type SimplifiedExperienceCard = {
  id: string;
  roleTitle?: string;
  org: string;
  logoUrl?: string;
  url?: string;
  totalDuration: string;
  badge?: string;
  bullets?: string[];
  roles?: Array<{ title: string; period: string; duration: string; location?: string }>;
};

export type PortfolioSections = {
  portfolioIntro?: { title: string; subtitle: string };
  vscodeProjectsIntro?: { title: string; subtitle: string };
  aboutIntro?: { title: string; subtitle: string };
  simplifiedProjectsIntro?: { title: string; subtitle: string };
  simplifiedGithubIntro?: { title: string; subtitle: string };
  simplifiedPhotosIntro?: { title: string; subtitle: string };
  simplifiedBlogIntro?: { title: string; subtitle: string };
  simplifiedSummaryHighlight?: string;
  simplifiedAboutBullets?: string[];
};

export type PortfolioDocument = {
  version: number;
  profile: Profile;
  socialLinks: SocialLink[];
  skillCategories: SkillCategory[];
  skillsFlat: string[];
  projects: Project[];
  photoEvents: PhotoEvent[];
  blogPosts: BlogPost[];
  experience: Experience[];
  simplifiedExperience?: SimplifiedExperienceCard[];
  education: Education[];
  achievements: Achievement[];
  certifications: Certification[];
  sections: PortfolioSections;
  updatedAt?: string;
};

export type PortfolioPatch = Partial<Omit<PortfolioDocument, 'version' | 'updatedAt'>> & {
  version?: number;
};
