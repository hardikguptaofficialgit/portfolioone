"use client"

import { ConnectivitySection } from "./connectivity-section"
import { DisplaySection } from "./display-section"
import { ThemeSection } from "./theme-section"

export function SettingsPanel() {
  return (
    <div className="w-full h-full space-y-3 overflow-y-auto">
      <div className="space-y-1 px-3 py-2">
        <h2 className="text-lg font-bold text-white">Settings</h2>
        <p className="text-xs text-white/50">Manage your system preferences</p>
      </div>

      <div className="border-t border-white/10">
        <ConnectivitySection />
      </div>

      <div className="border-t border-white/10">
        <DisplaySection />
      </div>

      <div className="border-t border-white/10">
        <ThemeSection />
      </div>
    </div>
  )
}
