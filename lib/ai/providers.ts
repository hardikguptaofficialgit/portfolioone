import type { BlogPost, PortfolioDocument } from '../portfolio/types';

export type AIProvider = {
  id: string;
  label: string;
  shortLabel: string;
  icon: string;
  model: string;
  urlBase: string;
};

export const PRIMARY_AI_PROVIDERS: AIProvider[] = [
  {
    id: 'chatgpt',
    label: 'Chat with ChatGPT',
    shortLabel: 'ChatGPT',
    icon: 'ChatGPT',
    model: 'gpt-5',
    urlBase: 'https://chatgpt.com/?q=',
  },
  {
    id: 'claude',
    label: 'Extend conversation with Claude',
    shortLabel: 'Claude',
    icon: 'Claude',
    model: 'claude',
    urlBase: 'https://claude.ai/new?q=',
  },
  {
    id: 'gemini',
    label: 'Chat with Gemini',
    shortLabel: 'Gemini',
    icon: 'Gemini',
    model: 'gemini',
    urlBase: 'https://gemini.google.com/app?prompt=',
  },
  {
    id: 'perplexity',
    label: 'Ask Perplexity',
    shortLabel: 'Perplexity',
    icon: 'Perplexity',
    model: 'pplx',
    urlBase: 'https://www.perplexity.ai/search/new?q=',
  },
];

export const EXTRA_AI_PROVIDERS: AIProvider[] = [
  {
    id: 'copilot',
    label: 'Open Microsoft Copilot',
    shortLabel: 'Copilot',
    icon: 'Copilot',
    model: 'copilot',
    urlBase: 'https://copilot.microsoft.com/?q=',
  },
  {
    id: 'huggingface',
    label: 'Try Hugging Face Chat',
    shortLabel: 'HuggingFace',
    icon: 'HuggingFace',
    model: 'openrouter',
    urlBase: 'https://huggingface.co/chat/?q=',
  },
];

export const getAIProviderHref = (provider: AIProvider, prompt: string) =>
  `${provider.urlBase}${encodeURIComponent(prompt)}`;

export const buildPortfolioPrompt = (portfolio: PortfolioDocument) => {
  const { profile, projects, skillsFlat } = portfolio;
  const featuredProjects = projects
    .filter((project) => !project.archived)
    .slice(0, 6)
    .map((project) => project.name)
    .join(', ');

  const skills = (skillsFlat || []).slice(0, 12).join(', ');
  const site = profile.website?.startsWith('http') ? profile.website : `https://${profile.website}`;

  return [
    `I am exploring ${profile.name}'s portfolio and want to discuss their background.`,
    '',
    `Name: ${profile.name}`,
    `Headline: ${profile.headline}`,
    profile.title ? `Title: ${profile.title}` : null,
    `Location: ${profile.location}`,
    `Website: ${site}`,
    profile.email ? `Email: ${profile.email}` : null,
    profile.summary ? `Summary: ${profile.summary}` : null,
    featuredProjects ? `Notable projects: ${featuredProjects}` : null,
    skills ? `Skills: ${skills}` : null,
    '',
    'Help me understand their experience, technical strengths, standout projects, and what makes them a strong collaborator or hire.',
  ]
    .filter(Boolean)
    .join('\n');
};

export const buildBlogPostPrompt = (post: BlogPost, postUrl: string) =>
  [
    `Let's discuss this article in detail.`,
    `Title: ${post.title}`,
    `Summary: ${post.excerpt || 'No summary provided.'}`,
    `URL: ${post.sourceUrl || postUrl}`,
    `I want key takeaways, critique, practical next steps, and production-grade implementation ideas.`,
  ].join('\n');
