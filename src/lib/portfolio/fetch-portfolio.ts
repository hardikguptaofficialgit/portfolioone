import { defaultPortfolio } from '@/content/defaults';
import type { PortfolioDocument } from '@/content/types';

export const PORTFOLIO_STATIC_URL = '/portfolio.json';

export async function fetchPortfolioDocument(): Promise<PortfolioDocument> {
  try {
    const staticRes = await fetch(PORTFOLIO_STATIC_URL, { cache: 'no-store' });
    if (staticRes.ok) {
      const data = (await staticRes.json()) as PortfolioDocument;
      if (data?.profile && Array.isArray(data.projects)) return data;
    }
  } catch {
    /* static bundle missing */
  }

  return defaultPortfolio;
}

export async function fetchBlogPostBySlug(slug: string) {
  const doc = await fetchPortfolioDocument();
  const post = (doc.blogPosts ?? []).find((item) => item.slug === slug && !item.archived);
  if (!post) throw new Error('Post not found.');
  return post;
}

export async function fetchBlogPostsList() {
  const doc = await fetchPortfolioDocument();
  return [...(doc.blogPosts ?? [])]
    .filter((post) => !post.archived)
    .sort((a, b) => {
      const sort = (a.sortOrder ?? 999) - (b.sortOrder ?? 999);
      return sort || +new Date(b.publishedAt) - +new Date(a.publishedAt);
    });
}
