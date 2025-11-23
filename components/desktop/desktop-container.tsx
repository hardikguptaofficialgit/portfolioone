"use client"

import type React from "react"
import { Taskbar } from "./taskbar"

import { useEffect } from "react"
import { useDesktopStore } from "@/lib/store"
import { DraggableWindow } from "./draggable-window"

interface DesktopContainerProps {
  wallpaper?: string
  children: React.ReactNode
}

export function DesktopContainer({ wallpaper, children }: DesktopContainerProps) {
  const { windows, isDarkMode, loadState, saveState } = useDesktopStore()

  useEffect(() => {
    loadState()
    window.addEventListener("beforeunload", saveState)
    return () => window.removeEventListener("beforeunload", saveState)
  }, [loadState, saveState])

  return (
    <div
      className={`w-full h-screen overflow-hidden ${isDarkMode ? "dark" : ""}`}
      style={{
        backgroundImage: wallpaper ? `url(${wallpaper})` : undefined,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      {!wallpaper && <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900" />}

      <div className="relative w-full h-full">
        {/* Render all windows */}
        {windows.map((window) => (
          <DraggableWindow key={window.id} window={window}>
            {children}
          </DraggableWindow>
        ))}
      </div>

      <Taskbar />
    </div>
  )
}
