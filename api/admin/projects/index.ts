import { requireAdmin } from '../../_lib/admin-auth.js';
import { createProject, listProjects } from '../../_lib/portfolio-store.js';

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
  if (!requireAdmin(req, res)) return;

  try {
    if (req.method === 'GET') {
      const result = await listProjects();
      res.status(200).json({ ok: true, ...result });
      return;
    }

    if (req.method === 'POST') {
      const project = await createProject(parseBody(req));
      res.status(201).json({ ok: true, data: project });
      return;
    }

    res.status(405).json({ error: 'Method not allowed.' });
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : 'Project request failed.' });
  }
}
