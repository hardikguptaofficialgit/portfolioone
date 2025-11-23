"use client"

import { PORTFOLIO_DATA } from "@/lib/portfolio"
import { ExternalLink } from "lucide-react"

export function ProjectsWindow() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-white">Featured Projects</h1>

      <div className="grid gap-4">
        {PORTFOLIO_DATA.projects.map((project) => (
          <a
            key={project.id}
            href={project.link}
            className="group bg-white/5 border border-white/10 rounded-lg p-4 hover:border-blue-500/50 hover:bg-white/10 transition-all"
          >
            <div className="flex items-start justify-between mb-2">
              <div>
                <h3 className="font-semibold text-white group-hover:text-blue-300 transition-colors">
                  {project.title}
                </h3>
                <p className="text-xs text-white/50">{project.year}</p>
              </div>
              <ExternalLink className="w-4 h-4 text-white/30 group-hover:text-blue-400 transition-colors" />
            </div>

            <p className="text-sm text-white/70 mb-3">{project.description}</p>

            <div className="flex flex-wrap gap-2">
              {project.tags.map((tag) => (
                <span key={tag} className="text-xs px-2 py-1 bg-purple-500/20 text-purple-300 rounded">
                  {tag}
                </span>
              ))}
            </div>
          </a>
        ))}
      </div>
    </div>
  )
}
