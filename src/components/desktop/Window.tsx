import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Rnd } from 'react-rnd';
import { Minus, Square, X, ExternalLink, Mail, Github, Linkedin, Monitor, Eye, FileText, Instagram, Twitter, Link } from 'lucide-react';
import { useDesktopStore } from '@/store/desktopStore';
import { cn } from '@/lib/utils';
import filesData from '@/data/files.json';
import Cal, { getCalApi } from "@calcom/embed-react";
import { getIconComponent } from '@/utils/apps';
import { DevToFeed } from '@/components/apps/DevToFeed';
import { BlogApp } from '@/components/apps/BlogApp';
import { useIsMobile } from '@/hooks/use-mobile';
import { usePortfolio } from '@/hooks/usePortfolio';
import { ResumeExperienceSection } from '@/components/portfolio/ResumeExperienceSection';
import type { Project } from '@/content/types';


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

  const isMobile = useIsMobile();
  const [mobileSize, setMobileSize] = useState({ width: 0, height: 0 });

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
  const taskbarHeight = 72;
  const previousBoundsRef = useRef<{ x: number; y: number; width: number; height: number } | null>(null);

  const getDesktopViewport = () => ({
    width: window.innerWidth,
    height: Math.max(250, window.innerHeight - taskbarHeight),
  });

  // Handle maximizing logic
  useEffect(() => {
    if (isMobile) return;

    if (isMaximized) {
      if (!previousBoundsRef.current) {
        previousBoundsRef.current = { x, y, width, height };
      }
      const viewport = getDesktopViewport();
      updateWindowPosition(id, 0, 0);
      updateWindowSize(id, viewport.width, viewport.height);
      return;
    }

    if (previousBoundsRef.current) {
      const prev = previousBoundsRef.current;
      updateWindowPosition(id, prev.x, prev.y);
      updateWindowSize(id, prev.width, prev.height);
      previousBoundsRef.current = null;
    }
  }, [isMaximized, isMobile, id]);

  useEffect(() => {
    if (isMobile || !isMaximized) return;
    const onResize = () => {
      const viewport = getDesktopViewport();
      updateWindowPosition(id, 0, 0);
      updateWindowSize(id, viewport.width, viewport.height);
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [isMobile, isMaximized, id]);

  useEffect(() => {
    if (!isMobile) return;
    const update = () => {
      setMobileSize({
        width: window.innerWidth,
        height: window.innerHeight - taskbarHeight
      });
    };
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, [isMobile]);

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
          size={isMobile && mobileSize.width > 0 ? mobileSize : { width, height }}
          position={isMobile ? { x: 0, y: 0 } : { x, y }}
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
          disableDragging={isMaximized || isMobile}
          enableResizing={!isMaximized && !isMobile}
        >
          {/* Main Window Container */}
          <div className={cn(
            "overflow-hidden h-full flex flex-col shadow-2xl w-full border transition-colors",
            isMaximized ? "rounded-none" : "rounded-lg",
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
              "flex-1 min-h-0 overflow-auto custom-scrollbar",
              settings.darkMode ? "bg-zinc-950" : "bg-white"
            )}>
              <div className={cn(
                "h-full min-h-0",
                settings.darkMode ? "text-zinc-200" : "text-zinc-800"
              )}>
                {content === 'portfolio' && <div className="p-6"><PortfolioContent /></div>}
                {content === 'resume' && <div className="p-6"><ResumeContent /></div>}
                {content === 'projects' && <div className="p-6"><ProjectsContent /></div>}
                {content === 'vscode' && <div className="p-6"><VSCodeContent /></div>}
                {content === 'about' && <div className="p-6"><AboutContent /></div>}
                {content === 'settings' && <div className="p-6"><SettingsContent /></div>}
                {content === 'documents' && <div className="p-6"><DocumentsContent /></div>}
                {content === 'terminal' && <TerminalContent />}
                {content === 'calendar' && <div className="h-full"><CalendarContent /></div>}
                {content === 'devto' && <div className={cn("h-full", isMaximized ? "p-4 md:p-6" : "p-6")}><DevToFeed /></div>}
                {content === 'blog' && <BlogApp />}
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
const ResumeContent = () => {
  const { profile, experience, skillsFlat, education } = usePortfolio();
  const openUrl = (url: string) => window.open(url, '_blank', 'noopener,noreferrer');

  return (
    <div className="space-y-8 max-w-3xl mx-auto font-mono">
      <header className="flex justify-between items-end border-b border-zinc-800 pb-6">
        <div>
          <h2 className="text-3xl font-bold text-white mb-1">{profile.name}</h2>
          <p className="text-zinc-400">{profile.headline}</p>
          <p className="text-zinc-500 text-sm mt-1">
            {profile.location} • {profile.website.replace(/^https?:\/\//, '')} • {profile.email}
          </p>
        </div>

        {profile.resumePdfUrl ? (
          <button
            onClick={() => openUrl(profile.resumePdfUrl!)}
            className="px-4 py-1 bg-white text-black font-bold text-sm hover:bg-zinc-200 transition-colors flex items-center gap-2"
          >
            Download PDF <ExternalLink size={14} />
          </button>
        ) : null}
      </header>

      <ResumeExperienceSection items={experience} onOpenUrl={openUrl} />

      <section className="space-y-4">
        <h3 className="text-xl font-bold text-white uppercase tracking-widest border-b border-zinc-800 pb-2 w-max">
          Tech Stack
        </h3>
        <div className="flex flex-wrap gap-2">
          {skillsFlat.map((skill) => (
            <span
              key={skill}
              className="px-3 py-1 border border-zinc-700 text-zinc-300 text-sm hover:bg-white hover:text-black transition-colors cursor-default"
            >
              {skill}
            </span>
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <h3 className="text-xl font-bold text-white uppercase tracking-widest border-b border-zinc-800 pb-2 w-max">
          Education
        </h3>
        {education.map((edu) => (
          <div key={edu.id} className="text-zinc-300 text-sm space-y-1">
            <p className="font-bold text-white">{edu.institution}</p>
            <p>{edu.degree}</p>
            <p>
              {edu.startYear} – {edu.endYear}
            </p>
          </div>
        ))}
      </section>
    </div>
  );
};

const ProjectsContent = () => {
  const { settings } = useDesktopStore();
  const { profile } = usePortfolio();
  const USERNAME = profile.githubUsername || "hardikguptaofficialgit";
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
    { id: 'doodle', name: 'Doodle Icons' },
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
          <div className="grid grid-cols-3 gap-3">
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
  const { profile, socialLinks, sections } = usePortfolio();
  const aboutIntro = sections.aboutIntro;
  const contactLinks = socialLinks.map((link) => ({
    name: link.name,
    iconName: link.icon,
    url: link.url,
    description: link.description || '',
  }));

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
          {aboutIntro?.title || 'Get in Touch'}
        </h2>
        <p className={cn(
          "text-lg",
          settings.darkMode ? "text-zinc-400" : "text-zinc-500"
        )}>
          {aboutIntro?.subtitle || "I'm always open to new opportunities and collaborations."}
        </p>
        <a
          href={`mailto:${profile.email}`}
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
  const { openWindow, settings } = useDesktopStore();

  const panelBorder = settings.darkMode ? "border-zinc-800" : "border-zinc-200";
  const titleText = settings.darkMode ? "text-white" : "text-zinc-900";
  const bodyText = settings.darkMode ? "text-zinc-400" : "text-zinc-600";
  const subtleText = settings.darkMode ? "text-zinc-500" : "text-zinc-500";
  const cardSurface = settings.darkMode
    ? "border-zinc-800 bg-gradient-to-br from-zinc-900 to-zinc-950"
    : "border-zinc-200 bg-gradient-to-br from-white to-zinc-100";
  const tileHover = settings.darkMode ? "hover:bg-white/10" : "hover:bg-black/5";
  const tileSurface = settings.darkMode ? "bg-zinc-800 group-hover:bg-zinc-700" : "bg-zinc-100 group-hover:bg-zinc-200";

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
    window.location.href = '/simplified';
  };

  return (
    <div className="h-full">
      <header className={cn("border-b pb-6 mb-6", panelBorder)}>
        <h2 className={cn("text-3xl font-bold tracking-tighter mb-2", titleText)}>
          Documents
        </h2>
        <p className={cn("text-lg", bodyText)}>
          Browse your files
        </p>
      </header>

      {/* Resume PDF Container */}
      <div
        onClick={handleResumeClick}
        className={cn("mb-6 p-6 border-2 rounded-xl cursor-pointer group", cardSurface)}
      >
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 flex items-center justify-center rounded-lg">
            <FileText className="w-8 h-8 text-red-400" />
          </div>
          <div className="flex-1">
            <h3 className={cn("text-xl font-bold transition-colors", titleText)}>
              Hardik_Gupta_Simplified_Resume
            </h3>
            <p className={cn("text-sm mt-1", subtleText)}>
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
            className={cn("group flex flex-col items-center gap-3 p-4 rounded-lg transition-colors cursor-pointer", tileHover)}
          >
            <div className={cn("w-16 h-16 flex items-center justify-center rounded-lg transition-colors overflow-hidden relative", tileSurface)}>
              {file.type === 'image' ? (
                <img
                  src={file.url}
                  alt={file.name}
                  className="w-full h-full object-cover"
                />
              ) : file.type === 'pdf' ? (
                <FileText className="w-8 h-8 text-red-400" />
              ) : (
                <FileText className={cn("w-8 h-8", settings.darkMode ? "text-zinc-400" : "text-zinc-600")} />
              )}
            </div>
            <span className={cn("text-sm text-center break-all", settings.darkMode ? "text-zinc-300 group-hover:text-white" : "text-zinc-700 group-hover:text-zinc-950")}>
              {file.name}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

const FilePreviewContent = ({ file }: { file: any }) => {
  const { settings } = useDesktopStore();
  if (!file) return <div className="text-white p-4">No file selected</div>;

  return (
    <div className="h-full flex flex-col">
      <div className={cn("flex-1 overflow-hidden flex items-center justify-center relative", settings.darkMode ? "bg-zinc-900" : "bg-zinc-100")}>
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
            <p className={cn(settings.darkMode ? "text-zinc-400" : "text-zinc-600")}>Preview not available for this file type.</p>
          </div>
        )}
      </div>
      <div className={cn("h-12 border-t flex items-center justify-between px-4 flex-shrink-0", settings.darkMode ? "border-zinc-800 bg-zinc-950" : "border-zinc-200 bg-white")}>
        <span className={cn("text-sm", settings.darkMode ? "text-zinc-400" : "text-zinc-700")}>{file.name}</span>
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
      content: `You are Hardik - an AI persona representing Hardik Gupta.

Identity:
Hardik Gupta
Learner • Builder • Full Stack Developer
Jaipur, Rajasthan, India
strykerinside.vercel.app
hardikgupta8792@gmail.com

Background:
You have founded and built multiple AI-powered products and platforms across education, productivity, and consumer apps.

Experience (Condensed):
• Building - NuviBrainz (AI-driven JEE prep ecosystem with revision intelligence, analytics, and generative tools)
• Full Stack Developer - Linkit (AI-powered link manager; shipped fast and reached 100+ users in 15 days)
• Web Developer - NextRound AI (interview-prep Chrome extension with summaries and insights)
• Full Stack Developer - AstroNuvi (RatnAI-powered astrology platform serving 1,200+ users)
• Freelance Developer - Socivo (London-based marketing agency)
• Senior Technical Executive - FED KIIT
• Web Developer - GeeksForGeeks KIIT

Technical Expertise:
ReactJS, Tailwind CSS, NodeJS, ExpressJS, Firebase, TypeScript, Git, Docker, Redis,
Vercel, Render, PostHog, C, HTML, CSS, JavaScript.

Education:
KIIT University - CSE (AI/ML) - 2024–2028

You speak, think, and respond as Hardik - with the technical depth, product background, and engineering experience he possesses.`
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

    setMessages([
      ...newMessages,
      {
        role: 'assistant',
        content:
          'AI chat is disabled on the public site so no browser-exposed API token is required. Email me instead and I will reply directly.',
      },
    ]);
    setIsLoading(false);
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
  const { featuredProjects, sections } = usePortfolio();
  const GithubIcon = getIconComponent('Github', settings.iconStyle);
  const ExternalLinkIcon = getIconComponent('ExternalLink', settings.iconStyle);
  const [selectedProjectPreview, setSelectedProjectPreview] = useState<Project | null>(null);
  const vscodeIntro = sections.vscodeProjectsIntro;

  const themeMap: Record<string, any> = {
    blue: { text: 'text-blue-500', bg: 'bg-blue-500', border: 'border-blue-500', hoverText: 'hover:text-blue-500', hoverBg: 'hover:bg-blue-500' },
    purple: { text: 'text-purple-500', bg: 'bg-purple-500', border: 'border-purple-500', hoverText: 'hover:text-purple-500', hoverBg: 'hover:bg-purple-500' },
    green: { text: 'text-green-500', bg: 'bg-green-500', border: 'border-green-500', hoverText: 'hover:text-green-500', hoverBg: 'hover:bg-green-500' },
    orange: { text: 'text-orange-500', bg: 'bg-orange-500', border: 'border-orange-500', hoverText: 'hover:text-orange-500', hoverBg: 'hover:bg-orange-500' },
    red: { text: 'text-red-500', bg: 'bg-red-500', border: 'border-red-500', hoverText: 'hover:text-red-500', hoverBg: 'hover:bg-red-500' },
    zinc: { text: 'text-zinc-500', bg: 'bg-zinc-500', border: 'border-zinc-500', hoverText: 'hover:text-zinc-500', hoverBg: 'hover:bg-zinc-500' },
  };
  const theme = themeMap[settings.themeColor] || themeMap.blue;
  const projects = featuredProjects;

  const projectGradientIndex = (id: string) => {
    const hash = id.split('').reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
    return (hash % 6) + 1;
  };

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
          {vscodeIntro?.title || 'Projects'}
        </h2>
        <p
          className={cn(
            "text-sm",
            settings.darkMode ? "text-zinc-400" : "text-zinc-500"
          )}
        >
          {vscodeIntro?.subtitle ||
            'Selected works and experiments. Some project GitHub links are not shared as they are commercial projects.'}
        </p>

      </div>

      <div className="flex-1 overflow-y-auto p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {projects.map((project) => (
            <div
              key={project.id}
              onClick={() => project.liveUrl !== "#" && setSelectedProjectPreview(project)}
              className={cn(
                "group rounded-xl border flex flex-col overflow-hidden cursor-pointer",
                settings.darkMode
                  ? "bg-zinc-900/50 border-zinc-800"
                  : "bg-white border-zinc-200"
              )}
            >
              <div className={cn(
                "w-full h-48 border-b relative transition-opacity overflow-hidden",
                settings.darkMode ? "bg-zinc-800 border-zinc-800" : "bg-zinc-100 border-zinc-200"
              )}>
                <div className={cn(
                  "absolute inset-0 bg-gradient-to-br",
                  projectGradientIndex(project.id) === 1 && "from-fuchsia-500/30 via-rose-500/20 to-amber-500/20",
                  projectGradientIndex(project.id) === 2 && "from-cyan-500/25 via-blue-500/15 to-emerald-500/20",
                  projectGradientIndex(project.id) === 3 && "from-emerald-500/20 via-lime-500/10 to-cyan-500/20",
                  projectGradientIndex(project.id) === 4 && "from-orange-500/20 via-red-500/15 to-yellow-500/15",
                  projectGradientIndex(project.id) === 5 && "from-violet-500/25 via-indigo-500/15 to-sky-500/20",
                  projectGradientIndex(project.id) === 6 && "from-sky-500/25 via-cyan-500/10 to-indigo-500/20"
                )} />
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.18),transparent_35%)]" />
                <div className="absolute inset-0 flex flex-col justify-between p-4">
                  <span className={cn(
                    "w-fit rounded-full border px-2.5 py-1 text-[10px] uppercase tracking-[0.25em]",
                    settings.darkMode ? "border-white/15 bg-black/15 text-zinc-100" : "border-black/10 bg-white/40 text-zinc-700"
                  )}>
                    {project.liveUrl !== "#" ? "Click to preview" : "Private build"}
                  </span>
                  <div>
                    <p className={cn(
                      "text-4xl font-black tracking-tight leading-none",
                      settings.darkMode ? "text-white/85" : "text-zinc-900/75"
                    )}>
                      {project.name}
                    </p>
                    <p className={cn(
                      "mt-3 text-[11px] uppercase tracking-[0.3em]",
                      settings.darkMode ? "text-zinc-200/80" : "text-zinc-700/70"
                    )}>
                      {project.liveUrl !== "#" ? "Live preview in popup" : "Source only"}
                    </p>
                  </div>
                </div>
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
                      onClick={(e) => e.stopPropagation()}
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
                      onClick={(e) => e.stopPropagation()}
                      className={cn(
                        "p-1.5 rounded-lg transition-colors",
                        settings.darkMode ? "hover:bg-zinc-800 text-zinc-400" : "hover:bg-zinc-100 text-zinc-500",
                        theme.hoverText
                      )}
                    >
                      <ExternalLinkIcon size={16} />
                    </a>
                    {project.liveUrl !== "#" && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedProjectPreview(project);
                        }}
                        className={cn(
                          "p-1.5 rounded-lg transition-colors",
                          settings.darkMode ? "hover:bg-zinc-800 text-zinc-400" : "hover:bg-zinc-100 text-zinc-500",
                          theme.hoverText
                        )}
                      >
                        <Eye size={16} />
                      </button>
                    )}
                  </div>
                </div>

                <p className={cn(
                  "text-sm mb-4 flex-1",
                  settings.darkMode ? "text-zinc-400" : "text-zinc-600"
                )}>
                  {project.description}
                </p>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (project.liveUrl !== "#") setSelectedProjectPreview(project);
                  }}
                  className={cn(
                    "mt-auto inline-flex items-center gap-2 text-xs font-medium uppercase tracking-[0.25em]",
                    settings.darkMode ? "text-zinc-400 hover:text-white" : "text-zinc-500 hover:text-zinc-900"
                  )}
                >
                  {project.liveUrl !== "#" ? <Eye size={14} /> : <GithubIcon size={14} />}
                  {project.liveUrl !== "#" ? "Preview Site" : "Code Link Only"}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <AnimatePresence>
        {selectedProjectPreview && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-20 bg-black/80 backdrop-blur-md p-4"
            onClick={() => setSelectedProjectPreview(null)}
          >
            <motion.div
              initial={{ y: 24, scale: 0.98 }}
              animate={{ y: 0, scale: 1 }}
              exit={{ y: 20, scale: 0.98 }}
              className={cn(
                "mx-auto flex h-full max-h-[calc(100vh-10rem)] w-full max-w-5xl flex-col overflow-hidden rounded-2xl border",
                settings.darkMode ? "bg-zinc-950 border-zinc-800" : "bg-white border-zinc-200"
              )}
              onClick={(e) => e.stopPropagation()}
            >
              <div className={cn(
                "flex items-start justify-between gap-4 border-b px-5 py-4",
                settings.darkMode ? "border-zinc-800" : "border-zinc-200"
              )}>
                <div>
                  <p className={cn("text-[10px] uppercase tracking-[0.3em]", settings.darkMode ? "text-zinc-500" : "text-zinc-500")}>
                    {selectedProjectPreview.name}
                  </p>
                  <h3 className="mt-2 text-2xl font-bold">{selectedProjectPreview.name}</h3>
                  <p className={cn("mt-2 text-sm max-w-2xl", settings.darkMode ? "text-zinc-400" : "text-zinc-600")}>
                    {selectedProjectPreview.description}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <a
                    href={selectedProjectPreview.liveUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={cn(
                      "inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm",
                      settings.darkMode ? "bg-white text-black" : "bg-zinc-900 text-white"
                    )}
                  >
                    <ExternalLink size={14} />
                    Open Site
                  </a>
                  <button
                    onClick={() => setSelectedProjectPreview(null)}
                    className={cn(
                      "rounded-lg border p-2",
                      settings.darkMode ? "border-zinc-800 text-zinc-400 hover:text-white" : "border-zinc-200 text-zinc-500 hover:text-zinc-900"
                    )}
                  >
                    <X size={16} />
                  </button>
                </div>
              </div>
              <div className={cn("flex-1", settings.darkMode ? "bg-zinc-900" : "bg-zinc-100")}>
                <iframe
                  src={selectedProjectPreview.liveUrl}
                  title={`${selectedProjectPreview.name} preview`}
                  className="h-full w-full border-none"
                  loading="lazy"
                  sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
                />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
