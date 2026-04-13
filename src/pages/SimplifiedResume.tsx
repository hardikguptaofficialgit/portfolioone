import React, { useState, useEffect, useRef, useCallback, memo } from 'react';
import { motion, AnimatePresence, useScroll, useTransform, useSpring, useInView, useMotionValue, useAnimationFrame } from 'framer-motion';
import {
    ChevronRight, X, ChevronLeft,
    Maximize2, Pin, Github, Linkedin, Instagram,
    Link, Star, GitFork, Download, ArrowUpRight, Clock,
    Menu,
    MapPin, Calendar, Sun, Moon, Mail, Terminal, Zap, Eye, Code2
} from 'lucide-react';
import { format } from 'date-fns';
import { fetchDevToArticles, type DevToArticle } from '@/lib/devto';
import photosData from '@/data/photos.json';

/* ─── Theme Context ──────────────────────────────────────────── */
type Theme = 'dark' | 'light';
const ThemeContext = React.createContext<{ theme: Theme; toggle: () => void }>({
    theme: 'dark',
    toggle: () => {},
});

const EASE_SMOOTH = [0.16, 1, 0.3, 1] as const;
const EASE_RIPPLE = [0.76, 0, 0.24, 1] as const;

/* ─── Noise SVG overlay (CSS) ─────────────────────────────── */
const NoiseOverlay = () => (
    <div
        aria-hidden
        className="pointer-events-none fixed inset-0 z-[5] opacity-[0.035]"
        style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
            backgroundRepeat: 'repeat',
            backgroundSize: '128px 128px',
            mixBlendMode: 'overlay',
        }}
    />
);

/* ─── Scroll Progress Bar ─────────────────────────────────── */
const ScrollProgress = ({ isDark }: { isDark: boolean }) => {
    const { scrollYProgress } = useScroll();
    const scaleX = useSpring(scrollYProgress, { stiffness: 100, damping: 30, restDelta: 0.001 });
    return (
        <motion.div
            className="fixed top-0 left-0 right-0 z-[200] h-[2px] origin-left"
            style={{
                scaleX,
                background: isDark
                    ? 'linear-gradient(90deg, #d0fffe, #a78bfa, #f9a8d4)'
                    : 'linear-gradient(90deg, #7b3e77, #c084fc, #f0abfc)',
            }}
        />
    );
};

/* ─── Magnetic cursor dot ─────────────────────────────────── */
const CursorDot = ({ isDark }: { isDark: boolean }) => {
    const cursorX = useMotionValue(-100);
    const cursorY = useMotionValue(-100);
    const springConfig = { damping: 25, stiffness: 700 };
    const cursorXSpring = useSpring(cursorX, springConfig);
    const cursorYSpring = useSpring(cursorY, springConfig);

    useEffect(() => {
        const move = (e: MouseEvent) => {
            cursorX.set(e.clientX - 6);
            cursorY.set(e.clientY - 6);
        };
        window.addEventListener('mousemove', move);
        return () => window.removeEventListener('mousemove', move);
    }, []);

    return (
        <motion.div
            className="pointer-events-none fixed z-[300] rounded-full mix-blend-difference"
            style={{
                left: cursorXSpring,
                top: cursorYSpring,
                width: 12,
                height: 12,
                background: isDark ? '#d0fffe' : '#7b3e77',
            }}
        />
    );
};

/* ─── Live Clock Widget ───────────────────────────────────── */
const LiveClock = ({ isDark, subtleText }: { isDark: boolean; subtleText: string }) => {
    const [time, setTime] = useState(new Date());
    useEffect(() => {
        const id = setInterval(() => setTime(new Date()), 1000);
        return () => clearInterval(id);
    }, []);
    return (
        <div className={`flex items-center gap-2 text-xs font-mono ${subtleText}`}>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>{time.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })}</span>
            <span className="opacity-50">IST</span>
        </div>
    );
};

/* ─── Glitch Text ─────────────────────────────────────────── */
const GlitchText = ({ text, className }: { text: string; className?: string }) => {
    const [isGlitching, setIsGlitching] = useState(false);
    useEffect(() => {
        const trigger = () => {
            setIsGlitching(true);
            setTimeout(() => setIsGlitching(false), 500);
        };
        const id = setInterval(trigger, 4000 + Math.random() * 3000);
        return () => clearInterval(id);
    }, []);

    return (
        <span className={`relative inline-block ${className}`} data-text={text}>
            {text}
            {isGlitching && (
                <>
                    <span
                        aria-hidden
                        className="absolute inset-0 text-[#d0fffe] opacity-70"
                        style={{ clipPath: 'polygon(0 30%, 100% 30%, 100% 50%, 0 50%)', transform: 'translate(-2px, 0)', mixBlendMode: 'screen' }}
                    >{text}</span>
                    <span
                        aria-hidden
                        className="absolute inset-0 text-[#f9a8d4] opacity-70"
                        style={{ clipPath: 'polygon(0 55%, 100% 55%, 100% 70%, 0 70%)', transform: 'translate(2px, 0)', mixBlendMode: 'screen' }}
                    >{text}</span>
                </>
            )}
        </span>
    );
};

/* ─── Section reveal wrapper ──────────────────────────────── */
const RevealSection = ({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) => {
    const ref = useRef(null);
    const isInView = useInView(ref, { once: true, margin: '-80px' });
    return (
        <motion.div
            ref={ref}
            initial={{ opacity: 0, y: 40, rotateX: 4 }}
            animate={isInView ? { opacity: 1, y: 0, rotateX: 0 } : {}}
            transition={{ duration: 0.7, delay, ease: EASE_SMOOTH }}
            style={{ transformPerspective: 1200 }}
        >
            {children}
        </motion.div>
    );
};

/* ─── Stagger list item ───────────────────────────────────── */
const StaggerItem = ({ children, index }: { children: React.ReactNode; index: number }) => {
    const ref = useRef(null);
    const isInView = useInView(ref, { once: true, margin: '-40px' });
    return (
        <motion.div
            ref={ref}
            initial={{ opacity: 0, x: -20 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.5, delay: index * 0.08, ease: EASE_SMOOTH }}
        >
            {children}
        </motion.div>
    );
};

/* ─── Terminal Easter Egg ─────────────────────────────────── */
const TerminalModal = ({ isDark, onClose }: { isDark: boolean; onClose: () => void }) => {
    const [input, setInput] = useState('');
    const [history, setHistory] = useState<{ cmd: string; out: string }[]>([
        { cmd: '', out: 'hardik@portfolio:~$ type "help" to get started' },
    ]);
    const inputRef = useRef<HTMLInputElement>(null);

    const commands: Record<string, string> = {
        help: '  whoami  · about me\n  skills  · tech stack\n  contact · get in touch\n  projects· my work\n  clear   · clear terminal\n  exit    · close terminal',
        whoami: 'Hardik Gupta — Full-stack engineer, SaaS founder.\nCSE (AI/ML) @ KIIT University 2024-2028.\nBuilding Linkit & NuviBrainz.',
        skills: 'Frontend: React, Next.js, TypeScript, Tailwind\nBackend : Node.js, Express, Firebase, Redis\nAI/ML  : OpenAI, Gemini, Llama, RAG\nDevOps : Docker, Vercel, Render',
        contact: 'Email    : hardikgupta8792@gmail.com\nGitHub   : github.com/hardikguptaofficialgit\nLinkedIn : linkedin.com/in/hardik-gupta-b528072b3\nTwitter  : @stryker_inside',
        projects: 'Linkit         · Link-in-bio SaaS (200+ creators)\nNuviBrainz     · AI JEE prep platform\nC25Go          · Campus nav PWA (15k students)\nPigglu Khelega · Real-time multiplayer game\nOpenSource Hire· OSS dev discovery engine\nVelocity Transit· Flutter transit app',
    };

    const run = (cmd: string) => {
        const trimmed = cmd.trim().toLowerCase();
        if (trimmed === 'clear') { setHistory([]); setInput(''); return; }
        if (trimmed === 'exit') { onClose(); return; }
        const out = commands[trimmed] ?? `command not found: ${trimmed}. Try "help".`;
        setHistory(h => [...h, { cmd, out }]);
        setInput('');
    };

    useEffect(() => { inputRef.current?.focus(); }, []);

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 20 }}
            transition={{ duration: 0.25, ease: EASE_SMOOTH }}
            className="fixed inset-0 z-[150] flex items-center justify-center p-4"
            onClick={onClose}
        >
            <motion.div
                className={`w-full max-w-2xl rounded-2xl border font-mono text-sm overflow-hidden shadow-2xl ${isDark ? 'bg-black border-zinc-700' : 'bg-[#1a1a1a] border-zinc-600'}`}
                onClick={e => e.stopPropagation()}
            >
                {/* Title bar */}
                <div className="flex items-center gap-2 px-4 py-3 bg-zinc-800 border-b border-zinc-700">
                    <button onClick={onClose} className="w-3 h-3 rounded-full bg-red-500 hover:bg-red-400" />
                    <div className="w-3 h-3 rounded-full bg-yellow-500" />
                    <div className="w-3 h-3 rounded-full bg-emerald-500" />
                    <span className="ml-auto text-xs text-zinc-400">hardik@portfolio — terminal</span>
                </div>
                {/* Output */}
                <div className="p-5 h-80 overflow-y-auto space-y-3 text-emerald-400">
                    {history.map((item, i) => (
                        <div key={i}>
                            {item.cmd && <div className="text-zinc-300"><span className="text-[#d0fffe]">hardik@portfolio:~$</span> {item.cmd}</div>}
                            <pre className="whitespace-pre-wrap text-emerald-400 text-xs leading-relaxed">{item.out}</pre>
                        </div>
                    ))}
                    {/* Input row */}
                    <div className="flex items-center gap-2 text-zinc-300">
                        <span className="text-[#d0fffe]">hardik@portfolio:~$</span>
                        <input
                            ref={inputRef}
                            value={input}
                            onChange={e => setInput(e.target.value)}
                            onKeyDown={e => { if (e.key === 'Enter') run(input); }}
                            className="flex-1 bg-transparent outline-none text-zinc-100 caret-[#d0fffe]"
                            autoComplete="off"
                            spellCheck={false}
                        />
                    </div>
                </div>
            </motion.div>
        </motion.div>
    );
};

/* ─── Floating status badge ───────────────────────────────── */
const FloatingBadge = ({ isDark }: { isDark: boolean }) => (
    <motion.div
        initial={{ opacity: 0, x: 40 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 1.4, duration: 0.6, ease: EASE_SMOOTH }}
        className={`fixed bottom-6 right-6 z-40 hidden md:flex items-center gap-2.5 rounded-2xl border px-4 py-2.5 text-xs font-medium backdrop-blur-xl shadow-lg ${isDark ? 'border-zinc-700 bg-zinc-900/80 text-zinc-300' : 'border-[#e7dacb] bg-[#fffaf1]/90 text-[#5f5248]'}`}
        style={{ fontFamily: 'monospace' }}
    >
        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
        open to internships · 2025
    </motion.div>
);

/* ─── X Brand Icon ────────────────────────────────────────── */
const XBrandIcon = ({ size = 18, className = '' }: { size?: number; className?: string }) => (
    <svg viewBox="0 0 24 24" width={size} height={size} className={className} fill="currentColor" aria-hidden="true">
        <path d="M18.901 2H21.98l-6.723 7.684L23.3 22h-6.297l-4.93-7.476L5.53 22H2.45l7.192-8.226L1.7 2h6.457l4.456 6.765L18.901 2Zm-1.104 18.1h1.706L7.23 3.805H5.4L17.797 20.1Z" />
    </svg>
);

/* ─── Tech Icons ──────────────────────────────────────────── */
const TechIcon = ({ name }: { name: string }) => {
    const icons: Record<string, JSX.Element> = {
        TypeScript: (<svg viewBox="0 0 24 24" width="14" height="14" fill="#3178c6"><path d="M1.125 0C.502 0 0 .502 0 1.125v21.75C0 23.498.502 24 1.125 24h21.75c.623 0 1.125-.502 1.125-1.125V1.125C24 .502 23.498 0 22.875 0zm17.363 9.75c.612 0 1.154.037 1.627.111a6.38 6.38 0 0 1 1.306.34v2.458a3.95 3.95 0 0 0-.643-.361 5.093 5.093 0 0 0-.717-.26 5.453 5.453 0 0 0-1.426-.2c-.3 0-.573.028-.819.086a2.1 2.1 0 0 0-.623.242c-.17.104-.3.229-.393.374a.888.888 0 0 0-.14.49c0 .196.053.373.156.529.104.156.252.304.443.444s.423.276.696.41c.273.135.582.274.926.416.47.197.892.407 1.266.628.374.222.695.473.963.753.268.279.472.598.614.957.142.359.214.776.214 1.253 0 .657-.125 1.21-.373 1.656a3.033 3.033 0 0 1-1.012 1.085 4.38 4.38 0 0 1-1.487.596c-.566.12-1.163.18-1.79.18a9.916 9.916 0 0 1-1.84-.164 5.544 5.544 0 0 1-1.512-.493v-2.63a5.033 5.033 0 0 0 3.237 1.2c.333 0 .624-.03.872-.09.249-.06.456-.144.623-.25.166-.108.29-.234.373-.38a1.023 1.023 0 0 0-.074-1.089 2.12 2.12 0 0 0-.537-.5 5.597 5.597 0 0 0-.807-.444 27.72 27.72 0 0 0-1.007-.436c-.918-.383-1.602-.852-2.053-1.405-.45-.553-.676-1.222-.676-2.005 0-.614.123-1.141.369-1.582.246-.441.58-.804 1.004-1.089a4.494 4.494 0 0 1 1.47-.629 7.536 7.536 0 0 1 1.77-.201zm-15.113.188h9.563v2.166H9.506v9.646H6.789v-9.646H3.375z"/></svg>),
        JavaScript: (<svg viewBox="0 0 24 24" width="14" height="14" fill="#f7df1e"><path d="M0 0h24v24H0V0zm22.034 18.276c-.175-1.095-.888-2.015-3.003-2.873-.736-.345-1.554-.585-1.797-1.14-.091-.33-.105-.51-.046-.705.15-.646.915-.84 1.515-.66.39.12.75.42.976.9 1.034-.676 1.034-.676 1.755-1.125-.27-.42-.404-.601-.586-.78-.63-.705-1.469-1.065-2.834-1.034l-.705.089c-.676.165-1.32.525-1.71 1.005-1.14 1.291-.811 3.541.569 4.471 1.365 1.02 3.361 1.244 3.616 2.205.24 1.17-.87 1.545-1.966 1.41-.811-.18-1.26-.586-1.755-1.336l-1.83 1.051c.21.48.45.689.81 1.109 1.74 1.756 6.09 1.666 6.871-1.004.029-.09.24-.705.074-1.65l.046.067zm-8.983-7.245h-2.248c0 1.938-.009 3.864-.009 5.805 0 1.232.063 2.363-.138 2.711-.33.689-1.18.601-1.566.48-.396-.196-.597-.466-.83-.855-.063-.105-.11-.196-.127-.196l-1.825 1.125c.305.63.75 1.172 1.324 1.517.855.51 2.004.675 3.207.405.783-.226 1.458-.691 1.811-1.411.51-.93.402-2.07.397-3.346.012-2.054 0-4.109 0-6.179l.004-.056z"/></svg>),
        Python: (<svg viewBox="0 0 24 24" width="14" height="14"><path fill="#3572A5" d="M11.914 0C5.82 0 6.2 2.656 6.2 2.656l.007 2.752h5.814v.826H3.882S0 5.789 0 11.969c0 6.18 3.403 5.963 3.403 5.963h2.034v-2.867s-.109-3.403 3.35-3.403h5.766s3.24.052 3.24-3.131V3.183S18.316 0 11.914 0zm-3.21 1.851a1.046 1.046 0 1 1-.001 2.093 1.046 1.046 0 0 1 .001-2.093z"/><path fill="#ffd43b" d="M12.086 24c6.094 0 5.714-2.656 5.714-2.656l-.007-2.752h-5.814v-.826h8.139S24 18.211 24 12.031c0-6.18-3.403-5.963-3.403-5.963h-2.034v2.867s.109 3.403-3.35 3.403H9.447s-3.24-.052-3.24 3.131v5.268S5.684 24 12.086 24zm3.21-1.851a1.046 1.046 0 1 1 .001-2.093 1.046 1.046 0 0 1-.001 2.093z"/></svg>),
        'React.js': (<svg viewBox="0 0 24 24" width="14" height="14" fill="#61DAFB"><path d="M14.23 12.004a2.236 2.236 0 0 1-2.235 2.236 2.236 2.236 0 0 1-2.236-2.236 2.236 2.236 0 0 1 2.235-2.236 2.236 2.236 0 0 1 2.236 2.236zm2.648-10.69c-1.346 0-3.107.96-4.888 2.622-1.78-1.653-3.542-2.602-4.887-2.602-.41 0-.783.093-1.106.278-1.375.793-1.683 3.264-.973 6.365C1.98 8.917 0 10.42 0 12.004c0 1.59 1.99 3.097 5.043 4.03-.704 3.113-.39 5.588.988 6.38.32.187.69.275 1.102.275 1.345 0 3.107-.96 4.888-2.624 1.78 1.654 3.542 2.603 4.887 2.603.41 0 .783-.09 1.106-.275 1.374-.792 1.683-3.263.973-6.365C22.02 15.096 24 13.59 24 12.004c0-1.59-1.99-3.097-5.043-4.032.704-3.11.39-5.587-.988-6.38-.318-.184-.688-.277-1.092-.278zm-.005 1.09c.725 0 1.173 1.06 1.173 2.81 0 .51-.041 1.078-.122 1.686a49.887 49.887 0 0 0-3.328-.831 49.716 49.716 0 0 0-2.297-3.018c1.048-.87 2.046-1.328 2.855-1.328zm-9.56.001c.808 0 1.805.457 2.853 1.324a49.785 49.785 0 0 0-2.294 3.02 49.887 49.887 0 0 0-3.33.833c-.295-1.96-.241-3.8.387-4.792.288-.467.723-.694 1.184-.694zm6.174 3.083a47.66 47.66 0 0 1 1.332 1.985 47.68 47.68 0 0 1-2.666 0c.213-.34.44-.678.677-1.012l.657-.973zm-2.696 1.985a47.67 47.67 0 0 1-1.332-1.985l.657.973c.237.334.464.672.675 1.012zm-3.924-.27a47.684 47.684 0 0 1 2.63-.832 47.804 47.804 0 0 1-.916 2.28 47.654 47.654 0 0 1-1.714-1.448zm10.498 1.447a47.649 47.649 0 0 1-1.714 1.45 47.818 47.818 0 0 1-.916-2.28 47.672 47.672 0 0 1 2.63.83zM12 13.396a47.697 47.697 0 0 1-1.602-.086 48.3 48.3 0 0 1-.987-1.843 47.745 47.745 0 0 1 .985-1.846 47.72 47.72 0 0 1 1.604-.086 47.72 47.72 0 0 1 1.604.086 47.765 47.765 0 0 1 .985 1.846 47.798 47.798 0 0 1-.985 1.843A47.742 47.742 0 0 1 12 13.396zm-2.354 1.5c.278.44.576.876.89 1.307l-.89 1.32c-.898-.98-1.636-1.974-2.187-2.914a47.742 47.742 0 0 1 2.187.287zm4.708 0c.74-.09 1.46-.187 2.187-.287-.55.94-1.288 1.933-2.187 2.914l-.89-1.32c.314-.43.612-.867.89-1.307zm-5.698 3.39c-.808 0-1.805-.457-2.853-1.325a49.827 49.827 0 0 0 2.294-3.02 49.884 49.884 0 0 0 3.33-.833c.295 1.96.241 3.8-.387 4.793-.288.467-.723.694-1.184.694zm9.56-.001c-.461 0-.896-.227-1.184-.694-.628-.993-.682-2.832-.387-4.792a49.887 49.887 0 0 0 3.328.83 49.716 49.716 0 0 0-2.294 3.018c-1.048.87-2.046 1.328-2.855 1.328z"/></svg>),
        'Next.js': (<svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor"><path d="M11.572 0c-.176 0-.31.001-.358.007a19.76 19.76 0 0 1-.364.033C7.443.346 4.25 2.185 2.228 5.012a11.875 11.875 0 0 0-2.119 5.243c-.096.659-.108.854-.108 1.747s.012 1.089.108 1.748c.652 4.506 3.86 8.292 8.209 9.695.779.25 1.6.422 2.534.525.363.04 1.935.04 2.299 0 1.611-.178 2.977-.577 4.323-1.264.207-.106.247-.134.219-.158-.02-.013-.9-1.193-1.955-2.62l-1.919-2.592-2.404-3.558a338.739 338.739 0 0 0-2.422-3.556c-.009-.002-.018 1.579-.023 3.51-.007 3.38-.01 3.515-.052 3.595a.426.426 0 0 1-.206.214c-.075.037-.14.044-.495.044H7.81l-.108-.068a.438.438 0 0 1-.157-.171l-.05-.106.006-4.703.007-4.705.072-.092a.645.645 0 0 1 .174-.143c.096-.047.134-.051.54-.051.478 0 .558.018.682.154.035.038 1.337 1.999 2.895 4.361a10760.433 10760.433 0 0 0 4.735 7.17l1.9 2.879.096-.063a12.317 12.317 0 0 0 2.466-2.163 11.944 11.944 0 0 0 2.824-6.134c.096-.66.108-.854.108-1.748 0-.893-.012-1.088-.108-1.747-.652-4.506-3.859-8.292-8.208-9.695a12.597 12.597 0 0 0-2.499-.523A33.119 33.119 0 0 0 11.573 0zm4.069 7.217c.347 0 .408.005.486.047a.473.473 0 0 1 .237.277c.018.06.023 1.365.018 4.304l-.006 4.218-.744-1.14-.746-1.14v-3.066c0-1.982.01-3.097.023-3.15a.478.478 0 0 1 .233-.296c.096-.05.13-.054.5-.054z"/></svg>),
        'Node.js': (<svg viewBox="0 0 24 24" width="14" height="14" fill="#339933"><path d="M11.998,24c-0.321,0-0.641-0.084-0.922-0.247l-2.936-1.737c-0.438-0.245-0.224-0.332-0.08-0.383c0.585-0.203,0.703-0.25,1.328-0.604c0.065-0.037,0.151-0.023,0.218,0.017l2.256,1.339c0.082,0.045,0.197,0.045,0.272,0l8.795-5.076c0.082-0.047,0.134-0.141,0.134-0.238V6.921c0-0.099-0.053-0.192-0.137-0.242l-8.791-5.072c-0.081-0.047-0.189-0.047-0.271,0L3.075,6.68C2.99,6.729,2.936,6.825,2.936,6.921v10.15c0,0.097,0.054,0.189,0.139,0.235l2.409,1.392c1.307,0.654,2.108-0.116,2.108-0.89V7.787c0-0.142,0.114-0.253,0.256-0.253h1.115c0.139,0,0.255,0.112,0.255,0.253v10.021c0,1.745-0.95,2.745-2.604,2.745c-0.508,0-0.909,0-2.026-0.551L2.28,18.675c-0.57-0.329-0.922-0.945-0.922-1.604V6.921c0-0.659,0.353-1.275,0.922-1.603l8.795-5.082c0.557-0.315,1.296-0.315,1.848,0l8.794,5.082c0.57,0.329,0.924,0.944,0.924,1.603v10.15c0,0.659-0.354,1.273-0.924,1.604l-8.794,5.078C12.643,23.916,12.324,24,11.998,24z"/></svg>),
        Flutter: (<svg viewBox="0 0 24 24" width="14" height="14" fill="#02569B"><path d="M14.314 0L2.3 12 6 15.7 21.684.013h-7.37zm.159 11.871l-5.77 5.767 5.77 5.767h7.348l-5.77-5.767 5.77-5.767h-7.348z"/></svg>),
        Firebase: (<svg viewBox="0 0 24 24" width="14" height="14"><path fill="#FFCA28" d="M3.89 15.672L6.255.461A.542.542 0 0 1 7.27.288l2.543 4.771zm16.794 3.39l-2.287-14.2a.54.54 0 0 0-.91-.281L3.89 15.672l7.812 4.406a1.623 1.623 0 0 0 1.586 0zM14.3 7.147l-1.82-3.482a.542.542 0 0 0-.96 0L3.89 15.672z"/></svg>),
        Docker: (<svg viewBox="0 0 24 24" width="14" height="14" fill="#2496ED"><path d="M13.983 11.078h2.119a.186.186 0 0 0 .186-.185V9.006a.186.186 0 0 0-.186-.186h-2.119a.185.185 0 0 0-.185.185v1.888c0 .102.083.185.185.185m-2.954-5.43h2.118a.186.186 0 0 0 .186-.186V3.574a.186.186 0 0 0-.186-.185h-2.118a.185.185 0 0 0-.185.185v1.888c0 .102.082.185.185.185m0 2.716h2.118a.187.187 0 0 0 .186-.186V6.29a.186.186 0 0 0-.186-.185h-2.118a.185.185 0 0 0-.185.185v1.887c0 .102.082.185.185.186m-2.93 0h2.12a.186.186 0 0 0 .184-.186V6.29a.185.185 0 0 0-.185-.185H8.1a.185.185 0 0 0-.185.185v1.887c0 .102.083.185.185.186m-2.964 0h2.119a.186.186 0 0 0 .185-.186V6.29a.185.185 0 0 0-.185-.185H5.136a.186.186 0 0 0-.186.185v1.887c0 .102.084.185.186.186m5.893 2.715h2.118a.186.186 0 0 0 .186-.185V9.006a.186.186 0 0 0-.186-.186h-2.118a.185.185 0 0 0-.185.185v1.888c0 .102.082.185.185.185m-2.93 0h2.12a.185.185 0 0 0 .184-.185V9.006a.185.185 0 0 0-.184-.186h-2.12a.185.185 0 0 0-.185.185v1.888c0 .102.083.185.185.185m-2.964 0h2.119a.185.185 0 0 0 .185-.185V9.006a.185.185 0 0 0-.184-.186h-2.12a.186.186 0 0 0-.186.186v1.887c0 .102.084.185.186.185m-2.92 0h2.12a.185.185 0 0 0 .184-.185V9.006a.185.185 0 0 0-.184-.186h-2.12a.185.185 0 0 0-.185.185v1.888c0 .102.082.185.185.185M23.763 9.89c-.065-.051-.672-.51-1.954-.51-.338.001-.676.03-1.01.087-.248-1.7-1.653-2.53-1.716-2.566l-.344-.199-.226.327c-.284.438-.49.922-.612 1.43-.23.97-.09 1.882.403 2.661-.595.332-1.55.413-1.744.42H.751a.751.751 0 0 0-.75.748 11.376 11.376 0 0 0 .692 4.062c.545 1.428 1.355 2.48 2.41 3.124 1.18.723 3.1 1.137 5.275 1.137.983.003 1.963-.086 2.93-.266a12.248 12.248 0 0 0 3.823-1.389c.98-.567 1.86-1.288 2.61-2.136 1.252-1.418 1.998-2.997 2.553-4.4h.221c1.372 0 2.215-.549 2.68-1.009.309-.293.55-.65.707-1.046l.098-.288Z"/></svg>),
        'Tailwind CSS': (<svg viewBox="0 0 24 24" width="14" height="14" fill="#06B6D4"><path d="M12.001,4.8c-3.2,0-5.2,1.6-6,4.8c1.2-1.6,2.6-2.2,4.2-1.8c0.913,0.228,1.565,0.89,2.288,1.624C13.666,10.618,15.027,12,18.001,12c3.2,0,5.2-1.6,6-4.8c-1.2,1.6-2.6,2.2-4.2,1.8c-0.913-0.228-1.565-0.89-2.288-1.624C16.337,6.182,14.976,4.8,12.001,4.8z M6.001,12c-3.2,0-5.2,1.6-6,4.8c1.2-1.6,2.6-2.2,4.2-1.8c0.913,0.228,1.565,0.89,2.288,1.624c1.177,1.194,2.538,2.576,5.512,2.576c3.2,0,5.2-1.6,6-4.8c-1.2,1.6-2.6,2.2-4.2,1.8c-0.913-0.228-1.565-0.89-2.288-1.624C10.337,13.382,8.976,12,6.001,12z"/></svg>),
        PostgreSQL: (<svg viewBox="0 0 24 24" width="14" height="14" fill="#4169E1"><path d="M23.5594 14.7228a.518.518 0 0 0-.0794-.063c-.198-.1193-1.3908-.5367-1.5812-.4489-.1094.0507-.2218.2226-.3299.3895-.1503.2285-.3061.4648-.5117.4976-.0239.0039-.0484.0056-.0739.0056-.2677 0-.5863-.1541-.8963-.3039-.3782-.183-.7692-.3722-1.132-.3017-.0097.0019-.0199.0041-.0302.0067-.0025-.027-.0052-.0561-.0079-.0884-.0363-.4336-.0999-1.1942.3659-1.8667l.0025-.0038c.0342-.0503.2196-.3225.5455-.3225.1049 0 .2085.0356.3132.0714.1261.0436.2564.0886.4147.0886.1104 0 .2172-.0239.3295-.0749.1626-.0737.2498-.1993.2498-.3572 0-.1501-.1077-.2866-.3208-.4057-.3038-.1672-.5694-.2087-.8078-.2087-.2753 0-.5143.0567-.7299.1059-.1616.0372-.3139.0723-.4378.0723-.1045 0-.1649-.0226-.2153-.0767-.1113-.1208-.0935-.3553-.0662-.6784.0189-.2251.0422-.505.0177-.8211-.0519-.6734-.3843-1.1117-.8726-1.1117-.3064 0-.5955.1695-.8139.4782-.2215.3133-.3637.7699-.4106 1.3232-.0149.1758-.0258.6035.0022.9286-.0513.0058-.1044.0116-.1588.0173-.2862.0303-.5768.061-.7996.1416-.1948.0703-.3024.1639-.3199.2783-.0183.1183.0623.229.1553.3003.1551.1186.4016.1854.7109.1938-.0097.0228-.0194.0452-.0291.0669-.1245.2841-.2523.5756-.2523 1.0006 0 .7444.4338 1.3082 1.0527 1.386.0378.0049.0754.0073.1126.0073.5029 0 .9989-.3491 1.3773-.9814l.0047-.0079c.0484-.082.2139-.3625.3697-.3625.0259 0 .0471.0077.0699.0265.4122.3393.5955.5015.7117.7099.0603.1082.0888.2315.0888.376 0 .2609-.0936.5462-.1836.8225-.0829.2567-.1613.499-.1613.7192 0 .2696.1141.4939.3301.6504.1739.1254.3988.1893.6694.1893.2745 0 .5553-.0657.8146-.1296.2463-.0614.5012-.1249.7357-.1249.2064 0 .3705.0485.5205.1527l.0064.0045c.0921.0635.1974.0956.3128.0956.3455 0 .6783-.3066.6783-.6301a.5584.5584 0 0 0-.1147-.3382z"/></svg>),
        Redis: (<svg viewBox="0 0 24 24" width="14" height="14" fill="#DC382D"><path d="M10.5 11.249l-3.938 1.612L10.5 14.47l3.937-1.609L10.5 11.249zm7.674 3.854l-7.673 3.137-7.673-3.137 7.673-3.137 7.673 3.137zM10.5 6.532L2.826 9.669 10.5 12.806l7.674-3.137-7.674-3.137zM10.5.005L0 4.385v15.23L10.5 24l10.5-4.385V4.385L10.5.005z"/></svg>),
        OpenAI: (<svg viewBox="0 0 24 24" width="14" height="14" fill="#10A37F"><path d="M22.282 9.821a5.985 5.985 0 0 0-.516-4.91 6.046 6.046 0 0 0-6.51-2.9A6.065 6.065 0 0 0 4.981 4.18a5.985 5.985 0 0 0-3.998 2.9 6.046 6.046 0 0 0 .743 7.097 5.98 5.98 0 0 0 .51 4.911 6.051 6.051 0 0 0 6.515 2.9A5.985 5.985 0 0 0 13.26 24a6.056 6.056 0 0 0 5.772-4.206 5.99 5.99 0 0 0 3.997-2.9 6.056 6.056 0 0 0-.747-7.073zM13.26 22.43a4.476 4.476 0 0 1-2.876-1.04l.141-.081 4.779-2.758a.795.795 0 0 0 .392-.681v-6.737l2.02 1.168a.071.071 0 0 1 .038.052v5.583a4.504 4.504 0 0 1-4.494 4.494zM3.6 18.304a4.47 4.47 0 0 1-.535-3.014l.142.085 4.783 2.759a.771.771 0 0 0 .78 0l5.843-3.369v2.332a.08.08 0 0 1-.033.062L9.74 19.95a4.5 4.5 0 0 1-6.14-1.646zM2.34 7.896a4.485 4.485 0 0 1 2.366-1.973V11.6a.766.766 0 0 0 .388.676l5.815 3.355-2.02 1.168a.076.076 0 0 1-.071 0l-4.83-2.786A4.504 4.504 0 0 1 2.34 7.872zm16.597 3.855l-5.843-3.372L15.115 7.2a.076.076 0 0 1 .071 0l4.83 2.791a4.494 4.494 0 0 1-.676 8.105v-5.678a.79.79 0 0 0-.403-.668zm2.01-3.023l-.141-.085-4.774-2.782a.776.776 0 0 0-.785 0L9.409 9.23V6.897a.066.066 0 0 1 .028-.061l4.83-2.787a4.5 4.5 0 0 1 6.68 4.66zm-12.64 4.135l-2.02-1.164a.08.08 0 0 1-.038-.057V6.075a4.5 4.5 0 0 1 7.375-3.453l-.142.08L8.704 5.46a.795.795 0 0 0-.393.681zm1.097-2.365l2.602-1.5 2.607 1.5v2.999l-2.597 1.5-2.607-1.5z"/></svg>),
        Vercel: (<svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor"><path d="M24 22.525H0l12-21.05 12 21.05z"/></svg>),
        'Socket.IO': (<svg viewBox="0 0 24 24" width="14" height="14" fill="#010101"><path d="M11.9-.001C5.35-.001.003 5.347.003 11.901c0 6.553 5.345 11.899 11.9 11.899 6.552 0 11.898-5.345 11.898-11.9C23.8 5.349 18.455 0 11.9 0zm6.165 6.139l-5.707 11.443-.246-7.528-5.421 2.573 5.707-11.443.246 7.528 5.421-2.573z"/></svg>),
        'GitHub API': (<svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor"><path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"/></svg>),
        'Express.js': (<svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor"><path d="M24 18.588a1.529 1.529 0 0 1-1.895-.72l-3.45-4.771-.5-.667-4.003 5.444a1.466 1.466 0 0 1-1.802.708l5.158-6.92-4.798-6.251a1.595 1.595 0 0 1 1.9.666l3.576 4.83 3.596-4.81a1.435 1.435 0 0 1 1.788-.668L21.708 7.9l-2.522 3.283a.666.666 0 0 0 0 .994l4.804 6.412zM.002 11.576l.42-2.075c1.154-4.103 5.858-5.81 9.094-3.27 1.895 1.489 2.368 3.597 2.275 5.973H1.116C.943 16.447 4.005 19.009 7.92 17.7a4.078 4.078 0 0 0 2.582-2.876c.207-.666.548-.78 1.174-.588a5.417 5.417 0 0 1-2.589 3.957 6.272 6.272 0 0 1-7.306-.933 6.575 6.575 0 0 1-1.64-3.858c0-.235-.08-.455-.134-.666A88.33 88.33 0 0 1 0 11.577zm1.127-.286h9.654c-.06-3.076-2.001-5.258-4.59-5.278-2.882-.04-4.944 2.094-5.071 5.264z"/></svg>),
        Dart: (<svg viewBox="0 0 24 24" width="14" height="14" fill="#0175C2"><path d="M4.105 4.105S9.158 1.58 11.684.316a3.079 3.079 0 0 1 1.481-.316 3.08 3.08 0 0 1 2.1.811l.003.002 7.467 7.467.002.003a3.081 3.081 0 0 1 .499 3.581c-1.263 2.527-3.788 7.579-3.788 7.579s-.001 0-.001.001c-.31.621-.944.999-1.641.999-.308 0-.615-.076-.892-.231C16.914 19.212 4.105 4.105 4.105 4.105z"/></svg>),
        Gemini: (<svg viewBox="0 0 24 24" width="14" height="14" fill="#8E75B2"><path d="M12 1.5c-.8 5.7-4.8 9.8-10.5 10.5C7.2 12.8 11.2 16.8 12 22.5c.8-5.7 4.8-9.7 10.5-10.5-5.7-.7-9.7-4.8-10.5-10.5z"/></svg>),
        Anthropic: (<svg viewBox="0 0 24 24" width="14" height="14" fill="#D4763B"><path d="M13.827 3.52h3.603L24 20h-3.603l-6.57-16.48zm-6.994 0H10.436L17 20h-3.603l-6.564-16.48z"/></svg>),
        Llama: (<svg viewBox="0 0 24 24" width="14" height="14" fill="#0467DF"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z"/></svg>),
        RAG: (<svg viewBox="0 0 24 24" width="14" height="14" fill="#9B59B6"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>),
        'Prompt Engineering': (<svg viewBox="0 0 24 24" width="14" height="14" fill="#E67E22"><path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm-5 14H4v-2h11v2zm5-4H4v-2h16v2zm0-4H4V8h16v2z"/></svg>),
        TensorFlow: (<svg viewBox="0 0 24 24" width="14" height="14" fill="#FF6F00"><path d="M22.374 9.704L12 3.97 1.626 9.704V21.17L12 15.436l10.374 5.735zM12 .03L24 6.97v10.06L12 23.97 0 17.03V6.97z"/></svg>),
        'C++': (<svg viewBox="0 0 24 24" width="14" height="14" fill="#00599C"><path d="M22.394 6c-.167-.29-.398-.543-.652-.69L12.926.22c-.509-.294-1.34-.294-1.848 0L2.26 5.31c-.508.293-.923 1.013-.923 1.6v10.18c0 .294.104.62.271.91.167.29.398.543.652.69l8.816 5.09c.508.293 1.34.293 1.848 0l8.816-5.09c.254-.147.485-.4.652-.69.167-.29.27-.616.27-.91V6.91c.003-.294-.1-.62-.268-.91zM12 19.11c-3.92 0-7.109-3.19-7.109-7.11 0-3.92 3.19-7.11 7.109-7.11a7.133 7.133 0 0 1 6.156 3.553l-3.076 1.78a3.567 3.567 0 0 0-3.08-1.78A3.555 3.555 0 0 0 8.444 12 3.555 3.555 0 0 0 12 15.555a3.57 3.57 0 0 0 3.08-1.778l3.078 1.78A7.135 7.135 0 0 1 12 19.11z"/></svg>),
        C: (<svg viewBox="0 0 24 24" width="14" height="14" fill="#A8B9CC"><path d="M16.5 9.4l-1.8-1.05A5.25 5.25 0 0 0 12 7.5a5.25 5.25 0 0 0-5.25 5.25A5.25 5.25 0 0 0 12 18a5.25 5.25 0 0 0 2.7-.75l1.8-1.05V19.5A7.5 7.5 0 0 1 12 21a7.5 7.5 0 0 1-7.5-7.5A7.5 7.5 0 0 1 12 6a7.5 7.5 0 0 1 4.5 1.5v1.9z"/></svg>),
        PHP: (<svg viewBox="0 0 24 24" width="14" height="14" fill="#777BB4"><path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2z"/></svg>),
        PostHog: (<svg viewBox="0 0 24 24" width="14" height="14" fill="#F54E00"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z"/></svg>),
        'MCP Servers': (<svg viewBox="0 0 24 24" width="14" height="14" fill="#D4763B"><path d="M13.827 3.52h3.603L24 20h-3.603l-6.57-16.48zm-6.994 0H10.436L17 20h-3.603l-6.564-16.48z"/></svg>),
        'HTML5': (<svg viewBox="0 0 24 24" width="14" height="14" fill="#E34F26"><path d="M1.5 0h21l-1.91 21.563L11.977 24l-8.565-2.438L1.5 0zm7.031 9.75l-.232-2.718 10.059.003.23-2.622L5.412 4.41l.698 8.01h9.126l-.326 3.426-2.91.804-2.955-.81-.188-2.11H6.248l.33 4.171L12 19.351l5.379-1.443.744-8.157H8.531z"/></svg>),
        'CSS3': (<svg viewBox="0 0 24 24" width="14" height="14" fill="#1572B6"><path d="M1.5 0h21l-1.91 21.563L11.977 24l-8.564-2.438L1.5 0zm17.09 4.413L5.41 4.41l.213 2.622 10.125.002-.255 2.716h-6.64l.24 2.573h6.182l-.366 3.523-2.91.804-2.956-.81-.188-2.11h-2.61l.29 3.855L12 19.288l5.373-1.53L18.59 4.414v-.001z"/></svg>),
        PWA: (<svg viewBox="0 0 24 24" width="14" height="14" fill="#5A0FC8"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z"/></svg>),
        'Google Maps': (<svg viewBox="0 0 24 24" width="14" height="14" fill="#4285F4"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>),
        Render: (<svg viewBox="0 0 24 24" width="14" height="14" fill="#46E3B7"><path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2z"/></svg>),
        'REST APIs': (<svg viewBox="0 0 24 24" width="14" height="14" fill="#FF5733"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/></svg>),
        WebSockets: (<svg viewBox="0 0 24 24" width="14" height="14" fill="#007ACC"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>),
    };
    return icons[name] || <span className="w-3.5 h-3.5 rounded-full bg-zinc-500 inline-block" />;
};

/* ─── helpers ──────────────────────────────────────────────── */
const langColor: Record<string, string> = {
    TypeScript: '#3178c6', JavaScript: '#f7df1e', Python: '#3572A5',
    CSS: '#563d7c', HTML: '#e44b23', Rust: '#dea584', Go: '#00ADD8',
    C: '#A8B9CC', 'C++': '#00599C', Shell: '#89e051', Dart: '#0175C2',
};

const calcDuration = (start: string, end?: string) => {
    const s = new Date(start);
    const e = end ? new Date(end) : new Date();
    let yrs = e.getFullYear() - s.getFullYear();
    let mos = e.getMonth() - s.getMonth();
    if (mos < 0) { yrs--; mos += 12; }
    if (yrs === 0 && mos === 0) return '1 mo';
    if (yrs === 0) return `${mos} mo${mos > 1 ? 's' : ''}`;
    if (mos === 0) return `${yrs} yr${yrs > 1 ? 's' : ''}`;
    return `${yrs} yr${yrs > 1 ? 's' : ''} ${mos} mo${mos > 1 ? 's' : ''}`;
};

const readingTime = (desc: string) => Math.max(1, Math.round(desc.split(' ').length / 200));

/* ─── static data ──────────────────────────────────────────── */
const techCategories = [
    { label: 'Languages', items: ['TypeScript', 'JavaScript', 'C++', 'C', 'Dart', 'PHP'] },
    { label: 'Frontend', items: ['React.js', 'Next.js', 'Flutter', 'Tailwind CSS', 'HTML5', 'CSS3', 'PWA'] },
    { label: 'Backend', items: ['Node.js', 'Express.js', 'REST APIs', 'WebSockets', 'Socket.IO', 'Redis'] },
    { label: 'AI / ML', items: ['OpenAI', 'Anthropic', 'Gemini', 'Llama', 'RAG', 'Prompt Engineering', 'TensorFlow'] },
    { label: 'DB & DevOps', items: ['Firebase', 'PostgreSQL', 'Docker', 'Vercel', 'Render', 'PostHog', 'MCP Servers'] },
];

const projects = [
    { id: 1, name: 'Linkit', tag: 'SaaS · 2025–Present', description: 'Linktree/Beacons-style link-in-bio platform serving 200+ creators. Drag-and-drop bio builder, real-time analytics, Cashfree payments, no-code form builder, and Linkit Studio - an AI creative suite for motion videos and slides.', tech: ['React.js', 'TypeScript', 'Firebase', 'Node.js', 'Cashfree'], liveUrl: 'https://linkitapp.in', githubUrl: '#', img: 'https://linkitapp.in/v1.png' },
    { id: 2, name: 'NuviBrainz', tag: 'EdTech · 2024–Present', description: 'AI-powered JEE exam prep platform with adaptive quizzes, personalised learning paths, and multi-LLM content generation across OpenAI, Gemini, and Llama.', tech: ['React.js', 'Node.js', 'Firebase', 'OpenAI', 'Gemini'], liveUrl: 'https://nuvibrainz.in', githubUrl: '#', img: 'https://res.cloudinary.com/ddx6avza4/image/upload/v1744129312/n_rz5riq.png' },
    { id: 3, name: 'C25Go', tag: 'PWA · 2025', description: "Indoor campus navigation PWA used by 15,000+ students. Shortest-path routing via Dijkstra's, offline-first architecture, and admin tooling for node/edge management.", tech: ['React.js', 'TypeScript', 'PWA', "Dijkstra's", 'Vercel'], liveUrl: 'https://campus25fed.vercel.app', githubUrl: 'https://github.com/hardikguptaofficialgit', img: null },
    { id: 4, name: 'Pigglu Khelega', tag: 'Multiplayer · 2025', description: 'Real-time multiplayer game with sub-100ms state sync across concurrent players using Socket.IO and Redis Pub/Sub.', tech: ['Node.js', 'Socket.IO', 'Redis', 'React.js', 'TypeScript'], liveUrl: '#', githubUrl: 'https://github.com/hardikguptaofficialgit', img: 'https://i.imgur.com/vzPtssA.png' },
    { id: 5, name: 'OpenSource Hire', tag: 'Dev Tool · 2025', description: 'Developer discovery engine surfacing engineering talent from open-source contribution signals via the GitHub API - replacing traditional resume screening.', tech: ['React.js', 'GitHub API', 'TypeScript', 'Vercel'], liveUrl: 'https://opensourcehire.vercel.app', githubUrl: 'https://github.com/hardikguptaofficialgit', img: 'https://opensourcehire.vercel.app/assets/logo-M4ZsasB2.png' },
    { id: 6, name: 'Velocity Transit', tag: 'Flutter · 2025', description: 'Multi-role Flutter transit app with real-time GPS tracking, live bus discovery, road-snapped route visualisation, and Socket.IO + Redis operations infrastructure.', tech: ['Flutter', 'Dart', 'Socket.IO', 'Redis', 'Google Maps'], liveUrl: '#', githubUrl: 'https://github.com/hardikguptaofficialgit', img: 'https://github.com/hardikguptaofficialgit/velocitytransit/blob/main/velocitytransitdark.png?raw=true' },
];

const achievements = [
    { title: 'YC Hackathon', detail: 'Selected from 2,000+ global applicants. Designed and shipped a full product under strict time constraints.', badge: 'Top Applicant' },
    { title: 'GDG Hackathon - Building Bad', detail: 'Winner. Demonstrated end-to-end product execution and cross-team collaboration.', badge: 'Winner' },
    { title: 'Bangalore Startup Residency', detail: 'Growth-focused startup residency covering product iteration and go-to-market strategy.', badge: 'Participant' },
];

const achievementIconSrc = {
    yc: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRHZEuWg1DSjG7W9DQ1Yl4ti8wj4I2DlGjZvg&s',
    gdg: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSx1ifvMfrD9VzaphHBYLhM6wUV-YHR0g28Ow&s',
    residency: 'https://cdn.prod.website-files.com/62f41dee5606d80f65b7dcbb/6676ffc8dcc184ba44858820_the_residency_logo.svg',
} as const;

const achievementIconBg: Record<keyof typeof achievementIconSrc, string> = {
    yc: '#FB651E', gdg: '#FFFFFF', residency: '#FFFFFF',
};

const getAchievementIconKey = (title: string): keyof typeof achievementIconSrc => {
    if (title.includes('YC')) return 'yc';
    if (title.includes('GDG')) return 'gdg';
    return 'residency';
};

const navItems = [
    { id: 'resume', label: 'Resume' },
    { id: 'projects', label: 'Projects' },
    { id: 'github', label: 'GitHub' },
    { id: 'photos', label: 'Photos' },
    { id: 'posts', label: 'Posts' },
    { id: 'contact', label: 'Contact', isAction: true },
];

/* ═══════════════════════════════════════════════════════════ */
/*  MAIN COMPONENT                                             */
/* ═══════════════════════════════════════════════════════════ */
const SimplifiedResume = () => {
    const [theme, setTheme] = useState<Theme>('dark');
    const [activeSection, setActiveSection] = useState('resume');
    const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
    // FIXED: single state flag controls the ripple
    const [rippleKey, setRippleKey] = useState(0);
    const [rippleTheme, setRippleTheme] = useState<Theme | null>(null);
    const [repos, setRepos] = useState<any[]>([]);
    const [filteredRepos, setFilteredRepos] = useState<any[]>([]);
    const [posts, setPosts] = useState<DevToArticle[]>([]);
    const [postsLoading, setPostsLoading] = useState(true);
    const [postsError, setPostsError] = useState<string | null>(null);
    const [filterMode, setFilterMode] = useState<'top' | 'latest' | 'pushed' | 'all'>('top');
    const [searchQuery, setSearchQuery] = useState('');
    const [previewErrors, setPreviewErrors] = useState<Record<number, boolean>>({});
    const [selectedProject, setSelectedProject] = useState<(typeof projects)[number] | null>(null);
    const [selectedEvent, setSelectedEvent] = useState<typeof photosData[0] | null>(null);
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const [projectControlsCollapsed, setProjectControlsCollapsed] = useState(false);
    const [projectControlsPos, setProjectControlsPos] = useState({ x: 16, y: 16 });
    const [isDraggingProjectControls, setIsDraggingProjectControls] = useState(false);
    const [showTerminal, setShowTerminal] = useState(false);
    const dragOffsetRef = useRef({ x: 0, y: 0 });
    const rippleTimerRef = useRef<number | null>(null);

    const isDark = theme === 'dark';

    const sortedEvents = [...photosData].sort((a, b) =>
        a.pinned === b.pinned ? 0 : a.pinned ? -1 : 1
    );

    useEffect(() => {
        fetch('https://api.github.com/users/hardikguptaofficialgit/repos?per_page=100')
            .then(r => r.json())
            .then(d => Array.isArray(d) && setRepos(d))
            .catch(() => {});
    }, []);

    useEffect(() => {
        let list = [...repos];
        if (filterMode === 'top') list.sort((a, b) => b.stargazers_count - a.stargazers_count);
        else if (filterMode === 'latest') list.sort((a, b) => +new Date(b.updated_at) - +new Date(a.updated_at));
        else if (filterMode === 'pushed') list.sort((a, b) => +new Date(b.pushed_at) - +new Date(a.pushed_at));
        if (searchQuery) {
            const q = searchQuery.toLowerCase();
            list = list.filter(r => r.name?.toLowerCase().includes(q) || r.description?.toLowerCase().includes(q));
        }
        if (filterMode === 'top') list = list.slice(0, 10);
        setFilteredRepos(list);
    }, [repos, filterMode, searchQuery]);

    const fetchDevToPosts = useCallback(async () => {
        setPostsLoading(true); setPostsError(null);
        const username = import.meta.env.VITE_DEV_USERNAME || 'strykerinside';
        try {
            const articles = await fetchDevToArticles(username, 10);
            setPosts(articles);
            setPostsLoading(false);
        } catch {
            setPosts([]);
            setPostsError('Unable to load posts from DEV.to right now.');
            setPostsLoading(false);
        }
    }, []);

    useEffect(() => { fetchDevToPosts(); }, [fetchDevToPosts]);

    useEffect(() => {
        const ids = ['resume', 'projects', 'github', 'photos', 'posts'];
        const sections = ids.map(id => document.getElementById(id)).filter(Boolean) as HTMLElement[];
        if (!sections.length) return;
        const vis = new Map<string, number>();
        const obs = new IntersectionObserver(entries => {
            entries.forEach(e => vis.set(e.target.id, e.intersectionRatio));
            let best = activeSection, bestR = -1;
            vis.forEach((r, id) => { if (r > bestR) { bestR = r; best = id; } });
            if (best && best !== activeSection) setActiveSection(best);
        }, { rootMargin: '-15% 0px -55% 0px', threshold: [0, 0.1, 0.25, 0.5, 0.75, 1] });
        sections.forEach(s => obs.observe(s));
        return () => obs.disconnect();
    }, [activeSection]);

    const scrollTo = (id: string) => {
        setActiveSection(id);
        setIsMobileNavOpen(false);
        document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
    };

    const openGallery = (ev: typeof photosData[0]) => { setSelectedEvent(ev); setCurrentImageIndex(0); };
    const nextImg = (e?: React.MouseEvent) => {
        e?.stopPropagation();
        setCurrentImageIndex(p => selectedEvent ? (p + 1) % selectedEvent.images.length : 0);
    };
    const prevImg = (e?: React.MouseEvent) => {
        e?.stopPropagation();
        setCurrentImageIndex(p => selectedEvent ? (p - 1 + selectedEvent.images.length) % selectedEvent.images.length : 0);
    };

    useEffect(() => {
        if (!selectedEvent) return;
        const handler = (e: KeyboardEvent) => {
            if (e.key === 'ArrowRight') nextImg();
            else if (e.key === 'ArrowLeft') prevImg();
            else if (e.key === 'Escape') setSelectedEvent(null);
        };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, [selectedEvent, currentImageIndex]);

    useEffect(() => {
        if (!selectedProject) return;
        const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') setSelectedProject(null); };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, [selectedProject]);

    useEffect(() => {
        if (!selectedProject) return;
        setProjectControlsCollapsed(false);
        setProjectControlsPos({ x: 16, y: 16 });
        setIsDraggingProjectControls(false);
    }, [selectedProject]);

    const handleProjectControlsPointerDown = (e: React.PointerEvent<HTMLElement>) => {
        setIsDraggingProjectControls(true);
        dragOffsetRef.current = { x: e.clientX - projectControlsPos.x, y: e.clientY - projectControlsPos.y };
        e.currentTarget.setPointerCapture(e.pointerId);
    };
    const handleProjectControlsPointerMove = (e: React.PointerEvent<HTMLElement>) => {
        if (!isDraggingProjectControls) return;
        const panelWidth = projectControlsCollapsed ? 52 : 320;
        const panelHeight = projectControlsCollapsed ? 52 : 56;
        const nextX = Math.max(8, Math.min(window.innerWidth - panelWidth - 8, e.clientX - dragOffsetRef.current.x));
        const nextY = Math.max(8, Math.min(window.innerHeight - panelHeight - 8, e.clientY - dragOffsetRef.current.y));
        setProjectControlsPos({ x: nextX, y: nextY });
    };
    const handleProjectControlsPointerUp = (e: React.PointerEvent<HTMLElement>) => {
        if (!isDraggingProjectControls) return;
        setIsDraggingProjectControls(false);
        e.currentTarget.releasePointerCapture(e.pointerId);
    };

    useEffect(() => {
        document.body.style.overflow = 'auto';
        document.documentElement.style.overflow = 'auto';
    }, []);

    useEffect(() => () => { if (rippleTimerRef.current) window.clearTimeout(rippleTimerRef.current); }, []);

    /* ── FIXED THEME TOGGLE ── */
    const toggleTheme = useCallback(() => {
        const next: Theme = theme === 'dark' ? 'light' : 'dark';
        // 1. show ripple for next theme immediately
        setRippleTheme(next);
        setRippleKey(k => k + 1);
        // 2. after ripple fully covers screen (~160ms), flip the theme
        if (rippleTimerRef.current) window.clearTimeout(rippleTimerRef.current);
        rippleTimerRef.current = window.setTimeout(() => {
            setTheme(next);
            // 3. ripple stays a moment so the new theme is visible under it, then fades out
            rippleTimerRef.current = window.setTimeout(() => {
                setRippleTheme(null);
            }, 320);
        }, 160);
    }, [theme]);

    // ── theme-aware classes
    const bg = isDark ? 'bg-[#09090b]' : 'bg-[#fffef9]';
    const bgImage = isDark ? '/bgdarkimage.png' : '/bgimage.png';
    const text = isDark ? 'text-zinc-100' : 'text-[#1f1a17]';
    const navBg = isDark ? 'bg-[#09090b]/90 border-zinc-800' : 'bg-[#fffef9]/90 border-[#e6d8cb]';
    const mutedText = isDark ? 'text-zinc-400' : 'text-[#5f5248]';
    const subtleText = isDark ? 'text-zinc-500' : 'text-[#7d6b5c]';
    const cardBg = isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-[#fffaf1] border-[#e7dacb]';
    const accent = isDark ? 'text-[#d0fffe]' : 'text-[#7b3e77]';
    const accentBorder = isDark ? 'border-[#d0fffe]/40 text-[#d0fffe]' : 'border-[#d39ad0] text-[#7b3e77]';
    const accentHover = isDark ? 'hover:bg-[#d0fffe] hover:text-black' : 'hover:bg-[#ffd3fd] hover:text-[#3f2a3d]';
    const divider = isDark ? 'border-zinc-800' : 'border-[#e7dacb]';
    const tagBg = isDark ? 'bg-zinc-900 border-zinc-800 text-zinc-400' : 'bg-[#fffddb] border-[#e9ddba] text-[#6b5c4f]';
    const inputBg = isDark ? 'bg-zinc-950 border-zinc-800 text-zinc-100 placeholder:text-zinc-600' : 'bg-[#fffef9] border-[#d9cabd] text-[#1f1a17] placeholder:text-[#9a8a7d]';
    const filterActive = isDark ? 'bg-zinc-100 text-zinc-900 border-zinc-100' : 'bg-[#ffd3fd] text-[#4f2d4c] border-[#dba5d7]';
    const filterInactive = isDark ? 'text-zinc-500 border-zinc-800 hover:text-zinc-300 hover:border-zinc-700' : 'text-[#7b6b5e] border-[#d9cabd] hover:text-[#3a312b] hover:border-[#bfaea0]';
    const labelText = isDark ? 'text-zinc-500' : 'text-[#6f5b4e]';
    const shellBase = isDark
        ? 'rounded-2xl border border-zinc-800 bg-zinc-950/80 backdrop-blur-sm p-6 md:p-8'
        : 'rounded-2xl border-2 border-[#d8c8b9] p-6 md:p-8 shadow-[6px_6px_0_0_rgba(80,58,41,0.16)]';

    /* ─ page entrance stagger ─ */
    const containerVariants = {
        hidden: {},
        visible: { transition: { staggerChildren: 0.12 } },
    };
    const childVariants = {
        hidden: { opacity: 0, y: 32 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.7, ease: EASE_SMOOTH } },
    };

    return (
        <ThemeContext.Provider value={{ theme, toggle: toggleTheme }}>
            <div className={`relative min-h-screen w-full overflow-x-hidden overflow-y-auto ${bg} ${text} font-sans antialiased selection:bg-[#ffd3fd] selection:text-[#271b27] transition-colors duration-500`}
                style={{ backgroundImage: `url('${bgImage}')`, backgroundSize: 'cover', backgroundPosition: 'center', backgroundAttachment: 'fixed' }}>

                {/* ── Noise & dim overlays ── */}
                <NoiseOverlay />
                <div aria-hidden className={`pointer-events-none absolute inset-0 z-[1] ${isDark ? 'bg-black/72' : 'bg-white/55'} transition-colors duration-500`} />

                {/* ── Scroll progress ── */}
                <ScrollProgress isDark={isDark} />

                {/* ── Cursor dot (desktop only) ── */}
                <div className="hidden md:block">
                    <CursorDot isDark={isDark} />
                </div>

                {/* ── FIXED Theme ripple ── */}
                <AnimatePresence>
                    {rippleTheme && (
                        <motion.div
                            key={rippleKey}
                            initial={{ clipPath: 'circle(0% at 98% 100%)' }}
                            animate={{ clipPath: 'circle(160% at 98% 100%)' }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.55, ease: EASE_RIPPLE }}
                            className={`pointer-events-none fixed inset-0 z-[89] ${rippleTheme === 'dark' ? 'bg-[#09090b]' : 'bg-[#fffef9]'}`}
                        />
                    )}
                </AnimatePresence>

                {/* ── Terminal modal ── */}
                <AnimatePresence>
                    {showTerminal && (
                        <TerminalModal isDark={isDark} onClose={() => setShowTerminal(false)} />
                    )}
                </AnimatePresence>

                {/* ── Floating status badge ── */}
                <FloatingBadge isDark={isDark} />

                {/* ══════════ NAV ══════════ */}
                <motion.nav
                    initial={{ y: -60, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ duration: 0.6, ease: EASE_SMOOTH }}
                    className={`fixed top-[2px] left-0 right-0 z-50 border-b ${navBg} backdrop-blur-xl transition-all duration-500`}
                >
                    <div className="max-w-6xl mx-auto px-4 md:px-6 py-3 md:py-4 flex items-center justify-between gap-3">
                        <button onClick={() => scrollTo('resume')}
                            className={`flex items-center gap-2.5 text-sm font-bold tracking-wider uppercase ${isDark ? 'text-zinc-100' : 'text-zinc-900'} transition-colors`}>
                            <motion.img
                                src="/harvix_logo.png" alt="Harvix logo"
                                className="h-8 w-8 rounded-md object-cover border border-white/20"
                                whileHover={{ rotate: [0, -8, 8, 0] }}
                                transition={{ duration: 0.4 }}
                            />
                            <span className="text-xs sm:text-sm">stryker.inside</span>
                        </button>

                        <div className="hidden lg:flex items-center gap-1">
                            {navItems.map((item, i) => (
                                <motion.button
                                    key={item.id}
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.1 + i * 0.06, duration: 0.4 }}
                                    onClick={() => item.id === 'contact'
                                        ? (window.location.href = 'mailto:hardikgupta8792@gmail.com')
                                        : scrollTo(item.id)}
                                    className={`relative px-4 py-2 text-xs font-medium tracking-wide uppercase transition-all duration-300 rounded-lg overflow-hidden ${
                                        activeSection === item.id && !item.isAction
                                            ? isDark ? 'text-zinc-100 bg-zinc-800' : 'text-zinc-900 bg-zinc-200'
                                            : isDark ? 'text-zinc-500 hover:text-zinc-300' : 'text-zinc-500 hover:text-zinc-700'
                                    }`}
                                    whileHover={{ scale: 1.04 }}
                                    whileTap={{ scale: 0.96 }}
                                >
                                    {item.label}
                                    {activeSection === item.id && !item.isAction && (
                                        <motion.div
                                            layoutId="nav-pill"
                                            className={`absolute inset-0 rounded-lg -z-10 ${isDark ? 'bg-zinc-800' : 'bg-zinc-200'}`}
                                            transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                                        />
                                    )}
                                </motion.button>
                            ))}
                        </div>

                        <div className="flex items-center gap-2 md:gap-3">
                            {/* Live clock */}
                            <div className="hidden xl:block">
                                <LiveClock isDark={isDark} subtleText={subtleText} />
                            </div>

                            {/* Terminal button */}
                            <motion.button
                                onClick={() => setShowTerminal(true)}
                                whileHover={{ scale: 1.08 }}
                                whileTap={{ scale: 0.92 }}
                                className={`hidden md:flex h-8 w-8 items-center justify-center rounded-lg border transition-colors ${isDark ? 'border-zinc-700 bg-zinc-900 text-[#d0fffe] hover:bg-zinc-800' : 'border-zinc-300 bg-zinc-100 text-[#7b3e77] hover:bg-zinc-200'}`}
                                title="Open terminal"
                            >
                                <Terminal size={14} />
                            </motion.button>

                            {/* FIXED Theme toggle */}
                            <motion.button
                                onClick={toggleTheme}
                                whileTap={{ scale: 0.93 }}
                                transition={{ type: 'spring', stiffness: 420, damping: 24 }}
                                className={`relative h-8 w-14 rounded-full p-1 border overflow-hidden ${isDark ? 'bg-zinc-900 border-zinc-700' : 'bg-zinc-100 border-zinc-300'}`}
                                aria-label="Toggle theme"
                            >
                                <motion.div
                                    className={`absolute inset-0 ${isDark ? 'bg-[radial-gradient(circle_at_20%_20%,#2f3a58_0%,#0b0d16_55%)]' : 'bg-[radial-gradient(circle_at_80%_20%,#ffe89a_0%,#ffd3fd_55%,#f4f4f5_100%)]'}`}
                                    initial={false}
                                    animate={{ opacity: 1 }}
                                    transition={{ duration: 0.35 }}
                                />
                                <motion.div
                                    className={`relative z-10 w-6 h-6 rounded-full border flex items-center justify-center shadow ${isDark ? 'bg-zinc-950 border-zinc-700' : 'bg-white border-zinc-300'}`}
                                    animate={{ x: isDark ? 24 : 0 }}
                                    transition={{ type: 'spring', stiffness: 500, damping: 32, mass: 0.7 }}
                                >
                                    <AnimatePresence mode="wait" initial={false}>
                                        {isDark ? (
                                            <motion.div key="moon"
                                                initial={{ opacity: 0, rotate: -120, scale: 0.75 }}
                                                animate={{ opacity: 1, rotate: 0, scale: 1 }}
                                                exit={{ opacity: 0, rotate: 120, scale: 0.75 }}
                                                transition={{ duration: 0.28, ease: 'easeOut' }}>
                                                <Moon size={14} className="text-[#d0fffe]" />
                                            </motion.div>
                                        ) : (
                                            <motion.div key="sun"
                                                initial={{ opacity: 0, rotate: 120, scale: 0.75 }}
                                                animate={{ opacity: 1, rotate: 0, scale: 1 }}
                                                exit={{ opacity: 0, rotate: -120, scale: 0.75 }}
                                                transition={{ duration: 0.28, ease: 'easeOut' }}>
                                                <Sun size={14} className="text-[#7b3e77]" />
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </motion.div>
                            </motion.button>

                            <a href="/" className={`hidden md:flex items-center gap-1 text-xs font-medium uppercase tracking-wider transition-colors ${isDark ? 'text-zinc-500 hover:text-zinc-300' : 'text-zinc-500 hover:text-zinc-700'}`}>
                                <span>OS</span><ArrowUpRight size={12} />
                            </a>

                            <motion.button
                                onClick={() => setIsMobileNavOpen(v => !v)}
                                whileTap={{ scale: 0.9 }}
                                className={`lg:hidden flex h-9 w-9 items-center justify-center rounded-lg border transition-colors ${isDark ? 'border-zinc-700 bg-zinc-900 text-zinc-200 hover:bg-zinc-800' : 'border-zinc-300 bg-zinc-100 text-zinc-700 hover:bg-zinc-200'}`}>
                                <Menu size={16} />
                            </motion.button>
                        </div>
                    </div>

                    <AnimatePresence>
                        {isMobileNavOpen && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                transition={{ duration: 0.3, ease: EASE_SMOOTH }}
                                className={`lg:hidden overflow-hidden border-t ${isDark ? 'border-zinc-800 bg-zinc-950/95' : 'border-[#e6d8cb] bg-[#fffef9]/95'} backdrop-blur-xl px-4 pb-4 pt-3`}
                            >
                                <div className="grid grid-cols-2 gap-2">
                                    {navItems.map((item, i) => (
                                        <motion.button
                                            key={item.id}
                                            initial={{ opacity: 0, y: 8 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: i * 0.04 }}
                                            onClick={() => item.id === 'contact'
                                                ? (window.location.href = 'mailto:hardikgupta8792@gmail.com')
                                                : scrollTo(item.id)}
                                            className={`px-3 py-2.5 text-xs font-semibold tracking-wide uppercase rounded-lg border transition-all duration-300 ${
                                                activeSection === item.id && !item.isAction
                                                    ? isDark ? 'text-zinc-100 bg-zinc-800 border-zinc-700' : 'text-zinc-900 bg-zinc-200 border-zinc-300'
                                                    : isDark ? 'text-zinc-400 border-zinc-800 hover:text-zinc-100 hover:bg-zinc-900' : 'text-zinc-600 border-zinc-300 hover:text-zinc-900 hover:bg-zinc-100'
                                            }`}
                                        >{item.label}</motion.button>
                                    ))}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </motion.nav>

                {/* ══════════ BODY ══════════ */}
                <div className="relative z-10 w-full px-4 md:px-10 lg:px-16 pt-28 pb-12">
                    <motion.div
                        variants={containerVariants}
                        initial="hidden"
                        animate="visible"
                        className="max-w-5xl mx-auto space-y-24"
                    >

                        {/* ══ RESUME ══ */}
                        <motion.section variants={childVariants} id="resume" className={`space-y-12 scroll-mt-32 ${shellBase} ${isDark ? '' : 'bg-[#fffddb]'}`}>

                            {/* Header */}
                            <header className={`space-y-6 pb-10 border-b ${divider}`}>
                                <motion.div
                                    className="flex items-center gap-2"
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: 0.4 }}
                                >
                                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                    <span className={`text-xs ${subtleText} tracking-widest uppercase`}>Available for internships · 2025</span>
                                </motion.div>

                                <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-8">
                                    <div className="space-y-3">
                                        <motion.p
                                            className={`text-xs uppercase tracking-[0.3em] ${subtleText}`}
                                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
                                        >Software Engineer</motion.p>
                                        <motion.h1
                                            className="text-5xl md:text-6xl font-bold tracking-tight leading-none"
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: 0.55, duration: 0.7, ease: EASE_SMOOTH }}
                                        >
                                            <GlitchText text="Hardik Gupta" />
                                        </motion.h1>
                                        <motion.p
                                            className={`${mutedText} text-base max-w-lg leading-relaxed`}
                                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.65 }}
                                        >
                                            Full-stack engineer and SaaS founder. 2+ years shipping production-grade web apps, AI-integrated platforms, and real-time systems.
                                        </motion.p>
                                        <motion.div
                                            className={`flex flex-wrap items-center gap-x-4 gap-y-1.5 text-sm ${subtleText}`}
                                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.72 }}
                                        >
                                            <span className="flex items-center gap-1.5"><MapPin size={12} /> Jaipur, India</span>
                                            <span>·</span>
                                            <a href="https://strykerinside.vercel.app" target="_blank" rel="noopener noreferrer"
                                                className="hover:text-zinc-100 transition-colors underline decoration-zinc-400 underline-offset-4">Portfolio</a>
                                            <span>·</span>
                                            <a href="mailto:hardikgupta8792@gmail.com"
                                                className="hover:text-zinc-100 transition-colors underline decoration-zinc-400 underline-offset-4">hardikgupta8792@gmail.com</a>
                                        </motion.div>
                                    </div>

                                    <motion.div
                                        className="flex flex-col gap-4 items-start lg:items-end shrink-0"
                                        initial={{ opacity: 0, x: 20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: 0.7, duration: 0.6 }}
                                    >
                                        <motion.a
                                            href="/resume.pdf" download
                                            whileHover={{ scale: 1.04, y: -2 }}
                                            whileTap={{ scale: 0.97 }}
                                            className={`inline-flex items-center gap-2 px-5 py-2.5 border ${accentBorder} text-sm tracking-wider uppercase rounded-lg ${accentHover} transition-all duration-300`}
                                        >
                                            <Download size={14} /> Download CV
                                        </motion.a>
                                        <div className="flex gap-4">
                                            {[
                                                { href: 'https://github.com/hardikguptaofficialgit', icon: <Github size={18} /> },
                                                { href: 'https://www.linkedin.com/in/hardik-gupta-b528072b3/', icon: <Linkedin size={18} /> },
                                                { href: 'https://www.instagram.com/stryker.inside/', icon: <Instagram size={18} /> },
                                                { href: 'https://x.com/stryker_inside', icon: <XBrandIcon size={18} /> },
                                                { href: 'https://linkitapp.in/harvix', icon: <Link size={18} /> },
                                            ].map(({ href, icon }, i) => (
                                                <motion.a
                                                    key={href} href={href} target="_blank" rel="noopener noreferrer"
                                                    className={`${subtleText} hover:${isDark ? 'text-zinc-100' : 'text-zinc-900'} transition-colors duration-300`}
                                                    whileHover={{ scale: 1.25, y: -3 }}
                                                    whileTap={{ scale: 0.9 }}
                                                    initial={{ opacity: 0, y: 10 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    transition={{ delay: 0.8 + i * 0.06 }}
                                                >{icon}</motion.a>
                                            ))}
                                        </div>
                                    </motion.div>
                                </div>
                            </header>

                            {/* Summary */}
                            <RevealSection>
                                <div className="space-y-4">
                                    <SectionLabel isDark={isDark} divider={divider} labelText={labelText}>Summary</SectionLabel>
                                    <p className={`text-base ${mutedText} leading-relaxed max-w-3xl`}>
                                        Full-stack engineer and SaaS founder with 2+ years of hands-on experience building and shipping production-grade web applications, AI-integrated platforms, and real-time systems. Adept at owning features end-to-end across fast-paced, collaborative environments.{' '}
                                        <span className={isDark ? 'text-zinc-200' : 'text-zinc-800'}>Selected for YC Hackathon (top applicants globally); GDG Hackathon winner.</span>
                                    </p>
                                </div>
                            </RevealSection>

                            {/* Experience */}
                            <RevealSection delay={0.05}>
                                <div className="space-y-5">
                                    <SectionLabel isDark={isDark} divider={divider} labelText={labelText}>Experience</SectionLabel>
                                    <div className="space-y-4">
                                        {[
                                            { org: 'NextRound Private Limited', url: 'https://nextround.tech', totalDuration: 'Jun 2025 – Aug 2025', badge: 'Internship · Remote', bullets: ['Delivered 10+ production features used by thousands of active users in agile sprint cycles.', 'Engineered a cross-platform Chrome extension for real-time meeting transcription across Zoom, Google Meet, and Teams.', 'Integrated event-driven APIs for real-time frontend updates, measurably reducing API latency.', 'Participated in code reviews, sprint retrospectives, and iterative delivery cycles.'] },
                                            { org: 'GeeksforGeeks KIIT Chapter', url: 'https://gfgkiit.in', totalDuration: `Feb 2025 – Present · ${calcDuration('2025-02-01')}`, badge: 'Part-time · On-site', bullets: ['Designed, built, and maintained a student-facing platform serving hundreds of users.', 'Shipped iterative feature improvements through continuous feedback cycles.'] },
                                            { org: 'FED, KIIT', url: 'https://fedkiit.com', totalDuration: `Nov 2024 – Present · ${calcDuration('2024-11-01')}`, badge: 'Part-time · On-site', roles: [{ title: 'Senior Technical Executive', period: 'Jan 2026 – Present', duration: calcDuration('2026-01-01'), location: 'Bhubaneswar' }, { title: 'Technical Executive', period: 'Nov 2024 – Jan 2026', duration: '1 yr 3 mos', location: 'Bhubaneswar' }], bullets: ['Built internal tooling for large-scale event coordination for a 500+ member student organisation.', 'Coordinated cross-functional peer teams to define requirements and ship systems on schedule.'] },
                                        ].map((exp, i) => (
                                            <StaggerItem key={exp.org} index={i}>
                                                <ExpCard isDark={isDark} cardBg={cardBg} divider={divider} mutedText={mutedText} subtleText={subtleText} {...exp} />
                                            </StaggerItem>
                                        ))}
                                    </div>
                                </div>
                            </RevealSection>

                            {/* Tech Stack */}
                            <RevealSection delay={0.05}>
                                <div className="space-y-5">
                                    <SectionLabel isDark={isDark} divider={divider} labelText={labelText}>Technical Skills</SectionLabel>
                                    <div className="space-y-3">
                                        {techCategories.map((cat, ci) => (
                                            <motion.div
                                                key={cat.label}
                                                className="flex flex-wrap items-center gap-2.5"
                                                initial={{ opacity: 0, x: -16 }}
                                                whileInView={{ opacity: 1, x: 0 }}
                                                viewport={{ once: true }}
                                                transition={{ delay: ci * 0.07, duration: 0.5 }}
                                            >
                                                <span className={`text-xs uppercase tracking-[0.3em] ${subtleText} w-24 shrink-0`}>{cat.label}</span>
                                                {cat.items.map((s, si) => (
                                                    <motion.span
                                                        key={s}
                                                        whileHover={{ scale: 1.08, y: -2 }}
                                                        className={`flex items-center gap-1.5 px-3 py-1.5 text-xs uppercase tracking-wide border ${tagBg} rounded-lg transition-all duration-300 cursor-default`}
                                                        initial={{ opacity: 0, scale: 0.85 }}
                                                        whileInView={{ opacity: 1, scale: 1 }}
                                                        viewport={{ once: true }}
                                                        transition={{ delay: ci * 0.07 + si * 0.025 }}
                                                    >
                                                        <TechIcon name={s} />{s}
                                                    </motion.span>
                                                ))}
                                            </motion.div>
                                        ))}
                                    </div>
                                </div>
                            </RevealSection>

                            {/* Achievements */}
                            <RevealSection delay={0.05}>
                                <div className="space-y-5">
                                    <SectionLabel isDark={isDark} divider={divider} labelText={labelText}>Achievements &amp; Leadership</SectionLabel>
                                    <div className="space-y-3">
                                        {achievements.map((a, i) => {
                                            const iconKey = getAchievementIconKey(a.title);
                                            return (
                                                <StaggerItem key={a.title} index={i}>
                                                    <motion.div
                                                        whileHover={{ x: 4 }}
                                                        className={`flex items-start gap-4 border ${cardBg} rounded-xl p-5 transition-all duration-300`}
                                                    >
                                                        <div className={`w-10 h-10 rounded-lg border ${divider} flex items-center justify-center shrink-0 overflow-hidden`}
                                                            style={{ backgroundColor: achievementIconBg[iconKey] }}>
                                                            <img src={achievementIconSrc[iconKey]} alt={a.title} className="h-5 w-5 object-contain" loading="lazy" referrerPolicy="no-referrer" />
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex flex-wrap items-center gap-2.5 mb-1.5">
                                                                <h3 className="text-base font-bold">{a.title}</h3>
                                                                <span className={`text-xs uppercase tracking-widest border ${isDark ? 'border-[#d0fffe]/30 text-[#d0fffe]/80' : 'border-[#d39ad0] text-[#7b3e77]'} px-2 py-0.5 rounded`}>{a.badge}</span>
                                                            </div>
                                                            <p className={`text-sm ${subtleText} leading-relaxed`}>{a.detail}</p>
                                                        </div>
                                                    </motion.div>
                                                </StaggerItem>
                                            );
                                        })}
                                    </div>
                                </div>
                            </RevealSection>
                        </motion.section>

                        {/* ══ PROJECTS ══ */}
                        <RevealSection>
                            <section id="projects" className={`space-y-7 scroll-mt-32 ${shellBase} ${isDark ? '' : 'bg-[#d0fffe]'}`}>
                                <div className={`flex items-end justify-between border-b ${divider} pb-4`}>
                                    <SectionLabel isDark={isDark} divider={divider} labelText={labelText}>Projects</SectionLabel>
                                    <span className={`text-xs ${subtleText} uppercase tracking-widest`}>Selected Works</span>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                    {projects.map((p, i) => (
                                        <StaggerItem key={p.id} index={i}>
                                            <ProjectCard
                                                project={p} isDark={isDark} cardBg={cardBg} divider={divider}
                                                mutedText={mutedText} subtleText={subtleText} tagBg={tagBg}
                                                onPreview={setSelectedProject}
                                                onImgError={(id) => setPreviewErrors(prev => ({ ...prev, [id]: true }))}
                                                imgError={!!previewErrors[p.id]}
                                            />
                                        </StaggerItem>
                                    ))}
                                </div>
                            </section>
                        </RevealSection>

                        {/* ══ GITHUB ══ */}
                        <RevealSection>
                            <section id="github" className={`space-y-7 scroll-mt-32 ${shellBase} ${isDark ? '' : 'bg-[#e4ffde]'}`}>
                                <div className={`flex flex-col gap-5 border-b ${divider} pb-5`}>
                                    <div className="flex items-end justify-between">
                                        <SectionLabel isDark={isDark} divider={divider} labelText={labelText}>My GitHub</SectionLabel>
                                        <a href="https://github.com/hardikguptaofficialgit" target="_blank" rel="noopener noreferrer"
                                            className={`text-xs ${subtleText} hover:${isDark ? 'text-zinc-100' : 'text-zinc-900'} flex items-center gap-1 transition-colors`}>
                                            View Profile <ArrowUpRight size={12} />
                                        </a>
                                    </div>
                                    <div className="flex flex-col md:flex-row gap-3 justify-between">
                                        <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
                                            {([['top', 'Top Rated'], ['latest', 'Latest'], ['pushed', 'Recently Pushed'], ['all', 'All']] as const).map(([id, label]) => (
                                                <motion.button key={id} onClick={() => setFilterMode(id as any)}
                                                    whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
                                                    className={`px-3 py-2 text-xs font-medium border rounded-lg transition-all duration-300 ${filterMode === id ? filterActive : filterInactive}`}>
                                                    {label}
                                                </motion.button>
                                            ))}
                                        </div>
                                        <input type="text" placeholder="Search…" value={searchQuery}
                                            onChange={e => setSearchQuery(e.target.value)}
                                            className={`border rounded-lg px-4 py-2 text-sm w-full md:w-60 focus:outline-none transition-all duration-300 ${inputBg} focus:border-zinc-500`} />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {filteredRepos.map((repo, i) => (
                                        <StaggerItem key={repo.id} index={i}>
                                            <motion.a
                                                href={repo.html_url} target="_blank" rel="noopener noreferrer"
                                                whileHover={{ y: -3, scale: 1.01 }}
                                                className={`group block border ${cardBg} rounded-xl p-5 transition-all duration-300`}
                                            >
                                                <div className="flex items-start justify-between gap-2 mb-3">
                                                    <h3 className="text-sm font-bold group-hover:underline underline-offset-4 truncate">{repo.name}</h3>
                                                    {repo.language && (
                                                        <span className="flex items-center gap-1.5 shrink-0">
                                                            <span className="w-2.5 h-2.5 rounded-full" style={{ background: langColor[repo.language] ?? '#888' }} />
                                                            <span className={`text-xs ${subtleText}`}>{repo.language}</span>
                                                        </span>
                                                    )}
                                                </div>
                                                <p className={`${subtleText} text-sm leading-relaxed line-clamp-2 mb-4`}>{repo.description || 'No description.'}</p>
                                                <div className={`flex items-center gap-5 text-xs ${subtleText}`}>
                                                    <span className="flex items-center gap-1.5"><Star size={12} /> {repo.stargazers_count}</span>
                                                    <span className="flex items-center gap-1.5"><GitFork size={12} /> {repo.forks_count}</span>
                                                    <span>{new Date(repo.updated_at).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}</span>
                                                </div>
                                            </motion.a>
                                        </StaggerItem>
                                    ))}
                                </div>
                            </section>
                        </RevealSection>

                        {/* ══ PHOTOS ══ */}
                        <RevealSection>
                            <section id="photos" className={`space-y-7 scroll-mt-32 ${shellBase} ${isDark ? '' : 'bg-[#ffe7d3]'}`}>
                                <div className={`flex items-end justify-between border-b ${divider} pb-4`}>
                                    <SectionLabel isDark={isDark} divider={divider} labelText={labelText}>Photos</SectionLabel>
                                    <span className={`text-xs ${subtleText} uppercase tracking-widest`}>Recent Highlights</span>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-7">
                                    {sortedEvents.map((ev, i) => (
                                        <StaggerItem key={ev.id} index={i}>
                                            <motion.div
                                                onClick={() => openGallery(ev)}
                                                whileHover={{ y: -4 }}
                                                className="group cursor-pointer space-y-3"
                                            >
                                                <div className={`relative aspect-video ${isDark ? 'bg-zinc-900' : 'bg-white'} p-2 rounded-xl overflow-hidden border ${divider}`}>
                                                    <div className="relative w-full h-full rounded-lg overflow-hidden bg-zinc-900">
                                                        <img src={ev.images[0]} alt={ev.title}
                                                            className="absolute inset-0 h-full w-full object-cover grayscale group-hover:grayscale-0 scale-100 group-hover:scale-105 transition-all duration-700" />
                                                        <div className="absolute top-3 right-3 flex flex-col gap-1.5 items-end z-10 pointer-events-none">
                                                            {ev.pinned && (
                                                                <div className="bg-white text-black px-2 py-0.5 rounded text-xs font-bold flex items-center gap-1">
                                                                    <Pin size={10} className="fill-current" /> Pinned
                                                                </div>
                                                            )}
                                                            {ev.images.length > 1 && (
                                                                <div className="bg-black/70 backdrop-blur-sm px-2 py-0.5 rounded text-xs text-white flex items-center gap-1 border border-white/10">
                                                                    <Maximize2 size={10} /> +{ev.images.length - 1}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                                <div>
                                                    <div className="flex items-start justify-between">
                                                        <h3 className="text-base font-bold group-hover:underline underline-offset-4">{ev.title}</h3>
                                                        <span className={`text-xs ${subtleText} font-mono shrink-0 ml-2 mt-0.5`}>{ev.date}</span>
                                                    </div>
                                                    <p className={`text-sm ${mutedText} leading-snug mt-1`}>{ev.description}</p>
                                                </div>
                                            </motion.div>
                                        </StaggerItem>
                                    ))}
                                </div>
                            </section>
                        </RevealSection>

                        {/* ══ POSTS ══ */}
                        <RevealSection>
                            <section id="posts" className={`space-y-7 scroll-mt-32 ${shellBase} ${isDark ? '' : 'bg-[#ffd3fd]'}`}>
                                <div className={`flex items-end justify-between border-b ${divider} pb-4`}>
                                    <SectionLabel isDark={isDark} divider={divider} labelText={labelText}>Posts</SectionLabel>
                                    <a href={`https://dev.to/${import.meta.env.VITE_DEV_USERNAME || 'strykerinside'}`}
                                        target="_blank" rel="noopener noreferrer"
                                        className={`text-xs ${subtleText} hover:${isDark ? 'text-zinc-100' : 'text-zinc-900'} flex items-center gap-1 transition-colors uppercase tracking-widest`}>
                                        DEV.to <ArrowUpRight size={12} />
                                    </a>
                                </div>

                                {postsLoading ? (
                                    <div className="space-y-4">
                                        {[1, 2, 3].map(i => (
                                            <motion.div key={i}
                                                animate={{ opacity: [0.4, 0.8, 0.4] }}
                                                transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.2 }}
                                                className={`h-24 rounded-xl ${isDark ? 'bg-zinc-900/60' : 'bg-zinc-200/60'}`} />
                                        ))}
                                    </div>
                                ) : postsError ? (
                                    <div className={`${subtleText} text-sm space-y-4`}>
                                        <p>{postsError}</p>
                                        <motion.button onClick={fetchDevToPosts}
                                            whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
                                            className={`text-xs uppercase tracking-widest border ${divider} px-4 py-2 rounded-lg transition-colors`}>
                                            Retry
                                        </motion.button>
                                    </div>
                                ) : posts.length > 0 ? (
                                    <div className={`divide-y ${isDark ? 'divide-zinc-800' : 'divide-zinc-200'}`}>
                                        {posts.map((post, i) => (
                                            <StaggerItem key={post.id} index={i}>
                                                <article className="group py-6 first:pt-0">
                                                    <div className="flex gap-5">
                                                        {post.cover_image && (
                                                            <motion.img
                                                                src={post.cover_image} alt=""
                                                                whileHover={{ scale: 1.05 }}
                                                                className="w-24 h-16 object-cover rounded-lg shrink-0 opacity-70 group-hover:opacity-100 transition-opacity duration-300" />
                                                        )}
                                                        <div className="flex-1 min-w-0">
                                                            <div className={`flex items-center gap-4 text-xs ${subtleText} mb-2`}>
                                                                <span className="flex items-center gap-1.5"><Calendar size={11} /> {format(new Date(post.published_at), 'MMM d, yyyy')}</span>
                                                                <span className="flex items-center gap-1.5"><Clock size={11} /> {post.reading_time_minutes || readingTime(post.description)} min read</span>
                                                            </div>
                                                            <h3 className="text-base font-bold mb-1.5 group-hover:underline underline-offset-4 leading-snug">
                                                                <a href={post.url} target="_blank" rel="noopener noreferrer">{post.title}</a>
                                                            </h3>
                                                            <p className={`${mutedText} text-sm leading-relaxed line-clamp-2`}>{post.description}</p>
                                                            {post.tag_list?.length > 0 && (
                                                                <div className="flex gap-2 mt-2.5 flex-wrap">
                                                                    {post.tag_list.slice(0, 3).map((t: string) => (
                                                                        <span key={t} className={`text-xs uppercase tracking-wider border px-2 py-0.5 rounded ${tagBg}`}>#{t}</span>
                                                                    ))}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </article>
                                            </StaggerItem>
                                        ))}
                                    </div>
                                ) : (
                                    <p className={`${subtleText} text-sm`}>No posts yet.</p>
                                )}
                            </section>
                        </RevealSection>

                    </motion.div>

                    {/* Footer */}
                    <motion.footer
                        initial={{ opacity: 0 }}
                        whileInView={{ opacity: 1 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.8 }}
                        className={`max-w-5xl mx-auto mt-24 pt-10 pb-8 border-t ${divider} flex flex-col md:flex-row items-center justify-between gap-4`}
                    >
                        <a href="/" className={`${subtleText} hover:${isDark ? 'text-zinc-100' : 'text-zinc-900'} transition-colors text-sm uppercase tracking-widest`}>← Return to OS</a>
                        <div className="flex gap-5">
                            {[
                                { href: 'https://github.com/hardikguptaofficialgit', icon: <Github size={16} /> },
                                { href: 'https://www.linkedin.com/in/hardik-gupta-b528072b3/', icon: <Linkedin size={16} /> },
                                { href: 'https://x.com/stryker_inside', icon: <XBrandIcon size={16} /> },
                            ].map(({ href, icon }) => (
                                <motion.a key={href} href={href} target="_blank" rel="noopener noreferrer"
                                    whileHover={{ scale: 1.2, y: -2 }}
                                    className={`${subtleText} hover:${isDark ? 'text-zinc-100' : 'text-zinc-900'} transition-colors`}>{icon}</motion.a>
                            ))}
                        </div>
                        <p className={`text-xs ${subtleText} font-mono`}>hardikgupta8792@gmail.com</p>
                    </motion.footer>
                </div>

                {/* ══ PROJECT LIGHTBOX ══ */}
                <AnimatePresence>
                    {selectedProject && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className={`fixed inset-0 z-[95] ${isDark ? 'bg-black/95' : 'bg-white/95'} backdrop-blur-xl`}
                            onClick={() => setSelectedProject(null)}
                        >
                            <motion.div
                                initial={{ y: 24, scale: 0.97 }}
                                animate={{ y: 0, scale: 1 }}
                                exit={{ y: 20, scale: 0.97 }}
                                transition={{ duration: 0.28, ease: EASE_SMOOTH }}
                                className={`relative h-full w-full overflow-hidden ${isDark ? 'bg-zinc-950' : 'bg-zinc-100'}`}
                                onClick={e => e.stopPropagation()}
                            >
                                <div className="absolute z-10" style={{ left: `${projectControlsPos.x}px`, top: `${projectControlsPos.y}px` }}>
                                    <div className={`flex items-center gap-2 rounded-xl border ${isDark ? 'border-white/15 bg-black/60' : 'border-black/10 bg-white/92'} p-2 shadow-lg backdrop-blur-sm`}>
                                        <button onPointerDown={handleProjectControlsPointerDown} onPointerMove={handleProjectControlsPointerMove} onPointerUp={handleProjectControlsPointerUp} onPointerCancel={handleProjectControlsPointerUp}
                                            className={`flex h-8 w-8 items-center justify-center rounded-lg border cursor-grab active:cursor-grabbing ${isDark ? 'border-white/15 text-zinc-100 hover:bg-white/10' : 'border-black/10 text-zinc-900 hover:bg-zinc-200'} transition-colors`} title="Drag controls">
                                            <Pin size={13} />
                                        </button>
                                        <button onClick={() => setProjectControlsCollapsed(v => !v)}
                                            className={`flex h-8 w-8 items-center justify-center rounded-lg border ${isDark ? 'border-white/15 text-zinc-100 hover:bg-white/10' : 'border-black/10 text-zinc-900 hover:bg-zinc-200'} transition-colors`}>
                                            {projectControlsCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
                                        </button>
                                        {!projectControlsCollapsed && (
                                            <>
                                                {selectedProject.githubUrl !== '#' && (
                                                    <a href={selectedProject.githubUrl} target="_blank" rel="noopener noreferrer" onPointerDown={e => e.stopPropagation()}
                                                        className={`inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-xs font-semibold uppercase tracking-wide ${isDark ? 'border-white/15 bg-zinc-900 text-zinc-100 hover:bg-zinc-800' : 'border-black/10 bg-zinc-100 text-zinc-900 hover:bg-zinc-200'} transition-colors`}>
                                                        <Github size={13} /> Code
                                                    </a>
                                                )}
                                                {selectedProject.liveUrl !== '#' && (
                                                    <a href={selectedProject.liveUrl} target="_blank" rel="noopener noreferrer" onPointerDown={e => e.stopPropagation()}
                                                        className={`inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-xs font-semibold uppercase tracking-wide ${isDark ? 'border-white/15 bg-white text-zinc-900 hover:bg-zinc-100' : 'border-black/10 bg-zinc-900 text-zinc-100 hover:bg-zinc-800'} transition-colors`}>
                                                        <ArrowUpRight size={13} /> Open Site
                                                    </a>
                                                )}
                                                <button onClick={() => setSelectedProject(null)}
                                                    className={`flex h-8 w-8 items-center justify-center rounded-lg border ${isDark ? 'border-white/15 bg-zinc-900 text-zinc-100 hover:bg-zinc-800' : 'border-black/10 bg-zinc-100 text-zinc-900 hover:bg-zinc-200'} transition-colors`}>
                                                    <X size={14} />
                                                </button>
                                            </>
                                        )}
                                    </div>
                                </div>
                                {selectedProject.liveUrl !== '#' ? (
                                    <iframe src={selectedProject.liveUrl} title={`${selectedProject.name} live preview`}
                                        className="h-full w-full border-0" sandbox="allow-scripts allow-same-origin allow-popups allow-forms" loading="lazy" />
                                ) : (
                                    <div className="flex h-full items-center justify-center p-8">
                                        <div className="max-w-md text-center">
                                            <p className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-zinc-900'}`}>{selectedProject.name}</p>
                                            <p className={`mt-3 text-sm ${mutedText}`}>Live preview unavailable — check the GitHub link above.</p>
                                        </div>
                                    </div>
                                )}
                            </motion.div>
                        </motion.div>
                    )}

                    {/* ══ PHOTO LIGHTBOX ══ */}
                    {selectedEvent && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className={`fixed inset-0 z-[100] ${isDark ? 'bg-black/98' : 'bg-white/98'} backdrop-blur-xl flex flex-col`}
                            onClick={() => setSelectedEvent(null)}
                        >
                            <div className={`flex items-center justify-between px-5 py-4 border-b ${divider} shrink-0`} onClick={e => e.stopPropagation()}>
                                <div>
                                    <h3 className="text-base font-bold">{selectedEvent.title}</h3>
                                    <p className={`text-xs ${subtleText} mt-0.5`}>{selectedEvent.description}</p>
                                </div>
                                <motion.button onClick={() => setSelectedEvent(null)}
                                    whileHover={{ rotate: 90 }} transition={{ duration: 0.2 }}
                                    className={`p-2 hover:${isDark ? 'bg-zinc-800' : 'bg-zinc-200'} rounded-lg transition-colors ml-4 shrink-0`}>
                                    <X size={18} />
                                </motion.button>
                            </div>
                            <div className="flex-1 flex items-center justify-center relative px-4 py-6 min-h-0" onClick={e => e.stopPropagation()}>
                                {selectedEvent.images.length > 1 && (
                                    <motion.button onClick={prevImg} whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                                        className={`absolute left-3 p-2.5 ${isDark ? 'bg-zinc-900 hover:bg-zinc-800' : 'bg-white hover:bg-zinc-200'} rounded-lg transition-colors z-10`}>
                                        <ChevronLeft size={20} />
                                    </motion.button>
                                )}
                                <div className="bg-white p-2 rounded-xl max-h-full flex items-center">
                                    <motion.img
                                        key={currentImageIndex}
                                        initial={{ opacity: 0, scale: 0.95 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        transition={{ duration: 0.25 }}
                                        src={selectedEvent.images[currentImageIndex]}
                                        alt={`Image ${currentImageIndex + 1}`}
                                        className="max-w-full max-h-[65vh] object-contain rounded-lg"
                                        drag="x"
                                        dragConstraints={{ left: 0, right: 0 }}
                                        dragElastic={0.2}
                                        onDragEnd={(_, { offset }) => {
                                            if (offset.x < -50) nextImg();
                                            else if (offset.x > 50) prevImg();
                                        }}
                                    />
                                </div>
                                {selectedEvent.images.length > 1 && (
                                    <motion.button onClick={nextImg} whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                                        className={`absolute right-3 p-2.5 ${isDark ? 'bg-zinc-900 hover:bg-zinc-800' : 'bg-white hover:bg-zinc-200'} rounded-lg transition-colors z-10`}>
                                        <ChevronRight size={20} />
                                    </motion.button>
                                )}
                                <div className={`absolute bottom-4 left-1/2 -translate-x-1/2 ${isDark ? 'bg-zinc-900' : 'bg-white'} backdrop-blur-sm border ${divider} px-3 py-1 rounded-full text-xs ${mutedText}`}>
                                    {currentImageIndex + 1} / {selectedEvent.images.length}
                                </div>
                            </div>
                            {selectedEvent.images.length > 1 && (
                                <div className={`h-20 border-t ${divider} flex items-center gap-2 px-5 overflow-x-auto no-scrollbar justify-start md:justify-center shrink-0 ${isDark ? 'bg-black/40' : 'bg-white/40'}`}
                                    onClick={e => e.stopPropagation()}>
                                    {selectedEvent.images.map((img, idx) => (
                                        <motion.button key={idx} onClick={() => setCurrentImageIndex(idx)}
                                            whileHover={{ scale: 1.08 }}
                                            className={`h-13 aspect-video flex-shrink-0 rounded-lg overflow-hidden transition-all duration-300 bg-white p-0.5 ${currentImageIndex === idx ? 'ring-2 ring-zinc-600' : 'opacity-40 hover:opacity-80'}`}>
                                            <img src={img} alt="" className="w-full h-full object-cover rounded" />
                                        </motion.button>
                                    ))}
                                </div>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </ThemeContext.Provider>
    );
};

/* ─── sub-components ──────────────────────────────────────── */
const SectionLabel = ({ children, isDark, divider, labelText }: { children: React.ReactNode; isDark: boolean; divider: string; labelText: string }) => (
    <h2 className={`text-sm font-bold uppercase tracking-[0.3em] ${labelText} border-b ${divider} pb-3`}>{children}</h2>
);

interface Role { title: string; period: string; duration: string; location?: string; }
interface ExpCardProps {
    org: string; url?: string; totalDuration: string; badge: string;
    roles?: Role[]; bullets?: string[];
    isDark: boolean; cardBg: string; divider: string; mutedText: string; subtleText: string;
}
const ExpCard = ({ org, url, totalDuration, badge, roles, bullets, isDark, cardBg, divider, mutedText, subtleText }: ExpCardProps) => (
    <motion.div
        whileHover={{ x: 3 }}
        className={`border ${cardBg} rounded-xl p-5 transition-all duration-300`}
    >
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-1.5 mb-2.5">
            <div className="flex flex-wrap items-center gap-2.5">
                <h3 className="text-base font-bold">{org}</h3>
                <span className={`text-xs uppercase tracking-widest border ${divider} px-2 py-0.5 rounded ${subtleText}`}>{badge}</span>
            </div>
            <span className={`text-xs ${subtleText} font-mono shrink-0`}>{totalDuration}</span>
        </div>
        {url && (
            <a href={url} target="_blank" rel="noopener noreferrer"
                className={`text-xs ${subtleText} hover:${isDark ? 'text-zinc-300' : 'text-zinc-700'} underline decoration-zinc-400 underline-offset-4 transition-colors block mb-3`}>
                {url.replace('https://', '')}
            </a>
        )}
        {roles?.map(r => (
            <div key={r.title} className={`mt-3 pl-4 border-l ${divider} space-y-0.5`}>
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-0.5">
                    <span className="text-sm font-semibold">{r.title}</span>
                    <span className={`text-xs ${subtleText} font-mono`}>{r.period} · {r.duration}</span>
                </div>
                {r.location && <p className={`text-xs ${subtleText}`}>{r.location}</p>}
            </div>
        ))}
        {bullets && (
            <ul className={`mt-3 space-y-2 pl-4 border-l ${divider}`}>
                {bullets.map(b => (
                    <li key={b} className={`text-sm ${mutedText} flex gap-2.5 items-start`}>
                        <span className={`${subtleText} mt-0.5 shrink-0`}>–</span>{b}
                    </li>
                ))}
            </ul>
        )}
    </motion.div>
);

interface ProjectCardProps {
    project: typeof projects[0];
    isDark: boolean; cardBg: string; divider: string; mutedText: string; subtleText: string; tagBg: string;
    onPreview: (p: typeof projects[0]) => void;
    onImgError: (id: number) => void;
    imgError: boolean;
}
const ProjectCard = memo(({ project: p, isDark, cardBg, divider, mutedText, subtleText, onPreview, onImgError, imgError }: ProjectCardProps) => {
    const hasVisual = !!p.img && !imgError;
    return (
        <motion.article
            whileHover={{ y: -4, scale: 1.01 }}
            transition={{ type: 'spring', stiffness: 300, damping: 22 }}
            className={`group w-full border ${cardBg} rounded-xl overflow-hidden text-left`}
        >
            <div className={`relative h-56 w-full bg-black overflow-hidden border-b ${divider}`}>
                {hasVisual ? (
                    <div className="absolute inset-0 flex items-center justify-center p-6 md:p-8">
                        <img src={p.img} alt={p.name} className="max-h-full max-w-full object-contain"
                            onError={() => onImgError(p.id)} />
                    </div>
                ) : (
                    <div className="absolute inset-0 bg-black flex items-center justify-center px-5 text-center">
                        <h3 className="text-4xl font-black tracking-tight leading-none text-white md:text-5xl">{p.name}</h3>
                    </div>
                )}
                {hasVisual && <div className="absolute inset-0 bg-black/45" />}
                <div className="absolute bottom-3 left-3 right-3 flex flex-wrap items-center justify-center gap-2">
                    {p.liveUrl !== '#' && (
                        <motion.button type="button" onClick={() => onPreview(p)}
                            whileHover={{ scale: 1.06 }} whileTap={{ scale: 0.95 }}
                            className="inline-flex items-center gap-1.5 rounded-lg bg-white px-3 py-2 text-xs font-semibold uppercase tracking-wide text-black hover:bg-zinc-100 transition-colors">
                            <Maximize2 size={13} /> Preview
                        </motion.button>
                    )}
                    {p.githubUrl !== '#' && (
                        <motion.a href={p.githubUrl} target="_blank" rel="noopener noreferrer"
                            whileHover={{ scale: 1.06 }} whileTap={{ scale: 0.95 }}
                            className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold uppercase tracking-wide border ${isDark ? 'bg-zinc-800 text-white hover:bg-zinc-700 border-white/10' : 'bg-[#ffd3fd] text-[#3f2a3d] hover:bg-[#f8bbf5] border-[#f1b4ee]'}`}>
                            <Github size={13} /> Code
                        </motion.a>
                    )}
                    {p.liveUrl !== '#' && (
                        <motion.a href={p.liveUrl} target="_blank" rel="noopener noreferrer"
                            whileHover={{ scale: 1.06 }} whileTap={{ scale: 0.95 }}
                            className="inline-flex items-center gap-1.5 rounded-lg bg-black/70 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-white hover:bg-black/80 transition-colors">
                            <ArrowUpRight size={13} /> Open Site
                        </motion.a>
                    )}
                </div>
            </div>
            <div className="p-5 space-y-4">
                <div className="space-y-1">
                    <h3 className="text-xl font-bold leading-tight">{p.name}</h3>
                    <p className={`text-xs uppercase tracking-widest ${subtleText}`}>{p.tag}</p>
                </div>
                <p className={`text-sm ${mutedText} leading-relaxed`}>{p.description}</p>
            </div>
        </motion.article>
    );
});

export default SimplifiedResume;