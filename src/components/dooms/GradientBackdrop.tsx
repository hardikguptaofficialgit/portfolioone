import { cn } from '@/lib/utils';

export function GradientBackdrop({ className }: { className?: string }) {
  return (
    <div className={cn('pointer-events-none absolute inset-0 overflow-hidden', className)} aria-hidden>
      <div className="absolute inset-0 [background:radial-gradient(125%_125%_at_50%_10%,#000_40%,#6366ee_100%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(rgba(255,255,255,0.06)_1px,transparent_1px)] [background-size:20px_20px]" />
      <div className="absolute -left-24 top-1/4 h-72 w-72 rounded-full bg-violet-500/20 blur-3xl animate-pulse" />
      <div className="absolute -right-16 bottom-1/4 h-80 w-80 rounded-full bg-indigo-400/15 blur-3xl animate-pulse [animation-delay:1.2s]" />
    </div>
  );
}
