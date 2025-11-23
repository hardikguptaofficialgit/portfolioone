"use client"

export function ResumeWindow() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-white">Resume</h1>

      <div className="space-y-6">
        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-white border-b border-white/20 pb-2">Professional Summary</h2>
          <p className="text-white/80 text-sm leading-relaxed">
            Experienced designer and developer with 6+ years of expertise in creating elegant, performant web and mobile
            applications. Proven track record of leading design systems, mentoring teams, and delivering products used
            by millions.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-white border-b border-white/20 pb-2">Technical Proficiencies</h2>
          <div className="grid grid-cols-2 gap-2 text-sm text-white/80">
            <div>
              <p className="font-medium text-white mb-1">Frontend</p>
              <p>React, Next.js, TypeScript</p>
            </div>
            <div>
              <p className="font-medium text-white mb-1">Design</p>
              <p>Figma, UI/UX, Design Systems</p>
            </div>
            <div>
              <p className="font-medium text-white mb-1">Styling</p>
              <p>Tailwind CSS, CSS-in-JS</p>
            </div>
            <div>
              <p className="font-medium text-white mb-1">Backend</p>
              <p>Node.js, PostgreSQL, APIs</p>
            </div>
          </div>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-white border-b border-white/20 pb-2">Education</h2>
          <div className="space-y-2">
            <div>
              <p className="font-medium text-white">Bachelor of Science in Computer Science</p>
              <p className="text-sm text-white/60">University of Technology - 2018</p>
            </div>
          </div>
        </section>

        <button className="w-full py-2 bg-blue-500/20 border border-blue-500/50 rounded-lg text-blue-300 hover:bg-blue-500/30 transition-colors text-sm font-medium">
          Download Full Resume (PDF)
        </button>
      </div>
    </div>
  )
}
