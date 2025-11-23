"use client"

import { PORTFOLIO_DATA } from "@/lib/portfolio"
import { Star } from "lucide-react"

export function AcknowledgementsWindow() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-white">Acknowledgments</h1>

      <p className="text-white/70 text-sm leading-relaxed">
        This portfolio showcases my work and passion for creating beautiful, functional digital experiences. Thank you
        for visiting!
      </p>

      <div className="space-y-3">
        <h2 className="text-sm font-semibold text-white/80">Built With</h2>
        <div className="space-y-2">
          {PORTFOLIO_DATA.acknowledgments.map((ack, idx) => (
            <div
              key={idx}
              className="flex items-start gap-3 p-3 bg-white/5 rounded-lg hover:bg-white/10 transition-colors"
            >
              <Star className="w-4 h-4 text-yellow-400 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-white/80">{ack}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="border-t border-white/10 pt-4 space-y-2">
        <p className="text-xs text-white/50">Made with care and attention to detail.</p>
        <p className="text-xs text-white/50">© 2025 Portfolio. All rights reserved.</p>
      </div>
    </div>
  )
}
