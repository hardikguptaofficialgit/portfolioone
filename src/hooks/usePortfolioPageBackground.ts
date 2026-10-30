import { useEffect } from 'react';

const PAGE_BG = {
  dark: '#09090b',
  light: '#fffef9',
} as const;

/** Keeps html/body color in sync with portfolio shell page background. */
export function usePortfolioPageBackground(isDark: boolean) {
  useEffect(() => {
    const html = document.documentElement;
    const body = document.body;
    const prevHtml = html.style.backgroundColor;
    const prevBody = body.style.backgroundColor;
    const color = isDark ? PAGE_BG.dark : PAGE_BG.light;

    html.style.backgroundColor = color;
    body.style.backgroundColor = color;

    return () => {
      html.style.backgroundColor = prevHtml;
      body.style.backgroundColor = prevBody;
    };
  }, [isDark]);
}
