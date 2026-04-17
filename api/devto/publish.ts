type DevToDraftPost = {
  title: string;
  excerpt?: string;
  featuredImage?: string;
  tags?: string[];
  content: string;
  published?: boolean;
  canonicalUrl?: string;
  series?: string;
};

declare const process: {
  env: Record<string, string | undefined>;
};

const parseBody = (req: any) => {
  if (!req.body) return {};
  if (typeof req.body === 'string') {
    try {
      return JSON.parse(req.body);
    } catch {
      return {};
    }
  }
  return req.body;
};

const requiredEnv = (name: string): string => {
  const value = process.env[name] || process.env[`VITE_${name}`];
  if (!value) throw new Error(`Missing environment variable: ${name}`);
  return value;
};

const normalizeTags = (tags?: string[]) => {
  if (!Array.isArray(tags)) return [];
  const normalized = tags
    .map((tag) => String(tag || '').trim().toLowerCase())
    .filter(Boolean)
    .map((tag) => tag.replace(/[^a-z0-9]+/g, ''))
    .filter(Boolean)
    .slice(0, 4);

  return Array.from(new Set(normalized));
};

const normalizeDevToMarkdown = (value: string) => {
  if (!value) return '';

  return value
    .replace(/\r\n/g, '\n')
    .replace(/\{\%\s*embed\s+(https?:\/\/[^%\s]+)\s*\%\}/gi, '\n\n[$1]($1)\n\n')
    .replace(/\{\%\s*youtube\s+([^\s%]+)\s*\%\}/gi, '\n\n[YouTube video](https://www.youtube.com/watch?v=$1)\n\n')
    .replace(/\{\%\s*agent_session\s+([^\s%]+)\s*\%\}/gi, '\n\n> Agent session: $1\n\n');
};

const validatePost = (post: DevToDraftPost, index: number) => {
  if (!post || typeof post !== 'object') {
    throw new Error(`Post at index ${index} is invalid.`);
  }
  if (!post.title || typeof post.title !== 'string') {
    throw new Error(`Post at index ${index} is missing a valid title.`);
  }
  if (!post.content || typeof post.content !== 'string') {
    throw new Error(`Post at index ${index} is missing markdown content.`);
  }
};

const isRecentTitleError = (message: string) =>
  /title has already been used in the last five minutes/i.test(message) ||
  /title.*already been used/i.test(message);

const uniqueTitle = (title: string, index: number) => {
  const stamp = new Date().toISOString().replace(/[:.]/g, '').slice(0, 15);
  return `${title} (${index + 1}-${stamp})`;
};

const publishToDevTo = async (apiKey: string, post: DevToDraftPost) => {
  const response = await fetch('https://dev.to/api/articles', {
    method: 'POST',
    headers: {
      'api-key': apiKey,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({
      article: {
        title: post.title,
        published: Boolean(post.published),
          body_markdown: normalizeDevToMarkdown(post.content),
        description: post.excerpt,
        main_image: post.featuredImage,
        tags: normalizeTags(post.tags),
        canonical_url: post.canonicalUrl,
        series: post.series,
      },
    }),
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message =
      typeof payload?.error === 'string'
        ? payload.error
        : Array.isArray(payload?.error)
          ? payload.error.join(', ')
          : `DEV.to publish failed (${response.status})`;
    throw new Error(message);
  }

  return payload;
};

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed.' });
    return;
  }

  try {
    const body = parseBody(req);
    const posts = Array.isArray(body?.posts) ? (body.posts as DevToDraftPost[]) : [];

    if (posts.length === 0) {
      res.status(400).json({ error: 'Provide at least one post.' });
      return;
    }

    if (posts.length > 5) {
      res.status(400).json({ error: 'Maximum 5 posts per request.' });
      return;
    }

    posts.forEach((post, index) => validatePost(post, index));

    const apiKey = requiredEnv('DEV_API_KEY');
    const published = [] as Array<{ id?: number; title?: string; url?: string }>;

    for (const [index, post] of posts.entries()) {
      let result;
      try {
        result = await publishToDevTo(apiKey, {
          ...post,
          published: false,
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : '';
        if (!isRecentTitleError(message)) throw error;

        result = await publishToDevTo(apiKey, {
          ...post,
          title: uniqueTitle(post.title, index),
          published: false,
        });
      }

      published.push({ id: result?.id, title: result?.title, url: result?.url });
    }

    res.status(200).json({ ok: true, published });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to publish DEV.to drafts.';
    res.status(500).json({ error: message });
  }
}
