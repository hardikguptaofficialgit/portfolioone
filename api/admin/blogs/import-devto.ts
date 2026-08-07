import { requireAdmin } from '../../_lib/admin-auth.js';
import { uploadToCloudinary } from '../../_lib/cloudinary.js';
import { getPortfolio, savePortfolio } from '../../_lib/portfolio-store.js';
import { blogPostSchema, slugify } from '../../../lib/portfolio/schema.js';
import type { BlogPost } from '../../../lib/portfolio/types.js';

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

const normalizeTags = (value: unknown): string[] => {
  if (Array.isArray(value)) return value.map(String).map((tag) => tag.trim()).filter(Boolean);
  if (typeof value === 'string') return value.split(',').map((tag) => tag.trim()).filter(Boolean);
  return [];
};

const normalizeMarkdown = (value: string) =>
  value
    .replace(/\r\n/g, '\n')
    .replace(/\{%\s*raw\s*%\}([\s\S]*?)\{%\s*endraw\s*%\}/gi, '$1')
    .replace(/\{%\s*embed\s+(https?:\/\/[^\s%}]+)\s*%\}/gi, '\n\n[$1]($1)\n\n')
    .replace(/\{%\s*youtube\s+([A-Za-z0-9_-]+)\s*%\}/gi, '\n\n[YouTube video](https://www.youtube.com/watch?v=$1)\n\n')
    .replace(/\{%\s*(?:twitter|tweet)\s+([0-9]+)\s*%\}/gi, '\n\n[X post](https://twitter.com/i/web/status/$1)\n\n')
    .replace(/\{%[^%]*%\}/g, '');

const replaceAsync = async (
  input: string,
  regex: RegExp,
  replacer: (match: RegExpExecArray) => Promise<string>
) => {
  const matches = Array.from(input.matchAll(regex));
  let output = input;
  for (const match of matches) {
    output = output.replace(match[0], await replacer(match));
  }
  return output;
};

const cloudinaryCache = new Map<string, string>();

const mirrorImage = async (url: string, folder: string) => {
  if (!/^https?:\/\//i.test(url) || url.includes('res.cloudinary.com')) return url;
  const cached = cloudinaryCache.get(url);
  if (cached) return cached;
  const result = await uploadToCloudinary(url, { folder });
  cloudinaryCache.set(url, result.url);
  return result.url;
};

const mirrorArticleImages = async (body: string, folder: string) => {
  let next = body;
  next = await replaceAsync(next, /!\[([^\]]*)\]\((https?:\/\/[^)\s]+)(?:\s+"[^"]*")?\)/g, async (match) => {
    const url = await mirrorImage(match[2], folder);
    return `![${match[1]}](${url})`;
  });
  next = await replaceAsync(next, /<img([^>]+?)src=["'](https?:\/\/[^"']+)["']([^>]*)>/gi, async (match) => {
    const url = await mirrorImage(match[2], folder);
    return `<img${match[1]}src="${url}"${match[3]}>`;
  });
  return next;
};

const fetchDevToJson = async (url: string, apiKey?: string) => {
  const response = await fetch(url, {
    headers: {
      Accept: 'application/json',
      ...(apiKey ? { 'api-key': apiKey } : {}),
    },
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload?.error || payload?.message || `DEV import request failed (${response.status}).`);
  }
  return payload;
};

export default async function handler(req: any, res: any) {
  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }

  if (!requireAdmin(req, res)) return;

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed.' });
    return;
  }

  try {
    const body = parseBody(req);
    const username = String(body.username || process.env.DEV_IMPORT_USERNAME || process.env.DEV_USERNAME || '').replace(/^@/, '').trim();
    const apiKey = String(body.apiKey || process.env.DEV_API_KEY || '').trim() || undefined;
    const limit = Math.min(Math.max(Number(body.limit) || 50, 1), 100);
    const replaceExisting = body.replaceExisting !== false;

    if (!username && !apiKey) {
      res.status(400).json({ error: 'Provide a DEV username or DEV_API_KEY for import.' });
      return;
    }

    const listUrl = apiKey
      ? `https://dev.to/api/articles/me/published?per_page=${limit}`
      : `https://dev.to/api/articles?username=${encodeURIComponent(username)}&per_page=${limit}`;
    const articles = await fetchDevToJson(listUrl, apiKey);
    if (!Array.isArray(articles)) throw new Error('DEV import returned an unexpected article list.');

    const imported: BlogPost[] = [];
    for (const articleSummary of articles) {
      const id = Number(articleSummary.id);
      if (!id) continue;
      const article = await fetchDevToJson(`https://dev.to/api/articles/${id}`, apiKey);
      const slug = slugify(String(article.slug || article.title || `post-${id}`)) || `post-${id}`;
      const folder = `portfolio/blogs/${slug}`;
      const coverImage = article.cover_image || article.social_image
        ? await mirrorImage(String(article.cover_image || article.social_image), folder)
        : null;
      const rawBody = normalizeMarkdown(String(article.body_markdown || article.body_html || article.description || ''));
      const bodyWithMirroredImages = await mirrorArticleImages(rawBody, folder);

      imported.push(
        blogPostSchema.parse({
          id: slug,
          slug,
          title: String(article.title || 'Untitled'),
          excerpt: String(article.description || ''),
          body: bodyWithMirroredImages,
          coverImage,
          tags: normalizeTags(article.tag_list ?? article.tags),
          publishedAt: article.published_at || article.published_timestamp || article.created_at || new Date().toISOString(),
          readingTimeMinutes: Number(article.reading_time_minutes) || undefined,
          featured: true,
          archived: false,
          sortOrder: Number(articleSummary?.positive_reactions_count) ? undefined : 999,
          sourceUrl: article.url || article.canonical_url,
        }) as BlogPost
      );
    }

    const { data } = await getPortfolio();
    const bySlug = new Map((data.blogPosts || []).map((post) => [post.slug, post]));
    for (const post of imported) {
      if (replaceExisting || !bySlug.has(post.slug)) bySlug.set(post.slug, post);
    }

    const saved = await savePortfolio({
      ...data,
      blogPosts: Array.from(bySlug.values()).sort(
        (a, b) => +new Date(b.publishedAt) - +new Date(a.publishedAt)
      ),
    });

    res.status(200).json({
      ok: true,
      imported: imported.length,
      totalBlogPosts: saved.blogPosts.length,
      data: imported,
    });
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : 'DEV import failed.' });
  }
}
