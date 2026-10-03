import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const publicDir = path.join(root, 'public');
const siteMetricsSrc = path.join(root, 'content/site-metrics.json');
const siteMetricsDest = path.join(publicDir, 'site-metrics.json');
if (fs.existsSync(siteMetricsSrc)) {
  fs.copyFileSync(siteMetricsSrc, siteMetricsDest);
}
const readContentJson = (file) => JSON.parse(fs.readFileSync(path.join(root, 'content', file), 'utf8'));
const site = readContentJson('site.json');
const skills = readContentJson('skills.json');
const projects = readContentJson('projects.json');
const experience = readContentJson('experience.json');
const blogs = readContentJson('blogs.json');
const photos = readContentJson('photos.json');

const portfolioDocument = {
  version: site.version ?? 1,
  profile: site.profile,
  socialLinks: site.socialLinks,
  sections: site.sections ?? {},
  education: site.education,
  achievements: site.achievements,
  certifications: site.certifications,
  skillCategories: skills.skillCategories,
  skillsFlat: skills.skillsFlat,
  projects: projects.projects,
  experience: experience.experience,
  simplifiedExperience: experience.simplifiedExperience ?? [],
  blogPosts: blogs.blogPosts ?? [],
  photoEvents: photos.photoEvents ?? [],
};

fs.writeFileSync(path.join(publicDir, 'portfolio.json'), JSON.stringify(portfolioDocument));

const SITE_URL = (process.env.VITE_SITE_URL || site.profile?.website || 'https://strykerinside.vercel.app').replace(
  /\/$/,
  '',
);
const profile = site.profile || {};
const name = profile.name || 'Hardik Gupta';
const summary = profile.summary || '';
const email = profile.email || '';
const github = site.socialLinks?.find((l) => l.id === 'github')?.url || '';
const linkedin = site.socialLinks?.find((l) => l.id === 'linkedin')?.url || '';
const x = site.socialLinks?.find((l) => l.id === 'twitter')?.url || '';

const posts = (blogs.blogPosts || []).filter((p) => !p.archived);

const staticPaths = ['/', '/blogs', '/desktop'];

const urls = [
  ...staticPaths.map((p) => ({ loc: `${SITE_URL}${p === '/' ? '' : p}`, changefreq: 'weekly', priority: p === '/' ? '1.0' : '0.8' })),
  ...posts.map((p) => ({
    loc: `${SITE_URL}/blogs/${p.slug}`,
    lastmod: p.publishedAt?.slice(0, 10),
    changefreq: 'monthly',
    priority: '0.7',
  })),
];

const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
  .map(
    (u) => `  <url>
    <loc>${u.loc}</loc>${u.lastmod ? `\n    <lastmod>${u.lastmod}</lastmod>` : ''}
    <changefreq>${u.changefreq}</changefreq>
    <priority>${u.priority}</priority>
  </url>`,
  )
  .join('\n')}
</urlset>
`;

const llms = `# Stryker Inside

> ${name} (Stryker) - ${profile.title || 'Software Engineer'}. ${summary}

Canonical site: ${SITE_URL}

## About

- Name: ${name}
- Also known as: Stryker
- Location: ${profile.location || 'India'}
- Headline: ${profile.headline || ''}
- Email: ${email}
- GitHub: ${github}
- LinkedIn: ${linkedin}
- X: ${x}

## Primary pages

- Home (portfolio, resume, projects): ${SITE_URL}/
- Technical blog index: ${SITE_URL}/blogs
- Interactive desktop experience: ${SITE_URL}/desktop
- Resume PDF: ${SITE_URL}/files/hardikresume.pdf

## Blog posts

${posts.map((p) => `- ${p.title}: ${SITE_URL}/blogs/${p.slug}`).join('\n')}

## Topics

Full-stack web development, TypeScript, React, Node.js, AI/LLM integration, SaaS architecture, Firebase, observability, and product engineering.

## Optional

- API (portfolio data): ${SITE_URL}/api/portfolio
- AI-readable summary: ${SITE_URL}/llms-full.txt
`;

const llmsFull = `${llms}

## Extended context

${(site.sections?.simplifiedAboutBullets || []).map((b) => `- ${b}`).join('\n')}

## Achievements

${(site.achievements || []).map((a) => `- ${a.title} (${a.badge}): ${a.detail}`).join('\n')}
`;

const aiTxt = `# AI / LLM site guidance for ${SITE_URL}

Preferred documentation for language models:

- llms.txt: ${SITE_URL}/llms.txt
- llms-full.txt: ${SITE_URL}/llms-full.txt
- sitemap: ${SITE_URL}/sitemap.xml

Contact: ${email}
`;

fs.mkdirSync(publicDir, { recursive: true });
fs.writeFileSync(path.join(publicDir, 'sitemap.xml'), sitemap);
fs.writeFileSync(path.join(publicDir, 'llms.txt'), llms.trim() + '\n');
fs.writeFileSync(path.join(publicDir, 'llms-full.txt'), llmsFull.trim() + '\n');
fs.writeFileSync(path.join(publicDir, 'ai.txt'), aiTxt.trim() + '\n');

console.log(`SEO static files written for ${SITE_URL} (${posts.length} blog URLs).`);
