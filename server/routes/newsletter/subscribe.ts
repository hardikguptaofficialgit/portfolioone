import { getPortfolio } from '../../_lib/portfolio-store.js';

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

const getSupabaseConfig = () => {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  return url && key ? { url, key } : null;
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

    const [{ data: portfolio }, config] = await Promise.all([
      getPortfolio(),
      Promise.resolve(getSupabaseConfig()),
    ]);
    if (!config) {
      res.status(501).json({
        error:
          'Newsletter storage is not configured. Add SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in Vercel.',
      });
      return;
    }
    const newsletterSettings = portfolio.newsletterSettings ?? {
      welcomeSubject: 'Thanks for subscribing - you are all set',
      welcomeText: 'You will now receive updates about AI, engineering, and new posts.',
    };

    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(config.url, config.key, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
    const now = new Date().toISOString();

    const { data: existingRow, error: existingError } = await supabase
      .from('newsletter_subscribers')
      .select('id,is_active')
      .eq('email', email)
      .maybeSingle();

    if (existingError) {
      const raw = existingError.message || 'Failed to check existing subscriber.';
      if (raw.toLowerCase().includes("could not find the table 'public.newsletter_subscribers'")) {
        res.status(500).json({
          error: 'Supabase table missing. Run supabase/newsletter_schema.sql in your Supabase SQL editor.',
        });
        return;
      }
      res.status(500).json({ error: raw });
      return;
    }

    if (existingRow?.is_active) {
      res.status(200).json({
        ok: true,
        alreadySubscribed: true,
        message: 'This email is already subscribed.',
      });
      return;
    }

    const { error } = await supabase.from('newsletter_subscribers').upsert(
      {
        email,
        is_active: true,
        subscribed_at: existingRow ? undefined : now,
        updated_at: now,
      },
      { onConflict: 'email' }
    );

    if (error) {
      const raw = error.message || 'Failed to save subscriber.';
      if (raw.toLowerCase().includes("could not find the table 'public.newsletter_subscribers'")) {
        res.status(500).json({
          error: 'Supabase table missing. Run supabase/newsletter_schema.sql in your Supabase SQL editor.',
        });
        return;
      }
      res.status(500).json({ error: raw });
      return;
    }

    const welcome = await sendWelcomeEmail(email, newsletterSettings);

    res.status(200).json({
      ok: true,
      alreadySubscribed: false,
      welcomeEmailSent: welcome.sent,
      welcomeEmailError: welcome.error,
      message: existingRow ? 'Subscription re-activated successfully.' : 'Subscribed successfully.',
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Subscription failed.';
    res.status(500).json({ error: message });
  }
}
