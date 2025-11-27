import React from 'react';
import { MessageSquare } from 'lucide-react';
import { useDesktopStore } from '@/store/desktopStore';

export const AskMeWidget = () => {
    const { openOrFocusWindow } = useDesktopStore();

    const handleOpenChat = () => {
        openOrFocusWindow({
            title: 'AI Clone',
            icon: 'Terminal',
            appId: 'terminal',
            x: 200,
            y: 100,
            width: 800,
            height: 600,
            content: 'terminal',
        });
    };

    return (
        <div
            onClick={handleOpenChat}
            className="
                relative w-64 h-20
                bg-zinc-900/50 backdrop-blur-md
                border border-zinc-800 
                rounded-2xl 
                cursor-pointer
                overflow-hidden
                transition-all
                p-4
                flex items-center
            "
        >
            <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-indigo-900 via-black to-black" />
            <div className="absolute inset-0 opacity-[0.03] bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />

            <div className="relative flex items-center justify-between w-full">
                <div className="flex flex-col leading-none">
                    <h3 className="text-lg font-bold text-white">AI Clone</h3>
                    <span className="text-xs text-zinc-500">Ask me anything...</span>
                </div>

                <div className="flex items-center">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-white bg-indigo-600 px-3 py-1.5 rounded-full shadow-lg shadow-indigo-600/20">
                        <MessageSquare size={12} />
                        CHAT
                    </div>
                </div>
            </div>
        </div>
    );
};
