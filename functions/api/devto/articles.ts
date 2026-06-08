import { json, methodNotAllowed } from '../../_shared/json';

type Env = {
  DEVTO_USERNAME?: string;
  VITE_DEV_USERNAME?: string;
  DEV_API_KEY?: string;
  VITE_DEV_API_KEY?: string;
};

type PagesContext = {
  request: Request;
  env: Env;
};

const getEnv = (env: Env, name: keyof Env) => env[name];

const normalizeTagList = (value: unknown): string[] => {
  if (Array.isArray(value)) {
    return value.filter((tag): tag is string => typeof tag === 'string' && tag.trim().length > 0);
  }
  if (typeof value === 'string') {
    return value.split(',').map((tag) => tag.trim()).filter(Boolean);
  }
  return [];
};

const normalizeArticle = (article: Record<string, unknown>) => {
  const user = (article.user || {}) as Record<string, unknown>;
  return {
    id: Number(article.id) || 0,
    title: String(article.title || 'Untitled'),
    description: String(article.description || article.social_image || ''),
    cover_image: article.cover_image || article.social_image || null,
    published_at: article.published_at || article.published_timestamp || article.created_at || new Date().toISOString(),
    tag_list: normalizeTagList(article.tag_list || article.tags),
    slug: String(article.slug || ''),
    url: String(article.url || article.canonical_url || ''),
    canonical_url: String(article.canonical_url || article.url || ''),
    body_markdown: typeof article.body_markdown === 'string' ? article.body_markdown : undefined,
    body_html: typeof article.body_html === 'string' ? article.body_html : undefined,
    reading_time_minutes: Number(article.reading_time_minutes) || 1,
    public_reactions_count: Number(article.public_reactions_count) || 0,
    comments_count: Number(article.comments_count) || 0,
    user: {
      name: String(user.name || ''),
      username: String(user.username || ''),
      profile_image: String(user.profile_image || user.profile_image_90 || ''),
    },
  };
};

const parseDevToError = async (response: Response) => {
  const fallback = `DEV.to request failed (${response.status})`;
  try {
    const payload = (await response.json()) as { error?: string | string[]; message?: string };
    if (typeof payload.error === 'string') return payload.error;
    if (Array.isArray(payload.error)) return payload.error.join(', ');
    if (typeof payload.message === 'string') return payload.message;
    return fallback;
  } catch {
    return fallback;
  }
};

const fetchByUsername = async (username: string, perPage: number) => {
  const params = new URLSearchParams({ username, per_page: String(perPage), page: '1' });
  const response = await fetch(`https://dev.to/api/articles?${params.toString()}`, {
    headers: { Accept: 'application/json' },
  });
  if (!response.ok) throw new Error(await parseDevToError(response));
  const payload = await response.json();
  return Array.isArray(payload) ? payload.map((item) => normalizeArticle(item as Record<string, unknown>)) : [];
};

const fetchMyPublished = async (apiKey: string, perPage: number) => {
  const response = await fetch(`https://dev.to/api/articles/me/published?per_page=${perPage}&page=1`, {
    headers: {
      Accept: 'application/json',
      'api-key': apiKey,
    },
  });
  if (!response.ok) throw new Error(await parseDevToError(response));
  const payload = await response.json();
  return Array.isArray(payload) ? payload.map((item) => normalizeArticle(item as Record<string, unknown>)) : [];
};

export const onRequestGet = async ({ request, env }: PagesContext) => {
  try {
    const url = new URL(request.url);
    const perPage = Math.min(50, Math.max(1, Number(url.searchParams.get('perPage')) || 24));
    const username = String(
      url.searchParams.get('username') ||
        getEnv(env, 'DEVTO_USERNAME') ||
        getEnv(env, 'VITE_DEV_USERNAME') ||
        'strykerinside'
    )
      .replace(/^@/, '')
      .trim();
    const apiKey = getEnv(env, 'DEV_API_KEY') || getEnv(env, 'VITE_DEV_API_KEY');

    if (apiKey) {
      const mine = await fetchMyPublished(apiKey, perPage);
      if (mine.length > 0) return json({ ok: true, source: 'me/published', articles: mine });
    }

    const articles = await fetchByUsername(username, perPage);
    return json({ ok: true, source: `username/${username}`, articles });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch DEV.to articles.';
    return json({ error: message }, { status: 500 });
  }
};

export const onRequest = (context: PagesContext) => {
  if (context.request.method.toUpperCase() !== 'GET') return methodNotAllowed();
  return onRequestGet(context);
};
