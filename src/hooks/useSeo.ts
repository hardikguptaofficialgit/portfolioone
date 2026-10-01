import { useEffect } from 'react';
import { applySeo, type SeoInput } from '@/lib/seo/head';
import { SITE_URL } from '@/lib/seo/site-config';

export function useSeo(input: SeoInput | null | undefined) {
  useEffect(() => {
    if (!input) return;
    applySeo(input, SITE_URL);
  }, [input]);
}
