import { cn } from '@/lib/utils';

export function PixelThemeOverlay({
  active,
  isDark,
}: {
  active: boolean;
  isDark: boolean;
}) {
  if (!active) return null;

  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 z-[70] overflow-hidden"
    >
      <div
        className={cn(
          'absolute inset-0 pixel-theme-reveal-tr',
          isDark ? 'bg-[#09090b]' : 'bg-[#fffef9]',
        )}
        style={{
          backgroundImage: isDark
            ? 'linear-gradient(90deg,rgba(255,255,255,0.05) 1px,transparent 1px),linear-gradient(rgba(255,255,255,0.05) 1px,transparent 1px)'
            : 'linear-gradient(90deg,rgba(0,0,0,0.06) 1px,transparent 1px),linear-gradient(rgba(0,0,0,0.06) 1px,transparent 1px)',
          backgroundSize: '6px 6px',
          imageRendering: 'pixelated',
        }}
      />
    </div>
  );
}
