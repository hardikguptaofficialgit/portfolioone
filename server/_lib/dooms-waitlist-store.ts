import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const TABLE = 'dooms_waitlist';
const FALLBACK_DOC_ID = 'dooms_waitlist';

export type DoomsWaitlistEntry = {
  email: string;
  name: string | null;
  source: string;
  joined_at: string;
  updated_at: string;
};

type FallbackDocument = {
  entries: DoomsWaitlistEntry[];
};

const getSupabaseConfig = () => {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  return url && key ? { url, key } : null;
};

const getSupabase = () => {
  const config = getSupabaseConfig();
  if (!config) return null;
  return createClient(config.url, config.key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
};

const isMissingTableError = (message: string) =>
  message.toLowerCase().includes("could not find the table 'public.dooms_waitlist'");

const readFallbackEntries = async (supabase: SupabaseClient) => {
  const { data, error } = await supabase
    .from('portfolio_content')
    .select('data')
    .eq('id', FALLBACK_DOC_ID)
    .maybeSingle();

  if (error) throw new Error(error.message || 'Failed to read waitlist storage.');
  const entries = (data?.data as FallbackDocument | null)?.entries;
  return Array.isArray(entries) ? entries : [];
};

const writeFallbackEntries = async (supabase: SupabaseClient, entries: DoomsWaitlistEntry[]) => {
  const now = new Date().toISOString();
  const { error } = await supabase.from('portfolio_content').upsert({
    id: FALLBACK_DOC_ID,
    data: { entries },
    version: 1,
    updated_at: now,
  });
  if (error) throw new Error(error.message || 'Failed to save waitlist entry.');
};

const joinViaTable = async (
  supabase: SupabaseClient,
  email: string,
  name: string | null,
  now: string,
) => {
  const { data: existingRow, error: existingError } = await supabase
    .from(TABLE)
    .select('id,email')
    .eq('email', email)
    .maybeSingle();

  if (existingError) {
    if (isMissingTableError(existingError.message || '')) {
      return { mode: 'fallback' as const };
    }
    throw new Error(existingError.message || 'Failed to check existing waitlist entry.');
  }

  if (existingRow) {
    return { mode: 'table' as const, alreadyJoined: true };
  }

  const { error } = await supabase.from(TABLE).insert({
    email,
    name,
    source: 'dooms-page',
    joined_at: now,
    updated_at: now,
  });

  if (error) {
    const raw = error.message || 'Failed to save waitlist entry.';
    if (isMissingTableError(raw)) return { mode: 'fallback' as const };
    if (raw.toLowerCase().includes('duplicate key')) {
      return { mode: 'table' as const, alreadyJoined: true };
    }
    throw new Error(raw);
  }

  return { mode: 'table' as const, alreadyJoined: false };
};

const joinViaFallback = async (
  supabase: SupabaseClient,
  email: string,
  name: string | null,
  now: string,
) => {
  const entries = await readFallbackEntries(supabase);
  const existing = entries.find((entry) => entry.email === email);
  if (existing) return { alreadyJoined: true };

  entries.push({
    email,
    name,
    source: 'dooms-page',
    joined_at: now,
    updated_at: now,
  });
  await writeFallbackEntries(supabase, entries);
  return { alreadyJoined: false };
};

export const joinDoomsWaitlist = async (email: string, name: string | null) => {
  const supabase = getSupabase();
  if (!supabase) {
    throw new Error('Waitlist storage is not configured. Add SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.');
  }

  const now = new Date().toISOString();
  const tableResult = await joinViaTable(supabase, email, name, now);

  if (tableResult.mode === 'table') {
    return { alreadyJoined: tableResult.alreadyJoined, storage: 'table' as const };
  }

  const fallbackResult = await joinViaFallback(supabase, email, name, now);
  return { alreadyJoined: fallbackResult.alreadyJoined, storage: 'fallback' as const };
};
