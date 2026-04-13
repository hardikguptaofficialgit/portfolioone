import React from 'react';
import { Files, Interfaces } from 'doodle-icons';
import { useDesktopStore } from '@/store/desktopStore';
import { cn } from '@/lib/utils';

export const DevToWidget = () => {
    const { openOrFocusWindow, settings } = useDesktopStore();

    const handleClick = () => {
        openOrFocusWindow({
            title: 'DEV.to Articles',
            icon: 'FileText',
            appId: 'devto',
            content: 'devto',
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
                "group relative w-64 p-4 rounded-2xl backdrop-blur-md border cursor-pointer overflow-hidden",
                settings.darkMode
                    ? "bg-black/40 border-white/10"
                    : "bg-white/40 border-black/5"
            )}
        >
            <div className="relative z-10 flex items-start justify-between mb-3">
                <div className={cn(
                    "p-2 rounded-xl",
                    settings.darkMode ? "bg-purple-500/20 text-purple-400" : "bg-purple-100 text-purple-600"
                )}>
                    <Files.FileText width={20} height={20} fill="currentColor" />
                </div>
                <Interfaces.Link width={16} height={16} fill="currentColor" className="text-zinc-500 transition-colors" />
            </div>

            <div className="relative z-10">
                <h3 className={cn(
                    "text-lg font-bold mb-1",
                    settings.darkMode ? "text-white" : "text-zinc-900"
                )}>
                    Dev Articles
                </h3>
                <p className={cn(
                    "text-xs line-clamp-2",
                    settings.darkMode ? "text-zinc-400" : "text-zinc-600"
                )}>
                    Latest tutorials, guides, and technical insights from DEV Community.
                </p>
            </div>

            {/* Latest Post Indicator */}
            <div className="relative z-10 mt-3 flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-500" />
                <span className="text-[10px] font-medium text-zinc-500 uppercase tracking-wider">
                    New Posts Available
                </span>
            </div>
        </div>
    );
};
