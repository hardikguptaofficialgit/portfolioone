export type PublicRuntimeConfig = {
  supabaseUrl: string;
  supabaseAnonKey: string;
};

const defaultConfig: PublicRuntimeConfig = {
  supabaseUrl: '',
  supabaseAnonKey: '',
};

let configPromise: Promise<PublicRuntimeConfig> | null = null;

export const getPublicRuntimeConfig = async () => {
  if (!configPromise) {
    configPromise = fetch('/api/config', { cache: 'no-store' })
      .then(async (response) => {
        if (!response.ok) throw new Error('Runtime config unavailable.');
        const payload = await response.json();
        const config = payload?.config || {};
        return {
          supabaseUrl: typeof config.supabaseUrl === 'string' ? config.supabaseUrl : '',
          supabaseAnonKey: typeof config.supabaseAnonKey === 'string' ? config.supabaseAnonKey : '',
        };
      })
      .catch(() => defaultConfig);
  }

  return configPromise;
};
