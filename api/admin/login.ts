import { createAdminToken, validateAdminCredentials } from '../_lib/admin-auth.js';

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

export default function handler(req: any, res: any) {
  try {
    if (req.method === 'OPTIONS') {
      res.status(204).end();
      return;
    }

    if (req.method !== 'POST') {
      res.status(405).json({ error: 'Method not allowed.' });
      return;
    }

    const body = parseBody(req);
    const email = String(body.email || '').trim();
    const password = String(body.password || '');
    if (!validateAdminCredentials(email, password)) {
      res.status(401).json({ error: 'Invalid email or password.' });
      return;
    }

    res.status(200).json({ ok: true, token: createAdminToken(email) });
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : 'Login failed.' });
  }
}
