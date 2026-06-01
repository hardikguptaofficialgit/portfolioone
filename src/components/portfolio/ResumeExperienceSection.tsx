import { formatExperienceRange } from '@/content/defaults';
import type { Experience } from '@/content/types';

type Props = {
  items: Experience[];
  onOpenUrl?: (url: string) => void;
};

export const ResumeExperienceSection = ({ items, onOpenUrl }: Props) => (
  <section className="space-y-6">
    <h3 className="text-xl font-bold text-white uppercase tracking-widest border-b border-zinc-800 pb-2 w-max">
      Experience
    </h3>
    <div className="space-y-6">
      {items.map((job, index) => (
        <div key={job.id} className="relative border-l border-zinc-800 pl-6 ml-2">
          <div
            className={`absolute -left-1.5 top-1.5 w-3 h-3 rounded-full border-4 border-black ${
              index === 0 ? 'bg-zinc-600' : 'bg-white'
            }`}
          />
          <div className="flex justify-between items-start mb-2 gap-4 flex-wrap">
            <h4 className="text-lg font-bold text-white">{job.role}</h4>
            <span className="text-sm text-zinc-500 bg-zinc-900 px-2 py-1 shrink-0">
              {formatExperienceRange(job.startDate, job.endDate, job.current)}
            </span>
          </div>
          {job.url ? (
            <p
              className="text-blue-300 text-sm mb-2 hover:text-blue-500 transition-colors cursor-pointer"
              onClick={() => onOpenUrl?.(job.url!)}
              onKeyDown={(e) => e.key === 'Enter' && onOpenUrl?.(job.url!)}
              role="link"
              tabIndex={0}
            >
              {job.url.replace(/^https?:\/\//, '')}
            </p>
          ) : null}
          <ul className="list-disc list-inside text-zinc-400 text-sm space-y-1">
            {job.highlights.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  </section>
);
