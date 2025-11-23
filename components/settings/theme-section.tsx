"use client"

import { useSettingsStore } from "@/lib/settings"
import { useDesktopStore } from "@/lib/store"
import { Palette, Moon, Sun } from "lucide-react"

export function ThemeSection() {
  const { theme, accentColor, setTheme, setAccentColor } = useSettingsStore()
  const { toggleDarkMode } = useDesktopStore()

  const accentColors = [
    { name: "blue", value: "bg-blue-500" },
    { name: "cyan", value: "bg-cyan-500" },
    { name: "purple", value: "bg-purple-500" },
    { name: "pink", value: "bg-pink-500" },
    { name: "orange", value: "bg-orange-500" },
    { name: "green", value: "bg-green-500" },
  ]

  return (
    <div className="space-y-4 p-3">
      <h3 className="text-sm font-semibold text-white/70">THEME & APPEARANCE</h3>

      <div className="space-y-2">
        <span className="text-sm text-white">Dark Mode</span>
        <div className="flex gap-2">
          <button
            onClick={() => {
              setTheme("light")
              toggleDarkMode()
            }}
            className={`flex-1 py-2 rounded-lg flex items-center justify-center gap-2 transition-colors ${
              theme === "light"
                ? "bg-blue-500/30 border border-blue-500"
                : "bg-white/5 border border-white/10 hover:bg-white/10"
            }`}
          >
            <Sun className="w-4 h-4" />
            <span className="text-xs">Light</span>
          </button>
          <button
            onClick={() => {
              setTheme("dark")
              toggleDarkMode()
            }}
            className={`flex-1 py-2 rounded-lg flex items-center justify-center gap-2 transition-colors ${
              theme === "dark"
                ? "bg-blue-500/30 border border-blue-500"
                : "bg-white/5 border border-white/10 hover:bg-white/10"
            }`}
          >
            <Moon className="w-4 h-4" />
            <span className="text-xs">Dark</span>
          </button>
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center gap-2 text-white/70">
          <Palette className="w-4 h-4" />
          <span className="text-sm">Accent Color</span>
        </div>
        <div className="grid grid-cols-6 gap-2">
          {accentColors.map((color) => (
            <button
              key={color.name}
              onClick={() => setAccentColor(color.name)}
              className={`w-8 h-8 rounded-lg ${color.value} transition-all ${
                accentColor === color.name ? "ring-2 ring-white scale-110" : "hover:scale-105"
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
