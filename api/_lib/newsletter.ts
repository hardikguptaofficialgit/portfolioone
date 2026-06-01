import { Resend } from 'resend';
import { getSupabaseAdminClient } from './supabase-admin';

export { getSupabaseAdminClient };

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

export const renderWelcomeNewsletterHtml = (email: string) => {
  const safeEmail = escapeHtml(email);
  return `
  <div style="margin:0;background:#ffffff;padding:0;font-family:Arial,Helvetica,sans-serif;color:#111111;">
    <div style="max-width:640px;margin:0 auto;border:1px solid #111111;">
      <div style="padding:22px 24px;border-bottom:1px solid #111111;background:#ffffff;">
        <p style="margin:0;font-size:11px;letter-spacing:0.2em;text-transform:uppercase;">Newsletter Subscription</p>
      </div>
      <div style="height:10px;background-image:repeating-linear-gradient(45deg,#111111 0,#111111 8px,#ffffff 8px,#ffffff 16px);"></div>
      <div style="padding:26px 24px;background:#ffffff;">
        <h1 style="margin:0 0 10px;font-size:24px;line-height:1.3;font-weight:800;">Thanks for subscribing.</h1>
        <p style="margin:0 0 14px;font-size:14px;line-height:1.7;">
          You're in, <strong>${safeEmail}</strong>.
        </p>
        <p style="margin:0 0 14px;font-size:14px;line-height:1.7;">
          You will get the latest updates on AI, engineering, and new DEV.to posts.
        </p>
        <div style="padding:14px;border:1px dashed #111111;">
          <p style="margin:0;font-size:12px;line-height:1.7;">
            Expect concise updates, practical insights, and useful resources.
          </p>
        </div>
      </div>
      <div style="padding:14px 24px;border-top:1px solid #111111;background:#f7f7f7;">
        <p style="margin:0;font-size:11px;line-height:1.6;color:#333333;">
          You are receiving this because you subscribed on the site.
        </p>
      </div>
    </div>
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

export const sendWelcomeNewsletter = async (toEmail: string) => {
  const resend = new Resend(requiredEnv('RESEND_API_KEY'));
  const from = requiredEnv('NEWSLETTER_FROM_EMAIL');

  const { error } = await resend.emails.send({
    from,
    to: [toEmail],
    subject: 'Thanks for subscribing - you are all set',
    html: renderWelcomeNewsletterHtml(toEmail),
    text: `Thanks for subscribing.\n\nYou will now receive latest updates about AI and new posts.`,
  });

  if (error) {
    throw new Error(error.message || 'Failed to send welcome email.');
  }
};

export const isAuthorizedDispatchRequest = (req: any) => {
  const secret = process.env.CRON_SECRET;
  if (!secret) return process.env.NODE_ENV !== 'production';

  const auth = req.headers.authorization;
  const cronHeader = req.headers['x-cron-secret'];
  const querySecret = req.query?.secret;

  return auth === `Bearer ${secret}` || cronHeader === secret || querySecret === secret;
};
