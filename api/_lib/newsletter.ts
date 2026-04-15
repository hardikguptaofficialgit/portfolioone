import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';

type DevToArticleLite = {
  id: number;
  title: string;
  description?: string;
  url: string;
  published_at?: string;
  cover_image?: string | null;
  tag_list?: string[];
};

const requiredEnv = (name: string): string => {
  const value = process.env[name];
  if (!value) throw new Error(`Missing environment variable: ${name}`);
  return value;
};

export const getSupabaseAdminClient = () => {
  const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl) throw new Error('Missing SUPABASE_URL (or VITE_SUPABASE_URL).');
  if (!serviceRoleKey) throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY.');

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
};

export const getDevToUsername = () =>
  (process.env.DEVTO_USERNAME || process.env.VITE_DEV_USERNAME || 'strykerinside').replace(/^@/, '').trim();

export const fetchLatestDevToPost = async (): Promise<DevToArticleLite | null> => {
  const username = getDevToUsername();
  const params = new URLSearchParams({
    username,
    per_page: '1',
    page: '1',
  });
  const response = await fetch(`https://dev.to/api/articles?${params.toString()}`, {
    headers: { Accept: 'application/json' },
  });

  if (!response.ok) {
    throw new Error(`DEV.to fetch failed (${response.status}).`);
  }

  const payload = (await response.json()) as DevToArticleLite[];
  if (!Array.isArray(payload) || payload.length === 0) return null;
  return payload[0];
};

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

export const renderNewsletterHtml = (article: DevToArticleLite) => {
  const title = escapeHtml(article.title || 'New DEV.to post');
  const description = escapeHtml(article.description || 'A new article is live now.');
  const postUrl = article.url;
  const tags = (article.tag_list || []).slice(0, 5).map((t) => `#${escapeHtml(t)}`).join(' ');

  return `
  <div style="font-family: Inter, Arial, sans-serif; max-width: 620px; margin: 0 auto; padding: 24px; color: #111;">
    <p style="margin:0 0 12px; font-size: 12px; letter-spacing: 0.08em; text-transform: uppercase; color: #6b7280;">
      New DEV.to article
    </p>
    <h1 style="margin:0 0 10px; font-size: 24px; line-height: 1.3;">${title}</h1>
    <p style="margin:0 0 18px; font-size: 15px; line-height: 1.6; color:#374151;">${description}</p>
    ${
      tags
        ? `<p style="margin:0 0 20px; font-size: 12px; color:#6b7280;">${tags}</p>`
        : ''
    }
    <a href="${postUrl}" style="display:inline-block; padding:10px 14px; border-radius:10px; background:#111827; color:#fff; text-decoration:none; font-size:14px;">
      Read article
    </a>
    <p style="margin:24px 0 0; font-size:12px; color:#9ca3af;">
      You received this because you subscribed for blog updates.
    </p>
  </div>`;
};

const chunk = <T>(arr: T[], size: number) => {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
};

export const sendNewsletter = async (to: string[], article: DevToArticleLite) => {
  if (!to.length) return { sent: 0 };

  const resend = new Resend(requiredEnv('RESEND_API_KEY'));
  const from = requiredEnv('NEWSLETTER_FROM_EMAIL');
  const websiteUrl = process.env.PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_SITE_URL || article.url;

  let sent = 0;
  for (const recipients of chunk(to, 50)) {
    const { error } = await resend.emails.send({
      from,
      to: recipients,
      subject: `New post: ${article.title}`,
      html: renderNewsletterHtml(article),
      text: `${article.title}\n\n${article.description || ''}\n\nRead: ${article.url}\n\n${websiteUrl}`,
    });

    if (error) {
      throw new Error(error.message || 'Failed to send newsletter email.');
    }
    sent += recipients.length;
  }

  return { sent };
};

export const isAuthorizedDispatchRequest = (req: any) => {
  const secret = process.env.CRON_SECRET;
  if (!secret) return process.env.NODE_ENV !== 'production';

  const auth = req.headers.authorization;
  const cronHeader = req.headers['x-cron-secret'];
  const querySecret = req.query?.secret;

  return auth === `Bearer ${secret}` || cronHeader === secret || querySecret === secret;
};

