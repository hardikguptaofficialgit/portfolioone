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
    website: z.string().url(),
    resumePdfUrl: z.string().url().optional(),
    githubUsername: z.string().optional(),
    devtoUsername: z.string().optional(),
    summary: z.string().optional(),
  }),
  socialLinks: z.array(
    z.object({
      id: z.string().min(1),
      name: z.string().min(1),
      icon: z.string().min(1),
      url: z.string().url(),
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
      url: z.string().url().optional(),
      credentialId: z.string().optional(),
    })
  ),
  simplifiedExperience: z
    .array(
      z.object({
        id: z.string().min(1),
        org: z.string().min(1),
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
  sections: z.record(z.unknown()).default({}),
  updatedAt: z.string().optional(),
});

export const slugify = (value: string) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
