import React, { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Rnd } from 'react-rnd';
import { Minus, Square, X, ExternalLink, Mail, Github, Linkedin, Monitor, Eye, FileText, Instagram, Twitter, Link } from 'lucide-react';
import { useDesktopStore } from '@/store/desktopStore';
import { cn } from '@/lib/utils';
import filesData from '@/data/files.json';
import Cal, { getCalApi } from "@calcom/embed-react";
import { getIconComponent } from '@/utils/apps';
import { SubstackFeed } from '@/components/apps/SubstackFeed';
import { GamesApp } from '@/components/apps/GamesApp';


interface WindowProps {
  id: string;
  title: string;
  icon: string;
  isMinimized: boolean;
  isMaximized: boolean;
  x: number;
  y: number;
  width: number;
  height: number;
  zIndex: number;
  content: string;
  data?: any;
}

export const Window = (props: WindowProps) => {
  const {
    id,
    title,
    isMinimized,
    isMaximized,
    x,
    y,
    width,
    height,
    zIndex,
    content,
    data,
  } = props;

  const {
    closeWindow,
    minimizeWindow,
    maximizeWindow,
    setActiveWindow,
    updateWindowPosition,
    updateWindowSize,
    settings
  } = useDesktopStore();

  const rndRef = useRef<Rnd>(null);

  // Handle maximizing logic
  useEffect(() => {
    if (isMaximized && rndRef.current) {
      // Account for taskbar at bottom (approx 7rem = 112px including spacing)
      const taskbarHeight = 112;
      rndRef.current.updateSize({
        width: window.innerWidth,
        height: window.innerHeight - taskbarHeight
      });
      rndRef.current.updatePosition({ x: 0, y: 0 });
    }
  }, [isMaximized]);

  const getBorderColor = () => {
    switch (settings.themeColor) {
      case 'blue': return 'border-blue-400/50';
      case 'purple': return 'border-purple-400/50';
      case 'green': return 'border-green-400/50';
      case 'orange': return 'border-orange-400/50';
      case 'red': return 'border-red-400/50';
      case 'zinc': return 'border-zinc-400/50';
      default: return 'border-zinc-800';
    }
  };

  if (isMinimized) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        transition={{ duration: 0.2, ease: "easeOut" }}
        style={{
          position: 'absolute',
          zIndex,
          // Important: allows clicking anywhere on the window to focus it
          pointerEvents: 'none'
        }}
        className="absolute top-0 left-0"
      >
        <Rnd
          ref={rndRef}
          default={{
            x,
            y,
            width,
            height,
          }}
          minWidth={350}
          minHeight={250}
          bounds="window"
          dragHandleClassName="window-drag-handle"
          enableUserSelectHack={false}
          cancel=".no-drag"
          style={{ pointerEvents: 'auto' }}
          onDragStart={() => setActiveWindow(id)}
          onDragStop={(e, d) => {
            updateWindowPosition(id, d.x, d.y);
          }}
          onResizeStart={() => setActiveWindow(id)}
          onResizeStop={(e, direction, ref, delta, position) => {
            updateWindowSize(id, parseInt(ref.style.width), parseInt(ref.style.height));
            updateWindowPosition(id, position.x, position.y);
          }}
          onMouseDown={() => setActiveWindow(id)}
          disableDragging={isMaximized}
          enableResizing={!isMaximized}
        >
          {/* Main Window Container */}
          <div className={cn(
            "rounded-lg overflow-hidden h-full flex flex-col shadow-2xl w-full border transition-colors",
            getBorderColor(),
            settings.darkMode ? "bg-zinc-950" : "bg-white"
          )}>

            {/* Title Bar */}
            <div
              className={cn(
                "window-drag-handle border-b px-4 h-10 flex items-center justify-between select-none cursor-default transition-colors",
                getBorderColor(),
                settings.darkMode ? "bg-zinc-900" : "bg-zinc-50"
              )}
            >
              {/* Title */}
              <div className="flex items-center gap-3">
                <span className={cn(
                  "text-sm font-semibold tracking-wide uppercase",
                  settings.darkMode ? "text-zinc-200" : "text-zinc-700"
                )}>
                  {title}
                </span>
              </div>

              {/* Window Controls (Traffic Lights) */}
              <div className="flex items-center gap-2 no-drag">
                <button
                  onClick={(e) => { e.stopPropagation(); minimizeWindow(id); }}
                  className="group w-3.5 h-3.5 rounded-full bg-yellow-500 flex items-center justify-center hover:bg-yellow-400 transition-colors"
                  aria-label="Minimize"
                >
                  <Minus className="w-2 h-2 text-black opacity-0 group-hover:opacity-100 transition-opacity" />
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); maximizeWindow(id); }}
                  className="group w-3.5 h-3.5 rounded-full bg-green-500 flex items-center justify-center hover:bg-green-400 transition-colors"
                  aria-label="Maximize"
                >
                  <Square className="w-2 h-2 text-black opacity-0 group-hover:opacity-100 transition-opacity" />
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); closeWindow(id); }}
                  className="group w-3.5 h-3.5 rounded-full bg-red-500 flex items-center justify-center hover:bg-red-400 transition-colors"
                  aria-label="Close"
                >
                  <X className="w-2 h-2 text-black opacity-0 group-hover:opacity-100 transition-opacity" />
                </button>
              </div>
            </div>

            {/* Content Area - Scrollable */}
            <div className={cn(
              "flex-1 overflow-auto custom-scrollbar",
              settings.darkMode ? "bg-zinc-950" : "bg-white"
            )}>
              <div className={cn(
                "h-full",
                settings.darkMode ? "text-zinc-200" : "text-zinc-800"
              )}>
                {content === 'portfolio' && <div className="p-6"><PortfolioContent /></div>}
                {content === 'resume' && <div className="p-6"><ResumeContent /></div>}
                {content === 'projects' && <div className="p-6"><ProjectsContent /></div>}
                {content === 'vscode' && <div className="p-6"><VSCodeContent /></div>}
                {content === 'about' && <div className="p-6"><AboutContent /></div>}
                {content === 'spotify' && <div className="p-6 h-full"><SpotifyContent /></div>}
                {content === 'settings' && <div className="p-6"><SettingsContent /></div>}
                {content === 'documents' && <div className="p-6"><DocumentsContent /></div>}
                {content === 'terminal' && <TerminalContent />}
                {content === 'calendar' && <div className="h-full"><CalendarContent /></div>}
                {content === 'substack' && <div className="p-6"><SubstackFeed /></div>}
                {content === 'games' && <GamesApp />}
                {content === 'file-preview' && <FilePreviewContent file={data} />}
              </div>
            </div>
          </div>
        </Rnd>
      </motion.div>
    </AnimatePresence>
  );
};

/* -------------------------------------------------------------------------- */
/* Content Components                                                         */
/* -------------------------------------------------------------------------- */

const PortfolioContent = () => (
  <div className="space-y-8 max-w-4xl mx-auto">
    <header className="border-b border-zinc-800 pb-6">
      <h2 className="text-4xl font-bold text-white tracking-tighter mb-2">
        Selected Work
      </h2>
      <p className="text-zinc-400 text-lg">
        A collection of digital experiences and engineering.
      </p>
    </header>

    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {[1, 2, 3, 4].map((i) => (
        <div
          key={i}
          className="group border border-zinc-800 bg-zinc-950 hover:bg-zinc-900 transition-colors duration-200 cursor-pointer p-1"
        >
          <div className="w-full h-48 bg-zinc-900 flex items-center justify-center border-b border-zinc-800 mb-4 overflow-hidden">
            <div className="text-zinc-700 group-hover:text-white transition-colors duration-300">
              [ Project Image Placeholder ]
            </div>
          </div>
          <div className="px-4 pb-4">
            <h3 className="text-xl font-bold text-white mb-1 group-hover:underline decoration-zinc-500 underline-offset-4">
              Project Name {i}
            </h3>
            <p className="text-sm text-zinc-400 mb-3">
              Frontend Architecture • UI/UX
            </p>
            <div className="text-zinc-500 text-sm line-clamp-2">
              A monochrome exploration of digital interfaces designed to focus purely on structure and typography.
            </div>
          </div>
        </div>
      ))}
    </div>
  </div>
);
const ResumeContent = () => (
  <div className="space-y-8 max-w-3xl mx-auto font-mono">
    {/* HEADER */}
    <header className="flex justify-between items-end border-b border-zinc-800 pb-6">
      <div>
        <h2 className="text-3xl font-bold text-white mb-1">Hardik Gupta</h2>
        <p className="text-zinc-400">
          Learner • Builder • Full Stack Developer
        </p>
        <p className="text-zinc-500 text-sm mt-1">
          Jaipur, Rajasthan, India • strykerinside.vercel.app • hardikgupta8792@gmail.com
        </p>
      </div>

      <button
        onClick={() =>
          window.open(
            "https://drive.google.com/file/d/16rDrv9O35qYxHeUxuSXyWWDpOUJH0aQZ/view?usp=drive_link",
            "_blank",
            "noopener,noreferrer"
          )
        }
        className="px-4 py-1 bg-white  text-black font-bold text-sm hover:bg-zinc-200 transition-colors flex items-center gap-2"
      >
        Download PDF <ExternalLink size={14} />
      </button>

    </header>

    {/* EXPERIENCE */}
    <section className="space-y-6">
      <h3 className="text-xl font-bold text-white uppercase tracking-widest border-b border-zinc-800 pb-2 w-max">
        Experience
      </h3>
      {/* NuviBrainz */}
      <div className="relative border-l border-zinc-800 pl-6 ml-2">
        <div className="absolute -left-1.5 top-1.5 w-3 h-3 bg-zinc-600 rounded-full border-4 border-black"></div>

        <div className="flex justify-between items-start mb-2">
          <h4 className="text-lg font-bold text-white">Building — NuviBrainz</h4>
          <span className="text-sm text-zinc-500 bg-zinc-900 px-2 py-1">
            Aug 2024 — Present
          </span>
        </div>

        <p
          className=" text-blue-300 text-sm mb-2   hover:text-blue-500 transition-colors cursor-pointer"
          onClick={() =>
            window.open("https://nuvibrainz.in", "_blank", "noopener,noreferrer")
          }
        >
          nuvibrainz.in
        </p>

        <ul className="list-disc list-inside text-zinc-400 text-sm space-y-1">
          <li>Built an AI-powered JEE exam prep platform with smart revision tools.</li>
          <li>Includes focus tracking, AI-generated questions, progress tracking, and chatbots.</li>
        </ul>
      </div>
      <div className="space-y-6">
        {/* Linkit */}
        <div className="relative border-l border-zinc-800 pl-6 ml-2">
          <div className="absolute -left-1.5 top-1.5 w-3 h-3 bg-white rounded-full border-4 border-black"></div>

          <div className="flex justify-between items-start mb-2">
            <h4 className="text-lg font-bold text-white">Full Stack Developer — Linkit</h4>
            <span className="text-sm text-zinc-500 bg-zinc-900 px-2 py-1">
              June 2025 — Present
            </span>
          </div>

          <p
            className=" text-blue-300 text-sm mb-2   hover:text-blue-500 transition-colors cursor-pointer"
            onClick={() =>
              window.open("https://Linkitapp.in", "_blank", "noopener,noreferrer")
            }
          >
            Linkitapp.in
          </p>

          <ul className="list-disc list-inside text-zinc-400 text-sm space-y-1">
            <li>AI-powered link manager with smart suggestions.</li>
            <li>Built personal AI chatbot and customizable collections.</li>
            <li>Product gained 100+ users in the first 15 days.</li>
          </ul>
        </div>

        {/* NextRound AI */}
        <div className="relative border-l border-zinc-800 pl-6 ml-2">
          <div className="absolute -left-1.5 top-1.5 w-3 h-3 bg-white rounded-full border-4 border-black"></div>

          <div className="flex justify-between items-start mb-2">
            <h4 className="text-lg font-bold text-white">Web Developer — NextRound AI</h4>
            <span className="text-sm text-zinc-500 bg-zinc-900 px-2 py-1">
              June 2025 — Present
            </span>
          </div>

          <p
            className=" text-blue-300 text-sm mb-2   hover:text-blue-500 transition-colors cursor-pointer"
            onClick={() =>
              window.open("https://nextround.tech/", "_blank", "noopener,noreferrer")
            }
          >
            nextround.tech
          </p>

          <ul className="list-disc list-inside text-zinc-400 text-sm space-y-1">
            <li>Building  an AI-powered Chrome extension for interview prep.</li>
            <li>Implemented smart summaries, insights, and personalized suggestions.</li>
          </ul>
        </div>

        {/* AstroNuvi */}
        <div className="relative border-l border-zinc-800 pl-6 ml-2">
          <div className="absolute -left-1.5 top-1.5 w-3 h-3 bg-white rounded-full border-4 border-black"></div>

          <div className="flex justify-between items-start mb-2">
            <h4 className="text-lg font-bold text-white">Full Stack Developer — AstroNuvi</h4>
            <span className="text-sm text-zinc-500 bg-zinc-900 px-2 py-1">
              Aug 2025 — Present
            </span>
          </div>

          <p
            className=" text-blue-300 text-sm mb-2   hover:text-blue-500 transition-colors cursor-pointer"
            onClick={() =>
              window.open("https://astronuvi.nuviverse.space", "_blank", "noopener,noreferrer")
            }
          >
            astronuvi.nuviverse.space
          </p>


          <ul className="list-disc list-inside text-zinc-400 text-sm space-y-1">
            <li>Built RatnAI model–powered astrology platform.</li>
            <li>Serves 1,200+ users and generated 1,000+ kundlis.</li>
            <li>Working with a 13-member team on product innovation.</li>
          </ul>
        </div>

        {/* Freelancing */}
        <div className="relative border-l border-zinc-800 pl-6 ml-2">
          <div className="absolute -left-1.5 top-1.5 w-3 h-3 bg-zinc-600 rounded-full border-4 border-black"></div>

          <div className="flex justify-between items-start mb-2">
            <h4 className="text-lg font-bold text-white">Freelance — Full Stack Developer</h4>
            <span className="text-sm text-zinc-500 bg-zinc-900 px-2 py-1">
              June 2025 — Present
            </span>
          </div>

          <p
            className=" text-blue-300 text-sm mb-2 text-blue-200 hover:text-blue-500 transition-colors cursor-pointer"
            onClick={() =>
              window.open("https://socivo.vercel.app", "_blank", "noopener,noreferrer")
            }
          >
            socivo.vercel.app
          </p>

          <ul className="list-disc list-inside text-zinc-400 text-sm space-y-1">
            <li>Working with a London-based marketing agency (Socivo).</li>
          </ul>
        </div>

        {/* FED KIIT */}
        <div className="relative border-l border-zinc-800 pl-6 ml-2">
          <div className="absolute -left-1.5 top-1.5 w-3 h-3 bg-zinc-600 rounded-full border-4 border-black"></div>

          <div className="flex justify-between items-start mb-2">
            <h4 className="text-lg font-bold text-white">Senior Technical Executive — FED KIIT</h4>
            <span className="text-sm text-zinc-500 bg-zinc-900 px-2 py-1">
              Nov 2024 — Present
            </span>
          </div>

          <p
            className=" text-blue-300 text-sm mb-2   hover:text-blue-500 transition-colors cursor-pointer"
            onClick={() =>
              window.open("https://fedkiit.com", "_blank", "noopener,noreferrer")
            }
          >
            fedkiit.com
          </p>

          <ul className="list-disc list-inside text-zinc-400 text-sm space-y-1">
            <li>Supporting technical events and managing web operations.</li>
          </ul>
        </div>

        {/* GeeksForGeeks KIIT */}
        <div className="relative border-l border-zinc-800 pl-6 ml-2">
          <div className="absolute -left-1.5 top-1.5 w-3 h-3 bg-zinc-600 rounded-full border-4 border-black"></div>

          <div className="flex justify-between items-start mb-2">
            <h4 className="text-lg font-bold text-white">Web Developer — GeeksForGeeks KIIT</h4>
            <span className="text-sm text-zinc-500 bg-zinc-900 px-2 py-1">
              Aug 2024 — Present
            </span>
          </div>

          <p
            className=" text-blue-300 text-sm mb-2   hover:text-blue-500 transition-colors cursor-pointer"
            onClick={() =>
              window.open("https://gfgkiit.in", "_blank", "noopener,noreferrer")
            }
          >
            gfgkiit.in
          </p>

          <ul className="list-disc list-inside text-zinc-400 text-sm space-y-1">
            <li>Managing website operations and support for technical events.</li>
          </ul>
        </div>


      </div>
    </section>

    {/* TECH STACK */}
    <section className="space-y-4">
      <h3 className="text-xl font-bold text-white uppercase tracking-widest border-b border-zinc-800 pb-2 w-max">
        Tech Stack
      </h3>

      <div className="flex flex-wrap gap-2">
        {[
          "ReactJS",
          "Tailwind CSS",
          "NodeJS",
          "ExpressJS",
          "Git",
          "GitHub",
          "Vercel",
          "C",
          "HTML",
          "CSS",
          "JavaScript",
          "Firebase",
          "TypeScript",
          "PostHog",
          "Render",
          "Docker",
          "Redis",
        ].map((skill) => (
          <span
            key={skill}
            className="px-3 py-1 border border-zinc-700 text-zinc-300 text-sm hover:bg-white hover:text-black transition-colors cursor-default"
          >
            {skill}
          </span>
        ))}
      </div>
    </section>

    {/* EDUCATION */}
    <section className="space-y-4">
      <h3 className="text-xl font-bold text-white uppercase tracking-widest border-b border-zinc-800 pb-2 w-max">
        Education
      </h3>

      <div className="text-zinc-300 text-sm space-y-1">
        <p className="font-bold text-white">Kalinga Institute of Industrial Technology</p>
        <p>CSE — AI/ML</p>
        <p>2024 – 2028</p>
      </div>
    </section>
  </div>
);

const ProjectsContent = () => {
  const { settings } = useDesktopStore();
  const USERNAME = "hardikguptaofficialgit";
  const API_URL = `https://api.github.com/users/${USERNAME}/repos?per_page=100`;

  const [repos, setRepos] = React.useState<any[]>([]);
  const [filteredRepos, setFilteredRepos] = React.useState<any[]>([]);
  const [mode, setMode] = React.useState<'top' | 'latest' | 'pushed' | 'all'>('top');
  const [searchQuery, setSearchQuery] = React.useState('');
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState('');

  // Dynamic Icons
  const GithubIcon = getIconComponent('Github', settings.iconStyle);
  const ExternalLinkIcon = getIconComponent('ExternalLink', settings.iconStyle);

  // Theme Colors
  const themeMap: Record<string, any> = {
    blue: { text: 'text-blue-500', bg: 'bg-blue-600', border: 'border-blue-500', ring: 'focus:ring-blue-500/50' },
    purple: { text: 'text-purple-500', bg: 'bg-purple-600', border: 'border-purple-500', ring: 'focus:ring-purple-500/50' },
    green: { text: 'text-green-500', bg: 'bg-green-600', border: 'border-green-500', ring: 'focus:ring-green-500/50' },
    orange: { text: 'text-orange-500', bg: 'bg-orange-600', border: 'border-orange-500', ring: 'focus:ring-orange-500/50' },
    red: { text: 'text-red-500', bg: 'bg-red-600', border: 'border-red-500', ring: 'focus:ring-red-500/50' },
    zinc: { text: 'text-zinc-500', bg: 'bg-zinc-600', border: 'border-zinc-500', ring: 'focus:ring-zinc-500/50' },
  };
  const theme = themeMap[settings.themeColor] || themeMap.blue;

  React.useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const reposRes = await fetch(API_URL);
        if (!reposRes.ok) throw new Error(`GitHub API error ${reposRes.status}`);
        const reposData = await reposRes.json();
        setRepos(Array.isArray(reposData) ? reposData : []);
        setLoading(false);
      } catch (err: any) {
        setError(err.message || 'Failed to load repositories');
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  React.useEffect(() => {
    let list = [...repos];
    if (mode === 'top') {
      list.sort((a, b) => b.stargazers_count - a.stargazers_count);
    } else if (mode === 'latest') {
      list.sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());
    } else if (mode === 'pushed') {
      list.sort((a, b) => new Date(b.pushed_at).getTime() - new Date(a.pushed_at).getTime());
    }

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      list = list.filter(r =>
        (r.name && r.name.toLowerCase().includes(q)) ||
        (r.description && r.description.toLowerCase().includes(q))
      );
    }

    if (mode === 'top') list = list.slice(0, 20);
    setFilteredRepos(list);
  }, [repos, mode, searchQuery]);

  const formatDate = (iso: string) => {
    return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className={cn(
        "flex-shrink-0 p-6 border-b",
        settings.darkMode ? "border-zinc-800" : "border-zinc-200"
      )}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className={cn(
              "text-2xl font-bold tracking-tight",
              settings.darkMode ? "text-white" : "text-zinc-900"
            )}>
              Open Source
            </h2>
            <p className={cn(
              "text-sm",
              settings.darkMode ? "text-zinc-400" : "text-zinc-500"
            )}>
              {filteredRepos.length} repositories found
            </p>
          </div>

          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={cn(
                "px-3 py-1.5 text-sm rounded-lg border focus:outline-none focus:ring-2",
                theme.ring,
                settings.darkMode
                  ? "bg-zinc-900 border-zinc-800 text-white placeholder-zinc-600"
                  : "bg-white border-zinc-200 text-zinc-900 placeholder-zinc-400"
              )}
            />
          </div>
        </div>

        <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
          {[
            { id: 'top', label: 'Top Rated' },
            { id: 'latest', label: 'Latest' },
            { id: 'pushed', label: 'Recently Pushed' },
            { id: 'all', label: 'All Repos' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setMode(tab.id as any)}
              className={cn(
                "px-3 py-1.5 text-xs font-medium rounded-full transition-colors whitespace-nowrap",
                mode === tab.id
                  ? cn(theme.bg, "text-white")
                  : settings.darkMode
                    ? "bg-zinc-800 text-zinc-400 hover:bg-zinc-700"
                    : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className={cn("w-6 h-6 border-2 border-t-transparent rounded-full animate-spin", theme.border)} />
          </div>
        ) : error ? (
          <div className="text-red-500 text-center p-4">{error}</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredRepos.map((repo) => (
              <a
                key={repo.id}
                href={repo.html_url}
                target="_blank"
                rel="noopener noreferrer"
                className={cn(
                  "group p-4 rounded-xl border flex flex-col h-full",
                  settings.darkMode
                    ? "bg-zinc-900/50 border-zinc-800"
                    : "bg-white border-zinc-200"
                )}
              >
                <div className="flex items-start justify-between mb-2">
                  <h3 className={cn(
                    "font-semibold truncate pr-4 transition-colors",
                    theme.text
                  )}>
                    {repo.name}
                  </h3>
                  <div className={cn(
                    "flex items-center gap-1 text-xs px-2 py-1 rounded-full",
                    settings.darkMode ? "bg-zinc-800 text-zinc-400" : "bg-zinc-100 text-zinc-600"
                  )}>
                    <span>★</span>
                    {repo.stargazers_count}
                  </div>
                </div>

                <p className={cn(
                  "text-sm line-clamp-2 flex-1 mb-4",
                  settings.darkMode ? "text-zinc-400" : "text-zinc-600"
                )}>
                  {repo.description || "No description available"}
                </p>

                <div className="flex items-center justify-between text-xs text-zinc-500">
                  <div className="flex items-center gap-2">
                    {repo.language && (
                      <span className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-yellow-500" />
                        {repo.language}
                      </span>
                    )}
                  </div>
                  <span>{formatDate(repo.updated_at)}</span>
                </div>
              </a>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

const SpotifyContent = () => (
  <div className="h-full flex flex-col items-center justify-center max-w-4xl mx-auto">
    <div className="w-full">
      <iframe
        data-testid="embed-iframe"
        style={{ borderRadius: '12px' }}
        src="https://open.spotify.com/embed/playlist/6sZlw5mscaMbGRpDliDL2b?utm_source=generator&theme=0"
        width="100%"
        height="400"
        frameBorder="0"
        allowFullScreen={true}
        allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
        loading="lazy"
      />
    </div>
  </div>
);

const SettingsContent = () => {
  const { settings, updateSettings } = useDesktopStore();

  const colors = [
    { name: 'blue', class: 'bg-blue-400' },
    { name: 'purple', class: 'bg-purple-400' },
    { name: 'green', class: 'bg-green-400' },
    { name: 'orange', class: 'bg-orange-400' },
    { name: 'red', class: 'bg-red-400' },
    { name: 'zinc', class: 'bg-white' },
  ];

  const iconStyles = [
    { id: 'iconoir', name: 'Iconoir' },
    { id: 'lucide', name: 'Lucide' },
  ];

  return (
    <div className="space-y-8 max-w-3xl mx-auto">
      <header className={cn(
        "border-b pb-6",
        settings.darkMode ? "border-zinc-800" : "border-zinc-200"
      )}>
        <h2 className={cn(
          "text-3xl font-bold tracking-tighter mb-2",
          settings.darkMode ? "text-white" : "text-zinc-900"
        )}>
          Settings
        </h2>
        <p className={cn(
          "text-lg",
          settings.darkMode ? "text-zinc-400" : "text-zinc-500"
        )}>
          Personalize your workspace
        </p>
      </header>

      <section className="space-y-6">
        <h3 className={cn(
          "text-xl font-bold uppercase tracking-widest border-b pb-2",
          settings.darkMode ? "text-white border-zinc-800" : "text-zinc-900 border-zinc-200"
        )}>
          Appearance
        </h3>

        {/* Theme Color */}
        <div className="space-y-3">
          <label className={cn(
            "text-sm font-semibold",
            settings.darkMode ? "text-zinc-300" : "text-zinc-600"
          )}>Accent Color</label>
          <div className="flex flex-wrap gap-3">
            {colors.map((color) => (
              <button
                key={color.name}
                onClick={() => updateSettings({ themeColor: color.name })}
                className={cn(
                  `w-12 h-12 rounded-full ${color.class} transition-all duration-200 flex items-center justify-center`,
                  settings.themeColor === color.name
                    ? 'ring-4 ring-white/20 scale-110'
                    : 'hover:scale-105 opacity-80 hover:opacity-100'
                )}
              >
                {settings.themeColor === color.name && (
                  <div className="w-4 h-4 bg-white rounded-full shadow-sm" />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Icon Style */}
        <div className="space-y-3">
          <label className={cn(
            "text-sm font-semibold",
            settings.darkMode ? "text-zinc-300" : "text-zinc-600"
          )}>Icon Style</label>
          <div className="grid grid-cols-2 gap-3">
            {iconStyles.map((style) => (
              <button
                key={style.id}
                onClick={() => updateSettings({ iconStyle: style.id as any })}
                className={cn(
                  "px-4 py-3 rounded-xl border transition-all duration-200 text-sm font-medium",
                  settings.iconStyle === style.id
                    ? settings.darkMode
                      ? "bg-white text-black border-white"
                      : "bg-zinc-900 text-white border-zinc-900"
                    : settings.darkMode
                      ? "bg-zinc-900 text-zinc-400 border-zinc-800 hover:border-zinc-700 hover:bg-zinc-800"
                      : "bg-white text-zinc-600 border-zinc-200 hover:border-zinc-300 hover:bg-zinc-50"
                )}
              >
                {style.name}
              </button>
            ))}
          </div>
        </div>

        {/* Dark Mode */}
        <div className={cn(
          "flex items-center justify-between p-4 border rounded-xl",
          settings.darkMode ? "border-zinc-800 bg-zinc-900/50" : "border-zinc-200 bg-white"
        )}>
          <div className="flex items-center gap-4">

            <div>
              <h4 className={cn(
                "text-sm font-semibold",
                settings.darkMode ? "text-white" : "text-zinc-900"
              )}>Dark Mode</h4>
              <p className={cn(
                "text-xs mt-0.5",
                settings.darkMode ? "text-zinc-500" : "text-zinc-500"
              )}>Adjust interface brightness</p>
            </div>
          </div>
          <button
            onClick={() => updateSettings({ darkMode: !settings.darkMode })}
            className={cn(
              "relative w-12 h-6 rounded-full transition-colors",
              settings.darkMode ? "bg-blue-600" : "bg-zinc-300"
            )}
          >
            <motion.div
              animate={{ x: settings.darkMode ? 24 : 2 }}
              transition={{ type: 'spring', stiffness: 500, damping: 30 }}
              className="absolute top-1 w-4 h-4 bg-white rounded-full shadow-lg"
            />
          </button>
        </div>
      </section>

      <section className="space-y-4">
        <h3 className={cn(
          "text-xl font-bold uppercase tracking-widest border-b pb-2",
          settings.darkMode ? "text-white border-zinc-800" : "text-zinc-900 border-zinc-200"
        )}>
          System
        </h3>
        <div className={cn(
          "p-4 border rounded-xl",
          settings.darkMode ? "border-zinc-800 bg-zinc-900/50" : "border-zinc-200 bg-white"
        )}>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-zinc-500">Version</span>
              <span className={cn(
                "font-mono",
                settings.darkMode ? "text-white" : "text-zinc-900"
              )}>0.0.1</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-500">Build</span>
              <span className={cn(
                "font-mono",
                settings.darkMode ? "text-white" : "text-zinc-900"
              )}>2025.11.25</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-500">Engine</span>
              <span className={cn(
                "font-mono",
                settings.darkMode ? "text-white" : "text-zinc-900"
              )}>Purely React & Tailwind</span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

const AboutContent = () => {
  const { settings } = useDesktopStore();

  const contactLinks = [
    {
      name: 'GitHub',
      iconName: 'Github',
      url: 'https://github.com/hardikguptaofficialgit',
      description: 'Check out my code'
    },
    {
      name: 'LinkedIn',
      iconName: 'Linkedin',
      url: 'https://www.linkedin.com/in/hardik-gupta-b528072b3/',
      description: 'Connect professionally'
    },
    {
      name: 'Instagram',
      iconName: 'Instagram',
      url: 'https://www.instagram.com/stryker.inside/',
      description: 'Personal updates'
    },
    {
      name: 'Twitter',
      iconName: 'Twitter',
      url: 'https://x.com/stryker_inside',
      description: 'Thoughts & threads'
    },
    {
      name: 'Linkit',
      iconName: 'Link',
      url: 'https://Linkitapp.in/harvix',
      description: 'All my links'
    }
  ];

  const MailIcon = getIconComponent('Mail', settings.iconStyle);

  // Theme Colors
  const themeMap: Record<string, any> = {
    blue: { text: 'text-blue-500', bg: 'bg-blue-500', border: 'border-blue-500', hoverText: 'hover:text-blue-500' },
    purple: { text: 'text-purple-500', bg: 'bg-purple-500', border: 'border-purple-500', hoverText: 'hover:text-purple-500' },
    green: { text: 'text-green-500', bg: 'bg-green-500', border: 'border-green-500', hoverText: 'hover:text-green-500' },
    orange: { text: 'text-orange-500', bg: 'bg-orange-500', border: 'border-orange-500', hoverText: 'hover:text-orange-500' },
    red: { text: 'text-red-500', bg: 'bg-red-500', border: 'border-red-500', hoverText: 'hover:text-red-500' },
    zinc: { text: 'text-zinc-500', bg: 'bg-zinc-500', border: 'border-zinc-500', hoverText: 'hover:text-zinc-500' },
  };
  const theme = themeMap[settings.themeColor] || themeMap.blue;

  return (
    <div className="h-full flex flex-col max-w-4xl mx-auto">
      <div className={cn(
        "flex-shrink-0 p-8 text-center border-b",
        settings.darkMode ? "border-zinc-800" : "border-zinc-200"
      )}>
        <h2 className={cn(
          "text-3xl font-bold mb-2",
          settings.darkMode ? "text-white" : "text-zinc-900"
        )}>
          Get in Touch
        </h2>
        <p className={cn(
          "text-lg",
          settings.darkMode ? "text-zinc-400" : "text-zinc-500"
        )}>
          I'm always open to new opportunities and collaborations.
        </p>
        <a
          href="mailto:hardikgupta8792@gmail.com"
          className={cn(
            "inline-block mt-4 px-6 py-2 rounded-full text-sm font-medium transition-colors",
            settings.darkMode
              ? "bg-white text-black hover:bg-zinc-200"
              : "bg-black text-white hover:bg-zinc-800"
          )}
        >
          hardikgupta8792@gmail.com
        </a>
      </div>

      <div className="flex-1 overflow-y-auto p-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {contactLinks.map((link) => {
            const Icon = getIconComponent(link.iconName, settings.iconStyle);
            return (
              <a
                key={link.name}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-center gap-4 py-2 transition-all duration-200"
              >
                <div className={cn(
                  "transition-colors",
                  theme.text,
                  "group-hover:text-white"
                )}>
                  <Icon className="w-6 h-6" />
                </div>
                <div>
                  <h3 className={cn(
                    "font-semibold transition-colors",
                    settings.darkMode ? "text-white" : "text-zinc-900",
                    theme.hoverText
                  )}>
                    {link.name}
                  </h3>
                  <p className={cn(
                    "text-sm",
                    settings.darkMode ? "text-zinc-400" : "text-zinc-500"
                  )}>
                    {link.description}
                  </p>
                </div>
                <ExternalLink className={cn(
                  "w-4 h-4 ml-auto opacity-0 group-hover:opacity-50 transition-all",
                  settings.darkMode ? "text-zinc-400" : "text-zinc-600",
                  theme.hoverText
                )} />
              </a>
            );
          })}
        </div>
      </div>
    </div>
  );
};

const DocumentsContent = () => {
  const { openWindow } = useDesktopStore();

  const handleFileClick = (file: any) => {
    openWindow({
      title: file.name,
      icon: 'FileText',
      width: 800,
      height: 600,
      x: 100,
      y: 100,
      content: 'file-preview',
      data: file
    });
  };

  const handleResumeClick = () => {
    openWindow({
      title: 'Resume',
      icon: 'FileText',
      width: 900,
      height: 700,
      x: 150,
      y: 50,
      content: 'resume',
    });
  };

  return (
    <div className="h-full">
      <header className="border-b border-zinc-800 pb-6 mb-6">
        <h2 className="text-3xl font-bold text-white tracking-tighter mb-2">
          Documents
        </h2>
        <p className="text-zinc-400 text-lg">
          Browse your files
        </p>
      </header>

      {/* Resume PDF Container */}
      <div
        onClick={handleResumeClick}
        className="mb-6 p-6 border-2 border-zinc-800 rounded-xl bg-gradient-to-br from-zinc-900 to-zinc-950 cursor-pointer group"
      >
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 flex items-center justify-center rounded-lg">
            <FileText className="w-8 h-8 text-red-400" />
          </div>
          <div className="flex-1">
            <h3 className="text-xl font-bold text-white transition-colors">
              Hardik_Gupta_Resume_2025.pdf
            </h3>
            <p className="text-sm text-zinc-500 mt-1">
              Click to view resume • 156 KB
            </p>
          </div>
          <div className="opacity-0  transition-opacity">
            <ExternalLink className="w-5 h-5 text-blue-400" />
          </div>
        </div>
      </div>

      {/* Other Files Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {filesData.files.map((file, index) => (
          <div
            key={index}
            onClick={() => handleFileClick(file)}
            className="group flex flex-col items-center gap-3 p-4 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
          >
            <div className="w-16 h-16 flex items-center justify-center bg-zinc-800 rounded-lg group-hover:bg-zinc-700 transition-colors overflow-hidden relative">
              {file.type === 'image' ? (
                <img
                  src={file.url}
                  alt={file.name}
                  className="w-full h-full object-cover"
                />
              ) : file.type === 'pdf' ? (
                <FileText className="w-8 h-8 text-red-400" />
              ) : (
                <FileText className="w-8 h-8 text-zinc-400" />
              )}
            </div>
            <span className="text-sm text-zinc-300 text-center break-all group-hover:text-white">
              {file.name}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

const FilePreviewContent = ({ file }: { file: any }) => {
  if (!file) return <div className="text-white p-4">No file selected</div>;

  return (
    <div className="h-full flex flex-col">
      <div className="flex-1 overflow-hidden flex items-center justify-center bg-zinc-900 relative">
        {file.type === 'pdf' ? (
          <iframe
            src={file.url}
            className="w-full h-full bg-white border-none"
            title={file.name}
          />
        ) : file.type === 'image' ? (
          <img
            src={file.url}
            alt={file.name}
            className="max-w-full max-h-full object-contain"
          />
        ) : (
          <div className="text-center">
            <FileText className="w-16 h-16 text-zinc-500 mx-auto mb-4" />
            <p className="text-zinc-400">Preview not available for this file type.</p>
          </div>
        )}
      </div>
      <div className="h-12 border-t border-zinc-800 flex items-center justify-between px-4 bg-zinc-950 flex-shrink-0">
        <span className="text-sm text-zinc-400">{file.name}</span>
        <div className="flex items-center gap-4">
          <span className="text-xs text-zinc-500">{file.size}</span>
          <a
            href={file.url}
            download
            className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1"
          >
            Download <ExternalLink size={10} />
          </a>
        </div>
      </div>
    </div>
  );
};

const TerminalContent = () => {
  const [messages, setMessages] = React.useState<
    Array<{ role: 'user' | 'assistant' | 'system'; content: string }>
  >([
    {
      role: 'system',
      content: `You are Hardik — an AI persona representing Hardik Gupta.

Identity:
Hardik Gupta
Learner • Builder • Full Stack Developer
Jaipur, Rajasthan, India
strykerinside.vercel.app
hardikgupta8792@gmail.com

Background:
You have founded and built multiple AI-powered products and platforms across education, productivity, and consumer apps.

Experience (Condensed):
• Building — NuviBrainz (AI-driven JEE prep ecosystem with revision intelligence, analytics, and generative tools)
• Full Stack Developer — Linkit (AI-powered link manager; shipped fast and reached 100+ users in 15 days)
• Web Developer — NextRound AI (interview-prep Chrome extension with summaries and insights)
• Full Stack Developer — AstroNuvi (RatnAI-powered astrology platform serving 1,200+ users)
• Freelance Developer — Socivo (London-based marketing agency)
• Senior Technical Executive — FED KIIT
• Web Developer — GeeksForGeeks KIIT

Technical Expertise:
ReactJS, Tailwind CSS, NodeJS, ExpressJS, Firebase, TypeScript, Git, Docker, Redis,
Vercel, Render, PostHog, C, HTML, CSS, JavaScript.

Education:
KIIT University — CSE (AI/ML) — 2024–2028

You speak, think, and respond as Hardik — with the technical depth, product background, and engineering experience he possesses.`
    }
  ]);

  const [input, setInput] = React.useState('');
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState('');
  const messagesEndRef = React.useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  React.useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    setError('');

    // Add user message to chat
    const newMessages = [...messages, { role: 'user' as const, content: userMessage }];
    setMessages(newMessages);
    setIsLoading(true);

    try {
      // Import the GitHub Models SDK dynamically
      const ModelClient = (await import('@azure-rest/ai-inference')).default;
      const { AzureKeyCredential } = await import('@azure/core-auth');
      const { isUnexpected } = await import('@azure-rest/ai-inference');

      const token = import.meta.env.VITE_GITHUB_TOKEN;
      if (!token) {
        throw new Error('GITHUB_TOKEN not found in environment variables');
      }

      const endpoint = "https://models.github.ai/inference";
      const model = "openai/gpt-4o-mini";

      const client = ModelClient(endpoint, new AzureKeyCredential(token));

      const response = await client.path("/chat/completions").post({
        body: {
          messages: newMessages.map(m => ({ role: m.role, content: m.content })),
          temperature: 1,
          top_p: 1,
          model: model
        }
      });

      if (isUnexpected(response)) {
        throw new Error(response.body?.error?.message || 'API request failed');
      }

      const assistantMessage = response.body.choices[0].message.content;
      setMessages([...newMessages, { role: 'assistant', content: assistantMessage }]);
    } catch (err: any) {
      setError(err.message || 'Failed to get response from AI');
      console.error('Chat error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="h-full flex flex-col bg-black text-green-400 font-mono">
      {/* Terminal Header */}
      <div className="px-4 py-2 bg-zinc-900 border-b border-zinc-800 flex items-center gap-2">
        <div className="w-3 h-3 rounded-full bg-red-500"></div>
        <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
        <div className="w-3 h-3 rounded-full bg-green-500"></div>
        <span className="ml-4 text-zinc-400 text-sm">Talk with My AI Clone ( or email me :) )</span>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
        {messages.filter(m => m.role !== 'system').map((message, index) => (
          <div key={index} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[80%] rounded-lg p-3 ${message.role === 'user'
              ? 'bg-blue-600 text-white'
              : 'bg-zinc-900 text-green-400 border border-zinc-800'
              }`}>
              <div className="text-xs opacity-70 mb-1">
                {message.role === 'user' ? '$ user' : '> assistant'}
              </div>
              <div className="whitespace-pre-wrap break-words">{message.content}</div>
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-zinc-900 text-green-400 border border-zinc-800 rounded-lg p-3">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse delay-75"></div>
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse delay-150"></div>
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="bg-red-900/20 border border-red-500 text-red-400 rounded-lg p-3">
            <div className="text-xs opacity-70 mb-1">! error</div>
            <div>{error}</div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="border-t border-zinc-800 bg-zinc-950 p-4">
        <div className="flex items-center gap-2">
          <span className="text-green-400">$</span>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type your message..."
            disabled={isLoading}
            className="flex-1 bg-transparent border-none outline-none text-green-400 placeholder-zinc-600 disabled:opacity-50"
          />
          <button
            onClick={sendMessage}
            disabled={isLoading || !input.trim()}
            className="px-4 py-2 bg-green-600 hover:bg-green-500 disabled:bg-zinc-800 disabled:text-zinc-600 text-black font-semibold rounded transition-colors"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
};

const CalendarContent = () => {
  useEffect(() => {
    (async function () {
      const cal = await getCalApi({ namespace: "30min" });
      cal("ui", { hideEventTypeDetails: false, layout: "month_view" });
    })();
  }, []);

  return (
    <Cal
      namespace="30min"
      calLink="hardik-stryker/30min"
      style={{ width: "100%", height: "100%", overflow: "scroll" }}
      config={{ layout: "month_view" }}
    />
  );
};

const VSCodeContent = () => {
  const { settings } = useDesktopStore();
  const GithubIcon = getIconComponent('Github', settings.iconStyle);
  const ExternalLinkIcon = getIconComponent('ExternalLink', settings.iconStyle);

  // Theme Colors
  const themeMap: Record<string, any> = {
    blue: { text: 'text-blue-500', bg: 'bg-blue-500', border: 'border-blue-500', hoverText: 'hover:text-blue-500', hoverBg: 'hover:bg-blue-500' },
    purple: { text: 'text-purple-500', bg: 'bg-purple-500', border: 'border-purple-500', hoverText: 'hover:text-purple-500', hoverBg: 'hover:bg-purple-500' },
    green: { text: 'text-green-500', bg: 'bg-green-500', border: 'border-green-500', hoverText: 'hover:text-green-500', hoverBg: 'hover:bg-green-500' },
    orange: { text: 'text-orange-500', bg: 'bg-orange-500', border: 'border-orange-500', hoverText: 'hover:text-orange-500', hoverBg: 'hover:bg-orange-500' },
    red: { text: 'text-red-500', bg: 'bg-red-500', border: 'border-red-500', hoverText: 'hover:text-red-500', hoverBg: 'hover:bg-red-500' },
    zinc: { text: 'text-zinc-500', bg: 'bg-zinc-500', border: 'border-zinc-500', hoverText: 'hover:text-zinc-500', hoverBg: 'hover:bg-zinc-500' },
  };
  const theme = themeMap[settings.themeColor] || themeMap.blue;
  const projects = [
    {
      id: 1,
      name: "NuviBrainz",
      description:
        "AI-driven JEE prep ecosystem with revision intelligence, analytics, and generative tools.",
      tech: [
        "ReactJS",
        "Tailwind CSS",
        "NodeJS",
        "ExpressJS",
        "Firebase",
        "TypeScript",
        "PostHog",
        "Git",
        "GitHub",
        "Vercel"
      ],
      liveUrl: "https://nuvibrainz.in",
      githubUrl: "#"
    },
    {
      id: 2,
      name: "Linkit",
      description:
        "AI-powered link manager with smart suggestions and personal AI chatbot.",
      tech: [
        "ReactJS",
        "Tailwind CSS",
        "TypeScript",
        "NodeJS",
        "ExpressJS",
        "Firebase",
        "Git",
        "GitHub",
        "Vercel"
      ],
      liveUrl: "https://Linkitapp.in",
      githubUrl: "#"
    },
    {
      id: 3,
      name: "AstroNuvi",
      description:
        "RatnAI-powered astrology platform serving 1,200+ users with AI predictions.",
      tech: [
        "ReactJS",
        "Tailwind CSS",
        "NodeJS",
        "ExpressJS",
        "MongoDB",
        "Git",
        "GitHub",
        "Render",
        "TypeScript"
      ],
      liveUrl: "https://astronuvi.nuviverse.space",
      githubUrl: "#"
    },
    {
      id: 4,
      name: "NextRound AI",
      description:
        "Interview-prep Chrome extension with smart summaries and insights.",
      tech: [
        "JavaScript",
        "TypeScript",
        "ReactJS",
        "Tailwind CSS",
        "Git",
        "GitHub",
        "Vercel"
      ],
      liveUrl: "https://nextround.tech",
      githubUrl:
        "https://github.com/hardikguptaofficialgit/nextround"
    },
    {
      id: 5,
      name: "Socivo Platform",
      description:
        "Freelancing and marketing platform for a London-based agency with analytics.",
      tech: [
        "Next.js",
        "TypeScript",
        "Tailwind CSS",
        "PostgreSQL",
        "Git",
        "GitHub",
        "Vercel",
        "Render"
      ],
      liveUrl: "https://socivo.vercel.app",
      githubUrl: "#"
    },
    {
      id: 6,
      name: "StrykerOS",
      description:
        "Windows 11-inspired portfolio website with a full desktop environment.",
      tech: [
        "ReactJS",
        "TypeScript",
        "Tailwind CSS",
        "Framer Motion",
        "Git",
        "GitHub",
        "Vercel"
      ],
      liveUrl: "https://strykerinside.vercel.app/",
      githubUrl:
        "https://github.com/hardikguptaofficialgit/portfolioone"
    }
  ];


  return (
    <div className="h-full flex flex-col">
      <div className={cn(
        "flex-shrink-0 p-6 border-b",
        settings.darkMode ? "border-zinc-800" : "border-zinc-200"
      )}>
        <h2 className={cn(
          "text-2xl font-bold tracking-tight mb-1",
          settings.darkMode ? "text-white" : "text-zinc-900"
        )}>
          Projects
        </h2>
        <p
          className={cn(
            "text-sm",
            settings.darkMode ? "text-zinc-400" : "text-zinc-500"
          )}
        >
          Selected works and experiments. some project github links are not shared as they are commercial projects.
        </p>

      </div>

      <div className="flex-1 overflow-y-auto p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {projects.map((project) => (
            <div
              key={project.id}
              className={cn(
                "group rounded-xl border flex flex-col overflow-hidden",
                settings.darkMode
                  ? "bg-zinc-900/50 border-zinc-800"
                  : "bg-white border-zinc-200"
              )}
            >
              {/* Live Preview */}
              <div className={cn(
                "w-full h-48 border-b relative transition-opacity overflow-hidden",
                settings.darkMode ? "bg-zinc-800 border-zinc-800" : "bg-zinc-100 border-zinc-200"
              )}>
                <iframe
                  src={project.liveUrl}
                  title={project.name}
                  className="w-[200%] h-[200%] origin-top-left scale-50 border-none pointer-events-none"
                  loading="lazy"
                  tabIndex={-1}
                />
              </div>

              <div className="p-5 flex flex-col flex-1">
                <div className="flex items-start justify-between mb-3">
                  <h3 className={cn(
                    "font-bold text-lg transition-colors",
                    settings.darkMode ? "text-white" : "text-zinc-900",
                    theme.hoverText
                  )}>
                    {project.name}
                  </h3>
                  <div className="flex gap-2">
                    <a
                      href={project.githubUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={cn(
                        "p-1.5 rounded-lg transition-colors",
                        settings.darkMode ? "hover:bg-zinc-800 text-zinc-400" : "hover:bg-zinc-100 text-zinc-500",
                        theme.hoverText
                      )}
                    >
                      <GithubIcon size={16} />
                    </a>
                    <a
                      href={project.liveUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={cn(
                        "p-1.5 rounded-lg transition-colors",
                        settings.darkMode ? "hover:bg-zinc-800 text-zinc-400" : "hover:bg-zinc-100 text-zinc-500",
                        theme.hoverText
                      )}
                    >
                      <ExternalLinkIcon size={16} />
                    </a>
                  </div>
                </div>

                <p className={cn(
                  "text-sm mb-4 flex-1",
                  settings.darkMode ? "text-zinc-400" : "text-zinc-600"
                )}>
                  {project.description}
                </p>

                <div className="flex flex-wrap gap-2">
                  {project.tech.map((tech) => (
                    <span
                      key={tech}
                      className={cn(
                        "px-2 py-1 text-xs font-medium rounded-md",
                        settings.darkMode
                          ? "bg-zinc-800 text-zinc-300"
                          : "bg-zinc-100 text-zinc-600"
                      )}
                    >
                      {tech}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};