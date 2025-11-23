import { create } from "zustand"
import { STORAGE_KEYS, createPersistMiddleware } from "./persistence"

interface SettingsStore {
  // Connectivity
  wifiEnabled: boolean
  bluetoothEnabled: boolean
  airplaneMode: boolean

  // System
  nightLight: boolean
  batterySaver: boolean
  accessibility: boolean
  location: boolean
  sharing: boolean

  // Display
  brightness: number
  volume: number

  // Theme
  theme: "light" | "dark" | "auto"
  accentColor: string

  // Actions
  toggleWifi: () => void
  toggleBluetooth: () => void
  toggleAirplaneMode: () => void
  toggleNightLight: () => void
  toggleBatterySaver: () => void
  toggleAccessibility: () => void
  toggleLocation: () => void
  toggleSharing: () => void
  setBrightness: (value: number) => void
  setVolume: (value: number) => void
  setTheme: (theme: "light" | "dark" | "auto") => void
  setAccentColor: (color: string) => void
  loadPersistedState: () => void
  saveState: () => void
}

const persistMiddleware = createPersistMiddleware({
  key: STORAGE_KEYS.SETTINGS_STATE,
  version: 1,
})

export const useSettingsStore = create<SettingsStore>((set, get) => {
  const persistApi = persistMiddleware(set, get)
  const initialState = persistApi.loadPersistedState()

  return {
    wifiEnabled: initialState?.wifiEnabled ?? true,
    bluetoothEnabled: initialState?.bluetoothEnabled ?? false,
    airplaneMode: initialState?.airplaneMode ?? false,
    nightLight: initialState?.nightLight ?? false,
    batterySaver: initialState?.batterySaver ?? false,
    accessibility: initialState?.accessibility ?? false,
    location: initialState?.location ?? true,
    sharing: initialState?.sharing ?? false,
    brightness: initialState?.brightness ?? 80,
    volume: initialState?.volume ?? 75,
    theme: initialState?.theme ?? "dark",
    accentColor: initialState?.accentColor ?? "blue",

    toggleWifi: () =>
      set((state) => {
        const newState = { wifiEnabled: !state.wifiEnabled }
        persistApi.persistState(newState)
        return newState
      }),

    toggleBluetooth: () =>
      set((state) => {
        const newState = { bluetoothEnabled: !state.bluetoothEnabled }
        persistApi.persistState(newState)
        return newState
      }),

    toggleAirplaneMode: () =>
      set((state) => {
        const newState = { airplaneMode: !state.airplaneMode }
        persistApi.persistState(newState)
        return newState
      }),

    toggleNightLight: () =>
      set((state) => {
        const newState = { nightLight: !state.nightLight }
        persistApi.persistState(newState)
        return newState
      }),

    toggleBatterySaver: () =>
      set((state) => {
        const newState = { batterySaver: !state.batterySaver }
        persistApi.persistState(newState)
        return newState
      }),

    toggleAccessibility: () =>
      set((state) => {
        const newState = { accessibility: !state.accessibility }
        persistApi.persistState(newState)
        return newState
      }),

    toggleLocation: () =>
      set((state) => {
        const newState = { location: !state.location }
        persistApi.persistState(newState)
        return newState
      }),

    toggleSharing: () =>
      set((state) => {
        const newState = { sharing: !state.sharing }
        persistApi.persistState(newState)
        return newState
      }),

    setBrightness: (value) =>
      set((state) => {
        const newState = { brightness: value }
        persistApi.persistState(newState)
        return newState
      }),

    setVolume: (value) =>
      set((state) => {
        const newState = { volume: value }
        persistApi.persistState(newState)
        return newState
      }),

    setTheme: (theme) =>
      set((state) => {
        const newState = { theme }
        persistApi.persistState(newState)
        return newState
      }),

    setAccentColor: (color) =>
      set((state) => {
        const newState = { accentColor: color }
        persistApi.persistState(newState)
        return newState
      }),

    loadPersistedState: () => {
      const persisted = persistApi.loadPersistedState()
      if (persisted) {
        set(persisted)
      }
    },

    saveState: () => {
      const state = get()
      persistApi.persistState(state)
    },
  }
})
