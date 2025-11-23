"use client"

import { PORTFOLIO_DATA } from "@/lib/portfolio"

export function ExperienceWindow() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-white">Experience</h1>

      <div className="space-y-4">
        {PORTFOLIO_DATA.experience.map((exp) => (
          <div
            key={exp.id}
            className="bg-white/5 border border-white/10 rounded-lg p-4 hover:border-blue-500/30 transition-colors"
          >
            <div className="flex items-start justify-between mb-2">
              <div>
                <h3 className="font-semibold text-white">{exp.title}</h3>
                <p className="text-sm text-blue-400">{exp.company}</p>
              </div>
              <span className="text-xs text-white/50">{exp.duration}</span>
            </div>

            <p className="text-sm text-white/70 mb-3">{exp.description}</p>

            <div className="flex flex-wrap gap-2">
              {exp.technologies.map((tech) => (
                <span key={tech} className="text-xs px-2 py-1 bg-cyan-500/20 text-cyan-300 rounded">
                  {tech}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
