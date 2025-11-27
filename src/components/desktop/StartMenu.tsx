// Force HMR update
import { motion, AnimatePresence } from 'framer-motion';
import { useState, useMemo, useRef, useEffect } from 'react';
import { Search, Power, User, Settings } from 'lucide-react';
import { useDesktopStore } from '@/store/desktopStore';
import { cn } from '@/lib/utils';
import { getIconComponent, getAllApps, App } from '@/utils/apps';

interface StartMenuProps {
  onSignOut?: () => void;
}

export const StartMenu = ({ onSignOut }: StartMenuProps) => {
  const { showStartMenu, toggleStartMenu, openOrFocusWindow, togglePinApp, pinnedApps, settings, shouldFocusSearch, setShouldFocusSearch } = useDesktopStore();
  const [searchQuery, setSearchQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (showStartMenu && shouldFocusSearch && inputRef.current) {
      // Small timeout to ensure animation has started/input is mounted
      setTimeout(() => {
        inputRef.current?.focus();
        setShouldFocusSearch(false);
      }, 100);
    }
  }, [showStartMenu, shouldFocusSearch, setShouldFocusSearch]);

  // Get all apps from JSON
  const apps = getAllApps();

  const handleAppClick = (app: App) => {
    openOrFocusWindow({
      title: app.name,
      icon: app.name.toLowerCase(),
      appId: app.id,
      x: 100 + Math.random() * 200,
      y: 50 + Math.random() * 100,
      width: 700,
      height: 500,
      content: app.content,
    });
    toggleStartMenu();
  };

  const filteredApps = useMemo(() => {
    let result = [...apps].sort((a, b) => a.name.localeCompare(b.name));
    if (searchQuery) {
      result = result.filter(app =>
        app.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    return result;
  }, [searchQuery, apps]);

  return (
    <AnimatePresence>
      {showStartMenu && (
        <>
          {/* Backdrop - Click to close */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={toggleStartMenu}
            className="fixed inset-0 bg-black/40 backdrop-blur-[2px] z-40"
          />

          {/* Start Menu Container */}
          <motion.div
            initial={{ y: 50, opacity: 0, scale: 0.95, x: "-50%" }}
            animate={{ y: 0, opacity: 1, scale: 1, x: "-50%" }}
            exit={{ y: 50, opacity: 0, scale: 0.95, x: "-50%" }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className={cn(
              "fixed bottom-28 left-1/2 w-[640px] backdrop-blur-xl rounded-2xl shadow-2xl z-50 overflow-hidden flex flex-col",
              settings.darkMode
                ? "bg-black/90 border border-white/10 text-zinc-100"
                : "bg-white/90 border border-border text-foreground"
            )}
          >

            {/* Search Section */}
            <div className="p-6 pb-4">
              <div className="relative group">
                <Search className={cn(
                  "absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors",
                  settings.darkMode
                    ? "text-zinc-500 group-focus-within:text-white"
                    : "text-muted-foreground group-focus-within:text-foreground"
                )} />
                <input
                  ref={inputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search apps, files, and commands..."
                  className={cn(
                    "w-full pl-11 pr-4 py-3.5 rounded-xl text-sm focus:outline-none transition-all shadow-inner",
                    settings.darkMode
                      ? "bg-zinc-900/50 border border-white/5 text-white placeholder:text-zinc-600 focus:bg-zinc-900 focus:border-white/20"
                      : "bg-muted border border-border text-foreground placeholder:text-muted-foreground focus:bg-background focus:border-primary"
                  )}
                />
              </div>
            </div>

            {/* Apps Grid */}
            <div className="px-6 pb-6 flex-1 overflow-y-auto custom-scrollbar min-h-[300px]">
              <div className="flex justify-between items-center mb-4 px-1">
                <h3 className={cn(
                  "text-xs font-semibold uppercase tracking-wider flex items-center gap-2",
                  settings.darkMode ? "text-zinc-500" : "text-muted-foreground"
                )}>
                  {searchQuery ? 'Search Results' : 'All Apps'}
                </h3>
              </div>

              <div className="grid grid-cols-6 gap-4">
                {filteredApps.map((app) => {
                  const IconComponent = getIconComponent(app.icon, settings.iconStyle);
                  const isPinned = pinnedApps.some(p => p.id === app.id);

                  const handleRightClick = (e: React.MouseEvent) => {
                    e.preventDefault();

                    togglePinApp({
                      id: app.id,
                      title: app.name,
                      icon: app.icon,
                      bg: `bg-gradient-to-b ${app.color}`,
                      iconColor: 'text-white'
                    });
                  };

                  return (
                    <motion.button
                      key={app.id}
                      whileHover={{ scale: 1.05, y: -2 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handleAppClick(app)}
                      onContextMenu={handleRightClick}
                      className="flex flex-col items-center gap-3 group relative"
                      title={isPinned ? "Right-click to unpin" : "Right-click to pin to taskbar"}
                    >
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center shadow-lg transition-all duration-300 relative ${settings.themeColor === 'blue' ? 'bg-blue-300' :
                        settings.themeColor === 'purple' ? 'bg-purple-300' :
                          settings.themeColor === 'green' ? 'bg-green-300' :
                            settings.themeColor === 'orange' ? 'bg-orange-300' :
                              settings.themeColor === 'red' ? 'bg-red-300' :
                                'bg-zinc-300'
                        }`}>
                        <IconComponent strokeWidth={1.5} className="w-6 h-6 text-black transition-colors relative z-10" />
                        <div className="absolute inset-0 rounded-xl bg-gradient-to-b from-white/20 to-transparent pointer-events-none" />
                      </div>
                      <span className={cn(
                        "text-[11px] font-medium transition-colors text-center truncate w-full",
                        settings.darkMode
                          ? "text-zinc-400 group-hover:text-white"
                          : "text-muted-foreground group-hover:text-foreground"
                      )}>
                        {app.name}
                      </span>
                    </motion.button>
                  );
                })}
                {filteredApps.length === 0 && (
                  <div className={cn(
                    "col-span-6 text-center py-8 text-sm",
                    settings.darkMode ? "text-zinc-500" : "text-muted-foreground"
                  )}>
                    No apps found for "{searchQuery}"
                  </div>
                )}
              </div>
            </div>

            {/* Footer / User Profile */}
            <div className={cn(
              "p-4 border-t flex items-center justify-between backdrop-blur-md",
              settings.darkMode
                ? "bg-zinc-900/50 border-white/5"
                : "bg-zinc-100 border-zinc-200"
            )}>
              <div className={cn(
                "flex items-center gap-3 p-2 rounded-lg transition-colors cursor-pointer group",
                settings.darkMode ? "hover:bg-white/5" : "hover:bg-white/50"
              )}>
                <div className={cn(
                  "w-9 h-9 rounded-full flex items-center justify-center",
                  settings.darkMode
                    ? "bg-zinc-800 border border-white/10"
                    : "bg-white border border-zinc-200"
                )}>
                  <User className={cn(
                    "w-5 h-5 transition-colors",
                    settings.darkMode
                      ? "text-zinc-400 group-hover:text-white"
                      : "text-zinc-500 group-hover:text-zinc-900"
                  )} />
                </div>
                <div className="flex flex-col">
                  <span className={cn(
                    "text-sm font-medium",
                    settings.darkMode
                      ? "text-zinc-200 group-hover:text-white"
                      : "text-zinc-900"
                  )}>Hardik G.</span>
                  <span className={cn(
                    "text-[10px]",
                    settings.darkMode ? "text-zinc-500" : "text-zinc-500"
                  )}>Administrator</span>
                </div>
              </div>

              <div className="flex items-center gap-1">
                <button
                  onClick={() => {
                    openOrFocusWindow({
                      title: 'Settings',
                      icon: 'settings',
                      appId: 'settings',
                      x: 100 + Math.random() * 200,
                      y: 50 + Math.random() * 100,
                      width: 700,
                      height: 500,
                      content: 'settings',
                    });
                    toggleStartMenu();
                  }}
                  className={cn(
                    "p-2.5 rounded-lg transition-colors group",
                    settings.darkMode ? "hover:bg-white/10" : "hover:bg-white/50"
                  )} title="Settings">
                  <Settings className={cn(
                    "w-4 h-4 transition-colors",
                    settings.darkMode
                      ? "text-zinc-500 group-hover:text-white"
                      : "text-zinc-500 group-hover:text-zinc-900"
                  )} />
                </button>
                <button
                  onClick={() => {
                    toggleStartMenu();
                    onSignOut?.();
                  }}
                  className="p-2.5 hover:bg-red-500/20 hover:text-red-400 rounded-lg transition-colors group"
                  title="Shut Down"
                >
                  <Power className={cn(
                    "w-4 h-4 transition-colors",
                    settings.darkMode
                      ? "text-zinc-500 group-hover:text-red-400"
                      : "text-zinc-500 group-hover:text-red-600"
                  )} />
                </button>
              </div>
            </div>

          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};