import { createHash } from 'crypto';

export type CloudinaryUploadResult = {
  url: string;
  publicId: string;
  width?: number;
  height?: number;
};

const getCloudinaryConfig = () => {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;
  return cloudName && apiKey && apiSecret ? { cloudName, apiKey, apiSecret } : null;
};

const signCloudinaryParams = (params: Record<string, string | number>, apiSecret: string) => {
  const payload = Object.entries(params)
    .filter(([, value]) => value !== undefined && value !== null && value !== '')
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${key}=${value}`)
    .join('&');
  return createHash('sha1').update(`${payload}${apiSecret}`).digest('hex');
};

export const assertCloudinaryConfigured = () => {
  const config = getCloudinaryConfig();
  if (!config) throw new Error('Cloudinary is not configured.');
  return config;
};

export const uploadToCloudinary = async (
  file: string,
  options: { folder?: string; publicId?: string } = {}
): Promise<CloudinaryUploadResult> => {
  const config = assertCloudinaryConfigured();
  const folder = (options.folder || 'portfolio').replace(/[^a-zA-Z0-9/_-]/g, '');
  const timestamp = Math.floor(Date.now() / 1000);
  const params: Record<string, string | number> = { folder, timestamp };
  if (options.publicId) params.public_id = options.publicId.replace(/[^a-zA-Z0-9_-]/g, '');

  const form = new FormData();
  form.set('file', file);
  form.set('api_key', config.apiKey);
  form.set('timestamp', String(timestamp));
  form.set('folder', folder);
  if (params.public_id) form.set('public_id', String(params.public_id));
  form.set('signature', signCloudinaryParams(params, config.apiSecret));

  const upload = await fetch(`https://api.cloudinary.com/v1_1/${config.cloudName}/image/upload`, {
    method: 'POST',
    body: form,
  });
  const payload = await upload.json().catch(() => ({}));

  if (!upload.ok) {
    throw new Error(payload?.error?.message || 'Cloudinary upload failed.');
  }

  return {
    url: payload.secure_url,
    publicId: payload.public_id,
    width: payload.width,
    height: payload.height,
  };
};
