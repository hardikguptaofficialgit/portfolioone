/** Canonical public site URL (no trailing slash). Override with VITE_SITE_URL at build time. */
export const SITE_URL = (
  import.meta.env.VITE_SITE_URL?.replace(/\/$/, '') || 'https://strykerinside.vercel.app'
).replace(/\/$/, '');

export const SITE_NAME = 'Stryker Inside';
export const SITE_TAGLINE = 'Hardik Gupta — Software Engineer & Builder';
export const DEFAULT_DESCRIPTION =
  'Portfolio of Hardik Gupta (Stryker): full-stack software engineer building AI systems, developer tools, and products. Projects, resume, blog, and interactive desktop experience.';
export const DEFAULT_OG_IMAGE = `${SITE_URL}/logoimage.png`;
export const AUTHOR_NAME = 'Hardik Gupta';
export const AUTHOR_X = 'https://x.com/stryker_inside';
export const AUTHOR_GITHUB = 'https://github.com/hardikguptaofficialgit';
export const AUTHOR_LINKEDIN = 'https://www.linkedin.com/in/hardik-gupta-b528072b3/';
export const CONTACT_EMAIL = 'hardikgupta8792@gmail.com';

export const STATIC_ROUTES = [
  { path: '/', changefreq: 'weekly', priority: '1.0' },
  { path: '/blogs', changefreq: 'weekly', priority: '0.9' },
  { path: '/desktop', changefreq: 'monthly', priority: '0.7' },
  { path: '/dooms', changefreq: 'monthly', priority: '0.4' },
] as const;
