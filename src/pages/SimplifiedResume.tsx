import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ExternalLink, Calendar, ChevronRight, X, ChevronLeft, Maximize2, Pin, Github, Linkedin, Instagram, Twitter, Link } from 'lucide-react';
import { format } from 'date-fns';

import photosData from '@/data/photos.json';

const SimplifiedResume = () => {
    const [activeSection, setActiveSection] = useState('resume');
    const [repos, setRepos] = useState<any[]>([]);
    const [filteredRepos, setFilteredRepos] = useState<any[]>([]);
    const [posts, setPosts] = useState<any[]>([]);
    const [filterMode, setFilterMode] = useState<'top' | 'latest' | 'pushed' | 'all'>('top');
    const [searchQuery, setSearchQuery] = useState('');

    // Photo Gallery State
    const [selectedEvent, setSelectedEvent] = useState<typeof photosData[0] | null>(null);
    const [currentImageIndex, setCurrentImageIndex] = useState(0);

    // Sort events: Pinned first
    const sortedEvents = [...photosData].sort((a, b) => {
        if (a.pinned === b.pinned) return 0;
        return a.pinned ? -1 : 1;
    });

    // Fetch GitHub Repos
    useEffect(() => {
        const fetchRepos = async () => {
            try {
                const response = await fetch('https://api.github.com/users/hardikguptaofficialgit/repos?per_page=100');
                const data = await response.json();
                if (Array.isArray(data)) setRepos(data);
            } catch (error) {
                console.error("Failed to fetch repos", error);
            }
        };
        fetchRepos();
    }, []);

    // Filter and sort repos
    useEffect(() => {
        let list = [...repos];

        // Sorting
        if (filterMode === 'top') {
            list.sort((a, b) => b.stargazers_count - a.stargazers_count);
        } else if (filterMode === 'latest') {
            list.sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());
        } else if (filterMode === 'pushed') {
            list.sort((a, b) => new Date(b.pushed_at).getTime() - new Date(a.pushed_at).getTime());
        }

        // Searching
        if (searchQuery) {
            const q = searchQuery.toLowerCase();
            list = list.filter(r =>
                (r.name && r.name.toLowerCase().includes(q)) ||
                (r.description && r.description.toLowerCase().includes(q))
            );
        }

        // Limit for top view if needed, or keeping all
        if (filterMode === 'top') list = list.slice(0, 10);

        setFilteredRepos(list);
    }, [repos, filterMode, searchQuery]);

    // Fetch Substack Posts
    useEffect(() => {
        const fetchPosts = async () => {
            try {
                const PROXY_URL = 'https://api.allorigins.win/get?url=' + encodeURIComponent('https://strykerinside.substack.com/api/v1/archive?sort=new&limit=10');
                const response = await fetch(PROXY_URL);
                const data = await response.json();
                const contents = JSON.parse(data.contents);
                if (Array.isArray(contents)) setPosts(contents);
            } catch (error) {
                console.error("Failed to fetch posts", error);
            }
        };
        fetchPosts();
    }, []);

    const scrollToSection = (id: string) => {
        setActiveSection(id);
        const element = document.getElementById(id);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth' });
        }
    };

    const openGallery = (event: typeof photosData[0]) => {
        setSelectedEvent(event);
        setCurrentImageIndex(0);
    };

    const nextImage = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (!selectedEvent) return;
        setCurrentImageIndex((prev) => (prev + 1) % selectedEvent.images.length);
    };

    const prevImage = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (!selectedEvent) return;
        setCurrentImageIndex((prev) => (prev - 1 + selectedEvent.images.length) % selectedEvent.images.length);
    };

    const navItems = [
        { id: 'resume', label: 'Resume' },
        { id: 'projects', label: 'Projects' },
        { id: 'photos', label: 'Photos' },
        { id: 'posts', label: 'Posts' },
        { id: 'contact', label: 'Contact', isAction: true }
    ];

    const handleNavClick = (item: typeof navItems[0]) => {
        if (item.id === 'contact') {
            window.location.href = "mailto:hardikgupta8792@gmail.com";
        } else {
            scrollToSection(item.id);
        }
    };

    return (
        <div className="h-screen w-full bg-black text-white font-mono flex flex-col selection:bg-[#E8DCC4] selection:text-black custom-cursor">
            <style>{`
                .custom-cursor {
                    cursor: url("data:image/svg+xml,%3Csvg width='24' height='24' viewBox='0 0 24 24' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M2 2l8.5 20.5 3.5-8.5 8.5-3.5L2 2z' fill='%23000' stroke='%23fff' stroke-width='1.5'/%3E%3C/svg%3E") 2 2, auto;
                }
                .custom-cursor a, 
                .custom-cursor button, 
                .custom-cursor .cursor-pointer,
                .custom-cursor [role="button"] {
                    cursor: url("data:image/svg+xml,%3Csvg width='24' height='24' viewBox='0 0 24 24' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M9 2H15V6H21V12H23V14H21V22H15V18H9V22H3V14H1V12H3V6H9V2Z' fill='%23fff' stroke='%23000' stroke-width='1.5'/%3E%3C/svg%3E") 12 12, pointer !important;
                }
            `}</style>

            {/* Navigation */}
            <nav className="sticky top-0 z-50 bg-black border-b border-white/10 px-6 py-4">
                <div className="max-w-4xl mx-auto relative flex items-center justify-center">
                    <div className="flex gap-6 overflow-x-auto no-scrollbar">
                        {navItems.map((item) => (
                            <button
                                key={item.id}
                                onClick={() => handleNavClick(item)}
                                className={`text-sm tracking-wider uppercase transition-colors whitespace-nowrap ${activeSection === item.id && !item.isAction ? 'text-[#E8DCC4] font-bold' : 'text-zinc-500 hover:text-[#E8DCC4]'}`}
                            >
                                {item.label}
                            </button>
                        ))}
                    </div>
                    <a href="/" className="absolute right-0 top-1/2 -translate-y-1/2 text-xs text-zinc-600 hover:text-white uppercase tracking-widest hidden md:block transition-colors">
                        Return to OS
                    </a>
                </div>
            </nav>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto w-full p-8 md:p-16">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8 }}
                    className="max-w-4xl mx-auto space-y-24 pb-24"
                >
                    {/* RESUME SECTION */}
                    <section id="resume" className="space-y-16">
                        {/* Header */}
                        <header className="space-y-4 border-b border-white/20 pb-8">
                            <h1 className="text-4xl md:text-5xl font-bold tracking-tight">Hardik Gupta</h1>
                            <p className="text-xl text-zinc-400">Learner • Builder • Full Stack Developer</p>
                            <p className="text-sm text-zinc-500">
                                Jaipur, Rajasthan, India •{' '}
                                <a
                                    href="https://strykerinside.vercel.app"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="hover:text-white transition-colors underline decoration-zinc-700 underline-offset-4"
                                >
                                    strykerinside.vercel.app
                                </a>{' '}
                                •{' '}
                                <a
                                    href="mailto:hardikgupta8792@gmail.com"
                                    className="hover:text-white transition-colors underline decoration-zinc-700 underline-offset-4"
                                >
                                    hardikgupta8792@gmail.com
                                </a>
                            </p>

                            {/* Social Icons */}
                            <div className="flex gap-4 pt-2">
                                <a href="https://github.com/hardikguptaofficialgit" target="_blank" rel="noopener noreferrer" className="text-zinc-500 hover:text-white transition-colors">
                                    <Github size={20} />
                                </a>
                                <a href="https://www.linkedin.com/in/hardik-gupta-b528072b3/" target="_blank" rel="noopener noreferrer" className="text-zinc-500 hover:text-white transition-colors">
                                    <Linkedin size={20} />
                                </a>
                                <a href="https://www.instagram.com/stryker.inside/" target="_blank" rel="noopener noreferrer" className="text-zinc-500 hover:text-white transition-colors">
                                    <Instagram size={20} />
                                </a>
                                <a href="https://x.com/stryker_inside" target="_blank" rel="noopener noreferrer" className="text-zinc-500 hover:text-white transition-colors">
                                    <Twitter size={20} />
                                </a>
                                <a href="https://linkitapp.in/harvix" target="_blank" rel="noopener noreferrer" className="text-zinc-500 hover:text-white transition-colors">
                                    <Link size={20} />
                                </a>
                            </div>
                        </header>

                        {/* Experience */}
                        <div className="space-y-10">
                            <h2 className="text-2xl font-bold uppercase tracking-widest border-b border-white/20 pb-4">Experience</h2>

                            <div className="space-y-12">
                                {/* NuviBrainz */}
                                <div className="space-y-2">
                                    <div className="flex flex-col md:flex-row md:justify-between md:items-baseline">
                                        <h3 className="text-xl font-bold">Building — NuviBrainz</h3>
                                        <span className="text-sm text-zinc-500 font-mono">Aug 2024 — Present</span>
                                    </div>
                                    <a href="https://nuvibrainz.in" target="_blank" rel="noopener noreferrer" className="text-sm text-zinc-500 hover:text-white transition-colors underline decoration-zinc-700 underline-offset-4">nuvibrainz.in</a>
                                    <ul className="list-disc list-inside text-zinc-300 space-y-1 pt-2 pl-2">
                                        <li>Built an AI-powered JEE exam prep platform with smart revision tools.</li>
                                        <li>Includes focus tracking, AI-generated questions, progress tracking, and chatbots.</li>
                                    </ul>
                                </div>

                                {/* LinkIT */}
                                <div className="space-y-2">
                                    <div className="flex flex-col md:flex-row md:justify-between md:items-baseline">
                                        <h3 className="text-xl font-bold">Full Stack Developer — LinkIT</h3>
                                        <span className="text-sm text-zinc-500 font-mono">June 2025 — Present</span>
                                    </div>
                                    <a href="https://linkitapp.in" target="_blank" rel="noopener noreferrer" className="text-sm text-zinc-500 hover:text-white transition-colors underline decoration-zinc-700 underline-offset-4">linkitapp.in</a>
                                    <ul className="list-disc list-inside text-zinc-300 space-y-1 pt-2 pl-2">
                                        <li>AI-powered link manager with smart suggestions.</li>
                                        <li>Built personal AI chatbot and customizable collections.</li>
                                        <li>Product gained 100+ users in the first 15 days.</li>
                                    </ul>
                                </div>

                                {/* NextRound AI */}
                                <div className="space-y-2">
                                    <div className="flex flex-col md:flex-row md:justify-between md:items-baseline">
                                        <h3 className="text-xl font-bold">Web Developer — NextRound AI</h3>
                                        <span className="text-sm text-zinc-500 font-mono">June 2025 — Present</span>
                                    </div>
                                    <a href="https://nextround.tech/" target="_blank" rel="noopener noreferrer" className="text-sm text-zinc-500 hover:text-white transition-colors underline decoration-zinc-700 underline-offset-4">nextround.tech</a>
                                    <ul className="list-disc list-inside text-zinc-300 space-y-1 pt-2 pl-2">
                                        <li>Building  an AI-powered Chrome extension for interview prep.</li>
                                        <li>Implemented smart summaries, insights, and personalized suggestions.</li>
                                    </ul>
                                </div>

                                {/* AstroNuvi */}
                                <div className="space-y-2">
                                    <div className="flex flex-col md:flex-row md:justify-between md:items-baseline">
                                        <h3 className="text-xl font-bold">Full Stack Developer — AstroNuvi</h3>
                                        <span className="text-sm text-zinc-500 font-mono">Aug 2025 — Present</span>
                                    </div>
                                    <a href="https://astronuvi.nuviverse.space" target="_blank" rel="noopener noreferrer" className="text-sm text-zinc-500 hover:text-white transition-colors underline decoration-zinc-700 underline-offset-4">astronuvi.nuviverse.space</a>
                                    <ul className="list-disc list-inside text-zinc-300 space-y-1 pt-2 pl-2">
                                        <li>Built RatnAI model–powered astrology platform.</li>
                                        <li>Serves 1,200+ users and generated 1,000+ kundlis.</li>
                                        <li>Working with a 13-member team on product innovation.</li>
                                    </ul>
                                </div>

                                {/* Freelance */}
                                <div className="space-y-2">
                                    <div className="flex flex-col md:flex-row md:justify-between md:items-baseline">
                                        <h3 className="text-xl font-bold">Freelance — Full Stack Developer</h3>
                                        <span className="text-sm text-zinc-500 font-mono">June 2025 — Present</span>
                                    </div>
                                    <a href="https://socivo.vercel.app" target="_blank" rel="noopener noreferrer" className="text-sm text-zinc-500 hover:text-white transition-colors underline decoration-zinc-700 underline-offset-4">socivo.vercel.app</a>
                                    <ul className="list-disc list-inside text-zinc-300 space-y-1 pt-2 pl-2">
                                        <li>Working with a London-based marketing agency (Socivo).</li>
                                    </ul>
                                </div>

                                {/* FED KIIT */}
                                <div className="space-y-2">
                                    <div className="flex flex-col md:flex-row md:justify-between md:items-baseline">
                                        <h3 className="text-xl font-bold">Senior Technical Executive — FED KIIT</h3>
                                        <span className="text-sm text-zinc-500 font-mono">Nov 2024 — Present</span>
                                    </div>
                                    <a href="https://fedkiit.com" target="_blank" rel="noopener noreferrer" className="text-sm text-zinc-500 hover:text-white transition-colors underline decoration-zinc-700 underline-offset-4">fedkiit.com</a>
                                    <ul className="list-disc list-inside text-zinc-300 space-y-1 pt-2">
                                        <li>Supporting technical events and managing web operations.</li>
                                    </ul>
                                </div>

                                {/* GFG KIIT */}
                                <div className="space-y-2">
                                    <div className="flex flex-col md:flex-row md:justify-between md:items-baseline">
                                        <h3 className="text-xl font-bold">Web Developer — GeeksForGeeks KIIT</h3>
                                        <span className="text-sm text-zinc-500 font-mono">Aug 2024 — Present</span>
                                    </div>
                                    <a href="https://gfgkiit.in" target="_blank" rel="noopener noreferrer" className="text-sm text-zinc-500 hover:text-white transition-colors underline decoration-zinc-700 underline-offset-4">gfgkiit.in</a>
                                    <ul className="list-disc list-inside text-zinc-300 space-y-1 pt-2">
                                        <li>Managing website operations and support for technical events.</li>
                                    </ul>
                                </div>

                            </div>
                        </div>

                        {/* Tech Stack */}
                        <div className="space-y-6">
                            <h2 className="text-2xl font-bold uppercase tracking-widest border-b border-white/20 pb-4">Tech Stack</h2>
                            <div className="flex flex-wrap gap-x-6 gap-y-3 text-zinc-300 font-mono">
                                {[
                                    "ReactJS", "Tailwind CSS", "NodeJS", "ExpressJS", "Git", "GitHub", "Vercel",
                                    "C", "HTML", "CSS", "JavaScript", "Firebase", "TypeScript", "PostHog", "Render", "Docker", "Redis"
                                ].map(skill => (
                                    <span key={skill}>{skill}</span>
                                ))}
                            </div>
                        </div>

                        {/* Education */}
                        <div className="space-y-6">
                            <h2 className="text-2xl font-bold uppercase tracking-widest border-b border-white/20 pb-4">Education</h2>
                            <div className="space-y-1">
                                <h3 className="text-xl font-bold">Kalinga Institute of Industrial Technology</h3>
                                <p className="text-zinc-300">CSE — AI/ML</p>
                                <p className="text-zinc-500 font-mono">2024 – 2028</p>
                            </div>
                        </div>
                    </section>

                    {/* PROJECTS SECTION */}
                    <section id="projects" className="space-y-10 pt-10 border-t border-white/10">
                        <header className="flex flex-col gap-6 border-b border-white/20 pb-6">
                            <div className="flex items-end justify-between">
                                <h2 className="text-2xl font-bold uppercase tracking-widest">Projects</h2>
                                <span className="text-xs text-zinc-500">Source: GitHub</span>
                            </div>

                            <div className="flex flex-col md:flex-row gap-4 justify-between">
                                <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0 no-scrollbar">
                                    {[
                                        { id: 'top', label: 'Top Rated' },
                                        { id: 'latest', label: 'Latest' },
                                        { id: 'pushed', label: 'Recently Pushed' },
                                        { id: 'all', label: 'All Repos' }
                                    ].map((tab) => (
                                        <button
                                            key={tab.id}
                                            onClick={() => setFilterMode(tab.id as any)}
                                            className={`px - 3 py - 1.5 text - xs font - medium border rounded transition - colors whitespace - nowrap ${filterMode === tab.id
                                                ? 'bg-white text-black border-white'
                                                : 'text-zinc-400 border-zinc-800 hover:border-zinc-600'
                                                } `}
                                        >
                                            {tab.label}
                                        </button>
                                    ))}
                                </div>

                                <input
                                    type="text"
                                    placeholder="Search projects..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="bg-zinc-950 border border-zinc-800 rounded px-3 py-1.5 text-sm w-full md:w-64 focus:outline-none focus:border-zinc-600 transition-colors"
                                />
                            </div>
                        </header>

                        <div className="grid grid-cols-1 gap-6">
                            {filteredRepos.map(repo => (
                                <a
                                    key={repo.id}
                                    href={repo.html_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="group block border border-white/10 p-6 transition-colors bg-zinc-950 hover:bg-zinc-900"
                                >
                                    <div className="flex justify-between items-start">
                                        <h3 className="text-xl font-bold">{repo.name}</h3>
                                        {repo.language && <span className="text-xs border border-white/10 px-2 py-1 text-zinc-500">{repo.language}</span>}
                                    </div>
                                    <p className="text-zinc-400 mt-2 text-sm max-w-2xl">{repo.description || "No description available."}</p>
                                    <div className="flex items-center gap-4 mt-4 text-xs text-zinc-500">
                                        <span>★ {repo.stargazers_count}</span>
                                        <span>Updated: {new Date(repo.updated_at).toLocaleDateString()}</span>
                                    </div>
                                </a>
                            ))}
                        </div>
                    </section>

                    {/* PHOTOS SECTION */}
                    <section id="photos" className="space-y-10 pt-10 border-t border-white/10">
                        <header className="flex items-end justify-between border-b border-white/20 pb-4">
                            <h2 className="text-2xl font-bold uppercase tracking-widest">Photos</h2>
                            <span className="text-xs text-zinc-500">Recent Highlights</span>
                        </header>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            {sortedEvents.map((event) => (
                                <div
                                    key={event.id}
                                    onClick={() => openGallery(event)}
                                    className="group cursor-pointer space-y-3"
                                >
                                    <div
                                        className="relative aspect-video bg-zinc-900 border border-zinc-800 overflow-hidden group-hover:border-zinc-700 transition-colors"
                                        onMouseMove={(e) => {
                                            const rect = e.currentTarget.getBoundingClientRect();
                                            const x = e.clientX - rect.left;
                                            const y = e.clientY - rect.top;
                                            e.currentTarget.style.setProperty('--x', `${x}px`);
                                            e.currentTarget.style.setProperty('--y', `${y}px`);
                                        }}
                                        style={{ '--x': '50%', '--y': '50%' } as React.CSSProperties}
                                    >
                                        {/* Grayscale Base Layer */}
                                        <img
                                            src={event.images[0]}
                                            alt={event.title}
                                            className="absolute inset-0 w-full h-full object-cover grayscale opacity-60 transition-transform duration-700 group-hover:scale-105"
                                        />

                                        {/* Color Reveal Layer (Spotlight) */}
                                        <img
                                            src={event.images[0]}
                                            alt={event.title}
                                            className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                                            style={{
                                                maskImage: 'radial-gradient(circle 100px at var(--x) var(--y), black, transparent)',
                                                WebkitMaskImage: 'radial-gradient(circle 100px at var(--x) var(--y), black, transparent)'
                                            }}
                                        />

                                        {/* Indicators Container */}
                                        <div className="absolute top-3 right-3 flex flex-col gap-2 items-end z-10 pointer-events-none">
                                            {/* Pinned Indicator */}
                                            {event.pinned && (
                                                <div className="bg-white/90 text-black px-2 py-1 rounded text-xs font-bold flex items-center gap-1.5 shadow-lg">
                                                    <Pin size={10} className="fill-current" />
                                                    <span>Pinned</span>
                                                </div>
                                            )}

                                            {/* Multi-image indicator */}
                                            {event.images.length > 1 && (
                                                <div className="bg-black/70 backdrop-blur-sm px-2 py-1 rounded text-xs text-white flex items-center gap-1.5 border border-white/10">
                                                    <Maximize2 size={10} />
                                                    <span>+{event.images.length - 1}</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div>
                                        <div className="flex justify-between items-start">
                                            <h3 className="text-lg font-bold group-hover:underline underline-offset-4">{event.title}</h3>
                                            <span className="text-xs text-zinc-500 font-mono pt-1">{event.date}</span>
                                        </div>
                                        <p className="text-sm text-zinc-400 leading-snug">{event.description}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>

                    {/* POSTS SECTION */}
                    <section id="posts" className="space-y-10 pt-10 border-t border-white/10">
                        <header className="flex items-end justify-between border-b border-white/20 pb-4">
                            <h2 className="text-2xl font-bold uppercase tracking-widest">Posts</h2>
                            <span className="text-xs text-zinc-500">Source: Substack</span>
                        </header>

                        <div className="grid grid-cols-1 gap-8">
                            {posts.length > 0 ? (
                                posts.map(post => (
                                    <article key={post.id} className="group">
                                        <div className="flex flex-col gap-2">
                                            <div className="flex items-center gap-3 text-xs text-zinc-500">
                                                <span className="flex items-center gap-1">
                                                    {format(new Date(post.post_date), 'MMM d, yyyy')}
                                                </span>
                                            </div>
                                            <h3 className="text-xl font-bold text-white group-hover:underline underline-offset-4">
                                                <a href={post.canonical_url} target="_blank" rel="noopener noreferrer">{post.title}</a>
                                            </h3>
                                            <p className="text-zinc-400 text-sm leading-relaxed max-w-3xl">
                                                {post.description}
                                            </p>
                                            <a href={post.canonical_url} target="_blank" rel="noopener noreferrer" className="text-sm text-zinc-500 mt-2 flex items-center gap-1 hover:text-white transition-colors">
                                                Read Post <ChevronRight size={14} />
                                            </a>
                                        </div>
                                    </article>
                                ))
                            ) : (
                                <p className="text-zinc-500 text-sm">Loading posts...</p>
                            )}
                        </div>
                    </section>

                </motion.div>

                {/* Footer */}
                <footer className="pt-20 border-t border-white/20 flex flex-col items-center gap-4">
                    <a href="/" className="text-zinc-500 hover:text-white transition-colors text-sm uppercase tracking-widest">← Return to OS</a>
                </footer>
            </div>

            {/* Lightbox / Gallery Modal */}
            <AnimatePresence>
                {selectedEvent && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-xl flex flex-col"
                    >
                        {/* Top Bar */}
                        <div className="flex items-center justify-between p-4 md:p-6 border-b border-white/10 shrink-0">
                            <div className="flex flex-col">
                                <h3 className="text-base md:text-lg font-bold line-clamp-1">{selectedEvent.title}</h3>
                                <p className="text-[10px] md:text-xs text-zinc-400">{currentImageIndex + 1} / {selectedEvent.images.length}</p>
                            </div>
                            <button
                                onClick={() => setSelectedEvent(null)}
                                className="p-2 hover:bg-white/10 rounded-full transition-colors"
                            >
                                <X size={20} className="md:w-6 md:h-6" />
                            </button>
                        </div>

                        {/* Main Image Container */}
                        <div className="flex-1 flex items-center justify-center relative p-2 md:p-10 min-h-0 overflow-hidden">
                            {/* Previous Button */}
                            {selectedEvent.images.length > 1 && (
                                <button
                                    onClick={prevImage}
                                    className="absolute left-2 md:left-4 p-2 md:p-3 bg-black/50 hover:bg-white/20 rounded-full backdrop-blur transition-colors z-10 text-white/80 hover:text-white"
                                >
                                    <ChevronLeft size={20} className="md:w-6 md:h-6" />
                                </button>
                            )}

                            {/* Image */}
                            <motion.img
                                key={currentImageIndex}
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ duration: 0.2 }}
                                src={selectedEvent.images[currentImageIndex]}
                                alt={`Gallery image ${currentImageIndex + 1}`}
                                className="max-w-full max-h-full object-contain rounded shadow-2xl"
                                drag="x"
                                dragConstraints={{ left: 0, right: 0 }}
                                dragElastic={0.2}
                                onDragEnd={(e, { offset, velocity }) => {
                                    const swipe = offset.x; // offset in pixels
                                    if (swipe < -50) {
                                        nextImage(e as any);
                                    } else if (swipe > 50) {
                                        prevImage(e as any);
                                    }
                                }}
                            />

                            {/* Next Button */}
                            {selectedEvent.images.length > 1 && (
                                <button
                                    onClick={nextImage}
                                    className="absolute right-2 md:right-4 p-2 md:p-3 bg-black/50 hover:bg-white/20 rounded-full backdrop-blur transition-colors z-10 text-white/80 hover:text-white"
                                >
                                    <ChevronRight size={20} className="md:w-6 md:h-6" />
                                </button>
                            )}
                        </div>

                        {/* Thumbnails (only if multiple) */}
                        {selectedEvent.images.length > 1 && (
                            <div className="h-20 md:h-24 border-t border-white/10 flex items-center gap-2 px-4 md:px-6 overflow-x-auto no-scrollbar justify-start md:justify-center shrink-0 w-full bg-black/50">
                                {selectedEvent.images.map((img, idx) => (
                                    <button
                                        key={idx}
                                        onClick={() => setCurrentImageIndex(idx)}
                                        className={`relative h-14 md:h-16 aspect-video rounded overflow-hidden transition-all flex-shrink-0 ${currentImageIndex === idx ? 'ring-2 ring-white scale-105' : 'opacity-50 hover:opacity-100'}`}
                                    >
                                        <img src={img} alt="thumbnail" className="w-full h-full object-cover" />
                                    </button>
                                ))}
                            </div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default SimplifiedResume;

