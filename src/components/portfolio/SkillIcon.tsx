import { Code2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { getSkillIconUrl } from '@/lib/skill-icon';
import { cn } from '@/lib/utils';

export function SkillIcon({
  skill,
  isDark,
  className = 'h-3.5 w-3.5',
}: {
  skill: string;
  isDark: boolean;
  className?: string;
}) {
  const primary = getSkillIconUrl(skill);
  const [src, setSrc] = useState(primary);

  useEffect(() => {
    setSrc(primary);
  }, [primary]);

  const fallbackClass = cn(
    'shrink-0',
    isDark ? 'text-zinc-300' : 'text-zinc-600',
    className,
  );

  if (!primary) {
    return <Code2 className={fallbackClass} aria-hidden strokeWidth={2} />;
  }

  if (!src) {
    return <Code2 className={fallbackClass} aria-hidden strokeWidth={2} />;
  }

  return (
    <img
      src={src}
      alt=""
      className={cn(
        'shrink-0 object-contain',
        isDark && 'brightness-0 invert opacity-90',
        className,
      )}
      loading="lazy"
      decoding="async"
      referrerPolicy="no-referrer"
      onError={() => setSrc(null)}
    />
  );
}
