import { useMemo, useState } from 'react';
import Copilot from '@lobehub/icons/es/Copilot';
import { ModelIcon } from '@lobehub/icons/es/features';
import { motion } from 'framer-motion';
import { ArrowUpRight } from 'lucide-react';
import {
  EXTRA_AI_PROVIDERS,
  getAIProviderHref,
  PRIMARY_AI_PROVIDERS,
  type AIProvider,
} from '../../../lib/ai/providers';
import { getIconComponent } from '@/utils/apps';
import { cn } from '@/lib/utils';

type AskAIPanelProps = {
  prompt: string;
  darkMode: boolean;
  iconStyle?: string;
  className?: string;
  title?: string;
  subtitle?: string;
  showExtraProviders?: boolean;
  variant?: 'widget' | 'blog' | 'inline';
  buttonClass?: string;
};

const ProviderIcon = ({ provider, size = 16 }: { provider: AIProvider; size?: number }) => {
  if (provider.model === 'copilot') {
    return <Copilot.Color size={size} />;
  }
  return <ModelIcon model={provider.model} size={size} type="color" />;
};

export const AskAIPanel = ({
  prompt,
  darkMode,
  iconStyle = 'color',
  className,
  title = 'Ask AI',
  subtitle = 'Pick an assistant to chat with.',
  showExtraProviders = false,
  variant = 'widget',
  buttonClass,
}: AskAIPanelProps) => {
  const [showExtra, setShowExtra] = useState(false);
  const providers = useMemo(
    () => (showExtraProviders && showExtra ? EXTRA_AI_PROVIDERS : PRIMARY_AI_PROVIDERS),
    [showExtra, showExtraProviders]
  );

  if (variant === 'inline') {
    return (
      <div className={cn('flex flex-wrap items-center gap-1', className)}>
        {providers.map((provider) => (
          <a
            key={provider.id}
            href={getAIProviderHref(provider, prompt)}
            target="_blank"
            rel="noopener noreferrer"
            className={cn(
              'inline-flex h-5 items-center gap-1 rounded-[4px] px-1.5 text-[9px] font-medium transition-colors',
              buttonClass
            )}
            title={provider.label}
          >
            <ProviderIcon provider={provider} size={10} />
            <span>Ask {provider.shortLabel}</span>
          </a>
        ))}
        {showExtraProviders && (
          <button
            type="button"
            onClick={() => setShowExtra((value) => !value)}
            className={cn(
              'inline-flex h-5 items-center gap-1 rounded-[4px] px-1.5 text-[9px] font-medium transition-colors',
              buttonClass
            )}
            aria-pressed={showExtra}
          >
            {showExtra ? 'Back' : 'More...'}
            <motion.span
              animate={{ rotate: showExtra ? 180 : 0 }}
              transition={{ type: 'spring', stiffness: 420, damping: 28 }}
              className="inline-flex"
            >
              <ArrowUpRight className="h-2.5 w-2.5 rotate-45" />
            </motion.span>
          </button>
        )}
      </div>
    );
  }

  const isBlog = variant === 'blog';

  return (
    <div className={className}>
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <h3
            className={cn(
              'font-bold',
              isBlog ? 'text-[11px]' : 'text-base',
              darkMode ? 'text-[#f0f0ee]' : 'text-zinc-950'
            )}
          >
            {title}
          </h3>
          <p
            className={cn(
              'mt-1',
              isBlog ? 'text-[9px]' : 'text-xs',
              darkMode ? (isBlog ? 'text-white/40' : 'text-zinc-500') : 'text-zinc-600'
            )}
          >
            {subtitle}
          </p>
        </div>
        <div
          className={cn(
            'rounded-lg border px-2 py-1 font-semibold uppercase tracking-wider',
            isBlog ? 'text-[8px]' : 'text-[10px]',
            darkMode
              ? isBlog
                ? 'border-white/10 text-white/40'
                : 'border-zinc-800 text-zinc-400'
              : 'border-zinc-200 text-zinc-600'
          )}
        >
          Chat
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        {providers.map((provider) => {
          const Icon = getIconComponent(provider.icon, iconStyle);
          return (
            <a
              key={provider.id}
              href={getAIProviderHref(provider, prompt)}
              target="_blank"
              rel="noopener noreferrer"
              className={cn(
                'flex items-center gap-2 rounded-xl border px-3 py-2 text-left transition-colors',
                isBlog ? 'py-2.5' : 'py-2',
                darkMode
                  ? 'border-zinc-800 bg-zinc-900 text-zinc-100 hover:bg-zinc-800'
                  : 'border-zinc-200 bg-white text-zinc-950 hover:bg-zinc-50'
              )}
              title={provider.label}
            >
              <span
                className={cn(
                  'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border',
                  darkMode
                    ? isBlog
                      ? 'border-white/10 bg-black'
                      : 'border-zinc-800 bg-black'
                    : 'border-zinc-200 bg-zinc-50'
                )}
              >
                {isBlog ? <ProviderIcon provider={provider} size={14} /> : <Icon className="h-4 w-4" />}
              </span>
              <span className={cn('min-w-0 font-semibold leading-tight', isBlog ? 'text-[10px]' : 'text-xs')}>
                {provider.shortLabel}
              </span>
            </a>
          );
        })}
      </div>

      {showExtraProviders && (
        <button
          type="button"
          onClick={() => setShowExtra((value) => !value)}
          className={cn(
            'mt-2 inline-flex items-center gap-1 text-[9px] font-medium transition-colors',
            darkMode ? 'text-white/45 hover:text-white/70' : 'text-zinc-500 hover:text-zinc-800'
          )}
        >
          {showExtra ? 'Show primary assistants' : 'More assistants'}
          <motion.span
            animate={{ rotate: showExtra ? 180 : 0 }}
            transition={{ type: 'spring', stiffness: 420, damping: 28 }}
            className="inline-flex"
          >
            <ArrowUpRight className="h-2.5 w-2.5 rotate-45" />
          </motion.span>
        </button>
      )}
    </div>
  );
};

export default AskAIPanel;
