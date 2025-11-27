import React from 'react';
import { Music, Play, Headphones, Radio } from 'lucide-react';
import { useDesktopStore } from '@/store/desktopStore';
import { cn } from '@/lib/utils';

export const SpotifyWidget = () => {
    const { openOrFocusWindow } = useDesktopStore();

    const handleOpenSpotify = () => {
        openOrFocusWindow({
            title: 'Spotify',
            icon: 'spotify',
            appId: 'spotify',
            x: 150,
            y: 150,
            width: 1000,
            height: 700,
            content: 'spotify',
        });
    };

    return (
        <div
            onClick={handleOpenSpotify}
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
                    <h3 className="text-lg font-bold text-white">Spotify</h3>
                    <span className="text-xs text-zinc-500">Listen my favorite songs</span>
                </div>

                <div className="flex items-center">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-white bg-green-600 px-3 py-1.5 rounded-full shadow-lg shadow-indigo-600/20">
                        <Play size={12} />
                        LISTEN
                    </div>
                </div>
            </div>
        </div>
    );
};
