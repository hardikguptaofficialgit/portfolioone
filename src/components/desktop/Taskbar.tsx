// Force HMR update
import { motion, AnimatePresence, LayoutGroup } from 'framer-motion';
import { useState, useEffect, useRef } from 'react';
import {
  Search,
  Wifi,
  Volume2,
  Battery,
  Grid3x3,
  FolderOpen,
} from 'lucide-react';
import { useDesktopStore } from '@/store/desktopStore';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { getPinnedApps, getIconComponent, getAppById } from '@/utils/apps';

// --- Improved Tooltip Component ---
const Tooltip = ({ children, text }: { children: React.ReactNode; text: string }) => {
  const [isVisible, setIsVisible] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleMouseEnter = () => {
    timeoutRef.current = setTimeout(() => setIsVisible(true), 400); // Slightly longer delay for "pro" feel
  };

  const handleMouseLeave = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setIsVisible(false);
  };

  return (
    <div
      className="relative flex flex-col items-center justify-end"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <AnimatePresence>
        {isVisible && (
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 2 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className="absolute -top-10 z-[100] whitespace-nowrap pointer-events-none"
          >
            <div className="px-3 py-1 rounded-md bg-neutral-900/95 border border-white/10 text-[11px] font-medium text-white shadow-xl backdrop-blur-md">
              {text}
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
    "mx-1.5 h-5 w-[1px] shrink-0 my-auto",
    darkMode ? "bg-white/10" : "bg-black/10"
  )} />
);

export const Taskbar = () => {
  const { windows, restoreWindow, minimizeWindow, activeWindowId, toggleStartMenu, showStartMenu, openOrFocusWindow, openStartMenuSearch, settings } = useDesktopStore();
  const [currentTime, setCurrentTime] = useState(new Date());

  const pinnedApps = getPinnedApps();

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const colorMap: Record<string, string> = {
    blue: 'bg-blue-600 text-white',
    purple: 'bg-purple-600 text-white',
    green: 'bg-emerald-600 text-white',
    orange: 'bg-orange-600 text-white',
    red: 'bg-rose-600 text-white',
    zinc: 'bg-zinc-700 text-white',
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[9999] flex justify-center p-3 pointer-events-none">
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className={cn(
          "pointer-events-auto",
          "flex h-12 items-center gap-1.5", 
          "backdrop-blur-2xl rounded-2xl px-2.5", 
          "border transition-all duration-300",
          settings.darkMode
            ? "bg-neutral-950/80 border-white/10 shadow-[0_0_1px_1px_rgba(255,255,255,0.05)]"
            : "bg-white/80 border-black/5 shadow-[0_0_1px_1px_rgba(0,0,0,0.05)]"
        )}
      >
        {/* --- LEFT: Start & Search --- */}
        <div className="flex items-center gap-1">
          <Tooltip text="Start">
            <button
              onClick={toggleStartMenu}
              className={cn(
                "flex h-9 w-9 items-center justify-center rounded-lg transition-all",
                showStartMenu
                  ? `${colorMap[settings.themeColor] || colorMap.blue}`
                  : settings.darkMode
                    ? "text-white/80 hover:bg-white/10"
                    : "text-black/80 hover:bg-black/5"
              )}
            >
              <Grid3x3 className="h-[18px] w-[18px]" />
            </button>
          </Tooltip>

          <Tooltip text="Search">
            <button
              onClick={openStartMenuSearch}
              className={cn(
                "flex h-9 w-9 items-center justify-center rounded-lg transition-all",
                settings.darkMode
                  ? "text-white/60 hover:bg-white/10 hover:text-white"
                  : "text-black/60 hover:bg-black/5 hover:text-black"
              )}
            >
              <Search className="h-[18px] w-[18px]" />
            </button>
          </Tooltip>
        </div>

        <Separator darkMode={settings.darkMode} />

        {/* --- MIDDLE: Apps --- */}
        <div className="flex items-center gap-1.5 px-1">
          <LayoutGroup>
            {/* Pinned Apps */}
            {pinnedApps.map((app) => {
              const existingWindow = windows.find(w => w.appId === app.id);
              const hasOpenWindow = !!existingWindow;
              const isActive = activeWindowId === existingWindow?.id && !existingWindow?.isMinimized;
              const IconComponent = getIconComponent(app.icon, settings.iconStyle);

              return (
                <div key={app.id} className="relative flex flex-col items-center">
                  <Tooltip text={app.name}>
                    <button
                      onClick={() => {
                        if (existingWindow) {
                          if (activeWindowId === existingWindow.id && !existingWindow.isMinimized) {
                            minimizeWindow(existingWindow.id);
                          } else {
                            restoreWindow(existingWindow.id);
                          }
                        } else {
                          openOrFocusWindow({
                            title: app.name,
                            icon: app.id,
                            appId: app.id,
                            x: 120, y: 80, width: 900, height: 600,
                            content: app.content,
                          });
                        }
                      }}
                      className={cn(
                        "flex h-9 w-9 items-center justify-center rounded-lg transition-colors duration-200",
                        isActive 
                          ? (settings.darkMode ? "bg-white/15" : "bg-black/10")
                          : settings.darkMode ? "hover:bg-white/5" : "hover:bg-black/5"
                      )}
                    >
                      <div className={cn(
                        "flex h-8 w-8 items-center justify-center rounded-md",
                        colorMap[settings.themeColor] || colorMap.blue
                      )}>
                        <IconComponent className="h-5 w-5" />
                      </div>
                    </button>
                  </Tooltip>
                  {hasOpenWindow && (
                    <div className={cn(
                      "absolute -bottom-1 h-1 rounded-full transition-all duration-300",
                      isActive ? "w-4 bg-blue-400" : "w-1 bg-neutral-500"
                    )} />
                  )}
                </div>
              );
            })}

            {/* Separator for Unpinned */}
            {windows.filter(w => !pinnedApps.some(app => app.id === w.appId)).length > 0 && (
              <div className={cn("w-[1px] h-4 mx-1", settings.darkMode ? "bg-white/10" : "bg-black/10")} />
            )}

            {/* Active Unpinned Windows */}
            <AnimatePresence mode='popLayout'>
              {windows
                .filter(window => !pinnedApps.some(app => app.id === window.appId))
                .map((window) => (
                  <motion.div
                    key={window.id}
                    layout
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="relative flex flex-col items-center"
                  >
                    <Tooltip text={window.title}>
                      <button
                        onClick={() => (activeWindowId === window.id && !window.isMinimized) ? minimizeWindow(window.id) : restoreWindow(window.id)}
                        className={cn(
                          "flex h-9 w-9 items-center justify-center rounded-lg transition-colors",
                          activeWindowId === window.id && !window.isMinimized
                            ? (settings.darkMode ? "bg-white/15" : "bg-black/10")
                            : settings.darkMode ? "hover:bg-white/5" : "hover:bg-black/5"
                        )}
                      >
                         <div className={cn(
                            "flex h-8 w-8 items-center justify-center rounded-md border",
                            settings.darkMode ? "bg-neutral-500/20 border-white/5" : "bg-black/5 border-black/10"
                          )}>
                            <FolderOpen className={cn("h-4 w-4", settings.darkMode ? "text-white/80" : "text-zinc-700")} />
                         </div>
                      </button>
                    </Tooltip>
                    <div className={cn(
                      "absolute -bottom-1 h-1 rounded-full transition-all duration-300",
                      activeWindowId === window.id && !window.isMinimized ? "w-4 bg-blue-400" : "w-1 bg-neutral-500"
                    )} />
                  </motion.div>
                ))}
            </AnimatePresence>
          </LayoutGroup>
        </div>

        <Separator darkMode={settings.darkMode} />

        {/* --- RIGHT: Tray --- */}
        <div className="flex items-center gap-1 pr-1">
          <div className={cn(
            "flex h-9 items-center gap-3 px-3 rounded-lg transition-colors",
            settings.darkMode ? "hover:bg-white/5" : "hover:bg-black/5"
          )}>
            <Wifi className="h-3.5 w-3.5 opacity-70" />
            <Volume2 className="h-3.5 w-3.5 opacity-70" />
            <Battery className="h-3.5 w-3.5 opacity-70" />
          </div>

          <button
            onClick={() => {
              const cal = getAppById('calendar');
              if (cal) openOrFocusWindow({ title: cal.name, icon: cal.id, appId: cal.id, x: 100, y: 50, width: 700, height: 500, content: cal.content });
            }}
            className={cn(
              "flex flex-col items-end justify-center px-2 h-9 rounded-lg transition-colors",
              settings.darkMode ? "hover:bg-white/5 text-white" : "hover:bg-black/5 text-black"
            )}
          >
            <span className="text-[12px] font-bold leading-none">
              {format(currentTime, 'HH:mm')}
            </span>
            <span className="text-[10px] opacity-50 font-medium mt-0.5">
              {format(currentTime, 'MM/dd/yyyy')}
            </span>
          </button>
        </div>
      </motion.div>
    </div>
  );
};
