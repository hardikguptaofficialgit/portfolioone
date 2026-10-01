import { readFileSync, writeFileSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';

const storePath = fileURLToPath(new URL('../../content/dooms-waitlist.json', import.meta.url));

export type DoomsWaitlistEntry = {
  email: string;
  name: string | null;
  joined_at: string;
};

type StoreFile = { entries: DoomsWaitlistEntry[] };

const readStore = (): StoreFile => {
  try {
    if (!existsSync(storePath)) return { entries: [] };
    return JSON.parse(readFileSync(storePath, 'utf8')) as StoreFile;
  } catch {
    return { entries: [] };
  }
};

const writeStore = (store: StoreFile) => {
  writeFileSync(storePath, JSON.stringify(store, null, 2) + '\n', 'utf8');
};

export const joinDoomsWaitlist = async (email: string, name: string | null) => {
  const store = readStore();
  const existing = store.entries.find((entry) => entry.email === email);
  if (existing) {
    return { alreadyJoined: true as const };
  }
  store.entries.push({
    email,
    name,
    joined_at: new Date().toISOString(),
  });
  writeStore(store);
  return { alreadyJoined: false as const };
};
