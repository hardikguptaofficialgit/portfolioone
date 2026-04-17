interface DevToPostData {
  title: string;
  content: string;
  excerpt?: string;
  featuredImage?: string;
  tags?: string[];
  published?: boolean;
  canonicalUrl?: string;
  series?: string;
}

export interface DevToArticle {
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
}

export interface DevToComment {
  id: number;
  body_markdown?: string;
  body_html?: string;
  created_at: string;
  depth: number;
  user: {
    name: string;
    username: string;
    profile_image: string;
  };
  children: DevToComment[];
}

interface FetchDevToArticlesOptions {
  page?: number;
  tag?: string;
  signal?: AbortSignal;
  perPage?: number;
}

interface DevToCachePayload {
  articles: DevToArticle[];
  savedAt: string;
}

const normalizeTagList = (value: unknown): string[] => {
  if (Array.isArray(value)) {
    return value.filter((tag): tag is string => typeof tag === 'string' && tag.trim().length > 0);
  }

  if (typeof value === 'string') {
    return value
      .split(',')
      .map((tag) => tag.trim())
      .filter(Boolean);
  }

  return [];
};

export const normalizeDevToMarkdown = (value: string) => {
  if (!value) return '';

  return value
    .replace(/\r\n/g, '\n')
    .replace(/\{\%\s*embed\s+(https?:\/\/[^%\s]+)\s*\%\}/gi, '\n\n[$1]($1)\n\n')
    .replace(/\{\%\s*youtube\s+([^\s%]+)\s*\%\}/gi, '\n\n[YouTube video](https://www.youtube.com/watch?v=$1)\n\n')
    .replace(/\{\%\s*agent_session\s+([^\s%]+)\s*\%\}/gi, '\n\n> Agent session: $1\n\n');
};

const parseDevToError = async (response: Response) => {
  const fallback = `DEV.to request failed (${response.status})`;

  try {
    const data = await response.json();
    if (typeof data?.error === 'string') return data.error;
    if (Array.isArray(data?.error)) return data.error.join(', ');
    if (typeof data?.message === 'string') return data.message;
    return fallback;
  } catch {
    return fallback;
  }
};

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
const getDevToCacheKey = (username: string) => `devto_cache_${username}`;

const readDevToCache = (username: string): DevToArticle[] => {
  try {
    const raw = localStorage.getItem(getDevToCacheKey(username));
    if (!raw) return [];
    const payload = JSON.parse(raw) as DevToCachePayload;
    if (!Array.isArray(payload?.articles)) return [];
    return payload.articles;
  } catch {
    return [];
  }
};

const writeDevToCache = (username: string, articles: DevToArticle[]) => {
  try {
    const payload: DevToCachePayload = { articles, savedAt: new Date().toISOString() };
    localStorage.setItem(getDevToCacheKey(username), JSON.stringify(payload));
  } catch {
    // Ignore storage failures (private mode/quota).
  }
};

const requestDevTo = async (url: string, init: RequestInit = {}, maxAttempts = 2): Promise<Response> => {
  let attempt = 0;
  let lastError: unknown;

  while (attempt < maxAttempts) {
    try {
      const response = await fetch(url, {
        ...init,
        headers: {
          Accept: 'application/json',
          ...(init.headers || {}),
        },
      });

      if (response.status === 429 && attempt < maxAttempts - 1) {
        await sleep(700 * (attempt + 1));
        attempt += 1;
        continue;
      }

      return response;
    } catch (error) {
      lastError = error;
      if (attempt >= maxAttempts - 1) throw error;
      await sleep(500 * (attempt + 1));
      attempt += 1;
    }
  }

  throw lastError ?? new Error('Unknown DEV.to request error');
};

const normalizeDevToArticle = (article: any): DevToArticle => ({
  id: article.id,
  title: article.title ?? 'Untitled',
  description: article.description ?? article.social_image ?? '',
  cover_image: article.cover_image ?? article.social_image ?? null,
  published_at: article.published_at ?? article.published_timestamp ?? article.created_at ?? new Date().toISOString(),
  tag_list: normalizeTagList(article.tag_list ?? article.tags),
  slug: article.slug ?? '',
  url: article.url ?? article.canonical_url ?? '',
  canonical_url: article.canonical_url ?? article.url ?? '',
  body_markdown: typeof article.body_markdown === 'string' ? article.body_markdown : undefined,
  body_html: typeof article.body_html === 'string' ? article.body_html : undefined,
  reading_time_minutes: Number(article.reading_time_minutes) || 1,
  public_reactions_count: Number(article.public_reactions_count) || 0,
  comments_count: Number(article.comments_count) || 0,
  user: {
    name: article.user?.name ?? '',
    username: article.user?.username ?? '',
    profile_image: article.user?.profile_image ?? article.user?.profile_image_90 ?? '',
  },
});

const normalizeDevToComment = (comment: any): DevToComment => ({
  id: Number(comment.id) || 0,
  body_markdown: typeof comment.body_markdown === 'string' ? comment.body_markdown : undefined,
  body_html: typeof comment.body_html === 'string' ? comment.body_html : undefined,
  created_at: comment.created_at ?? new Date().toISOString(),
  depth: Number(comment.depth) || 0,
  user: {
    name: comment.user?.name ?? '',
    username: comment.user?.username ?? '',
    profile_image: comment.user?.profile_image ?? '',
  },
  children: Array.isArray(comment.children) ? comment.children.map(normalizeDevToComment) : [],
});

/**
 * Publish a post to DEV.to using their API
 * Requires DEV_API_KEY environment variable
 */
export const postToDevTo = async (data: DevToPostData) => {
  const apiKey = import.meta.env.VITE_DEV_API_KEY;

  if (!apiKey) {
    throw new Error('DEV.to API key not configured. Please add VITE_DEV_API_KEY to your .env file');
  }

  try {
    const response = await fetch('https://dev.to/api/articles', {
      method: 'POST',
      headers: {
        'api-key': apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        article: {
          title: data.title,
          published: data.published ?? false,
          body_markdown: normalizeDevToMarkdown(data.content),
          tags: data.tags || [],
          description: data.excerpt,
          main_image: data.featuredImage,
          canonical_url: data.canonicalUrl,
          series: data.series,
        },
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to publish to DEV.to');
    }

    return await response.json();
  } catch (error) {
    console.error('Error publishing to DEV.to:', error);
    throw error;
  }
};

/**
 * Fetch published articles from a DEV.to user
 * This endpoint is public and doesn't require authentication
 */
export const fetchDevToArticles = async (
  username: string,
  perPage: number = 10,
  options: FetchDevToArticlesOptions = {}
): Promise<DevToArticle[]> => {
  const safeUsername = username?.trim().replace(/^@/, '') || 'strykerinside';

  try {
    const params = new URLSearchParams({
      username: safeUsername,
      per_page: String(options.perPage ?? perPage),
      page: String(options.page ?? 1),
    });

    if (options.tag) {
      params.set('tag', options.tag);
    }

    const response = await requestDevTo(`https://dev.to/api/articles?${params.toString()}`, {
      signal: options.signal,
      cache: 'no-store',
    });

    if (!response.ok) {
      throw new Error(await parseDevToError(response));
    }

    const articles = await response.json();

    if (!Array.isArray(articles)) {
      throw new Error('DEV.to returned an unexpected response');
    }

    const normalized = articles.map(normalizeDevToArticle);
    if (normalized.length > 0) {
      writeDevToCache(safeUsername, normalized);
    }
    return normalized;
  } catch (error) {
    console.error('Error fetching DEV.to articles:', error);
    const cached = readDevToCache(safeUsername);
    if (cached.length > 0) return cached;
    throw error;
  }
};

/**
 * Fetch a single article by id (public endpoint)
 */
export const fetchDevToArticleById = async (articleId: number, signal?: AbortSignal): Promise<DevToArticle> => {
  const response = await requestDevTo(`https://dev.to/api/articles/${articleId}`, {
    signal,
    cache: 'no-store',
  });

  if (!response.ok) {
    throw new Error(await parseDevToError(response));
  }

  const article = await response.json();
  return normalizeDevToArticle(article);
};

/**
 * Fetch a single article by username and slug (public endpoint)
 */
export const fetchDevToArticleBySlug = async (
  username: string,
  slug: string,
  signal?: AbortSignal
): Promise<DevToArticle> => {
  const safeUsername = username?.trim().replace(/^@/, '') || 'strykerinside';
  const safeSlug = slug?.trim();
  const response = await requestDevTo(`https://dev.to/api/articles/${safeUsername}/${safeSlug}`, {
    signal,
    cache: 'no-store',
  });

  if (!response.ok) {
    throw new Error(await parseDevToError(response));
  }

  const article = await response.json();
  return normalizeDevToArticle(article);
};

/**
 * Fetch public comments for a DEV.to article by article id
 */
export const fetchDevToComments = async (
  articleId: number,
  signal?: AbortSignal
): Promise<DevToComment[]> => {
  const params = new URLSearchParams({ a_id: String(articleId) });
  const response = await requestDevTo(`https://dev.to/api/comments?${params.toString()}`, {
    signal,
    cache: 'no-store',
  });

  if (!response.ok) {
    throw new Error(await parseDevToError(response));
  }

  const comments = await response.json();
  if (!Array.isArray(comments)) return [];
  return comments.map(normalizeDevToComment);
};

/**
 * Fetch your own published articles (requires authentication)
 */
export const fetchMyDevToArticles = async (published: boolean = true): Promise<DevToArticle[]> => {
  const apiKey = import.meta.env.VITE_DEV_API_KEY;

  if (!apiKey) {
    throw new Error('DEV.to API key not configured');
  }

  try {
    const endpoint = published 
      ? 'https://dev.to/api/articles/me/published'
      : 'https://dev.to/api/articles/me/unpublished';

    const response = await fetch(endpoint, {
      headers: {
        'api-key': apiKey,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch your DEV.to articles');
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching your DEV.to articles:', error);
    throw error;
  }
};

/**
 * Update an existing DEV.to article
 */
export const updateDevToArticle = async (articleId: number, data: Partial<DevToPostData>) => {
  const apiKey = import.meta.env.VITE_DEV_API_KEY;

  if (!apiKey) {
    throw new Error('DEV.to API key not configured');
  }

  try {
    const response = await fetch(`https://dev.to/api/articles/${articleId}`, {
      method: 'PUT',
      headers: {
        'api-key': apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        article: {
          title: data.title,
          published: data.published,
          body_markdown: normalizeDevToMarkdown(data.content ?? ''),
          tags: data.tags,
          description: data.excerpt,
          main_image: data.featuredImage,
          canonical_url: data.canonicalUrl,
          series: data.series,
        },
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to update DEV.to article');
    }

    return await response.json();
  } catch (error) {
    console.error('Error updating DEV.to article:', error);
    throw error;
  }
};

/**
 * Delete a DEV.to article
 */
export const deleteDevToArticle = async (articleId: number) => {
  const apiKey = import.meta.env.VITE_DEV_API_KEY;

  if (!apiKey) {
    throw new Error('DEV.to API key not configured');
  }

  try {
    const response = await fetch(`https://dev.to/api/articles/${articleId}`, {
      method: 'DELETE',
      headers: {
        'api-key': apiKey,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to delete DEV.to article');
    }

    return { success: true };
  } catch (error) {
    console.error('Error deleting DEV.to article:', error);
    throw error;
  }
};
