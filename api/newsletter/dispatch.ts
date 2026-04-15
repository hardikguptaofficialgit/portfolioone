import {
  fetchLatestDevToPost,
  getSupabaseAdminClient,
  isAuthorizedDispatchRequest,
  sendNewsletter,
} from '../_lib/newsletter';

export default async function handler(req: any, res: any) {
  if (req.method !== 'GET' && req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed.' });
    return;
  }

  if (!isAuthorizedDispatchRequest(req)) {
    res.status(401).json({ error: 'Unauthorized.' });
    return;
  }

  try {
    const article = await fetchLatestDevToPost();
    if (!article) {
      res.status(200).json({ ok: true, status: 'no_articles' });
      return;
    }

    const supabase = getSupabaseAdminClient();

    const { data: stateRow, error: stateReadError } = await supabase
      .from('newsletter_dispatch_state')
      .select('id,last_sent_devto_article_id')
      .eq('id', 1)
      .maybeSingle();

    if (stateReadError) {
      res.status(500).json({ error: stateReadError.message || 'Failed to read dispatch state.' });
      return;
    }

    if (stateRow?.last_sent_devto_article_id === article.id) {
      res.status(200).json({ ok: true, status: 'already_sent', articleId: article.id });
      return;
    }

    const { data: subscribers, error: subscribersError } = await supabase
      .from('newsletter_subscribers')
      .select('email')
      .eq('is_active', true);

    if (subscribersError) {
      res.status(500).json({ error: subscribersError.message || 'Failed to load subscribers.' });
      return;
    }

    const emails = (subscribers || [])
      .map((row: { email?: string }) => String(row.email || '').trim().toLowerCase())
      .filter(Boolean);

    if (emails.length > 0) {
      await sendNewsletter(emails, article);
    }

    const { error: stateWriteError } = await supabase.from('newsletter_dispatch_state').upsert(
      {
        id: 1,
        last_sent_devto_article_id: article.id,
        last_sent_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'id' }
    );

    if (stateWriteError) {
      res.status(500).json({ error: stateWriteError.message || 'Failed to update dispatch state.' });
      return;
    }

    res.status(200).json({
      ok: true,
      status: emails.length > 0 ? 'sent' : 'no_subscribers',
      articleId: article.id,
      recipients: emails.length,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Dispatch failed.';
    res.status(500).json({ error: message });
  }
}

