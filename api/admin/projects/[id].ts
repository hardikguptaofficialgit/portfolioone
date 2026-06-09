import { requireAdmin } from '../../_lib/admin-auth.js';
import { deleteProject, updateProject } from '../../_lib/portfolio-store.js';

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
    const id = String(req.query?.id || '');
    if (req.method === 'PATCH' || req.method === 'PUT' || req.method === 'POST') {
      const body = parseBody(req);
      const project = await updateProject(id, body.project || body);
      res.status(200).json({ ok: true, data: project });
      return;
    }

    if (req.method === 'DELETE') {
      await deleteProject(id);
      res.status(200).json({ ok: true, deleted: id });
      return;
    }

    res.status(405).json({ error: 'Method not allowed.' });
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : 'Project request failed.' });
  }
}
