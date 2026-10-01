import { getPortfolio } from '../../_lib/portfolio-store.js';
import { findSubscriberByEmail, upsertSubscriber } from '../../_lib/newsletter-subscribers-store.js';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type JsonObject = Record<string, unknown>;

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

const renderWelcomeNewsletterHtml = (email: string, text: string) => `
  <div style="margin:0;background:#ffffff;padding:0;font-family:Arial,Helvetica,sans-serif;color:#111111;">
    <div style="max-width:640px;margin:0 auto;border:1px solid #111111;">
      <div style="padding:22px 24px;border-bottom:1px solid #111111;background:#ffffff;">
        <p style="margin:0;font-size:11px;letter-spacing:0.2em;text-transform:uppercase;">Stryker Newsletter</p>
      </div>
      <div style="padding:26px 24px;background:#ffffff;">
        <h1 style="margin:0 0 10px;font-size:24px;line-height:1.3;font-weight:800;">Thanks for subscribing.</h1>
        <p style="margin:0 0 14px;font-size:14px;line-height:1.7;">
          You're in, <strong>${email}</strong>.
        </p>
        <p style="margin:0;font-size:14px;line-height:1.7;">
          ${text}
        </p>
      </div>
    </div>
  </div>`;

const sendWelcomeEmail = async (email: string, settings: { welcomeSubject: string; welcomeText: string; fromName?: string }) => {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.NEWSLETTER_FROM_EMAIL;
  if (!apiKey || !from) {
    return { sent: false, error: 'Email provider is not configured.' };
  }

  const { Resend } = await import('resend');
  const resend = new Resend(apiKey);
  const { error } = await resend.emails.send({
    from: settings.fromName ? `${settings.fromName} <${from}>` : from,
    to: [email],
    subject: settings.welcomeSubject,
    html: renderWelcomeNewsletterHtml(email, settings.welcomeText),
    text: settings.welcomeText,
  });

  if (error) {
    return { sent: false, error: error.message || 'Welcome email failed.' };
  }

  return { sent: true, error: null };
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
    const email = String(body.email || '').trim().toLowerCase();

    if (!EMAIL_REGEX.test(email)) {
      res.status(400).json({ error: 'Enter a valid email address.' });
      return;
    }

    const { data: portfolio } = await getPortfolio();
    const newsletterSettings = portfolio.newsletterSettings ?? {
      welcomeSubject: 'Thanks for subscribing - you are all set',
      welcomeText: 'You will now receive updates about AI, engineering, and new posts.',
    };

    const existingRow = findSubscriberByEmail(email);
    if (existingRow?.is_active) {
      res.status(200).json({
        ok: true,
        alreadySubscribed: true,
        message: 'This email is already subscribed.',
      });
      return;
    }

    const now = new Date().toISOString();
    const { existing } = upsertSubscriber(email, now);
    const welcome = await sendWelcomeEmail(email, newsletterSettings);

    res.status(200).json({
      ok: true,
      alreadySubscribed: false,
      welcomeEmailSent: welcome.sent,
      welcomeEmailError: welcome.error,
      message: existing ? 'Subscription re-activated successfully.' : 'Subscribed successfully.',
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Subscription failed.';
    res.status(500).json({ error: message });
  }
}
