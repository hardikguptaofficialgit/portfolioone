import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ExternalLink, Calendar, ChevronRight, X, ChevronLeft, Maximize2, Pin, Github, Linkedin, Instagram, Twitter, Link } from 'lucide-react';
import { format } from 'date-fns';

import photosData from '@/data/photos.json';

const SimplifiedResume = () => {
    const [activeSection, setActiveSection] = useState('resume');
    const [repos, setRepos] = useState<any[]>([]);
    const [filteredRepos, setFilteredRepos] = useState<any[]>([]);
    const [posts, setPosts] = useState<any[]>([]);
    const [postsLoading, setPostsLoading] = useState(true);
    const [postsError, setPostsError] = useState<string | null>(null);
    const [filterMode, setFilterMode] = useState<'top' | 'latest' | 'pushed' | 'all'>('top');
    const [searchQuery, setSearchQuery] = useState('');
    const [previewErrors, setPreviewErrors] = useState<Record<number, boolean>>({});

    // Photo Gallery State
    const [selectedEvent, setSelectedEvent] = useState<typeof photosData[0] | null>(null);
    const [currentImageIndex, setCurrentImageIndex] = useState(0);

    // Sort events: Pinned first
    const sortedEvents = [...photosData].sort((a, b) => {
        if (a.pinned === b.pinned) return 0;
        return a.pinned ? -1 : 1;
    });

    // Calculate duration from start date to present
    const calculateDuration = (startDate: string) => {
        const start = new Date(startDate);
        const now = new Date();
        
        let years = now.getFullYear() - start.getFullYear();
        let months = now.getMonth() - start.getMonth();
        
        if (months < 0) {
            years--;
            months += 12;
        }
        
        if (years === 0 && months === 0) {
            return '1 mo';
        } else if (years === 0) {
            return `${months} mo${months > 1 ? 's' : ''}`;
        } else if (months === 0) {
            return `${years} yr${years > 1 ? 's' : ''}`;
        } else {
            return `${years} yr${years > 1 ? 's' : ''} ${months} mo${months > 1 ? 's' : ''}`;
        }
    };

    // Calculate duration between two dates
    const calculateDateRange = (startDate: string, endDate: string) => {
        const start = new Date(startDate);
        const end = new Date(endDate);
        
        let years = end.getFullYear() - start.getFullYear();
        let months = end.getMonth() - start.getMonth();
        
        if (months < 0) {
            years--;
            months += 12;
        }
        
        if (years === 0 && months === 0) {
            return '1 mo';
        } else if (years === 0) {
            return `${months} mo${months > 1 ? 's' : ''}`;
        } else if (months === 0) {
            return `${years} yr${years > 1 ? 's' : ''}`;
        } else {
            return `${years} yr${years > 1 ? 's' : ''} ${months} mo${months > 1 ? 's' : ''}`;
        }
    };

    // Projects data
    const projects = [
        {
            id: 1,
            name: "NuviBrainz",
            description: "AI-driven JEE prep ecosystem with revision intelligence, analytics, and generative tools.",
            tech: ["ReactJS", "Tailwind CSS", "NodeJS", "ExpressJS", "Firebase", "TypeScript", "PostHog", "Git", "GitHub", "Vercel"],
            liveUrl: "https://nuvibrainz.in",
            githubUrl: "#"
        },
        {
            id: 2,
            name: "Linkit",
            description: "AI-powered link manager with smart suggestions and personal AI chatbot.",
            tech: ["ReactJS", "Tailwind CSS", "TypeScript", "NodeJS", "ExpressJS", "Firebase", "Git", "GitHub", "Vercel"],
            liveUrl: "https://Linkitapp.in",
            githubUrl: "#"
        },
        {
            id: 3,
            name: "AstroNuvi",
            description: "RatnAI-powered astrology platform serving 1,200+ users with AI predictions.",
            tech: ["ReactJS", "Tailwind CSS", "NodeJS", "ExpressJS", "MongoDB", "Git", "GitHub", "Render", "TypeScript"],
            liveUrl: "https://astronuvi.nuviverse.space",
            githubUrl: "#"
        },
        {
            id: 4,
            name: "NextRound AI",
            description: "Interview-prep Chrome extension with smart summaries and insights.",
            tech: ["JavaScript", "TypeScript", "ReactJS", "Tailwind CSS", "Git", "GitHub", "Vercel"],
            liveUrl: "https://nextround.tech",
            githubUrl: "https://github.com/hardikguptaofficialgit/nextround"
        },
        {
            id: 5,
            name: "Socivo Platform",
            description: "Freelancing and marketing platform for a London-based agency with analytics.",
            tech: ["Next.js", "TypeScript", "Tailwind CSS", "PostgreSQL", "Git", "GitHub", "Vercel", "Render"],
            liveUrl: "https://socivo.vercel.app",
            githubUrl: "#"
        },
        {
            id: 6,
            name: "StrykerOS",
            description: "Windows 11-inspired portfolio website with a full desktop environment.",
            tech: ["ReactJS", "TypeScript", "Tailwind CSS", "Framer Motion", "Git", "GitHub", "Vercel"],
            liveUrl: "https://strykerinside.vercel.app/",
            githubUrl: "https://github.com/hardikguptaofficialgit/portfolioone"
        }
    ];

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

    const postsAbortRef = useRef<AbortController | null>(null);

    const parseRssPosts = (rssText: string) => {
        try {
            const parser = new DOMParser();
            const xml = parser.parseFromString(rssText, 'text/xml');
            const items = Array.from(xml.querySelectorAll('item'));
            return items.map((item, index) => {
                const title = item.querySelector('title')?.textContent?.trim() || 'Untitled';
                const link = item.querySelector('link')?.textContent?.trim() || '';
                const description = item.querySelector('description')?.textContent?.trim() || '';
                const pubDate = item.querySelector('pubDate')?.textContent?.trim() || '';
                return {
                    id: `${link}-${index}`,
                    title,
                    canonical_url: link,
                    description: description.replace(/<[^>]+>/g, ''),
                    post_date: pubDate || new Date().toISOString()
                };
            });
        } catch (error) {
            return [];
        }
    };

    const fetchSubstackPosts = useCallback(async () => {
        postsAbortRef.current?.abort();
        const controller = new AbortController();
        postsAbortRef.current = controller;
        setPostsLoading(true);
        setPostsError(null);

        const baseUrl = 'https://strykerinside.substack.com/api/v1/archive?sort=new&limit=10';
        const rssUrl = 'https://strykerinside.substack.com/feed';
        const sources = [
            { url: baseUrl, wrapped: false, type: 'json' as const },
            { url: `https://api.allorigins.win/raw?url=${encodeURIComponent(baseUrl)}`, wrapped: false, type: 'json' as const },
            { url: `https://api.allorigins.win/get?url=${encodeURIComponent(baseUrl)}`, wrapped: true, type: 'json' as const },
            { url: `https://api.allorigins.win/raw?url=${encodeURIComponent(rssUrl)}`, wrapped: false, type: 'rss' as const }
        ];

        for (const source of sources) {
            if (controller.signal.aborted) break;
            try {
                const timeoutId = window.setTimeout(() => controller.abort(), 10000);
                const response = await fetch(source.url, { signal: controller.signal });
                window.clearTimeout(timeoutId);
                if (!response.ok) throw new Error(`Request failed: ${response.status}`);

                if (source.type === 'rss') {
                    const rssText = await response.text();
                    const rssPosts = parseRssPosts(rssText);
                    if (rssPosts.length > 0) {
                        setPosts(rssPosts.slice(0, 10));
                        setPostsLoading(false);
                        return;
                    }
                } else {
                    const data = await response.json();
                    const contents = source.wrapped ? JSON.parse(data.contents || '[]') : data;

                    if (Array.isArray(contents)) {
                        setPosts(contents);
                        setPostsLoading(false);
                        return;
                    }
                }
            } catch (error) {
                if (controller.signal.aborted) break;
            }
        }

        if (!controller.signal.aborted) {
            setPosts([]);
            setPostsError('Unable to load posts right now.');
            setPostsLoading(false);
        }
    }, []);

    // Fetch Substack Posts
    useEffect(() => {
        fetchSubstackPosts();
        return () => postsAbortRef.current?.abort();
    }, [fetchSubstackPosts]);

    useEffect(() => {
        const sectionIds = ['resume', 'projects', 'github', 'photos', 'posts'];
        const sections = sectionIds
            .map((id) => document.getElementById(id))
            .filter((el): el is HTMLElement => Boolean(el));

        if (sections.length === 0) return;

        const visibilityMap = new Map<string, number>();
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    visibilityMap.set(entry.target.id, entry.intersectionRatio);
                });

                let bestId = activeSection;
                let bestRatio = -1;
                visibilityMap.forEach((ratio, id) => {
                    if (ratio > bestRatio) {
                        bestRatio = ratio;
                        bestId = id;
                    }
                });

                if (bestId && bestId !== activeSection) {
                    setActiveSection(bestId);
                }
            },
            {
                root: null,
                rootMargin: '-15% 0px -55% 0px',
                threshold: [0, 0.1, 0.25, 0.5, 0.75, 1]
            }
        );

        sections.forEach((section) => observer.observe(section));
        return () => observer.disconnect();
    }, [activeSection]);

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
        { id: 'github', label: 'My Github' },
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
        <div className="relative h-screen w-full bg-black text-white font-mono flex flex-col selection:bg-[#E8DCC4] selection:text-black">
            <div className="pointer-events-none absolute inset-0 overflow-hidden">
                <div className="absolute -top-24 right-[-10%] h-72 w-72 rounded-full bg-[radial-gradient(circle,rgba(232,220,196,0.15),transparent_65%)] blur-2xl" />
                <div className="absolute bottom-[-15%] left-[-10%] h-96 w-96 rounded-full bg-[radial-gradient(circle,rgba(56,189,248,0.18),transparent_60%)] blur-2xl" />
                <div className="absolute inset-0 bg-[radial-gradient(1200px_400px_at_50%_-10%,rgba(255,255,255,0.06),transparent_70%)]" />
                <div className="absolute inset-0 bg-[linear-gradient(transparent,rgba(0,0,0,0.6))]" />
            </div>

            {/* Navigation */}
            <nav className="sticky top-0 z-50 border-b border-white/10 bg-black/70 backdrop-blur-xl px-4 md:px-6 py-3">
                <div className="max-w-5xl mx-auto relative flex items-center justify-center">
                    <div className="flex gap-3 md:gap-6 overflow-x-auto no-scrollbar">
                        {navItems.map((item) => (
                            <button
                                key={item.id}
                                onClick={() => handleNavClick(item)}
                                aria-label={item.label}
                                className={`text-xs md:text-sm tracking-wider uppercase transition-colors whitespace-nowrap rounded-full px-3 py-1.5 border ${activeSection === item.id && !item.isAction
                                    ? 'text-black bg-[#E8DCC4] border-[#E8DCC4]'
                                    : 'text-zinc-400 border-white/10 hover:text-[#E8DCC4] hover:border-white/30'
                                    }`}
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
            <div className="relative z-10 flex-1 overflow-y-auto w-full p-6 md:p-12 lg:p-16">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8 }}
                    className="max-w-5xl mx-auto space-y-24 pb-24"
                >
                    {/* RESUME SECTION */}
                    <section id="resume" className="space-y-16 scroll-mt-24">
                        {/* Header */}
                        <header className="grid gap-10 border-b border-white/20 pb-10 lg:grid-cols-[1.2fr_0.8fr]">
                            <div className="space-y-4">
                                <p className="text-xs uppercase tracking-[0.35em] text-zinc-500">Full Stack Developer</p>
                                <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight audiowide-regular">Hardik Gupta</h1>
                                <p className="text-lg md:text-xl text-zinc-400 max-w-2xl">
                                    Learner. Builder. Shipping clean, human-first products across web and AI.
                                </p>
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
                                    <a href="https://Linkitapp.in/harvix" target="_blank" rel="noopener noreferrer" className="text-zinc-500 hover:text-white transition-colors">
                                        <Link size={20} />
                                    </a>
                                </div>
                            </div>

                          <div className="rounded-xl p-5 border border-white/15 bg-black">
    <h2 className="text-xs uppercase tracking-[0.3em] text-zinc-400">Focus</h2>

    <div className="mt-3 grid gap-3">
        <div className="rounded-lg border border-white/15 bg-black px-4 py-3">
            <p className="text-[11px] uppercase tracking-wider text-zinc-500">Currently Building</p>
            <p className="text-sm text-white">Linkit Apps - AI-powered full-stack platform</p>
        </div>

        <div className="rounded-lg border border-white/15 bg-black px-4 py-3">
            <p className="text-[11px] uppercase tracking-wider text-zinc-500">Ships</p>
            <p className="text-sm text-white">Full-stack web apps, AI tools, automations</p>
        </div>

        <div className="rounded-lg border border-white/15 bg-black px-4 py-3">
            <p className="text-[11px] uppercase tracking-wider text-zinc-500">Open To</p>
            <p className="text-sm text-white">Internships, Freelancing Projects , Collaborations, Startups</p>
        </div>
    </div>
</div>

                        </header>

                        {/* Experience */}
                        <div className="space-y-10">
                            <h2 className="text-2xl font-bold uppercase tracking-widest border-b border-white/20 pb-4">Experience</h2>

                            <div className="space-y-8">
                                {/* FED KIIT */}
                                <div className="space-y-3 rounded-2xl border border-white/10 bg-black/40 p-6 transition-colors hover:bg-black/60">
                                    <div className="flex flex-col md:flex-row md:justify-between md:items-baseline">
                                        <h3 className="text-xl font-bold">FED KIIT</h3>
                                        <span className="text-sm text-zinc-500 font-mono">Part-time · {calculateDuration('2024-11-01')}</span>
                                    </div>
                                    <a href="https://fedkiit.com" target="_blank" rel="noopener noreferrer" className="text-sm text-zinc-500 hover:text-white transition-colors underline decoration-zinc-700 underline-offset-4">fedkiit.com</a>
                                    
                                    {/* Senior Technical Executive */}
                                    <div className="pt-3 space-y-1 border-l-2 border-white/20 pl-4 ml-1">
                                        <div className="flex flex-col md:flex-row md:justify-between md:items-baseline">
                                            <h4 className="text-lg font-semibold">Senior Technical Executive</h4>
                                            <span className="text-xs text-zinc-500 font-mono">Jan 2026 - Present · {calculateDuration('2026-01-01')}</span>
                                        </div>
                                        <p className="text-xs text-zinc-400">Bhubaneswar, Odisha, India · On-site</p>
                                    </div>

                                    {/* Technical Executive */}
                                    <div className="pt-2 space-y-1 border-l-2 border-white/20 pl-4 ml-1">
                                        <div className="flex flex-col md:flex-row md:justify-between md:items-baseline">
                                            <h4 className="text-lg font-semibold">Technical Executive</h4>
                                            <span className="text-xs text-zinc-500 font-mono">Nov 2024 - Jan 2026 · 1 yr 3 mos</span>
                                        </div>
                                        <p className="text-xs text-zinc-400">Bhubaneshwar, Odisha, India · Hybrid</p>
                                    </div>
                                </div>

                                {/* Linkit */}
                                <div className="space-y-3 rounded-2xl border border-white/10 bg-black/40 p-6 transition-colors hover:bg-black/60">
                                    <div className="flex flex-col md:flex-row md:justify-between md:items-baseline">
                                        <h3 className="text-xl font-bold">Building Linkit</h3>
                                        <span className="text-sm text-zinc-500 font-mono">June 2025 - Present · {calculateDuration('2025-06-01')}</span>
                                    </div>
                                    <a href="https://Linkitapp.in" target="_blank" rel="noopener noreferrer" className="text-sm text-zinc-500 hover:text-white transition-colors underline decoration-zinc-700 underline-offset-4">Linkitapp.in</a>
                                    <ul className="list-disc list-inside text-zinc-300 space-y-1 pt-2 pl-2">
                                        <li>AI-powered link manager with smart suggestions.</li>
                                        <li>Built personal AI chatbot and customizable collections.</li>
                                        <li>Product gained 100+ users in the first 15 days.</li>
                                    </ul>
                                </div>

                                {/* Freelance */}
                                <div className="space-y-3 rounded-2xl border border-white/10 bg-black/40 p-6 transition-colors hover:bg-black/60">
                                    <div className="flex flex-col md:flex-row md:justify-between md:items-baseline">
                                        <h3 className="text-xl font-bold">Freelance - Full Stack Developer</h3>
                                        <span className="text-sm text-zinc-500 font-mono">June 2025 - Present · {calculateDuration('2025-06-01')}</span>
                                    </div>
                                    <a href="https://socivo.vercel.app" target="_blank" rel="noopener noreferrer" className="text-sm text-zinc-500 hover:text-white transition-colors underline decoration-zinc-700 underline-offset-4">socivo.vercel.app</a>
                                    <ul className="list-disc list-inside text-zinc-300 space-y-1 pt-2 pl-2">
                                        <li>Working with a London-based marketing agency (Socivo).</li>
                                    </ul>
                                </div>

                                {/* NextRound AI */}
                                <div className="space-y-3 rounded-2xl border border-white/10 bg-black/40 p-6 transition-colors hover:bg-black/60">
                                    <div className="flex flex-col md:flex-row md:justify-between md:items-baseline">
                                        <h3 className="text-xl font-bold">Frontend Developer - NEXTROUND PRIVATE LIMITED</h3>
                                        <span className="text-sm text-zinc-500 font-mono">Jun 2025 - Aug 2025 · 3 mos</span>
                                    </div>
                                    <p className="text-sm text-zinc-500">Internship · Remote</p>
                                    <a href="https://nextround.tech/" target="_blank" rel="noopener noreferrer" className="text-sm text-zinc-500 hover:text-white transition-colors underline decoration-zinc-700 underline-offset-4">nextround.tech</a>
                                    <ul className="list-disc list-inside text-zinc-300 space-y-1 pt-2 pl-2">
                                        <li>Built an AI-powered Chrome extension for interview prep.</li>
                                        <li>Implemented smart summaries, insights, and personalized suggestions.</li>
                                    </ul>
                                </div>

                                {/* GFG KIIT */}
                                <div className="space-y-3 rounded-2xl border border-white/10 bg-black/40 p-6 transition-colors hover:bg-black/60">
                                    <div className="flex flex-col md:flex-row md:justify-between md:items-baseline">
                                        <h3 className="text-xl font-bold">Web Developer - GeeksForGeeks KIIT</h3>
                                        <span className="text-sm text-zinc-500 font-mono">Feb 2025 - Present · {calculateDuration('2025-02-01')}</span>
                                    </div>
                                    <p className="text-sm text-zinc-500">Part-time · Bhubaneswar, Odisha, India · On-site</p>
                                    <a href="https://gfgkiit.in" target="_blank" rel="noopener noreferrer" className="text-sm text-zinc-500 hover:text-white transition-colors underline decoration-zinc-700 underline-offset-4">gfgkiit.in</a>
                                    <ul className="list-disc list-inside text-zinc-300 space-y-1 pt-2">
                                        <li>Managing website operations and support for technical events.</li>
                                    </ul>
                                </div>

                                {/* NuviBrainz */}
                                <div className="space-y-3 rounded-2xl border border-white/10 bg-black/40 p-6 transition-colors hover:bg-black/60">
                                    <div className="flex flex-col md:flex-row md:justify-between md:items-baseline">
                                        <h3 className="text-xl font-bold">NuviBrainz</h3>
                                        <span className="text-sm text-zinc-500 font-mono">Aug 2024 - Dec 2025</span>
                                    </div>
                                    <a href="https://nuvibrainz.in" target="_blank" rel="noopener noreferrer" className="text-sm text-zinc-500 hover:text-white transition-colors underline decoration-zinc-700 underline-offset-4">nuvibrainz.in</a>
                                    <ul className="list-disc list-inside text-zinc-300 space-y-1 pt-2 pl-2">
                                        <li>Built an AI-powered JEE exam prep platform with smart revision tools.</li>
                                        <li>Includes focus tracking, AI-generated questions, progress tracking, and chatbots.</li>
                                    </ul>
                                </div>

                                {/* HPAIR */}
                                <div className="space-y-3 rounded-2xl border border-white/10 bg-black/40 p-6 transition-colors hover:bg-black/60">
                                    <div className="flex flex-col md:flex-row md:justify-between md:items-baseline">
                                        <h3 className="text-xl font-bold">Delegate - Harvard Project for Asian and International Relations (HPAIR)</h3>
                                        <span className="text-sm text-zinc-500 font-mono">Feb 2026 · {calculateDateRange('2026-02-01', '2026-02-28')}</span>
                                    </div>
                                    <p className="text-sm text-zinc-500">Part-time · On-site</p>
                                    <ul className="list-disc list-inside text-zinc-300 space-y-1 pt-2">
                                        <li>Participated in international relations discussions and networking events.</li>
                                    </ul>
                                </div>

                            </div>
                        </div>

                        {/* Tech Stack */}
                        <div className="space-y-6">
                            <h2 className="text-2xl font-bold uppercase tracking-widest border-b border-white/20 pb-4">Tech Stack</h2>
                            <div className="flex flex-wrap gap-3 text-zinc-300 font-mono">
                                {[
                                    "ReactJS", "Tailwind CSS", "NodeJS", "ExpressJS", "Git", "GitHub", "Vercel",
                                    "C", "HTML", "CSS", "JavaScript", "Firebase", "TypeScript", "PostHog", "Render", "Docker", "Redis"
                                ].map(skill => (
                                    <span key={skill} className="rounded-full border border-white/10 bg-black/40 px-3 py-1 text-xs uppercase tracking-widest text-zinc-300">{skill}</span>
                                ))}
                            </div>
                        </div>

                        {/* Education */}
                        <div className="space-y-6">
                            <h2 className="text-2xl font-bold uppercase tracking-widest border-b border-white/20 pb-4">Education</h2>
                            <div className="space-y-1">
                                <h3 className="text-xl font-bold">Kalinga Institute of Industrial Technology</h3>
                                <p className="text-zinc-300">CSE - AI/ML</p>
                                <p className="text-zinc-500 font-mono">2024 – 2028</p>
                            </div>
                        </div>
                    </section>

                    {/* PROJECTS SECTION */}
                    <section id="projects" className="space-y-10 pt-10 border-t border-white/10 scroll-mt-24">
                        <header className="flex items-end justify-between border-b border-white/20 pb-4">
                            <h2 className="text-2xl font-bold uppercase tracking-widest">Projects</h2>
                            <span className="text-xs text-zinc-500">Selected Works</span>
                        </header>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {projects.map(project => (
                                <div
                                    key={project.id}
                                    className="group border border-white/10 rounded-2xl overflow-hidden bg-black/40 hover:bg-black/60 transition-all"
                                >
                                    {/* Live Preview with Iframe */}
                                    <div className="w-full h-64 border-b border-white/10 relative bg-zinc-900 overflow-hidden">
                                        {project.id === 4 ? (
                                            <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-zinc-900 via-zinc-800 to-black">
                                                <div className="text-center space-y-3">
                                                    <h3 className="text-2xl font-bold text-white">{project.name}</h3>
                                                    <p className="text-sm text-zinc-300">Preview disabled for this site.</p>
                                                    <div className="flex items-center justify-center gap-3">
                                                        <a
                                                            href={project.liveUrl}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="inline-flex items-center gap-2 px-4 py-2 bg-white text-black hover:bg-zinc-200 rounded-lg text-sm font-medium transition-colors"
                                                        >
                                                            <ExternalLink size={16} />
                                                            Visit Site
                                                        </a>
                                                        {project.githubUrl !== "#" && (
                                                            <a
                                                                href={project.githubUrl}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="inline-flex items-center gap-2 px-4 py-2 bg-zinc-800 text-white hover:bg-zinc-700 rounded-lg text-sm font-medium transition-colors"
                                                            >
                                                                <Github size={16} />
                                                                Code
                                                            </a>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        ) : project.id === 2 ? (
                                            previewErrors[project.id] ? (
                                                <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-zinc-900 via-zinc-800 to-black">
                                                    <div className="text-center space-y-3">
                                                        <h3 className="text-2xl font-bold text-white">{project.name}</h3>
                                                        <p className="text-sm text-zinc-300">Preview unavailable.</p>
                                                        <a
                                                            href={project.liveUrl}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="inline-flex items-center gap-2 px-4 py-2 bg-white text-black hover:bg-zinc-200 rounded-lg text-sm font-medium transition-colors"
                                                        >
                                                            <ExternalLink size={16} />
                                                            Visit Site
                                                        </a>
                                                    </div>
                                                </div>
                                            ) : (
                                                <>
                                                    <img
                                                        src="/linkit.png"
                                                        alt={`${project.name} preview`}
                                                        className="w-full h-full object-cover"
                                                        loading="lazy"
                                                        onError={() => setPreviewErrors(prev => ({ ...prev, [project.id]: true }))}
                                                    />
                                                    {/* Overlay to prevent interaction but show hover */}
                                                    <div className="absolute inset-0 bg-transparent cursor-pointer" />

                                                    {/* Header overlay with project info */}
                                                    <div className="absolute top-0 left-0 right-0 p-4 bg-gradient-to-b from-black/80 to-transparent">
                                                        <h3 className="text-xl font-bold text-white">{project.name}</h3>
                                                    </div>

                                                    {/* Hover overlay with links */}
                                                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                                                        <a
                                                            href={project.liveUrl}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="flex items-center gap-2 px-4 py-2 bg-white text-black hover:bg-zinc-200 rounded-lg text-sm font-medium transition-colors"
                                                            onClick={(e) => e.stopPropagation()}
                                                        >
                                                            <ExternalLink size={16} />
                                                            Visit Site
                                                        </a>
                                                        {project.githubUrl !== "#" && (
                                                            <a
                                                                href={project.githubUrl}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="flex items-center gap-2 px-4 py-2 bg-zinc-800 text-white hover:bg-zinc-700 rounded-lg text-sm font-medium transition-colors"
                                                                onClick={(e) => e.stopPropagation()}
                                                            >
                                                                <Github size={16} />
                                                                Code
                                                            </a>
                                                        )}
                                                    </div>
                                                </>
                                            )
                                        ) : (
                                            <>
                                                <iframe
                                                    src={project.liveUrl}
                                                    title={project.name}
                                                    className="w-full h-full border-0"
                                                    sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
                                                    loading="lazy"
                                                    style={{
                                                        transform: 'scale(0.8)',
                                                        transformOrigin: 'top left',
                                                        width: '125%',
                                                        height: '125%'
                                                    }}
                                                />
                                                {/* Overlay to prevent interaction but show hover */}
                                                <div className="absolute inset-0 bg-transparent cursor-pointer" />
                                                
                                                {/* Header overlay with project info */}
                                                <div className="absolute top-0 left-0 right-0 p-4 bg-gradient-to-b from-black/80 to-transparent">
                                                    <h3 className="text-xl font-bold text-white">{project.name}</h3>
                                                </div>

                                                {/* Hover overlay with links */}
                                                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                                                    <a
                                                        href={project.liveUrl}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="flex items-center gap-2 px-4 py-2 bg-white text-black hover:bg-zinc-200 rounded-lg text-sm font-medium transition-colors"
                                                        onClick={(e) => e.stopPropagation()}
                                                    >
                                                        <ExternalLink size={16} />
                                                        Visit Site
                                                    </a>
                                                    {project.githubUrl !== "#" && (
                                                        <a
                                                            href={project.githubUrl}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="flex items-center gap-2 px-4 py-2 bg-zinc-800 text-white hover:bg-zinc-700 rounded-lg text-sm font-medium transition-colors"
                                                            onClick={(e) => e.stopPropagation()}
                                                        >
                                                            <Github size={16} />
                                                            Code
                                                        </a>
                                                    )}
                                                </div>
                                            </>
                                        )}
                                    </div>

                                    {/* Content */}
                                    <div className="p-6 space-y-4">
                                        <div>
                                            <p className="text-sm text-zinc-400 leading-relaxed">{project.description}</p>
                                        </div>

                                        {/* Tech Stack */}
                                        <div className="flex flex-wrap gap-2">
                                            {project.tech.slice(0, 5).map((tech, idx) => (
                                                <span
                                                    key={idx}
                                                    className="text-xs px-2 py-1 rounded-full bg-black/60 border border-white/10 text-zinc-400"
                                                >
                                                    {tech}
                                                </span>
                                            ))}
                                            {project.tech.length > 5 && (
                                                <span className="text-xs px-2 py-1 rounded-full bg-black/60 border border-white/10 text-zinc-400">
                                                    +{project.tech.length - 5} more
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>

                    {/* MY GITHUB SECTION */}
                    <section id="github" className="space-y-10 pt-10 border-t border-white/10 scroll-mt-24">
                        <header className="flex flex-col gap-6 border-b border-white/20 pb-6">
                            <div className="flex items-end justify-between">
                                <h2 className="text-2xl font-bold uppercase tracking-widest">My Github</h2>
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
                                            aria-pressed={filterMode === tab.id}
                                            className={`px-3 py-1.5 text-xs font-medium border rounded-full transition-colors whitespace-nowrap ${filterMode === tab.id
                                                ? 'bg-[#E8DCC4] text-black border-[#E8DCC4]'
                                                : 'text-zinc-400 border-zinc-800 hover:border-zinc-600'
                                                }`}
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
                                    className="group block border border-white/10 p-6 transition-colors bg-black/40 hover:bg-black/60 rounded-2xl"
                                >
                                    <div className="flex justify-between items-start">
                                        <h3 className="text-xl font-bold">{repo.name}</h3>
                                        {repo.language && <span className="text-xs border border-white/10 px-2 py-1 text-zinc-500 rounded-full">{repo.language}</span>}
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
                    <section id="photos" className="space-y-10 pt-10 border-t border-white/10 scroll-mt-24">
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
                                        className="relative aspect-video bg-white p-2 overflow-hidden transition-all rounded-2xl shadow-lg hover:shadow-xl hover:shadow-white/20"
                                    >
                                    <div
                                        className="relative aspect-video bg-zinc-900 overflow-hidden rounded-xl"
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
                                            className="absolute inset-0 w-full h-full object-contain bg-black grayscale opacity-60 transition-transform duration-700 group-hover:scale-105"
                                        />

                                        {/* Color Reveal Layer (Spotlight) */}
                                        <img
                                            src={event.images[0]}
                                            alt={event.title}
                                            className="absolute inset-0 w-full h-full object-contain bg-black transition-transform duration-700 group-hover:scale-105"
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
                    <section id="posts" className="space-y-10 pt-10 border-t border-white/10 scroll-mt-24">
                        <header className="flex items-end justify-between border-b border-white/20 pb-4">
                            <h2 className="text-2xl font-bold uppercase tracking-widest">Posts</h2>
                            <span className="text-xs text-zinc-500">Source: Substack</span>
                        </header>

                        <div className="grid grid-cols-1 gap-8">
                            {postsLoading ? (
                                <p className="text-zinc-500 text-sm">Loading posts...</p>
                            ) : postsError ? (
                                <div className="text-zinc-500 text-sm space-y-3">
                                    <p>{postsError}</p>
                                    <button
                                        onClick={fetchSubstackPosts}
                                        className="text-xs uppercase tracking-widest border border-white/10 px-3 py-1.5 rounded-full hover:text-white hover:border-white/30 transition-colors"
                                    >
                                        Retry
                                    </button>
                                </div>
                            ) : posts.length > 0 ? (
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
                                <p className="text-zinc-500 text-sm">No posts yet.</p>
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
                            <div className="bg-white p-3 md:p-4 rounded-2xl shadow-2xl">
                            <motion.img
                                key={currentImageIndex}
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ duration: 0.2 }}
                                src={selectedEvent.images[currentImageIndex]}
                                alt={`Gallery image ${currentImageIndex + 1}`}
                                className="max-w-full max-h-full object-contain rounded-xl shadow-lg"
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
                            </div>

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
                                        className={`relative h-14 md:h-16 aspect-video transition-all flex-shrink-0 bg-white p-1 rounded-lg ${currentImageIndex === idx ? 'ring-2 ring-white scale-105' : 'opacity-50 hover:opacity-100'}`}
                                    >
                                        <img src={img} alt="thumbnail" className="w-full h-full object-cover rounded" />
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

