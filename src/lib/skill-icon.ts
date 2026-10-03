/** Simple Icons slugs - rendered via Iconify CDN. */
const SKILL_ICON_SLUG: Record<string, string> = {
  TypeScript: 'typescript',
  JavaScript: 'javascript',
  'C++': 'cplusplus',
  C: 'c',
  Dart: 'dart',
  PHP: 'php',
  'React.js': 'react',
  ReactJS: 'react',
  'Next.js': 'nextdotjs',
  Flutter: 'flutter',
  'Tailwind CSS': 'tailwindcss',
  HTML5: 'html5',
  HTML: 'html5',
  CSS3: 'css',
  CSS: 'css',
  PWA: 'googlechrome',
  'Node.js': 'nodedotjs',
  NodeJS: 'nodedotjs',
  'Express.js': 'express',
  ExpressJS: 'express',
  'REST APIs': 'openapiinitiative',
  WebSockets: 'socketdotio',
  'Socket.IO': 'socketdotio',
  Redis: 'redis',
  OpenAI: 'openai',
  Anthropic: 'anthropic',
  Gemini: 'googlegemini',
  Llama: 'meta',
  TensorFlow: 'tensorflow',
  Firebase: 'firebase',
  PostgreSQL: 'postgresql',
  Docker: 'docker',
  Vercel: 'vercel',
  Render: 'render',
  PostHog: 'posthog',
  Git: 'git',
  GitHub: 'github',
};

const ICONIFY = 'https://api.iconify.design/simple-icons';

export function getSkillIconSlug(skill: string): string | null {
  return SKILL_ICON_SLUG[skill.trim()] ?? null;
}

export function getSkillIconUrl(skill: string) {
  const slug = getSkillIconSlug(skill);
  if (!slug) return null;
  return `${ICONIFY}/${slug}.svg`;
}
