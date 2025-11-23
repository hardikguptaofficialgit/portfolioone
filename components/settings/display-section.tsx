"use client"

import { useSettingsStore } from "@/lib/settings"
import { Volume2, Sun } from "lucide-react"

export function DisplaySection() {
  const { brightness, volume, setBrightness, setVolume } = useSettingsStore()

  return (
    <div className="space-y-4 p-3">
      <h3 className="text-sm font-semibold text-white/70">DISPLAY & AUDIO</h3>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-white/70">
            <Sun className="w-4 h-4" />
            <span className="text-sm">Brightness</span>
          </div>
          <span className="text-sm text-white">{brightness}%</span>
        </div>
        <input
          type="range"
          min="0"
          max="100"
          value={brightness}
          onChange={(e) => setBrightness(Number(e.target.value))}
          className="w-full h-1 bg-white/10 rounded-full appearance-none cursor-pointer accent-blue-500"
        />
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-white/70">
            <Volume2 className="w-4 h-4" />
            <span className="text-sm">Volume</span>
          </div>
          <span className="text-sm text-white">{volume}%</span>
        </div>
        <input
          type="range"
          min="0"
          max="100"
          value={volume}
          onChange={(e) => setVolume(Number(e.target.value))}
          className="w-full h-1 bg-white/10 rounded-full appearance-none cursor-pointer accent-blue-500"
        />
      </div>
    </div>
  )
}
