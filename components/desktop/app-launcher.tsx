"use client"

import { useState, useMemo } from "react"
import { DEFAULT_APPS } from "@/lib/apps"
import { useDesktopStore } from "@/lib/store"
import { Search, X } from "lucide-react"

interface AppLauncherProps {
  onClose: () => void
}

export function AppLauncher({ onClose }: AppLauncherProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const { createWindow } = useDesktopStore()

  const filteredApps = useMemo(() => {
    return DEFAULT_APPS.filter((app) => app.name.toLowerCase().includes(searchQuery.toLowerCase()))
  }, [searchQuery])

  const handleAppClick = (app: (typeof DEFAULT_APPS)[0]) => {
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
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-end animate-in fade-in duration-300">
      <div className="w-full bg-black/50 backdrop-blur-xl border-t border-white/10 rounded-t-2xl max-h-[70vh] flex flex-col animate-in slide-in-from-bottom duration-300">
        <div className="p-6 border-b border-white/10">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
            <input
              type="text"
              placeholder="Search apps..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              autoFocus
              className="w-full bg-white/5 border border-white/10 rounded-lg pl-12 pr-4 py-3 text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all duration-200"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 scrollbar-hide">
          <div className="grid grid-cols-4 gap-4 md:grid-cols-6 lg:grid-cols-8">
            {filteredApps.map((app, idx) => (
              <button
                key={app.id}
                onClick={() => handleAppClick(app)}
                className="flex flex-col items-center gap-2 p-4 rounded-lg hover:bg-white/10 transition-all duration-200 group hover:scale-110 hover:-translate-y-1 animate-in fade-in duration-200"
                style={{
                  animationDelay: `${idx * 30}ms`,
                }}
              >
                <div
                  className={`w-12 h-12 rounded-lg bg-gradient-to-br ${app.color} flex items-center justify-center text-2xl group-hover:scale-110 transition-all duration-200 shadow-lg group-hover:shadow-xl`}
                >
                  {app.icon}
                </div>
                <span className="text-xs text-white/70 text-center truncate w-full group-hover:text-white transition-colors">
                  {app.name}
                </span>
              </button>
            ))}
          </div>
          {filteredApps.length === 0 && (
            <div className="flex items-center justify-center h-32 text-white/50 animate-in fade-in duration-300">
              No apps found
            </div>
          )}
        </div>

        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 hover:bg-white/10 rounded-lg transition-all duration-200 hover:scale-110 hover:rotate-90"
        >
          <X className="w-6 h-6 text-white/70 hover:text-white transition-colors" />
        </button>
      </div>
    </div>
  )
}
