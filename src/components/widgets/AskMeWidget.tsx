import { useDesktopStore } from '@/store/desktopStore';
import { getIconComponent } from '@/utils/apps';
import { cn } from '@/lib/utils';

const providers = [
  { id: 'ask-chatgpt', title: 'Ask ChatGPT', icon: 'ChatGPT' },
  { id: 'ask-claude', title: 'Ask Claude', icon: 'Claude' },
  { id: 'ask-gemini', title: 'Ask Gemini', icon: 'Gemini' },
  { id: 'ask-perplexity', title: 'Ask Perplexity', icon: 'Perplexity' },
];

export const AskMeWidget = () => {
  const { openOrFocusWindow, settings } = useDesktopStore();

  const handleOpenChat = (provider: (typeof providers)[number]) => {
    openOrFocusWindow({
      title: provider.title,
      icon: provider.icon,
      appId: provider.id,
      x: 200,
      y: 100,
      width: 800,
      height: 600,
      content: 'terminal',
    });
  };

  return (
    <div
      className={cn(
        'w-72 rounded-2xl border p-4 backdrop-blur-md',
        settings.darkMode ? 'border-zinc-800 bg-zinc-950/75' : 'border-zinc-200 bg-white/80'
      )}
    >
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <h3 className={cn('text-base font-bold', settings.darkMode ? 'text-white' : 'text-zinc-950')}>Ask AI</h3>
          <p className={cn('mt-1 text-xs', settings.darkMode ? 'text-zinc-500' : 'text-zinc-600')}>
            Pick an assistant to chat with.
          </p>
        </div>
        <div
          className={cn(
            'rounded-lg border px-2 py-1 text-[10px] font-semibold uppercase tracking-wider',
            settings.darkMode ? 'border-zinc-800 text-zinc-400' : 'border-zinc-200 text-zinc-600'
          )}
        >
          Chat
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        {providers.map((provider) => {
          const Icon = getIconComponent(provider.icon, settings.iconStyle);
          return (
            <button
              key={provider.id}
              type="button"
              onClick={() => handleOpenChat(provider)}
              className={cn(
                'flex items-center gap-2 rounded-xl border px-3 py-2 text-left',
                settings.darkMode
                  ? 'border-zinc-800 bg-zinc-900 text-zinc-100'
                  : 'border-zinc-200 bg-white text-zinc-950'
              )}
            >
              <span
                className={cn(
                  'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border',
                  settings.darkMode ? 'border-zinc-800 bg-black' : 'border-zinc-200 bg-zinc-50'
                )}
              >
                <Icon className="h-4 w-4" />
              </span>
              <span className="min-w-0 text-xs font-semibold leading-tight">
                {provider.title.replace('Ask ', '')}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
