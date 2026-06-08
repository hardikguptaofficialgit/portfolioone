import { json, methodNotAllowed, parseJsonBody } from '../../_shared/json';

type Env = {
  NEWSLETTER_KV?: KVNamespace;
  RESEND_API_KEY?: string;
  NEWSLETTER_FROM_EMAIL?: string;
};

type PagesContext = {
  request: Request;
  env: Env;
};

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const subscriberKey = (email: string) => `newsletter:subscriber:${email}`;

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const renderWelcomeHtml = (email: string) => `
  <div style="margin:0;background:#ffffff;padding:0;font-family:Arial,Helvetica,sans-serif;color:#111111;">
    <div style="max-width:640px;margin:0 auto;border:1px solid #111111;">
      <div style="padding:22px 24px;border-bottom:1px solid #111111;background:#ffffff;">
        <p style="margin:0;font-size:11px;letter-spacing:0.2em;text-transform:uppercase;">Newsletter Subscription</p>
      </div>
      <div style="padding:26px 24px;background:#ffffff;">
        <h1 style="margin:0 0 10px;font-size:24px;line-height:1.3;font-weight:800;">Thanks for subscribing.</h1>
        <p style="margin:0 0 14px;font-size:14px;line-height:1.7;">You're in, <strong>${escapeHtml(email)}</strong>.</p>
        <p style="margin:0;font-size:14px;line-height:1.7;">You will get the latest updates on AI, engineering, and new DEV.to posts.</p>
      </div>
    </div>
  </div>`;

const sendWelcomeEmail = async (env: Env, email: string) => {
  if (!env.RESEND_API_KEY || !env.NEWSLETTER_FROM_EMAIL) {
    return { sent: false, error: 'Email provider is not configured.' };
  }

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: env.NEWSLETTER_FROM_EMAIL,
      to: [email],
      subject: 'Thanks for subscribing - you are all set',
      html: renderWelcomeHtml(email),
      text: 'Thanks for subscribing. You will now receive latest updates about AI and new posts.',
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    return { sent: false, error: body || `Resend failed (${response.status}).` };
  }

  return { sent: true, error: null };
};

export const onRequestPost = async ({ request, env }: PagesContext) => {
  try {
    const body = await parseJsonBody<{ email?: string }>(request);
    const email = String(body.email || '').trim().toLowerCase();

    if (!EMAIL_REGEX.test(email)) {
      return json({ error: 'Enter a valid email address.' }, { status: 400 });
    }

    if (!env.NEWSLETTER_KV) {
      return json(
        {
          error: 'Newsletter storage is not configured. Add a Cloudflare KV binding named NEWSLETTER_KV.',
        },
        { status: 501 }
      );
    }

    const key = subscriberKey(email);
    const existing = await env.NEWSLETTER_KV.get<{ is_active?: boolean }>(key, 'json');
    if (existing?.is_active) {
      return json({
        ok: true,
        alreadySubscribed: true,
        message: 'This email is already subscribed.',
      });
    }

    const now = new Date().toISOString();
    await env.NEWSLETTER_KV.put(
      key,
      JSON.stringify({
        email,
        is_active: true,
        subscribed_at: existing ? undefined : now,
        updated_at: now,
      })
    );

    const welcome = await sendWelcomeEmail(env, email);

    return json({
      ok: true,
      alreadySubscribed: false,
      welcomeEmailSent: welcome.sent,
      welcomeEmailError: welcome.error,
      message: existing ? 'Subscription re-activated successfully.' : 'Subscribed successfully.',
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Subscription failed.';
    return json({ error: message }, { status: 500 });
  }
};

export const onRequest = (context: PagesContext) => {
  if (context.request.method.toUpperCase() === 'OPTIONS') return new Response(null, { status: 204 });
  if (context.request.method.toUpperCase() !== 'POST') return methodNotAllowed();
  return onRequestPost(context);
};
