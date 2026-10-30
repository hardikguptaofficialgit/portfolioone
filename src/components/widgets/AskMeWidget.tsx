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
        'w-72 rounded-2xl border p-4',
        settings.darkMode ? 'border-zinc-800/80 bg-[#0c0c0e]' : 'border-[#ded4ca] bg-[#fffef9]'
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
