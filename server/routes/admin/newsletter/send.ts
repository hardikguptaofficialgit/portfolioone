import { requireAdmin } from '../../../_lib/admin-auth.js';
import { listNewsletterSubscribers } from '../../../_lib/newsletter-store.js';
import { getPortfolio } from '../../../_lib/portfolio-store.js';

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

const stripHtml = (html: string) =>
  html
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const withEmailShell = (html: string, previewText?: string) => {
  const trimmed = html.trim();
  if (/<!doctype html|<html[\s>]/i.test(trimmed)) return trimmed;
  return `<!doctype html>
<html>
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="x-apple-disable-message-reformatting">
    <title>Newsletter</title>
  </head>
  <body style="margin:0;padding:0;background:#ffffff;color:#111111;font-family:Arial,Helvetica,sans-serif;">
    ${previewText ? `<div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">${previewText}</div>` : ''}
    ${trimmed}
  </body>
</html>`;
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
    const apiKey = process.env.RESEND_API_KEY;
    const from = process.env.NEWSLETTER_FROM_EMAIL;
    if (!apiKey || !from) {
      res.status(501).json({ error: 'Resend is not configured. Add RESEND_API_KEY and NEWSLETTER_FROM_EMAIL.' });
      return;
    }

    const body = parseBody(req);
    const { data: portfolio } = await getPortfolio();
    const settings = portfolio.newsletterSettings;
    const subject = String(body.subject || settings?.campaignSubject || '').trim();
    const html = String(body.html || settings?.campaignHtml || '').trim();
    const previewText = String(body.previewText || settings?.campaignPreviewText || '').trim();
    const text = String(body.text || settings?.campaignText || stripHtml(html)).trim();

    if (!subject) {
      res.status(400).json({ error: 'Newsletter subject is required.' });
      return;
    }
    if (!html) {
      res.status(400).json({ error: 'Newsletter HTML is required.' });
      return;
    }

    const subscribers = (await listNewsletterSubscribers()).filter((subscriber) => subscriber.is_active);
    if (subscribers.length === 0) {
      res.status(400).json({ error: 'No active subscribers to send to.' });
      return;
    }

    const { Resend } = await import('resend');
    const resend = new Resend(apiKey);
    const formattedFrom = settings?.fromName ? `${settings.fromName} <${from}>` : from;
    const emailHtml = withEmailShell(html, previewText);
    const chunks: Array<typeof subscribers> = [];
    for (let i = 0; i < subscribers.length; i += 50) {
      chunks.push(subscribers.slice(i, i + 50));
    }

    const sentIds: string[] = [];
    for (const chunk of chunks) {
      const { data, error } = await resend.batch.send(
        chunk.map((subscriber) => ({
          from: formattedFrom,
          to: [subscriber.email],
          subject,
          html: emailHtml,
          text,
        }))
      );
      if (error) {
        res.status(502).json({ error: error.message || 'Resend failed to send newsletter.' });
        return;
      }
      const ids = Array.isArray(data) ? data.map((item) => item.id).filter(Boolean) : [];
      sentIds.push(...ids);
    }

    res.status(200).json({ ok: true, sent: subscribers.length, batches: chunks.length, ids: sentIds });
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : 'Newsletter send failed.' });
  }
}
