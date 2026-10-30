import { Files } from 'doodle-icons';
import { useDesktopStore } from '@/store/desktopStore';
import { cn } from '@/lib/utils';

export const BlogWidget = () => {
  const { openOrFocusWindow, settings } = useDesktopStore();

  const handleClick = () => {
    openOrFocusWindow({
      title: 'My Blog',
      icon: 'FileText',
      appId: 'blog',
      content: 'blog',
      width: 900,
      height: 700,
      x: 100,
      y: 50,
    });
  };

  return (
    <div
      onClick={handleClick}
      className={cn(
        'w-64 cursor-pointer rounded-2xl border p-5',
        settings.darkMode ? 'border-zinc-800/80 bg-[#0c0c0e]' : 'border-[#ded4ca] bg-[#fffef9]'
      )}
    >
      <div className="mb-4 flex items-center justify-between">
        <div
          className={cn(
            'rounded-md p-2',
            settings.darkMode ? 'bg-zinc-800 text-zinc-300' : 'bg-[#d0fffe] text-[#1f1a17]'
          )}
        >
          <Files.FileText width={18} height={18} fill="currentColor" />
        </div>
      </div>
      <div className="space-y-1">
        <h3 className={cn('text-base font-semibold', settings.darkMode ? 'text-white' : 'text-[#1f1a17]')}>
          My Blog
        </h3>
        <p className={cn('line-clamp-2 text-sm leading-snug', settings.darkMode ? 'text-zinc-400' : 'text-[#5c554b]')}>
          Thoughts, deep dives, and things I learn while building.
        </p>
      </div>
      <div className="mt-4 flex items-center gap-2">
        <div className="h-1.5 w-1.5 rounded-full bg-green-500" />
        <span className={cn('text-[10px] uppercase tracking-wider', settings.darkMode ? 'text-zinc-500' : 'text-[#6b5c4f]')}>
          Updated regularly
        </span>
      </div>
    </div>
  );
};
