import { create } from "zustand"
import type { Window as WindowType } from "./types"
import { STORAGE_KEYS, createPersistMiddleware } from "./persistence"

interface DesktopStore {
  windows: WindowType[]
  activeWindowId: string | null
  taskbarApps: any[]
  isDarkMode: boolean

  // Window management
  createWindow: (window: Omit<WindowType, "id" | "zIndex">) => void
  closeWindow: (id: string) => void
  updateWindow: (id: string, updates: Partial<WindowType>) => void
  minimizeWindow: (id: string) => void
  maximizeWindow: (id: string) => void
  setActiveWindow: (id: string) => void
  bringToFront: (id: string) => void

  // Taskbar management
  addTaskbarApp: (app: any) => void
  removeTaskbarApp: (appId: string) => void

  // Theme
  toggleDarkMode: () => void

  // Persistence
  saveState: () => void
  loadState: () => void
  clearState: () => void
}

const persistMiddleware = createPersistMiddleware({
  key: STORAGE_KEYS.DESKTOP_STATE,
  version: 1,
})

export const useDesktopStore = create<DesktopStore>((set, get) => {
  const persistApi = persistMiddleware(set, get)
  const initialState = persistApi.loadPersistedState()

  return {
    windows: initialState?.windows ?? [],
    activeWindowId: initialState?.activeWindowId ?? null,
    taskbarApps: initialState?.taskbarApps ?? [],
    isDarkMode: initialState?.isDarkMode ?? true,

    createWindow: (windowData) =>
      set((state) => {
        const newWindow: WindowType = {
          ...windowData,
          id: `window-${Date.now()}`,
          zIndex: Math.max(0, ...state.windows.map((w) => w.zIndex)) + 1,
        }
        const newState = { windows: [...state.windows, newWindow] }
        persistApi.persistState(newState)
        return newState
      }),

    closeWindow: (id) =>
      set((state) => {
        const newState = {
          windows: state.windows.filter((w) => w.id !== id),
          activeWindowId: state.activeWindowId === id ? null : state.activeWindowId,
        }
        persistApi.persistState(newState)
        return newState
      }),

    updateWindow: (id, updates) =>
      set((state) => {
        const newState = {
          windows: state.windows.map((w) => (w.id === id ? { ...w, ...updates } : w)),
        }
        persistApi.persistState(newState)
        return newState
      }),

    minimizeWindow: (id) =>
      set((state) => {
        const newState = {
          windows: state.windows.map((w) => (w.id === id ? { ...w, isMinimized: true } : w)),
        }
        persistApi.persistState(newState)
        return newState
      }),

    maximizeWindow: (id) =>
      set((state) => {
        const newState = {
          windows: state.windows.map((w) => (w.id === id ? { ...w, isMaximized: !w.isMaximized } : w)),
        }
        persistApi.persistState(newState)
        return newState
      }),

    setActiveWindow: (id) => set({ activeWindowId: id }),

    bringToFront: (id) =>
      set((state) => {
        const maxZ = Math.max(0, ...state.windows.map((w) => w.zIndex))
        const newState = {
          windows: state.windows.map((w) => (w.id === id ? { ...w, zIndex: maxZ + 1 } : w)),
          activeWindowId: id,
        }
        persistApi.persistState(newState)
        return newState
      }),

    addTaskbarApp: (app) =>
      set((state) => {
        const newState = { taskbarApps: [...state.taskbarApps, app] }
        persistApi.persistState(newState)
        return newState
      }),

    removeTaskbarApp: (appId) =>
      set((state) => {
        const newState = {
          taskbarApps: state.taskbarApps.filter((a) => a.appId !== appId),
        }
        persistApi.persistState(newState)
        return newState
      }),

    toggleDarkMode: () =>
      set((state) => {
        const newState = { isDarkMode: !state.isDarkMode }
        persistApi.persistState(newState)
        return newState
      }),

    saveState: () => {
      const state = get()
      persistApi.persistState(state)
    },

    loadState: () => {
      const persisted = persistApi.loadPersistedState()
      if (persisted) {
        set(persisted)
      }
    },

    clearState: () => {
      persistApi.clearPersistedState()
      set({
        windows: [],
        activeWindowId: null,
        taskbarApps: [],
        isDarkMode: true,
      })
    },
  }
})
