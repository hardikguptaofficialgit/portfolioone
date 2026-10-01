import { z } from 'zod';

export const projectSchema = z.object({
  id: z.string().min(1).regex(/^[a-z0-9-]+$/),
  name: z.string().min(1),
  tag: z.string().optional(),
  description: z.string().min(1),
  tech: z.array(z.string()).default([]),
  liveUrl: z.string().min(1),
  githubUrl: z.string().optional(),
  imageUrl: z.string().nullable().optional(),
  caseStudy: z.string().optional(),
  featured: z.boolean().optional(),
  sortOrder: z.number().optional(),
  archived: z.boolean().optional(),
});

export const photoEventSchema = z.object({
  id: z.string().min(1).regex(/^[a-z0-9-]+$/),
  title: z.string().min(1),
  description: z.string().min(1),
  date: z.string().min(1),
  pinned: z.boolean().optional(),
  images: z.array(z.string().min(1)).default([]),
  sortOrder: z.number().optional(),
});

export const blogPostSchema = z.object({
  id: z.string().min(1).regex(/^[a-z0-9-]+$/),
  slug: z.string().min(1).regex(/^[a-z0-9-]+$/),
  title: z.string().min(1),
  excerpt: z.string().default(''),
  body: z.string().default(''),
  coverImage: z.string().nullable().optional(),
  tags: z.array(z.string()).default([]),
  publishedAt: z.string().min(1),
  readingTimeMinutes: z.number().optional(),
  featured: z.boolean().optional(),
  archived: z.boolean().optional(),
  sortOrder: z.number().optional(),
  sourceUrl: z.string().optional(),
});

export const newsletterSettingsSchema = z.object({
  title: z.string().min(1).default('Stryker Newsletter'),
  description: z.string().min(1).default('Updates on products, engineering, AI, and things I am building.'),
  welcomeSubject: z.string().min(1).default('Thanks for subscribing'),
  welcomeText: z.string().min(1).default('You are subscribed to Stryker updates.'),
  fromName: z.string().optional(),
  campaignSubject: z.string().optional(),
  campaignPreviewText: z.string().optional(),
  campaignHtml: z.string().optional(),
  campaignText: z.string().optional(),
});

export const experienceSchema = z.object({
  id: z.string().min(1).regex(/^[a-z0-9-]+$/),
  role: z.string().min(1),
  company: z.string().min(1),
  startDate: z.string().min(1),
  endDate: z.string().nullable().optional(),
  current: z.boolean().optional(),
  url: z.string().optional(),
  highlights: z.array(z.string()).default([]),
  sortOrder: z.number().optional(),
});

export const portfolioDocumentSchema = z.object({
  version: z.number().int().positive().default(1),
  profile: z.object({
    name: z.string().min(1),
    headline: z.string().min(1),
    title: z.string().optional(),
    location: z.string().min(1),
    email: z.string().email(),
    website: z.string().min(1),
    resumePdfUrl: z.string().optional(),
    githubUsername: z.string().optional(),
    summary: z.string().optional(),
  }),
  socialLinks: z.array(
    z.object({
      id: z.string().min(1),
      name: z.string().min(1),
      icon: z.string().min(1),
      url: z.string().min(1),
      description: z.string().optional(),
    })
  ),
  skillCategories: z.array(
    z.object({
      label: z.string().min(1),
      items: z.array(z.string()),
    })
  ),
  skillsFlat: z.array(z.string()),
  projects: z.array(projectSchema),
  photoEvents: z.array(photoEventSchema).default([]),
  blogPosts: z.array(blogPostSchema).default([]),
  newsletterSettings: newsletterSettingsSchema.optional(),
  experience: z.array(experienceSchema),
  education: z.array(
    z.object({
      id: z.string().min(1),
      institution: z.string().min(1),
      degree: z.string().min(1),
      startYear: z.number(),
      endYear: z.number(),
    })
  ),
  achievements: z.array(
    z.object({
      id: z.string().min(1),
      title: z.string().min(1),
      detail: z.string().min(1),
      badge: z.string().optional(),
      iconKey: z.string().optional(),
    })
  ),
  certifications: z.array(
    z.object({
      id: z.string().min(1),
      name: z.string().min(1),
      issuer: z.string().min(1),
      issueDate: z.string().optional(),
      url: z.string().optional(),
      credentialId: z.string().optional(),
    })
  ),
  simplifiedExperience: z
    .array(
      z.object({
        id: z.string().min(1),
        roleTitle: z.string().optional(),
        org: z.string().min(1),
        logoUrl: z.string().optional(),
        url: z.string().optional(),
        totalDuration: z.string().min(1),
        badge: z.string().optional(),
        bullets: z.array(z.string()).optional(),
        roles: z
          .array(
            z.object({
              title: z.string(),
              period: z.string(),
              duration: z.string(),
              location: z.string().optional(),
            })
          )
          .optional(),
      })
    )
    .optional(),
  sections: z
    .object({
      portfolioIntro: z.object({ title: z.string(), subtitle: z.string() }).optional(),
      vscodeProjectsIntro: z.object({ title: z.string(), subtitle: z.string() }).optional(),
      aboutIntro: z.object({ title: z.string(), subtitle: z.string() }).optional(),
      simplifiedProjectsIntro: z.object({ title: z.string(), subtitle: z.string() }).optional(),
      simplifiedGithubIntro: z.object({ title: z.string(), subtitle: z.string() }).optional(),
      simplifiedPhotosIntro: z.object({ title: z.string(), subtitle: z.string() }).optional(),
      simplifiedBlogIntro: z.object({ title: z.string(), subtitle: z.string() }).optional(),
      simplifiedSummaryHighlight: z.string().optional(),
      simplifiedAboutBullets: z.array(z.string()).optional(),
    })
    .passthrough()
    .default({}),
  updatedAt: z.string().optional(),
});

export const slugify = (value: string) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
