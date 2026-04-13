import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface Window {
  id: string;
  title: string;
  icon: string;
  isMinimized: boolean;
  isMaximized: boolean;
  x: number;
  y: number;
  width: number;
  height: number;
  zIndex: number;
  content: string;
  appId?: string; // Unique identifier for the app (e.g., 'chrome', 'vscode')
  data?: any;
}

export interface PinnedApp {
  id: string;
  title: string;
  icon: string;
  bg: string;
  iconColor: string;
}

export interface Settings {
  darkMode: boolean;
  themeColor: string;
  iconStyle: 'lucide' | 'iconoir' | 'doodle';
}

interface DesktopState {
  windows: Window[];
  activeWindowId: string | null;
  showStartMenu: boolean;
  maxZIndex: number;
  pinnedApps: PinnedApp[];
  settings: Settings;

  shouldFocusSearch: boolean;
  openStartMenuSearch: () => void;
  setShouldFocusSearch: (shouldFocus: boolean) => void;

  openWindow: (window: Omit<Window, 'id' | 'isMinimized' | 'isMaximized' | 'zIndex'>) => void;
  closeWindow: (id: string) => void;
  minimizeWindow: (id: string) => void;
  maximizeWindow: (id: string) => void;
  restoreWindow: (id: string) => void;
  setActiveWindow: (id: string) => void;
  updateWindowPosition: (id: string, x: number, y: number) => void;
  updateWindowSize: (id: string, width: number, height: number) => void;
  toggleStartMenu: () => void;
  togglePinApp: (app: PinnedApp) => void;
  openOrFocusWindow: (window: Omit<Window, 'id' | 'isMinimized' | 'isMaximized' | 'zIndex'>) => void;
  updateSettings: (settings: Partial<Settings>) => void;
}

// Default pinned apps
const DEFAULT_PINNED_APPS: PinnedApp[] = [
  {
    id: 'chrome',
    title: 'Google Chrome',
    icon: 'Chrome',
    bg: 'bg-gradient-to-b from-blue-500 to-blue-600 shadow-blue-500/20',
    iconColor: 'text-white'
  },
  {
    id: 'vscode',
    title: 'VS Code',
    icon: 'Code2',
    bg: 'bg-gradient-to-b from-sky-600 to-blue-700 shadow-sky-500/20',
    iconColor: 'text-white'
  },
  {
    id: 'spotify',
    title: 'Spotify',
    icon: 'SpotifyIcon',
    bg: 'bg-gradient-to-b from-green-500 to-emerald-600 shadow-green-500/20',
    iconColor: 'text-white'
  },
  {
    id: 'github',
    title: 'GitHub',
    icon: 'Github',
    bg: 'bg-gradient-to-b from-neutral-700 to-neutral-900 shadow-black/40',
    iconColor: 'text-white'
  },
  {
    id: 'terminal',
    title: 'Terminal',
    icon: 'Terminal',
    bg: 'bg-neutral-900 border border-white/10 shadow-black/40',
    iconColor: 'text-white'
  },
];

export const useDesktopStore = create<DesktopState>()(
  persist(
    (set, get) => ({
      windows: [],
      activeWindowId: null,
      showStartMenu: false,
      shouldFocusSearch: false,
      maxZIndex: 10,
      pinnedApps: DEFAULT_PINNED_APPS,
      settings: {
        darkMode: true,
        themeColor: 'blue',
        iconStyle: 'doodle',
      },

      openOrFocusWindow: (windowData) => {
        const state = get();

        // Check if a window with the same appId or title already exists
        const existingWindow = state.windows.find(
          w => (windowData.appId && w.appId === windowData.appId) ||
            (!windowData.appId && w.title === windowData.title)
        );

        if (existingWindow) {
          // If window exists, restore and focus it
          const newZIndex = state.maxZIndex + 1;
          set({
            windows: state.windows.map((w) =>
              w.id === existingWindow.id
                ? { ...w, isMinimized: false, zIndex: newZIndex }
                : w
            ),
            activeWindowId: existingWindow.id,
            maxZIndex: newZIndex,
          });
        } else {
          // Create new window
          const id = `window-${Date.now()}`;
          const newZIndex = state.maxZIndex + 1;

          set({
            windows: [
              ...state.windows,
              {
                id,
                ...windowData,
                isMinimized: false,
                isMaximized: false,
                zIndex: newZIndex,
              },
            ],
            activeWindowId: id,
            maxZIndex: newZIndex,
          });
        }
      },

      openWindow: (windowData) => {
        const id = `window-${Date.now()}`;
        const newZIndex = get().maxZIndex + 1;

        set((state) => ({
          windows: [
            ...state.windows,
            {
              id,
              ...windowData,
              isMinimized: false,
              isMaximized: false,
              zIndex: newZIndex,
            },
          ],
          activeWindowId: id,
          maxZIndex: newZIndex,
        }));
      },

      closeWindow: (id) => {
        set((state) => ({
          windows: state.windows.filter((w) => w.id !== id),
          activeWindowId: state.activeWindowId === id ? null : state.activeWindowId,
        }));
      },

      minimizeWindow: (id) => {
        set((state) => ({
          windows: state.windows.map((w) =>
            w.id === id ? { ...w, isMinimized: true } : w
          ),
          activeWindowId: state.activeWindowId === id ? null : state.activeWindowId,
        }));
      },

      maximizeWindow: (id) => {
        set((state) => ({
          windows: state.windows.map((w) =>
            w.id === id ? { ...w, isMaximized: !w.isMaximized } : w
          ),
        }));
      },

      restoreWindow: (id) => {
        const newZIndex = get().maxZIndex + 1;
        set((state) => ({
          windows: state.windows.map((w) =>
            w.id === id ? { ...w, isMinimized: false, zIndex: newZIndex } : w
          ),
          activeWindowId: id,
          maxZIndex: newZIndex,
        }));
      },

      setActiveWindow: (id) => {
        const newZIndex = get().maxZIndex + 1;
        set((state) => ({
          windows: state.windows.map((w) =>
            w.id === id ? { ...w, zIndex: newZIndex } : w
          ),
          activeWindowId: id,
          maxZIndex: newZIndex,
        }));
      },

      updateWindowPosition: (id, x, y) => {
        set((state) => ({
          windows: state.windows.map((w) =>
            w.id === id ? { ...w, x, y } : w
          ),
        }));
      },

      updateWindowSize: (id, width, height) => {
        set((state) => ({
          windows: state.windows.map((w) =>
            w.id === id ? { ...w, width, height } : w
          ),
        }));
      },

      toggleStartMenu: () => {
        set((state) => ({ showStartMenu: !state.showStartMenu }));
      },

      openStartMenuSearch: () => {
        set({ showStartMenu: true, shouldFocusSearch: true });
      },

      togglePinApp: (app: PinnedApp) => {
        set((state) => {
          const isAlreadyPinned = state.pinnedApps.some(p => p.id === app.id);

          if (isAlreadyPinned) {
            // Unpin the app
            return {
              pinnedApps: state.pinnedApps.filter(p => p.id !== app.id)
            };
          } else {
            // Pin the app
            return {
              pinnedApps: [...state.pinnedApps, app]
            };
          }
        });
      },

      updateSettings: (newSettings: Partial<Settings>) => {
        set((state) => ({
          settings: { ...state.settings, ...newSettings }
        }));
      },

      setShouldFocusSearch: (shouldFocus: boolean) => {
        set({ shouldFocusSearch: shouldFocus });
      },
    }),
    {
      name: 'desktop-storage',
      partialize: (state) => ({
        windows: state.windows.map(w => ({ ...w, isMinimized: false })),
        pinnedApps: state.pinnedApps,
        settings: state.settings,
      }),
    }
  )
);
