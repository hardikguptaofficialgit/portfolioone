import { Moon, Sun } from 'lucide-react';
import type { MouseEvent } from 'react';
import { cn } from '@/lib/utils';

export function PixelThemeToggle({
  isDark,
  onToggle,
  className,
}: {
  isDark: boolean;
  onToggle: (origin: { x: number; y: number }) => void;
  className?: string;
}) {
  const handleClick = (event: MouseEvent<HTMLButtonElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    onToggle({
      x: rect.left + rect.width / 2,
      y: rect.top + rect.height / 2,
    });
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label="Toggle theme"
      className={cn('theme-toggle', isDark ? 'theme-toggle-dark' : 'theme-toggle-light', className)}
    >
      <span className="theme-toggle-thumb" aria-hidden />
      <span className="theme-toggle-icon theme-toggle-moon" aria-hidden>
        <Moon size={13} strokeWidth={2.25} />
      </span>
      <span className="theme-toggle-icon theme-toggle-sun" aria-hidden>
        <Sun size={13} strokeWidth={2.25} />
      </span>
    </button>
  );
}
