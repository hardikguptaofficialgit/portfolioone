import { useState, useEffect } from 'react';
import { motion, useMotionValue, useTransform, useAnimation, PanInfo } from 'framer-motion';
import { ChevronUp } from 'lucide-react';
import { FallingPattern } from "@/components/ui/falling-pattern";

interface LockScreenProps {
    onUnlock: () => void;
}

export const LockScreen = ({ onUnlock }: LockScreenProps) => {
    const [time, setTime] = useState(new Date());
    const y = useMotionValue(0);
    const opacity = useTransform(y, [0, -300], [1, 0]);
    const controls = useAnimation();

    useEffect(() => {
        const timer = setInterval(() => setTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    const handleDragEnd = (_: any, info: PanInfo) => {
        if (info.offset.y < -150) {
            controls.start({ y: -window.innerHeight, transition: { duration: 0.4, ease: "easeInOut" } }).then(onUnlock);
        } else {
            controls.start({ y: 0, transition: { type: "spring", stiffness: 300, damping: 30 } });
        }
    };

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Enter' || e.key === ' ') {
                controls.start({ y: -window.innerHeight, transition: { duration: 0.4, ease: "easeInOut" } }).then(onUnlock);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [onUnlock, controls]);

    return (
        <motion.div
            className="fixed inset-0 z-[100] flex flex-col items-center justify-between pb-12 pt-32 bg-black text-white cursor-grab active:cursor-grabbing overflow-hidden audiowide-regular"
            style={{ y, opacity }}
            drag="y"
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0.5, bottom: 0 }}
            onDragEnd={handleDragEnd}
            animate={controls}
        >
            {/* Background with Falling Pattern */}
            <div className="absolute inset-0 z-0">
                <FallingPattern className="h-full w-full [mask-image:radial-gradient(ellipse_at_center,transparent,hsl(var(--background)))]" />
            </div>

            {/* Time and Date */}
            <div className="relative z-10 flex flex-col items-center gap-2">
                <h1 className="text-8xl font-light tracking-tighter select-none">
                    {time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })}
                </h1>
                <p className="text-2xl font-light tracking-wide text-zinc-300 select-none">
                    {time.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' })}
                </p>
            </div>

            {/* Unlock Hint */}
            <div className="relative z-10 flex flex-col items-center">
                <div className="relative z-20 flex justify-center w-full pointer-events-none">
                    <div className="relative px-6 py-3 bg-white text-black rounded-full shadow-lg flex flex-col items-center gap-1">

                        {/* Top DIP shape */}
                        <div
                            className="absolute -top-3 left-1/2 -translate-x-1/2 
	w-14 h-6 bg-white 
	rounded-full flex items-center justify-center"
                        >
                            <ChevronUp className="w-4 h-4 text-black" />
                        </div>


                        {/* Text */}
                        <span className="text-sm tracking-widest font-medium uppercase">
                            SWIPE UP TO UNLOCK
                        </span>
                    </div>
                </div>

            </div>

        </motion.div>
    );
};
