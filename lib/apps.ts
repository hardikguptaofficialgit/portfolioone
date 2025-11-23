import type { DesktopApp } from "./types"

export const DEFAULT_APPS: DesktopApp[] = [
  { id: "figma", name: "Figma", icon: "🎨", color: "from-purple-500 to-pink-500" },
  { id: "vscode", name: "VSCode", icon: "💻", color: "from-blue-500 to-cyan-500" },
  { id: "github", name: "GitHub", icon: "🐙", color: "from-gray-700 to-gray-900" },
  { id: "portfolio", name: "Portfolio", icon: "⭐", color: "from-yellow-500 to-orange-500" },
  { id: "resume", name: "Resume", icon: "📄", color: "from-red-500 to-pink-500" },
  { id: "projects", name: "Projects", icon: "📦", color: "from-green-500 to-emerald-500" },
  { id: "settings", name: "Settings", icon: "⚙️", color: "from-gray-500 to-slate-500" },
  { id: "terminal", name: "Terminal", icon: "⌨️", color: "from-black to-gray-800" },
  { id: "chrome", name: "Chrome", icon: "🌐", color: "from-yellow-400 to-red-500" },
  { id: "zoom", name: "Zoom", icon: "📹", color: "from-blue-400 to-blue-600" },
  { id: "slack", name: "Slack", icon: "💬", color: "from-purple-500 to-pink-500" },
  { id: "figma-alt", name: "Design", icon: "✏️", color: "from-indigo-500 to-purple-500" },
]

export const PINNED_APPS = ["figma", "vscode", "github", "portfolio", "settings"]
