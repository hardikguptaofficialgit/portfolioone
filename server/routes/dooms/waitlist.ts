import { joinDoomsWaitlist } from '../../_lib/dooms-waitlist-store.js';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_EMAIL_LENGTH = 254;
const MAX_NAME_LENGTH = 80;
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000;
const RATE_LIMIT_MAX = 8;

type JsonObject = Record<string, unknown>;

type RateLimitEntry = {
  count: number;
  resetAt: number;
};

const rateLimitStore = new Map<string, RateLimitEntry>();

const parseBody = (req: { body?: unknown }): JsonObject => {
  if (!req.body) return {};
  if (typeof req.body === 'string') {
    try {
      return JSON.parse(req.body) as JsonObject;
    } catch {
      return {};
    }
  }
  return req.body as JsonObject;
};

const getClientIp = (req: { headers?: Record<string, string | string[] | undefined> }) => {
  const forwarded = req.headers?.['x-forwarded-for'];
  const raw = Array.isArray(forwarded) ? forwarded[0] : forwarded;
  if (typeof raw === 'string' && raw.trim()) {
    return raw.split(',')[0]?.trim() || 'unknown';
  }
  const realIp = req.headers?.['x-real-ip'];
  if (typeof realIp === 'string' && realIp.trim()) return realIp.trim();
  return 'unknown';
};

const isRateLimited = (ip: string) => {
  const now = Date.now();
  const entry = rateLimitStore.get(ip);
  if (!entry || now >= entry.resetAt) {
    rateLimitStore.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return false;
  }
  if (entry.count >= RATE_LIMIT_MAX) return true;
  entry.count += 1;
  rateLimitStore.set(ip, entry);
  return false;
};

const sanitizeName = (value: unknown) => {
  const name = String(value || '')
    .replace(/[\u0000-\u001F\u007F]/g, '')
    .trim()
    .slice(0, MAX_NAME_LENGTH);
  return name || null;
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
    const honeypot = String(body.website || '').trim();
    if (honeypot) {
      res.status(200).json({ ok: true, message: 'You are on the waitlist.' });
      return;
    }

    const ip = getClientIp(req);
    if (isRateLimited(ip)) {
      res.status(429).json({ error: 'Too many requests. Try again in a little while.' });
      return;
    }

    const email = String(body.email || '')
      .trim()
      .toLowerCase()
      .slice(0, MAX_EMAIL_LENGTH);
    const name = sanitizeName(body.name);

    if (!EMAIL_REGEX.test(email)) {
      res.status(400).json({ error: 'Enter a valid email address.' });
      return;
    }

    const result = await joinDoomsWaitlist(email, name);

    if (result.alreadyJoined) {
      res.status(200).json({
        ok: true,
        alreadyJoined: true,
        message: 'You are already on the waitlist.',
      });
      return;
    }

    res.status(200).json({
      ok: true,
      alreadyJoined: false,
      message: 'You are on the waitlist. We will be in touch soon.',
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Waitlist signup failed.';
    res.status(500).json({ error: message });
  }
}
