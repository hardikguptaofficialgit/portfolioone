"use client"

import type React from "react"
import { useRef, useState, useEffect } from "react"
import { useDesktopStore } from "@/lib/store"
import type { Window as WindowType } from "@/lib/types"
import { X, Minus, Square } from "lucide-react"

interface DraggableWindowProps {
  window: WindowType
  children: React.ReactNode
}

export function DraggableWindow({ window, children }: DraggableWindowProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
  const [isResizing, setIsResizing] = useState(false)
  const [resizeStart, setResizeStart] = useState({ x: 0, y: 0, width: 0, height: 0 })

  const { updateWindow, closeWindow, minimizeWindow, maximizeWindow, bringToFront } = useDesktopStore()

  const handleMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest("[data-no-drag]")) return

    setIsDragging(true)
    bringToFront(window.id)
    setDragOffset({
      x: e.clientX - window.x,
      y: e.clientY - window.y,
    })
  }

  const handleResizeStart = (e: React.MouseEvent) => {
    e.preventDefault()
    setIsResizing(true)
    setResizeStart({
      x: e.clientX,
      y: e.clientY,
      width: window.width,
      height: window.height,
    })
  }

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        updateWindow(window.id, {
          x: e.clientX - dragOffset.x,
          y: e.clientY - dragOffset.y,
        })
      }

      if (isResizing) {
        const newWidth = Math.max(300, resizeStart.width + (e.clientX - resizeStart.x))
        const newHeight = Math.max(200, resizeStart.height + (e.clientY - resizeStart.y))
        updateWindow(window.id, {
          width: newWidth,
          height: newHeight,
        })
      }
    }

    const handleMouseUp = () => {
      setIsDragging(false)
      setIsResizing(false)
    }

    if (isDragging || isResizing) {
      document.addEventListener("mousemove", handleMouseMove)
      document.addEventListener("mouseup", handleMouseUp)
      return () => {
        document.removeEventListener("mousemove", handleMouseMove)
        document.removeEventListener("mouseup", handleMouseUp)
      }
    }
  }, [isDragging, isResizing, dragOffset, resizeStart, window.id, updateWindow])

  if (window.isMinimized) return null

  return (
    <div
      ref={containerRef}
      className="fixed bg-black/30 backdrop-blur-md border border-white/10 rounded-lg shadow-2xl overflow-hidden transition-all duration-200 hover:shadow-blue-500/20 hover:shadow-2xl animate-in fade-in slide-in-from-bottom-2"
      style={{
        left: `${window.x}px`,
        top: `${window.y}px`,
        width: `${window.width}px`,
        height: `${window.height}px`,
        zIndex: window.zIndex,
      }}
      onClick={() => bringToFront(window.id)}
    >
      <div
        className="bg-gradient-to-r from-white/5 to-white/10 border-b border-white/10 px-4 py-3 flex items-center justify-between cursor-move select-none hover:from-white/8 hover:to-white/12 transition-all duration-200"
        onMouseDown={handleMouseDown}
      >
        <span className="text-sm font-medium text-white/90">{window.title}</span>
        <div className="flex items-center gap-2" data-no-drag>
          <button
            onClick={() => minimizeWindow(window.id)}
            className="hover:bg-white/10 p-1 rounded transition-all duration-150 hover:scale-110"
            title="Minimize"
          >
            <Minus size={16} className="text-white/70 hover:text-white transition-colors" />
          </button>
          <button
            onClick={() => maximizeWindow(window.id)}
            className="hover:bg-white/10 p-1 rounded transition-all duration-150 hover:scale-110"
            title="Maximize"
          >
            <Square size={16} className="text-white/70 hover:text-white transition-colors" />
          </button>
          <button
            onClick={() => closeWindow(window.id)}
            className="hover:bg-red-500/20 p-1 rounded transition-all duration-150 hover:scale-110 animate-out fade-out slide-out-to-top"
            title="Close"
          >
            <X size={16} className="text-white/70 hover:text-red-400 transition-colors" />
          </button>
        </div>
      </div>

      <div className="h-[calc(100%-40px)] overflow-auto bg-gradient-to-br from-white/5 to-transparent p-4 scrollbar-hide">
        <div className="animate-in fade-in duration-300">{children}</div>
      </div>

      <div
        className="absolute bottom-0 right-0 w-6 h-6 cursor-se-resize bg-gradient-to-tl from-blue-500/20 to-transparent hover:from-blue-500/40 transition-all duration-200 opacity-0 hover:opacity-100"
        onMouseDown={handleResizeStart}
      />
    </div>
  )
}
