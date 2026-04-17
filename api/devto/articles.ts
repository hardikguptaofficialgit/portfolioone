type DevToArticle = {
  id: number;
  title: string;
  description: string;
  cover_image: string | null;
  published_at: string;
  tag_list: string[];
  slug: string;
  url: string;
  canonical_url: string;
  body_markdown?: string;
  body_html?: string;
  reading_time_minutes: number;
  public_reactions_count: number;
  comments_count: number;
  user: {
    name: string;
    username: string;
    profile_image: string;
  };
};

declare const process: {
  env: Record<string, string | undefined>;
};

const parseDevToError = async (response: Response) => {
  const fallback = `DEV.to request failed (${response.status})`;
  try {
    const payload = await response.json();
    if (typeof payload?.error === 'string') return payload.error;
    if (Array.isArray(payload?.error)) return payload.error.join(', ');
    if (typeof payload?.message === 'string') return payload.message;
    return fallback;
  } catch {
    return fallback;
  }
};

const normalizeTagList = (value: unknown): string[] => {
  if (Array.isArray(value)) {
    return value.filter((tag): tag is string => typeof tag === 'string' && tag.trim().length > 0);
  }
  if (typeof value === 'string') {
    return value.split(',').map((tag) => tag.trim()).filter(Boolean);
  }
  return [];
};

const normalizeArticle = (article: any): DevToArticle => ({
  id: Number(article?.id) || 0,
  title: article?.title ?? 'Untitled',
  description: article?.description ?? article?.social_image ?? '',
  cover_image: article?.cover_image ?? article?.social_image ?? null,
  published_at: article?.published_at ?? article?.published_timestamp ?? article?.created_at ?? new Date().toISOString(),
  tag_list: normalizeTagList(article?.tag_list ?? article?.tags),
  slug: article?.slug ?? '',
  url: article?.url ?? article?.canonical_url ?? '',
  canonical_url: article?.canonical_url ?? article?.url ?? '',
  body_markdown: typeof article?.body_markdown === 'string' ? article.body_markdown : undefined,
  body_html: typeof article?.body_html === 'string' ? article.body_html : undefined,
  reading_time_minutes: Number(article?.reading_time_minutes) || 1,
  public_reactions_count: Number(article?.public_reactions_count) || 0,
  comments_count: Number(article?.comments_count) || 0,
  user: {
    name: article?.user?.name ?? '',
    username: article?.user?.username ?? '',
    profile_image: article?.user?.profile_image ?? article?.user?.profile_image_90 ?? '',
  },
});

const getEnv = (name: string) => process.env[name] || process.env[`VITE_${name}`];

const fetchByUsername = async (username: string, perPage: number, signal?: AbortSignal) => {
  const params = new URLSearchParams({
    username,
    per_page: String(perPage),
    page: '1',
  });
  const response = await fetch(`https://dev.to/api/articles?${params.toString()}`, {
    signal,
    headers: { Accept: 'application/json' },
    cache: 'no-store',
  });
  if (!response.ok) throw new Error(await parseDevToError(response));
  const payload = await response.json();
  if (!Array.isArray(payload)) return [] as DevToArticle[];
  return payload.map(normalizeArticle);
};

const fetchMyPublished = async (apiKey: string, perPage: number, signal?: AbortSignal) => {
  const response = await fetch(`https://dev.to/api/articles/me/published?per_page=${perPage}&page=1`, {
    signal,
    headers: {
      Accept: 'application/json',
      'api-key': apiKey,
    },
    cache: 'no-store',
  });
  if (!response.ok) throw new Error(await parseDevToError(response));
  const payload = await response.json();
  if (!Array.isArray(payload)) return [] as DevToArticle[];
  return payload.map(normalizeArticle);
};

export default async function handler(req: any, res: any) {
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed.' });
    return;
  }

  try {
    const perPage = Math.min(50, Math.max(1, Number(req.query?.perPage) || 24));
    const username = String(req.query?.username || getEnv('DEV_USERNAME') || 'strykerinside').replace(/^@/, '').trim();

    const apiKey = getEnv('DEV_API_KEY');

    if (apiKey) {
      const mine = await fetchMyPublished(apiKey, perPage);
      if (mine.length > 0) {
        res.status(200).json({ ok: true, source: 'me/published', articles: mine });
        return;
      }
    }

    const articles = await fetchByUsername(username, perPage);
    res.status(200).json({ ok: true, source: `username/${username}`, articles });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch DEV.to articles.';
    res.status(500).json({ error: message });
  }
}
