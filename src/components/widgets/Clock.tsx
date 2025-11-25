import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';

// Helper component to animate individual digits smoothly
const Digit = ({ value }) => (
  <div className="relative w-[0.6em] h-[1em] overflow-hidden inline-flex justify-center">
    <AnimatePresence mode='popLayout'>
      <motion.span
        key={value}
        initial={{ y: 20, opacity: 0, filter: "blur(4px)" }}
        animate={{ y: 0, opacity: 1, filter: "blur(0px)" }}
        exit={{ y: -20, opacity: 0, filter: "blur(4px)" }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="absolute inset-0 flex items-center justify-center"
      >
        {value}
      </motion.span>
    </AnimatePresence>
  </div>
);

// Helper for the blinking colon
const Separator = () => (
  <motion.span
    animate={{ opacity: [0.4, 1, 0.4] }}
    transition={{ duration: 2, ease: "easeInOut", repeat: Infinity }}
    className="mx-1 relative -top-1"
  >
    :
  </motion.span>
);

export const Clock = () => {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const timeString = format(time, 'HH:mm:ss');
  const dateString = format(time, 'EEEE, MMMM d, yyyy');

  // Split time string to animate chars individually
  const timeChars = timeString.split('');

  return (
    <motion.div
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      // Adding a subtle "breathing/floating" animation to the container
      whileHover={{ scale: 1.02 }}
      className="glass-panel rounded-2xl p-6 w-72 cursor-default select-none shadow-xl relative overflow-hidden"
    >
      {/* Optional: Subtle background shine effect */}
      <div className="absolute inset-0 bg-gradient-to-tr from-white/5 to-transparent pointer-events-none" />

      <div className="text-center space-y-4 relative z-10">
        {/* Time Display */}
        <div className="flex justify-center items-center text-5xl font-bold text-glass-text tabular-nums tracking-tight">
          {/* Hours */}
          <Digit value={timeChars[0]} />
          <Digit value={timeChars[1]} />

          <Separator />

          {/* Minutes */}
          <Digit value={timeChars[3]} />
          <Digit value={timeChars[4]} />

          <Separator />

          {/* Seconds */}
          <Digit value={timeChars[6]} />
          <Digit value={timeChars[7]} />
        </div>

        {/* Date Display */}
        <motion.div
          key={dateString} // Only animates when date changes (midnight)
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1 }}
          className="text-sm font-medium text-glass-text-muted uppercase tracking-widest"
        >
          {dateString}
        </motion.div>
      </div>
    </motion.div>
  );
};