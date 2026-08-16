import { getPortfolio } from '../../_lib/portfolio-store.js';

export default async function handler(req: any, res: any) {
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed.' });
    return;
  }

  try {
    const slug = String(req.query?.slug || '').trim();
    const { data } = await getPortfolio();
    const post = (data.blogPosts || []).find((item) => item.slug === slug && !item.archived);
    if (!post) {
      res.status(404).json({ error: 'Post not found.' });
      return;
    }
    res.status(200).json({ ok: true, data: post });
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : 'Blog request failed.' });
  }
}
