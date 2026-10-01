import { readFileSync, writeFileSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';

const storePath = fileURLToPath(new URL('../../content/newsletter-subscribers.json', import.meta.url));

export type NewsletterSubscriber = {
  id: string;
  email: string;
  is_active: boolean;
  subscribed_at: string;
  updated_at: string;
};

type StoreFile = { subscribers: NewsletterSubscriber[] };

const readStore = (): StoreFile => {
  try {
    if (!existsSync(storePath)) return { subscribers: [] };
    return JSON.parse(readFileSync(storePath, 'utf8')) as StoreFile;
  } catch {
    return { subscribers: [] };
  }
};

const writeStore = (store: StoreFile) => {
  writeFileSync(storePath, JSON.stringify(store, null, 2) + '\n', 'utf8');
};

export const findSubscriberByEmail = (email: string) => {
  const store = readStore();
  return store.subscribers.find((row) => row.email === email) ?? null;
};

export const upsertSubscriber = (email: string, now: string) => {
  const store = readStore();
  const existing = store.subscribers.find((row) => row.email === email);
  if (existing) {
    existing.is_active = true;
    existing.updated_at = now;
  } else {
    store.subscribers.push({
      id: crypto.randomUUID(),
      email,
      is_active: true,
      subscribed_at: now,
      updated_at: now,
    });
  }
  writeStore(store);
  return { existing: Boolean(existing) };
};
