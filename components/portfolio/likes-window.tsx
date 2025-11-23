"use client"

import { Heart } from "lucide-react"

const LIKED_ITEMS = [
  { id: 1, title: "Minimalist Design", category: "Design" },
  { id: 2, title: "Clean Code Architecture", category: "Development" },
  { id: 3, title: "Accessibility First", category: "Philosophy" },
  { id: 4, title: "Smooth Animations", category: "UX" },
  { id: 5, title: "Dark Mode Interfaces", category: "Design" },
  { id: 6, title: "Open Source Contribution", category: "Community" },
  { id: 7, title: "Component Reusability", category: "Development" },
  { id: 8, title: "User Research", category: "Design" },
]

export function LikesWindow() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-white">Things I Like</h1>

      <div className="grid grid-cols-2 gap-3">
        {LIKED_ITEMS.map((item) => (
          <div
            key={item.id}
            className="bg-white/5 border border-white/10 rounded-lg p-3 hover:border-pink-500/30 hover:bg-pink-500/5 transition-all group"
          >
            <div className="flex items-start gap-2">
              <Heart className="w-4 h-4 text-pink-400 mt-0.5 flex-shrink-0 group-hover:fill-pink-400 transition-all" />
              <div>
                <p className="text-sm font-medium text-white">{item.title}</p>
                <p className="text-xs text-white/50">{item.category}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
