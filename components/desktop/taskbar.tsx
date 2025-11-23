"use client"

import { useState, useEffect } from "react"
import { useDesktopStore } from "@/lib/store"
import { PINNED_APPS, DEFAULT_APPS } from "@/lib/apps"
import { AppLauncher } from "./app-launcher"
import { Grid3x3, Volume2, Wifi, Battery, Clock } from "lucide-react"

export function Taskbar() {
  const [showLauncher, setShowLauncher] = useState(false)
  const [currentTime, setCurrentTime] = useState(new Date())
  const { windows, createWindow, bringToFront } = useDesktopStore()

  useEffect(() => {
    const interval = setInterval(() => setCurrentTime(new Date()), 1000)
    return () => clearInterval(interval)
  }, [])

  const pinnedAppsList = DEFAULT_APPS.filter((app) => PINNED_APPS.includes(app.id))

  const handlePinnedAppClick = (app: (typeof DEFAULT_APPS)[0]) => {
    const existingWindow = windows.find((w) => w.title === app.name)
    if (existingWindow) {
      bringToFront(existingWindow.id)
    } else {
      createWindow({
        title: app.name,
        type: "app",
        x: Math.random() * 200 + 100,
        y: Math.random() * 200 + 100,
        width: app.defaultWidth || 600,
        height: app.defaultHeight || 400,
        isMinimized: false,
        isMaximized: false,
      })
    }
  }

  return (
    <>
      {showLauncher && <AppLauncher onClose={() => setShowLauncher(false)} />}

      <div className="fixed bottom-0 left-0 right-0 h-16 bg-black/40 backdrop-blur-xl border-t border-white/10 flex items-center px-4 justify-between z-40 animate-in fade-in slide-in-from-bottom duration-500">
        {/* Left section */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowLauncher(!showLauncher)}
            className="p-2 hover:bg-white/10 rounded-lg transition-all duration-200 group hover:scale-110"
            title="Start Menu"
          >
            <Grid3x3 className="w-6 h-6 text-white/70 group-hover:text-white transition-colors" />
          </button>

          <div className="h-12 w-px bg-white/10" />

          <div className="flex items-center gap-2">
            {pinnedAppsList.map((app, idx) => (
              <button
                key={app.id}
                onClick={() => handlePinnedAppClick(app)}
                className="p-2 hover:bg-white/10 rounded-lg transition-all duration-200 group relative hover:scale-110 hover:-translate-y-1"
                style={{
                  animationDelay: `${idx * 50}ms`,
                }}
                title={app.name}
              >
                <div className="text-2xl transition-transform duration-200 group-hover:scale-125">{app.icon}</div>
                <div className="absolute bottom-1 right-1 w-2 h-2 bg-green-400 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
              </button>
            ))}
          </div>
        </div>

        {/* Right section */}
        <div className="flex items-center gap-4 text-white/70 text-sm">
          <div className="flex items-center gap-2 hover:bg-white/10 px-3 py-2 rounded-lg transition-all duration-200 hover:text-white cursor-pointer hover:scale-105">
            <Wifi className="w-4 h-4" />
          </div>
          <div className="flex items-center gap-2 hover:bg-white/10 px-3 py-2 rounded-lg transition-all duration-200 hover:text-white cursor-pointer hover:scale-105">
            <Volume2 className="w-4 h-4" />
          </div>
          <div className="flex items-center gap-2 hover:bg-white/10 px-3 py-2 rounded-lg transition-all duration-200 hover:text-white cursor-pointer hover:scale-105">
            <Battery className="w-4 h-4" />
          </div>
          <div className="flex items-center gap-2 hover:bg-white/10 px-3 py-2 rounded-lg transition-all duration-200 hover:text-white cursor-pointer hover:scale-105">
            <Clock className="w-4 h-4" />
            <span>{currentTime.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
          </div>
        </div>
      </div>
    </>
  )
}
