// Force HMR update
import { motion, AnimatePresence, LayoutGroup } from 'framer-motion';
import { useState, useEffect, useRef } from 'react';
import {
  Search,
  Wifi,
  Volume2,
  Battery,
  Grid3x3,
  MessageSquare,
  FolderOpen,
  Settings
} from 'lucide-react';
import { useDesktopStore } from '@/store/desktopStore';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { getPinnedApps, getIconComponent, getAppById } from '@/utils/apps';

// --- Configuration: Pinned Dock Apps ---
// Removed custom SpotifyIcon as we are using Iconoir now

// --- Improved Tooltip Component ---
const Tooltip = ({ children, text }: { children: React.ReactNode; text: string }) => {
  const [isVisible, setIsVisible] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleMouseEnter = () => {
    // Add a slight delay so tooltips don't flash when quickly moving mouse across dock
    timeoutRef.current = setTimeout(() => setIsVisible(true), 200);
  };

  const handleMouseLeave = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setIsVisible(false);
  };

  return (
    <div
      className="relative flex flex-col items-center justify-end group"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <AnimatePresence>
        {isVisible && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 5, scale: 0.9 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className="absolute -top-16 left-0 -translate-x-10 z-[100] whitespace-nowrap"
          >
            <div className="relative px-3 py-1.5 rounded-lg bg-neutral-900/90 border border-white/10 text-xs font-semibold text-white shadow-xl backdrop-blur-md">
              {text}
              {/* Arrow Pointer */}
              <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-neutral-900/90 border-r border-b border-white/10 rotate-45 transform" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      {children}
    </div>
  );
};

const Separator = ({ darkMode }: { darkMode: boolean }) => (
  <div className={cn(
    "mx-2 h-10 w-[1px] rounded-full shrink-0 my-auto",
    darkMode ? "bg-white/10" : "bg-border"
  )} />
);

export const Taskbar = () => {
  const { windows, restoreWindow, toggleStartMenu, showStartMenu, openOrFocusWindow, settings } = useDesktopStore();
  const [currentTime, setCurrentTime] = useState(new Date());

  // Get pinned apps from JSON
  const pinnedApps = getPinnedApps();

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const colorMap: Record<string, string> = {
    blue: 'bg-blue-300 border-blue-200 shadow-blue-500/20',
    purple: 'bg-purple-300 border-purple-200 shadow-purple-500/20',
    green: 'bg-green-300 border-green-200 shadow-green-500/20',
    orange: 'bg-orange-300 border-orange-200 shadow-orange-500/20',
    red: 'bg-red-300 border-red-200 shadow-red-500/20',
    zinc: 'bg-zinc-300 border-zinc-200 shadow-zinc-500/20',
  };

  const activeWindowColorMap: Record<string, string> = {
    blue: 'bg-blue-400',
    purple: 'bg-purple-400',
    green: 'bg-green-400',
    orange: 'bg-orange-400',
    red: 'bg-red-400',
    zinc: 'bg-zinc-400',
  };

  return (
    <>
      {/* Main Dock Wrapper 
        pointer-events-none on the wrapper ensures clicks pass through the 
        empty areas to the desktop/windows behind.
      */}
      <div
        className="fixed bottom-6 left-0 right-0 z-[9999] flex justify-center px-4 pointer-events-none"
      >

        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{
            y: 0,
            opacity: 1
          }}
          transition={{ type: "spring", stiffness: 200, damping: 20 }}
          className={cn(
            "pointer-events-auto", // Re-enable clicks for the dock itself
            "flex h-[5rem] items-center gap-2",
            "backdrop-blur-2xl rounded-[2.5rem] px-4",
            "w-auto max-w-[96vw]",
            "transition-all duration-300 ease-out",
            settings.darkMode
              ? "bg-neutral-950/80 border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.5)]"
              : "bg-white/80 border border-border shadow-[0_20px_50px_rgba(0,0,0,0.1)]"
          )}
        >

          {/* --- LEFT: System Controls --- */}
          <div className="flex items-center gap-2 shrink-0 z-20">
            <Tooltip text="Start Menu">
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={toggleStartMenu}
                className={cn(
                  "flex h-12 w-12 items-center justify-center rounded-2xl transition-all duration-300 shadow-lg",
                  showStartMenu
                    ? `${colorMap[settings.themeColor] || colorMap.blue} text-black`
                    : settings.darkMode
                      ? "bg-neutral-800/50 text-white/90 hover:bg-neutral-700/50 border border-white/5"
                      : "bg-white/50 text-black hover:bg-white/70 border border-zinc-200"
                )}
              >
                <Grid3x3 className="h-6 w-6" />
              </motion.button>
            </Tooltip>

            <Tooltip text="Search">
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                className={cn(
                  "flex h-12 w-12 items-center justify-center rounded-2xl shadow-lg transition-colors",
                  settings.darkMode
                    ? "bg-neutral-800/50 text-white/70 border border-white/5 hover:bg-neutral-700/50 hover:text-white"
                    : "bg-white/50 text-black border border-zinc-200 hover:bg-white/70 hover:text-black"
                )}
              >
                <Search className="h-5 w-5" />
              </motion.button>
            </Tooltip>
          </div>

          <Separator darkMode={settings.darkMode} />

          {/* --- MIDDLE: Scrollable Dock Area --- */}
          <div className="flex-1 min-w-0 h-full flex justify-center relative z-10">
            <div className="
              flex items-end gap-3 
              overflow-x-auto no-scrollbar 
              px-2 w-full justify-start md:justify-center 
              pt-24 -mt-24 pb-0 
              pointer-events-none 
            ">
              <LayoutGroup>

                {/* 1. Static Pinned Apps */}
                <div className="flex items-center gap-3 shrink-0 pointer-events-auto pb-4">
                  {pinnedApps.map((app) => {
                    // Check if this app has an open window
                    const hasOpenWindow = windows.some(w => w.appId === app.id);

                    const handleAppClick = () => {
                      openOrFocusWindow({
                        title: app.name,
                        icon: app.id,
                        appId: app.id,
                        x: 100 + Math.random() * 200,
                        y: 50 + Math.random() * 100,
                        width: 700,
                        height: 500,
                        content: app.content,
                      });
                    };

                    // Get the icon component
                    const IconComponent = getIconComponent(app.icon, settings.iconStyle);

                    return (
                      <div key={app.id} className="flex items-center justify-center">
                        <Tooltip text={app.name}>
                          <motion.button
                            layout
                            whileHover={{ scale: 1.15, y: -8 }}
                            whileTap={{ scale: 0.85 }}
                            transition={{ type: "spring", stiffness: 350, damping: 15 }}
                            onClick={handleAppClick}
                            className={cn(
                              "relative flex h-12 w-12 items-center justify-center rounded-2xl shadow-lg",
                              "mx-0", // remove side spacing
                              `${colorMap[settings.themeColor] || colorMap.blue}`
                            )}
                          >
                            <IconComponent className="h-6 w-6 text-black" />
                            <div className="absolute inset-0 rounded-2xl bg-gradient-to-b from-white/20 to-transparent pointer-events-none" />
                            {/* Running indicator */}
                            {hasOpenWindow && (
                              <div className={cn(
                                "absolute -bottom-2 h-1.5 w-1.5 rounded-full shadow-lg",
                                settings.darkMode ? "bg-white shadow-white/50" : "bg-zinc-900 shadow-zinc-900/50"
                              )} />
                            )}
                          </motion.button>
                        </Tooltip>
                      </div>
                    );
                  })}
                </div>

                {windows.length > 0 && (
                  <div className={cn(
                    "mx-2 h-1 w-1 rounded-full shrink-0 mb-10 pointer-events-auto",
                    settings.darkMode ? "bg-white/20" : "bg-zinc-300"
                  )} />
                )}

                {/* 2. Active Windows */}
                <div className="flex items-center gap-3 shrink-0 pointer-events-auto pb-4">
                  <AnimatePresence mode='popLayout'>
                    {windows.map((window) => {
                      const isActive = !window.isMinimized;
                      return (
                        <Tooltip key={window.id} text={window.title}>
                          <motion.button
                            layout
                            initial={{ opacity: 0, scale: 0.5, width: 0 }}
                            animate={{ opacity: 1, scale: 1, width: "auto" }}
                            exit={{ opacity: 0, scale: 0.5, width: 0 }}
                            whileHover={{ scale: 1.05, y: -4 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => restoreWindow(window.id)}
                            className={cn(
                              "relative flex h-12 items-center gap-3 rounded-2xl px-4 transition-all duration-300 border shrink-0 min-w-[140px] max-w-[200px]",
                              settings.darkMode
                                ? isActive
                                  ? "bg-white/10 border-white/10 text-white shadow-xl backdrop-blur-md"
                                  : "bg-neutral-800/40 border-transparent text-white/50 hover:bg-white/5"
                                : isActive
                                  ? "bg-white/80 border-zinc-200 text-zinc-900 shadow-xl backdrop-blur-md"
                                  : "bg-white/40 border-transparent text-zinc-500 hover:bg-white/60"
                            )}
                          >
                            <div className={cn(
                              "flex h-8 w-8 shrink-0 items-center justify-center rounded-xl",
                              isActive
                                ? `${activeWindowColorMap[settings.themeColor] || activeWindowColorMap.blue} text-black`
                                : settings.darkMode
                                  ? "bg-white/5 text-white/50"
                                  : "bg-zinc-200 text-zinc-500"
                            )}>
                              <FolderOpen className="h-4 w-4" />
                            </div>

                            <div className="flex flex-col items-start min-w-0 overflow-hidden">
                              <span className="truncate text-xs font-bold w-full text-left leading-tight">
                                {window.title}
                              </span>
                              <span className="text-[10px] opacity-50 truncate w-full text-left">
                                Running
                              </span>
                            </div>
                          </motion.button>
                        </Tooltip>
                      );
                    })}
                  </AnimatePresence>
                </div>
              </LayoutGroup>
            </div>
          </div>

          <Separator darkMode={settings.darkMode} />

          {/* --- RIGHT: System Tray --- */}
          <div className="flex items-center gap-2 shrink-0 z-20">
            {/* Status Pill */}
            <motion.div
              className={cn(
                "hidden sm:flex h-12 items-center gap-3 rounded-2xl px-4 shrink-0",
                settings.darkMode
                  ? "bg-neutral-800/50 border border-white/5 text-white/90"
                  : "bg-white/50 border border-zinc-200 text-zinc-900"
              )}
              whileHover={{ scale: 1.02 }}
            >
              <Wifi className="h-4 w-4" />
              <div className={cn(
                "h-3 w-[1px]",
                settings.darkMode ? "bg-white/20" : "bg-zinc-300"
              )} />
              <Volume2 className="h-4 w-4" />
              <div className={cn(
                "h-3 w-[1px]",
                settings.darkMode ? "bg-white/20" : "bg-zinc-300"
              )} />
              <Battery className="h-4 w-4" />
            </motion.div>

            {/* Clock */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              className={cn(
                "flex h-12 flex-col justify-center rounded-2xl px-3 text-right transition-colors shrink-0",
                settings.darkMode
                  ? "hover:bg-white/5 text-white"
                  : "hover:bg-white/50 text-zinc-900"
              )}
            >
              <span className={cn(
                "text-sm font-bold leading-none",
                settings.darkMode ? "text-white" : "text-zinc-900"
              )}>
                {format(currentTime, 'HH:mm')}
              </span>
              <span className={cn(
                "text-[10px] font-medium leading-none mt-1",
                settings.darkMode ? "text-white/50" : "text-zinc-500"
              )}>
                {format(currentTime, 'EEE dd')}
              </span>
            </motion.button>

            {/* Notifications */}
            <Tooltip text="Notifications">
              <motion.button
                whileHover={{ scale: 1.1, rotate: 10 }}
                whileTap={{ scale: 0.9 }}
                className={cn(
                  "relative flex h-12 w-12 items-center justify-center rounded-full shadow-inner shrink-0 ml-1",
                  settings.darkMode
                    ? "border border-white/10 bg-neutral-800 text-white"
                    : "border border-zinc-200 bg-white text-zinc-900"
                )}
              >
                <span className="absolute top-3 right-3 h-2 w-2 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.8)] animate-pulse" />
                <MessageSquare className="h-5 w-5" />
              </motion.button>
            </Tooltip>
          </div>

        </motion.div>
      </div>
    </>
  );
};