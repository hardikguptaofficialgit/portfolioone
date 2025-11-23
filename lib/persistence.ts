// Persistence layer for all stores

export const STORAGE_KEYS = {
  DESKTOP_STATE: "desktop-state",
  WIDGET_STATE: "widget-state",
  SETTINGS_STATE: "settings-state",
} as const

export interface PersistenceConfig {
  key: string
  version: number
  migrate?: (oldState: any, oldVersion: number) => any
}

export function createPersistMiddleware<T>(config: PersistenceConfig) {
  return (set: any, get: any) => ({
    loadPersistedState: () => {
      try {
        const item = localStorage.getItem(config.key)
        if (item) {
          const { state, version } = JSON.parse(item)

          if (config.migrate && version < config.version) {
            const migratedState = config.migrate(state, version)
            return migratedState
          }

          return state
        }
      } catch (error) {
        console.error(`[v0] Failed to load persisted state for ${config.key}:`, error)
      }
      return null
    },

    persistState: (state: T) => {
      try {
        localStorage.setItem(
          config.key,
          JSON.stringify({
            state,
            version: config.version,
            timestamp: Date.now(),
          }),
        )
      } catch (error) {
        console.error(`[v0] Failed to persist state for ${config.key}:`, error)
      }
    },

    clearPersistedState: () => {
      try {
        localStorage.removeItem(config.key)
      } catch (error) {
        console.error(`[v0] Failed to clear persisted state for ${config.key}:`, error)
      }
    },
  })
}

export function setupStorageSync() {
  const handleStorageChange = (e: StorageEvent) => {
    if (e.key === STORAGE_KEYS.DESKTOP_STATE) {
      console.log("[v0] Desktop state updated in another tab")
      // State will be reloaded on component mount
    }
    if (e.key === STORAGE_KEYS.WIDGET_STATE) {
      console.log("[v0] Widget state updated in another tab")
    }
    if (e.key === STORAGE_KEYS.SETTINGS_STATE) {
      console.log("[v0] Settings state updated in another tab")
    }
  }

  if (typeof window !== "undefined") {
    window.addEventListener("storage", handleStorageChange)
    return () => window.removeEventListener("storage", handleStorageChange)
  }
}
