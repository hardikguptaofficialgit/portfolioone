import { useMemo } from 'react';
import { useDesktopStore } from '@/store/desktopStore';
import { usePortfolio } from '@/hooks/usePortfolio';
import { buildPortfolioPrompt } from '../../../lib/ai/providers';
import AskAIPanel from '@/components/ai/AskAIPanel';
import { cn } from '@/lib/utils';

export const AskMeWidget = () => {
  const { settings } = useDesktopStore();
  const { portfolio } = usePortfolio();
  const prompt = useMemo(() => buildPortfolioPrompt(portfolio), [portfolio]);

  return (
    <div
      className={cn(
        'w-72 rounded-2xl border p-4 backdrop-blur-md',
        settings.darkMode ? 'border-zinc-800 bg-zinc-950/75' : 'border-zinc-200 bg-white/80'
      )}
    >
      <AskAIPanel
        prompt={prompt}
        darkMode={settings.darkMode}
        iconStyle={settings.iconStyle}
        variant="widget"
      />
    </div>
  );
};
