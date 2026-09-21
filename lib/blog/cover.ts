export type CoverTheme = 'dark' | 'light';

export type CoverPalette = {
  background: string;
  backgroundEnd: string;
  accent: string;
  accentMuted: string;
  text: string;
  textMuted: string;
  pattern: string;
};

export type CoverPattern = 'orbs' | 'lines' | 'grid' | 'arcs';

const DARK_BASE = {
  background: '#0d0f0f',
  backgroundEnd: '#141818',
  accent: '#d0fffe',
  text: '#f0f0ee',
};

const LIGHT_BASE = {
  background: '#f6f5f0',
  backgroundEnd: '#eeede8',
  accent: '#1a1a1a',
  text: '#1a1a1a',
};

const PATTERNS: CoverPattern[] = ['orbs', 'lines', 'grid', 'arcs'];

export const hashString = (value: string) => {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
};

const shiftHex = (hex: string, amount: number) => {
  const normalized = hex.replace('#', '');
  const channels = [0, 2, 4].map((offset) => parseInt(normalized.slice(offset, offset + 2), 16));
  const shifted = channels.map((channel, index) => {
    const delta = index === 1 ? amount : Math.round(amount * 0.55);
    return Math.max(0, Math.min(255, channel + delta));
  });
  return `#${shifted.map((channel) => channel.toString(16).padStart(2, '0')).join('')}`;
};

export const getCoverPattern = (title: string): CoverPattern => {
  const hash = hashString(title.trim().toLowerCase());
  return PATTERNS[hash % PATTERNS.length];
};

export const getCoverPalette = (title: string, theme: CoverTheme): CoverPalette => {
  const hash = hashString(title.trim().toLowerCase());
  const hueShift = (hash % 17) - 8;
  const base = theme === 'dark' ? DARK_BASE : LIGHT_BASE;
  const accent = theme === 'dark' ? shiftHex(base.accent, hueShift) : base.accent;

  return {
    background: base.background,
    backgroundEnd: shiftHex(base.backgroundEnd, Math.round(hueShift * 0.35)),
    accent,
    accentMuted: theme === 'dark' ? `${accent}33` : `${accent}14`,
    text: base.text,
    textMuted: theme === 'dark' ? 'rgba(240, 240, 238, 0.42)' : 'rgba(26, 26, 26, 0.42)',
    pattern: theme === 'dark' ? `${accent}24` : `${accent}18`,
  };
};

export const getCoverKeyword = (title: string) => {
  const words = title
    .replace(/[^\w\s-]/g, ' ')
    .split(/\s+/)
    .map((word) => word.trim())
    .filter((word) => word.length > 2);

  if (words.length === 0) return title.slice(0, 24) || 'Article';
  return words.slice(0, 2).join(' ');
};

export const splitCoverTitle = (title: string, maxLines = 3) => {
  const words = title.trim().split(/\s+/).filter(Boolean);
  if (words.length <= 4) return [title.trim()];

  const lines: string[] = [];
  let current = '';

  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (candidate.length > 22 && current) {
      lines.push(current);
      current = word;
    } else {
      current = candidate;
    }
    if (lines.length === maxLines - 1) break;
  }

  if (current) lines.push(current);
  if (lines.length < words.length && lines.length > 0) {
    lines[lines.length - 1] = `${lines[lines.length - 1].replace(/\.{3}$/, '')}...`;
  }

  return lines.slice(0, maxLines);
};
