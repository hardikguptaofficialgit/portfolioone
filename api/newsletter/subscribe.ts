import { getSupabaseAdminClient } from '../_lib/newsletter';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

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

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed.' });
    return;
  }

  try {
    const body = parseBody(req);
    const email = String(body.email || '').trim().toLowerCase();

    if (!EMAIL_REGEX.test(email)) {
      res.status(400).json({ error: 'Enter a valid email address.' });
      return;
    }

    const supabase = getSupabaseAdminClient();
    const now = new Date().toISOString();

    const { error } = await supabase
      .from('newsletter_subscribers')
      .upsert(
        {
          email,
          is_active: true,
          subscribed_at: now,
          updated_at: now,
        },
        { onConflict: 'email' }
      );

    if (error) {
      res.status(500).json({ error: error.message || 'Failed to save subscriber.' });
      return;
    }

    res.status(200).json({ ok: true, message: 'Subscribed successfully.' });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Subscription failed.';
    res.status(500).json({ error: message });
  }
}

