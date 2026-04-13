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
  reading_time_minutes: number;
  public_reactions_count: number;
  comments_count: number;
  user: {
    name: string;
    username: string;
    profile_image: string;
  };
}

interface FetchDevToArticlesOptions {
  page?: number;
  tag?: string;
  signal?: AbortSignal;
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
  reading_time_minutes: Number(article.reading_time_minutes) || 1,
  public_reactions_count: Number(article.public_reactions_count) || 0,
  comments_count: Number(article.comments_count) || 0,
  user: {
    name: article.user?.name ?? '',
    username: article.user?.username ?? '',
    profile_image: article.user?.profile_image ?? article.user?.profile_image_90 ?? '',
  },
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
          body_markdown: data.content,
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
  try {
    const params = new URLSearchParams({
      username,
      per_page: String(perPage),
      page: String(options.page ?? 1),
    });

    if (options.tag) {
      params.set('tag', options.tag);
    }

    const response = await fetch(`https://dev.to/api/articles?${params.toString()}`, {
      headers: {
        Accept: 'application/json',
      },
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

    return articles.map(normalizeDevToArticle);
  } catch (error) {
    console.error('Error fetching DEV.to articles:', error);
    throw error;
  }
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
          body_markdown: data.content,
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
