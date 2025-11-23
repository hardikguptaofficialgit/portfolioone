// Type definitions for the desktop environment

export interface Window {
  id: string
  title: string
  type: "app" | "widget" | "settings"
  x: number
  y: number
  width: number
  height: number
  zIndex: number
  isMinimized: boolean
  isMaximized: boolean
  icon?: string
}

export interface DesktopApp {
  id: string
  name: string
  icon: string
  color?: string
  defaultWidth?: number
  defaultHeight?: number
}

export interface TaskbarItem {
  appId: string
  name: string
  icon: string
  isRunning: boolean
  windowIds: string[]
}
