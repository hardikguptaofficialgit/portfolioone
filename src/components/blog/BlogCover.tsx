import { useMemo } from 'react';
import {
  type CoverPattern,
  type CoverTheme,
  getCoverKeyword,
  getCoverPalette,
  getCoverPattern,
  hashString,
  splitCoverTitle,
} from '../../../lib/blog/cover';
import { cn } from '@/lib/utils';

type BlogCoverProps = {
  title: string;
  coverImage?: string | null;
  theme: CoverTheme;
  tags?: string[];
  className?: string;
  imageClassName?: string;
  loading?: 'eager' | 'lazy';
  variant?: 'card' | 'featured' | 'hero';
};

const PatternLayer = ({
  pattern,
  palette,
  seed,
}: {
  pattern: CoverPattern;
  palette: ReturnType<typeof getCoverPalette>;
  seed: number;
}) => {
  const accent = palette.accent;
  const muted = palette.pattern;

  if (pattern === 'orbs') {
    const x1 = 72 + (seed % 18);
    const y1 = 18 + (seed % 12);
    const x2 = 84 + (seed % 10);
    const y2 = 72 + (seed % 16);
    return (
      <g opacity="0.9">
        <circle cx={`${x1}%`} cy={`${y1}%`} r="28%" fill={muted} />
        <circle cx={`${x2}%`} cy={`${y2}%`} r="18%" fill={accent} opacity="0.16" />
        <circle cx="12%" cy="82%" r="10%" fill={accent} opacity="0.1" />
      </g>
    );
  }

  if (pattern === 'lines') {
    const offset = seed % 6;
    return (
      <g opacity="0.85">
        {[0, 1, 2, 3].map((index) => (
          <line
            key={index}
            x1={`${8 + index * 7}%`}
            y1="100%"
            x2={`${42 + index * 9 + offset}%`}
            y2="0%"
            stroke={index % 2 === 0 ? accent : muted}
            strokeWidth={index === 0 ? 2.5 : 1.5}
            opacity={0.18 + index * 0.05}
          />
        ))}
      </g>
    );
  }

  if (pattern === 'grid') {
    return (
      <g opacity="0.8">
        {Array.from({ length: 5 }).map((_, row) =>
          Array.from({ length: 7 }).map((__, col) => (
            <circle
              key={`${row}-${col}`}
              cx={`${12 + col * 12}%`}
              cy={`${18 + row * 14}%`}
              r={row === col ? 2.8 : 1.6}
              fill={row === col ? accent : muted}
              opacity={row === col ? 0.35 : 0.22}
            />
          ))
        )}
      </g>
    );
  }

  return (
    <g opacity="0.9">
      <path d="M 0 78 Q 35 42, 72 58 T 100 34" fill="none" stroke={accent} strokeWidth="2" opacity="0.22" />
      <path d="M 0 92 Q 40 64, 78 76 T 100 58" fill="none" stroke={muted} strokeWidth="1.5" opacity="0.35" />
      <circle cx="86%" cy="24%" r="12%" fill={accent} opacity="0.08" />
    </g>
  );
};

const GeneratedCover = ({
  title,
  theme,
  tags,
  variant,
  className,
}: {
  title: string;
  theme: CoverTheme;
  tags?: string[];
  variant: BlogCoverProps['variant'];
  className?: string;
}) => {
  const palette = useMemo(() => getCoverPalette(title, theme), [title, theme]);
  const pattern = useMemo(() => getCoverPattern(title), [title]);
  const seed = useMemo(() => hashString(title), [title]);
  const lines = useMemo(() => splitCoverTitle(title, variant === 'card' ? 2 : 3), [title, variant]);
  const keyword = useMemo(() => getCoverKeyword(title), [title]);
  const primaryTag = tags?.[0];

  const titleClass =
    variant === 'hero'
      ? 'text-[clamp(1rem,4vw,1.6rem)] leading-[1.12]'
      : variant === 'featured'
        ? 'text-[clamp(0.7rem,2.5vw,1.05rem)] leading-[1.18]'
        : 'text-[clamp(0.55rem,2vw,0.8rem)] leading-[1.2]';
  const badgeClass =
    variant === 'card' ? 'text-[clamp(0.45rem,1.4vw,0.55rem)]' : 'text-[clamp(0.5rem,1.6vw,0.62rem)]';

  return (
    <div
      className={cn('relative h-full w-full overflow-hidden', className)}
      aria-hidden={false}
      role="img"
      aria-label={`Cover image for ${title}`}
    >
      <svg className="absolute inset-0 h-full w-full" viewBox="0 0 1200 630" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
        <defs>
          <linearGradient id={`cover-bg-${seed}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={palette.background} />
            <stop offset="100%" stopColor={palette.backgroundEnd} />
          </linearGradient>
        </defs>
        <rect width="1200" height="630" fill={`url(#cover-bg-${seed})`} />
        <PatternLayer pattern={pattern} palette={palette} seed={seed} />
      </svg>

      <div className="absolute inset-0 flex flex-col justify-between p-[8%]">
        <div className="flex items-center gap-2">
          <span
            className={cn('rounded-full px-2 py-0.5 font-mono uppercase tracking-[0.18em]', badgeClass)}
            style={{
              color: palette.textMuted,
              backgroundColor: palette.accentMuted,
            }}
          >
            {primaryTag || keyword}
          </span>
        </div>

        <div className="max-w-[82%]">
          <div
            className="mb-2 h-[3px] w-10 rounded-full"
            style={{ backgroundColor: palette.accent, opacity: theme === 'dark' ? 0.9 : 0.85 }}
          />
          <div className={cn('font-bold tracking-tight', titleClass)} style={{ color: palette.text }}>
            {lines.map((line) => (
              <div key={line} className="line-clamp-none">
                {line}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export const BlogCover = ({
  title,
  coverImage,
  theme,
  tags,
  className,
  imageClassName,
  loading = 'lazy',
  variant = 'card',
}: BlogCoverProps) => {
  if (coverImage) {
    return (
      <img
        src={coverImage}
        alt={title}
        loading={loading}
        className={cn('h-full w-full object-cover', imageClassName, className)}
      />
    );
  }

  return (
    <GeneratedCover
      title={title}
      theme={theme}
      tags={tags}
      variant={variant}
      className={cn(imageClassName, className)}
    />
  );
};

export default BlogCover;
