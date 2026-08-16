import { createHmac, timingSafeEqual } from 'crypto';

const SESSION_TTL_MS = 1000 * 60 * 60 * 8;

const getSecret = () =>
  process.env.ADMIN_SESSION_SECRET ||
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.RESEND_API_KEY ||
  'dev-admin-secret-change-me';

const sign = (payload: string) => createHmac('sha256', getSecret()).update(payload).digest('base64url');

export const createAdminToken = (email: string) => {
  const payload = Buffer.from(
    JSON.stringify({ email, exp: Date.now() + SESSION_TTL_MS }),
    'utf8'
  ).toString('base64url');
  return `${payload}.${sign(payload)}`;
};

export const verifyAdminToken = (token?: string | null) => {
  if (!token || !token.includes('.')) return false;
  const [payload, signature] = token.split('.');
  const expected = sign(payload);
  const signatureBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expected);
  if (signatureBuffer.length !== expectedBuffer.length) return false;
  if (!timingSafeEqual(signatureBuffer, expectedBuffer)) return false;

  try {
    const data = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')) as { exp?: number };
    return typeof data.exp === 'number' && data.exp > Date.now();
  } catch {
    return false;
  }
};

export const requireAdmin = (req: { headers?: { authorization?: string } }, res: any) => {
  const auth = req.headers?.authorization || '';
  const token = auth.startsWith('Bearer ') ? auth.slice('Bearer '.length) : '';
  if (verifyAdminToken(token)) return true;
  res.status(401).json({ error: 'Unauthorized.' });
  return false;
};

export const validateAdminCredentials = (email: string, password: string) => {
  const adminEmail = process.env.ADMIN_EMAIL;
  const adminPassword = process.env.ADMIN_PASSWORD;
  return Boolean(adminEmail && adminPassword && email === adminEmail && password === adminPassword);
};
