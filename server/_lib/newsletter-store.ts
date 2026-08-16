import { createClient } from '@supabase/supabase-js';

export type NewsletterSubscriberPatch = {
  email?: string;
  is_active?: boolean;
};

const getSupabaseConfig = () => {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  return url && key ? { url, key } : null;
};

const getSupabase = () => {
  const config = getSupabaseConfig();
  if (!config) throw new Error('Newsletter admin storage is not configured. Add SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.');
  return createClient(config.url, config.key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
};

export const listNewsletterSubscribers = async () => {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from('newsletter_subscribers')
    .select('id,email,is_active,subscribed_at,updated_at')
    .order('subscribed_at', { ascending: false });
  if (error) throw new Error(error.message || 'Failed to list newsletter subscribers.');
  return data ?? [];
};

export const updateNewsletterSubscriber = async (id: number, patch: NewsletterSubscriberPatch) => {
  const supabase = getSupabase();
  const update = {
    ...patch,
    email: patch.email?.trim().toLowerCase(),
    updated_at: new Date().toISOString(),
  };
  const { data, error } = await supabase
    .from('newsletter_subscribers')
    .update(update)
    .eq('id', id)
    .select('id,email,is_active,subscribed_at,updated_at')
    .single();
  if (error) throw new Error(error.message || 'Failed to update subscriber.');
  return data;
};

export const deleteNewsletterSubscriber = async (id: number) => {
  const supabase = getSupabase();
  const { error } = await supabase.from('newsletter_subscribers').delete().eq('id', id);
  if (error) throw new Error(error.message || 'Failed to delete subscriber.');
};
