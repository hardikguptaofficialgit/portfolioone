import { requireAdmin } from '../../_lib/admin-auth.js';
import { uploadToCloudinary } from '../../_lib/cloudinary.js';

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

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed.' });
    return;
  }

  try {
    const body = parseBody(req);
    const file = String(body.file || '');
    if (!file.startsWith('data:image/')) {
      res.status(400).json({ error: 'Upload a valid image file.' });
      return;
    }

    const folder = String(body.folder || 'portfolio').replace(/[^a-zA-Z0-9/_-]/g, '');
    const payload = await uploadToCloudinary(file, { folder });

    res.status(200).json({
      ok: true,
      url: payload.url,
      publicId: payload.publicId,
      width: payload.width,
      height: payload.height,
    });
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : 'Upload failed.' });
  }
}
