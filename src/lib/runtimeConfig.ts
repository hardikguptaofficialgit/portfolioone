export type PublicRuntimeConfig = {
  devUsername: string;
  supabaseUrl: string;
  supabaseAnonKey: string;
};

const defaultConfig: PublicRuntimeConfig = {
  devUsername: 'strykerinside',
  supabaseUrl: '',
  supabaseAnonKey: '',
};

let configPromise: Promise<PublicRuntimeConfig> | null = null;

export const normalizeDevUsername = (value?: string | null) =>
  (value || defaultConfig.devUsername).replace(/^@/, '').trim() || defaultConfig.devUsername;

export const getPublicRuntimeConfig = async () => {
  if (!configPromise) {
    configPromise = fetch('/api/config', { cache: 'no-store' })
      .then(async (response) => {
        if (!response.ok) throw new Error('Runtime config unavailable.');
        const payload = await response.json();
        const config = payload?.config || {};
        return {
          devUsername: normalizeDevUsername(config.devUsername),
          supabaseUrl: typeof config.supabaseUrl === 'string' ? config.supabaseUrl : '',
          supabaseAnonKey: typeof config.supabaseAnonKey === 'string' ? config.supabaseAnonKey : '',
        };
      })
      .catch(() => defaultConfig);
  }

  return configPromise;
};

export const getDevUsername = async () => {
  const config = await getPublicRuntimeConfig();
  return normalizeDevUsername(config.devUsername);
};
