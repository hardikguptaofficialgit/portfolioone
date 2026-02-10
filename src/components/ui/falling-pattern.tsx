'use client';

import type React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

type FallingPatternProps = React.ComponentProps<'div'> & {
    color?: string;
    backgroundColor?: string;
    duration?: number;
    blurIntensity?: string;
    density?: number;
};

export function FallingPattern({
    color = '#ffffff',
    backgroundColor = '#000000',
    duration = 150,
    blurIntensity = '1em',
    density = 1,
    className,
}: FallingPatternProps) {
    const generateBackgroundImage = () => {
        const patterns = [
            `radial-gradient(4px 100px at 0px 235px, ${color}, transparent)`,
            `radial-gradient(4px 100px at 300px 235px, ${color}, transparent)`,
            `radial-gradient(1.5px 1.5px at 150px 117.5px, ${color} 100%, transparent)`,

            `radial-gradient(4px 100px at 0px 252px, ${color}, transparent)`,
            `radial-gradient(4px 100px at 300px 252px, ${color}, transparent)`,
            `radial-gradient(1.5px 1.5px at 150px 126px, ${color} 100%, transparent)`,

            `radial-gradient(4px 100px at 0px 150px, ${color}, transparent)`,
            `radial-gradient(4px 100px at 300px 150px, ${color}, transparent)`,
            `radial-gradient(1.5px 1.5px at 150px 75px, ${color} 100%, transparent)`,

            `radial-gradient(4px 100px at 0px 253px, ${color}, transparent)`,
            `radial-gradient(4px 100px at 300px 253px, ${color}, transparent)`,
            `radial-gradient(1.5px 1.5px at 150px 126.5px, ${color} 100%, transparent)`,
        ];
        return patterns.join(', ');
    };

    const backgroundSizes = [
        '300px 235px',
        '300px 235px',
        '300px 235px',
        '300px 252px',
        '300px 252px',
        '300px 252px',
        '300px 150px',
        '300px 150px',
        '300px 150px',
        '300px 253px',
        '300px 253px',
        '300px 253px',
    ].join(', ');

    /** 
     * FIXED POSITION
     * This is where the animation STOPS permanently.
     */
    const frozenPosition =
        '0px 1200px, 3px 1200px, 151.5px 1317.5px, 25px 1800px, 28px 1800px, 176.5px 1926px, 50px 1100px, 53px 1100px, 201.5px 1175px, 75px 2200px, 78px 2200px, 226.5px 2326.5px';

    return (
        <div className={cn('relative h-full w-full overflow-hidden bg-black', className)}>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.2 }}
                className="size-full brightness-150 contrast-125"
            >
                <motion.div
                    className="relative size-full z-0"
                    style={{
                        backgroundColor,
                        backgroundImage: generateBackgroundImage(),
                        backgroundSize: backgroundSizes,
                        backgroundPosition: frozenPosition, // 👈 HARD STOP
                    }}
                />
            </motion.div>

            {/* Static blur overlay */}
            <div
                className="absolute inset-0 z-1 pointer-events-none"
                style={{
                    backdropFilter: `blur(${blurIntensity})`,
                    backgroundImage:
                        `radial-gradient(circle at 50% 50%, rgba(255,255,255,0.05) 0, transparent 4px, rgba(0,0,0,0.5) 4px)`,
                    backgroundSize: `${8 * density}px ${8 * density}px`,
                }}
            />
        </div>
    );
}
