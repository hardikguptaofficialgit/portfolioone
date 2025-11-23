"use client"

import { useEffect } from "react"
import { useDesktopStore } from "@/lib/store"
import { useWidgetStore } from "@/lib/widgets"
import { useSettingsStore } from "@/lib/settings"
import { setupStorageSync } from "@/lib/persistence"

export function useAppInit() {
  useEffect(() => {
    // Load persisted state from all stores
    useDesktopStore.getState().loadState()
    useWidgetStore.getState().loadPersistedState()
    useSettingsStore.getState().loadPersistedState()

    console.log("[v0] App initialized with persisted state")

    // Setup cross-tab storage sync
    const unsubscribe = setupStorageSync()

    // Save state before unload
    const handleBeforeUnload = () => {
      useDesktopStore.getState().saveState()
      useWidgetStore.getState().saveState()
      useSettingsStore.getState().saveState()
    }

    window.addEventListener("beforeunload", handleBeforeUnload)

    return () => {
      unsubscribe?.()
      window.removeEventListener("beforeunload", handleBeforeUnload)
    }
  }, [])
}
