const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

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

const hasNewsletterStore = () =>
  Boolean(
    (process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL) &&
      process.env.SUPABASE_SERVICE_ROLE_KEY
  );

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

    if (!hasNewsletterStore()) {
      res.status(501).json({
        error:
          'Newsletter storage is not configured. Add SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY, or disable the newsletter form.',
      });
      return;
    }

    const { getSupabaseAdminClient, sendWelcomeNewsletter } = await import('../_lib/newsletter');
    const supabase = getSupabaseAdminClient();
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
          error: "Supabase table missing. Run supabase/newsletter_schema.sql in your Supabase SQL editor.",
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

    const { error } = await supabase
      .from('newsletter_subscribers')
      .upsert(
        {
          email,
          is_active: true,
          subscribed_at: now,
          updated_at: now,
        },
        { onConflict: 'email' }
      );

    if (error) {
      const raw = error.message || 'Failed to save subscriber.';
      if (raw.toLowerCase().includes("could not find the table 'public.newsletter_subscribers'")) {
        res.status(500).json({
          error: "Supabase table missing. Run supabase/newsletter_schema.sql in your Supabase SQL editor.",
        });
        return;
      }
      res.status(500).json({ error: raw });
      return;
    }

    let welcomeEmailSent = true;
    let welcomeEmailError: string | null = null;
    try {
      await sendWelcomeNewsletter(email);
    } catch (mailError) {
      // Do not fail subscription if mail provider/env is misconfigured.
      welcomeEmailSent = false;
      welcomeEmailError =
        mailError instanceof Error ? mailError.message : 'Welcome email failed.';
    }

    res.status(200).json({
      ok: true,
      alreadySubscribed: false,
      welcomeEmailSent,
      welcomeEmailError,
      message: existingRow ? 'Subscription re-activated successfully.' : 'Subscribed successfully.',
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Subscription failed.';
    res.status(500).json({ error: message });
  }
}
