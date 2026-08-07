type PublicConfig = {
  supabaseUrl: string;
  supabaseAnonKey: string;
};

const getPublicConfig = (): PublicConfig => ({
  supabaseUrl: process.env.SUPABASE_URL || '',
  supabaseAnonKey: process.env.SUPABASE_ANON_KEY || '',
});

export default function handler(req: any, res: any) {
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed.' });
    return;
  }

  res.status(200).json({ ok: true, config: getPublicConfig() });
}
