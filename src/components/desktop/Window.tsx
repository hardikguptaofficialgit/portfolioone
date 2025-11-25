import React, { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Rnd } from 'react-rnd';
import { Minus, Square, X, ExternalLink, Mail, Github, Linkedin, Monitor, Eye, FileText } from 'lucide-react';
import { useDesktopStore } from '@/store/desktopStore';
import { cn } from '@/lib/utils';
import filesData from '@/data/files.json';

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
                {content === 'about' && <div className="p-6"><AboutContent /></div>}
                {content === 'spotify' && <div className="p-6 h-full"><SpotifyContent /></div>}
                {content === 'settings' && <div className="p-6"><SettingsContent /></div>}
                {content === 'documents' && <div className="p-6"><DocumentsContent /></div>}
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
          Jaipur, Rajasthan, India • harvix.tech • hardikgupta8792@gmail.com
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
          <h4 className="text-lg font-bold text-white">Founder & CTO — NuviBrainz</h4>
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
        {/* LinkIT */}
        <div className="relative border-l border-zinc-800 pl-6 ml-2">
          <div className="absolute -left-1.5 top-1.5 w-3 h-3 bg-white rounded-full border-4 border-black"></div>

          <div className="flex justify-between items-start mb-2">
            <h4 className="text-lg font-bold text-white">Full Stack Developer — LinkIT</h4>
            <span className="text-sm text-zinc-500 bg-zinc-900 px-2 py-1">
              June 2025 — Present
            </span>
          </div>

          <p
            className=" text-blue-300 text-sm mb-2   hover:text-blue-500 transition-colors cursor-pointer"
            onClick={() =>
              window.open("https://linkitapp.in", "_blank", "noopener,noreferrer")
            }
          >
            linkitapp.in
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
              window.open("https://nextround.tech", "_blank", "noopener,noreferrer")
            }
          >
            nextround.tech
          </p>

          <ul className="list-disc list-inside text-zinc-400 text-sm space-y-1">
            <li>Building an AI-powered Chrome extension for interview prep.</li>
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
  const USERNAME = "hardikguptaofficialgit";
  const API_URL = `https://api.github.com/users/${USERNAME}/repos?per_page=100`;

  const [repos, setRepos] = React.useState<any[]>([]);
  const [filteredRepos, setFilteredRepos] = React.useState<any[]>([]);
  const [mode, setMode] = React.useState<'top' | 'latest' | 'pushed' | 'all'>('top');
  const [searchQuery, setSearchQuery] = React.useState('');
  const [minStars, setMinStars] = React.useState(0);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState('');
  const [userInfo, setUserInfo] = React.useState<any>(null);

  React.useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [reposRes, userRes] = await Promise.all([
          fetch(API_URL),
          fetch(`https://api.github.com/users/${USERNAME}`)
        ]);

        if (!reposRes.ok) throw new Error(`GitHub API error ${reposRes.status}`);

        const reposData = await reposRes.json();
        const userData = await userRes.json();

        setRepos(Array.isArray(reposData) ? reposData : []);
        setUserInfo(userData);
        setLoading(false);
      } catch (err: any) {
        setError(err.message || 'Failed to load repositories');
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  React.useEffect(() => {
    applyFilters();
  }, [repos, mode, searchQuery, minStars]);

  const applyFilters = () => {
    let list = [...repos];

    // Sort by mode
    if (mode === 'top') {
      list.sort((a, b) => b.stargazers_count - a.stargazers_count || new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());
    } else if (mode === 'latest') {
      list.sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());
    } else if (mode === 'pushed') {
      list.sort((a, b) => new Date(b.pushed_at).getTime() - new Date(a.pushed_at).getTime());
    }

    // Apply filters
    list = list.filter(r => {
      if (r.stargazers_count < minStars) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        return (r.name && r.name.toLowerCase().includes(q)) ||
          (r.description && r.description.toLowerCase().includes(q)) ||
          (r.language && r.language.toLowerCase().includes(q));
      }
      return true;
    });

    // Limit top repos
    if (mode === 'top') list = list.slice(0, 20);

    setFilteredRepos(list);
  };

  const formatDate = (iso: string) => {
    return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-zinc-400">Loading repositories...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-red-400">Error: {error}</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Profile Section */}
      <div className="border border-zinc-800 bg-zinc-950 p-6 rounded-lg">
        <div className="flex items-start gap-6">
          <img
            src={`https://github.com/${USERNAME}.png`}
            alt="avatar"
            className="w-24 h-24 rounded-lg border border-zinc-800"
          />
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-1">
              <h2 className="text-2xl font-bold text-white">{userInfo?.name || USERNAME}</h2>
              <a
                href={`https://github.com/${USERNAME}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-8 h-8 flex items-center justify-center border border-zinc-800 rounded-lg hover:border-zinc-600 hover:bg-zinc-900 transition-all group"
                title="View GitHub Profile"
              >
                <Github className="w-4 h-4 text-zinc-400 group-hover:text-white transition-colors" />
              </a>
              <a
                href={`https://github.com/${USERNAME}?tab=followers`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold rounded-lg transition-all flex items-center gap-2 border border-blue-500 hover:border-blue-400"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                Follow Me
              </a>
            </div>
            <p className="text-zinc-400 mb-4">{userInfo?.bio || 'GitHub profile'}</p>

            {/* Contributions Graph */}
            <div className="mt-4">
              <h3 className="text-sm font-semibold text-zinc-400 mb-2">Contributions</h3>
              <img
                src={`https://ghchart.rshah.org/38bdf8/${USERNAME}`}
                alt="contributions graph"
                className="w-full rounded-lg border border-zinc-800 bg-black p-2"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src = `https://github-readme-stats.vercel.app/api?username=${USERNAME}&show_icons=true&theme=dark&hide_border=true&bg_color=000000&title_color=ffffff&text_color=9aa4b2&icon_color=38bdf8`;
                }}
              />
              <p className="text-xs text-zinc-600 mt-2">
                GitHub contribution activity
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Repositories Section */}
      <div className="border border-zinc-800 bg-zinc-950 p-6 rounded-lg">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-bold text-white">Repositories</h2>
            <p className="text-sm text-zinc-500">{repos.length} public repos — showing {filteredRepos.length}</p>
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Filter by name or language"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="px-3 py-1.5 bg-black border border-zinc-800 rounded text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-zinc-600"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="px-2 py-1.5 bg-black border border-zinc-800 rounded text-white hover:bg-zinc-900"
              >
                ×
              </button>
            )}
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-2 mb-4 flex-wrap">
          <button
            onClick={() => setMode('top')}
            className={`px-3 py-1.5 text-sm border rounded transition-colors ${mode === 'top'
              ? 'border-blue-500 bg-blue-500/10 text-white'
              : 'border-zinc-800 text-zinc-400 hover:border-zinc-600'
              }`}
          >
            Top (stars)
          </button>
          <button
            onClick={() => setMode('latest')}
            className={`px-3 py-1.5 text-sm border rounded transition-colors ${mode === 'latest'
              ? 'border-blue-500 bg-blue-500/10 text-white'
              : 'border-zinc-800 text-zinc-400 hover:border-zinc-600'
              }`}
          >
            Latest (updated)
          </button>
          <button
            onClick={() => setMode('pushed')}
            className={`px-3 py-1.5 text-sm border rounded transition-colors ${mode === 'pushed'
              ? 'border-blue-500 bg-blue-500/10 text-white'
              : 'border-zinc-800 text-zinc-400 hover:border-zinc-600'
              }`}
          >
            Most recently pushed
          </button>
          <button
            onClick={() => setMode('all')}
            className={`px-3 py-1.5 text-sm border rounded transition-colors ${mode === 'all'
              ? 'border-blue-500 bg-blue-500/10 text-white'
              : 'border-zinc-800 text-zinc-400 hover:border-zinc-600'
              }`}
          >
            All
          </button>

          <div className="ml-auto flex items-center gap-2">
            <label className="text-xs text-zinc-500">Min stars</label>
            <input
              type="number"
              min="0"
              value={minStars}
              onChange={(e) => setMinStars(parseInt(e.target.value) || 0)}
              className="w-20 px-2 py-1.5 bg-black border border-zinc-800 rounded text-sm text-white focus:outline-none focus:border-zinc-600"
            />
          </div>
        </div>

        {/* Repository List */}
        <div className="space-y-3 max-h-[500px] overflow-y-auto custom-scrollbar">
          {filteredRepos.length === 0 ? (
            <div className="text-center text-zinc-500 py-8">No repositories match the filters.</div>
          ) : (
            filteredRepos.map((repo) => (
              <div
                key={repo.id}
                className="p-4 border border-zinc-800 bg-black rounded-lg hover:border-zinc-600 transition-colors"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <a
                      href={repo.html_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-400 hover:text-blue-300 font-semibold text-base"
                    >
                      {repo.name}
                    </a>
                    <p className="text-sm text-zinc-400 mt-1">
                      {repo.description || <span className="text-zinc-600">No description</span>}
                    </p>
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    <span className="px-2 py-1 text-xs border border-zinc-800 rounded text-zinc-400">
                      ★ {repo.stargazers_count}
                    </span>
                    <span className="px-2 py-1 text-xs border border-zinc-800 rounded text-zinc-400">
                      {repo.forks_count} forks
                    </span>
                    {repo.language && (
                      <span className="px-2 py-1 text-xs border border-zinc-800 rounded text-zinc-400">
                        {repo.language}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex gap-4 mt-3 text-xs text-zinc-600">
                  <span>Updated: {formatDate(repo.updated_at)}</span>
                  <span>Created: {formatDate(repo.created_at)}</span>
                  <span>Pushed: {formatDate(repo.pushed_at)}</span>
                  <span className="ml-auto">Size: {repo.size} KB</span>
                </div>
              </div>
            ))
          )}
        </div>
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
            <div className={cn(
              "w-10 h-10 rounded-lg flex items-center justify-center",
              settings.darkMode ? "bg-zinc-800" : "bg-zinc-100"
            )}>
              <Monitor className={cn(
                "w-5 h-5",
                settings.darkMode ? "text-zinc-400" : "text-zinc-600"
              )} />
            </div>
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
              )}>2.0.0 (Theme Engine)</span>
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
              )}>React + Tailwind</span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

const AboutContent = () => (
  <div className="h-full flex flex-col items-center justify-center text-center max-w-2xl mx-auto py-12">
    <div className="w-32 h-32 bg-zinc-900 rounded-full border-2 border-white mb-8 flex items-center justify-center">
      <span className="text-4xl">👋</span>
    </div>

    <h2 className="text-4xl font-bold text-white mb-6">Hello, I'm [Your Name]</h2>

    <p className="text-zinc-400 text-lg leading-relaxed mb-10">
      I am a software engineer passionate about minimalism and performance.
      I build tools that help people work better and faster. This site is a playground
      where I experiment with web technologies and interface design.
    </p>

    <div className="grid grid-cols-3 gap-4 w-full max-w-md">
      <a href="#" className="flex flex-col items-center gap-2 p-4 border border-zinc-800 hover:bg-white hover:text-black transition-all">
        <Mail size={24} />
        <span className="text-sm font-bold">Email</span>
      </a>
      <a href="#" className="flex flex-col items-center gap-2 p-4 border border-zinc-800 hover:bg-white hover:text-black transition-all">
        <Github size={24} />
        <span className="text-sm font-bold">GitHub</span>
      </a>
      <a href="#" className="flex flex-col items-center gap-2 p-4 border border-zinc-800 hover:bg-white hover:text-black transition-all">
        <Linkedin size={24} />
        <span className="text-sm font-bold">LinkedIn</span>
      </a>
    </div>
  </div>
);

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