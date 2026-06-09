import { requireAdmin } from '../../_lib/admin-auth.js';
import { createProject, deleteProject, listProjects, updateProject } from '../../_lib/portfolio-store.js';

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
      const result = await listProjects();
      res.status(200).json({ ok: true, ...result });
      return;
    }

    if (req.method === 'POST') {
      const body = parseBody(req);

      if (body.action === 'update') {
        const id = String(body.id || body.project?.id || '');
        const project = await updateProject(id, body.project || body);
        res.status(200).json({ ok: true, data: project });
        return;
      }

      if (body.action === 'delete') {
        const id = String(body.id || '');
        await deleteProject(id);
        res.status(200).json({ ok: true, deleted: id });
        return;
      }

      const project = await createProject(body.project || body);
      res.status(201).json({ ok: true, data: project });
      return;
    }

    res.status(405).json({ error: 'Method not allowed.' });
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : 'Project request failed.' });
  }
}
