import { getPortfolio } from '../../_lib/portfolio-store.js';

export default async function handler(req: any, res: any) {
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed.' });
    return;
  }

  try {
    const { data } = await getPortfolio();
    const posts = [...(data.blogPosts || [])]
      .filter((post) => !post.archived)
      .sort((a, b) => {
        const sort = (a.sortOrder ?? 999) - (b.sortOrder ?? 999);
        return sort || +new Date(b.publishedAt) - +new Date(a.publishedAt);
      });

    res.status(200).json({ ok: true, data: posts });
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : 'Blog request failed.' });
  }
}
