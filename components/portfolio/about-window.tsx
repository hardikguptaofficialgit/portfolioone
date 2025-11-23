"use client"

import { PORTFOLIO_DATA } from "@/lib/portfolio"

export function AboutWindow() {
  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <h1 className="text-3xl font-bold text-white">{PORTFOLIO_DATA.about.name}</h1>
        <p className="text-blue-400 font-semibold italic">{PORTFOLIO_DATA.about.tagline}</p>
      </div>

      <p className="text-white/80 leading-relaxed">{PORTFOLIO_DATA.about.bio}</p>

      <div className="space-y-3">
        <h3 className="font-semibold text-white">Core Skills</h3>
        <div className="grid grid-cols-2 gap-2">
          {[
            "Product Design",
            "Frontend Development",
            "UI/UX Design",
            "React & TypeScript",
            "Design Systems",
            "Accessibility",
          ].map((skill) => (
            <div
              key={skill}
              className="bg-blue-500/20 border border-blue-500/30 rounded-lg px-3 py-2 text-sm text-blue-300"
            >
              {skill}
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        <h3 className="font-semibold text-white">Connect</h3>
        <div className="grid grid-cols-2 gap-2">
          {PORTFOLIO_DATA.links.map((link) => (
            <a
              key={link.name}
              href={link.url}
              className="flex items-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg px-3 py-2 transition-colors"
            >
              <span>{link.icon}</span>
              <span className="text-sm text-white/80">{link.name}</span>
            </a>
          ))}
        </div>
      </div>
    </div>
  )
}
