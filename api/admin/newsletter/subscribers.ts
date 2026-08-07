import { requireAdmin } from '../../_lib/admin-auth.js';
import {
  deleteNewsletterSubscriber,
  listNewsletterSubscribers,
  updateNewsletterSubscriber,
} from '../../_lib/newsletter-store.js';

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

export default async function handler(req: any, res: any) {
  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }

  if (!requireAdmin(req, res)) return;

  try {
    if (req.method === 'GET') {
      const data = await listNewsletterSubscribers();
      res.status(200).json({ ok: true, data });
      return;
    }

    if (req.method === 'POST') {
      const body = parseBody(req);
      const id = Number(body.id);
      if (!Number.isFinite(id)) {
        res.status(400).json({ error: 'Subscriber id is required.' });
        return;
      }

      if (body.action === 'delete') {
        await deleteNewsletterSubscriber(id);
        res.status(200).json({ ok: true, deleted: id });
        return;
      }

      const data = await updateNewsletterSubscriber(id, {
        email: typeof body.email === 'string' ? body.email : undefined,
        is_active: typeof body.is_active === 'boolean' ? body.is_active : undefined,
      });
      res.status(200).json({ ok: true, data });
      return;
    }

    res.status(405).json({ error: 'Method not allowed.' });
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : 'Newsletter admin request failed.' });
  }
}
