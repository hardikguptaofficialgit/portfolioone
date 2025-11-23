"use client"

import type React from "react"

import { useSettingsStore } from "@/lib/settings"
import { Wifi, Bluetooth, Plane, Moon, Zap, UniversityIcon as UniversalAccess, MapPin, Share2 } from "lucide-react"

interface ToggleItemProps {
  icon: React.ReactNode
  label: string
  description: string
  enabled: boolean
  onChange: () => void
}

function ToggleItem({ icon, label, description, enabled, onChange }: ToggleItemProps) {
  return (
    <div className="flex items-center justify-between p-3 hover:bg-white/5 rounded-lg transition-colors">
      <div className="flex items-center gap-3">
        <div className="text-white/70">{icon}</div>
        <div>
          <div className="text-sm font-medium text-white">{label}</div>
          <div className="text-xs text-white/50">{description}</div>
        </div>
      </div>
      <button
        onClick={onChange}
        className={`relative w-12 h-6 rounded-full transition-colors ${enabled ? "bg-blue-500" : "bg-white/10"}`}
      >
        <div
          className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
            enabled ? "translate-x-7" : "translate-x-1"
          }`}
        />
      </button>
    </div>
  )
}

export function ConnectivitySection() {
  const {
    wifiEnabled,
    bluetoothEnabled,
    airplaneMode,
    nightLight,
    batterySaver,
    accessibility,
    location,
    sharing,
    toggleWifi,
    toggleBluetooth,
    toggleAirplaneMode,
    toggleNightLight,
    toggleBatterySaver,
    toggleAccessibility,
    toggleLocation,
    toggleSharing,
  } = useSettingsStore()

  return (
    <div className="space-y-2">
      <h3 className="text-sm font-semibold text-white px-3 py-2 text-white/70">CONNECTIVITY</h3>
      <ToggleItem
        icon={<Wifi className="w-5 h-5" />}
        label="WiFi"
        description="Network connectivity"
        enabled={wifiEnabled}
        onChange={toggleWifi}
      />
      <ToggleItem
        icon={<Bluetooth className="w-5 h-5" />}
        label="Bluetooth"
        description="Device pairing"
        enabled={bluetoothEnabled}
        onChange={toggleBluetooth}
      />
      <ToggleItem
        icon={<Plane className="w-5 h-5" />}
        label="Airplane Mode"
        description="Disconnect all networks"
        enabled={airplaneMode}
        onChange={toggleAirplaneMode}
      />

      <h3 className="text-sm font-semibold text-white px-3 py-2 mt-4 text-white/70">SYSTEM</h3>
      <ToggleItem
        icon={<Moon className="w-5 h-5" />}
        label="Night Light"
        description="Reduce blue light"
        enabled={nightLight}
        onChange={toggleNightLight}
      />
      <ToggleItem
        icon={<Zap className="w-5 h-5" />}
        label="Battery Saver"
        description="Extend battery life"
        enabled={batterySaver}
        onChange={toggleBatterySaver}
      />
      <ToggleItem
        icon={<UniversalAccess className="w-5 h-5" />}
        label="Accessibility"
        description="Enhanced options"
        enabled={accessibility}
        onChange={toggleAccessibility}
      />
      <ToggleItem
        icon={<MapPin className="w-5 h-5" />}
        label="Location"
        description="Allow location access"
        enabled={location}
        onChange={toggleLocation}
      />
      <ToggleItem
        icon={<Share2 className="w-5 h-5" />}
        label="Sharing"
        description="File and screen sharing"
        enabled={sharing}
        onChange={toggleSharing}
      />
    </div>
  )
}
