import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { format } from 'date-fns';
import {
  ArrowLeft,
  Calendar,
  Check,
  Clock,
  ExternalLink,
  Flame,
  Copy,
  RefreshCw,
  Search,
  Share2,
  Tag,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { buildBlogPostPrompt } from '../../lib/ai/providers';
import AskAIPanel from '@/components/ai/AskAIPanel';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneLight, vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import remarkBreaks from 'remark-breaks';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import { Input } from '@/components/ui/input';
import { useDesktopStore } from '@/store/desktopStore';
import type { BlogPost } from '@/content/types';
import { PixelThemeToggle } from '@/components/portfolio/PixelThemeToggle';
import { transitionPortfolioTheme } from '@/lib/theme-transition';
import { usePortfolioPageBackground } from '@/hooks/usePortfolioPageBackground';

type BlogTheme = 'dark' | 'light';

const buildPostUrl = (slug: string) => {
  const path = `/blogs/${slug}`;
  if (typeof window === 'undefined') return path;
  return new URL(path, window.location.origin).toString();
};

const readingTime = (text: string) =>
  Math.max(1, Math.round((text || '').split(/\s+/).filter(Boolean).length / 220));

const T = {
  dark: {
    root: 'bg-zinc-950 text-zinc-100',
    surface: 'bg-zinc-950',
    card: 'bg-zinc-900 hover:bg-zinc-800',
    input: 'bg-zinc-950 border-0 text-zinc-100 placeholder:text-zinc-500 focus-visible:ring-1 focus-visible:ring-zinc-600 rounded-md',
    muted: 'text-zinc-400',
    subtle: 'text-zinc-500',
    badge: 'bg-white/8 text-zinc-300',
    btn: 'bg-white/6 hover:bg-white/10 text-zinc-300 hover:text-zinc-100',
    accentBtn: 'bg-[#d0fffe] text-zinc-950 hover:bg-[#b8f5f3]',
    divider: 'bg-zinc-800',
    border: 'border-zinc-800',
    codeHeader: 'bg-zinc-900 text-zinc-400 border-zinc-800',
    codeSurface: '#09090b',
    tableHeader: 'bg-zinc-900 text-zinc-200',
    quote: 'border-[#d0fffe]/45 bg-zinc-900/50 text-zinc-300',
    prose: 'prose-invert prose-headings:text-zinc-100 prose-p:text-zinc-300 prose-li:text-zinc-300 prose-a:text-[#d0fffe] prose-code:text-[#ffd3fd] prose-pre:bg-transparent prose-strong:text-zinc-100',
  },
  light: {
    root: 'bg-[#f6f5f0] text-[#1a1a1a]',
    surface: 'bg-[#eeede8]',
    card: 'bg-white hover:bg-[#fafaf8]',
    input: 'bg-white border-0 text-[#1a1a1a] placeholder:text-black/35 focus-visible:ring-1 focus-visible:ring-black/15 rounded-md',
    muted: 'text-black/55',
    subtle: 'text-black/38',
    badge: 'bg-black/6 text-black/55',
    btn: 'bg-black/5 hover:bg-black/9 text-black/60 hover:text-black',
    accentBtn: 'bg-[#1a1a1a] text-white hover:bg-[#333]',
    divider: 'bg-black/8',
    border: 'border-black/10',
    codeHeader: 'bg-black/[0.04] text-black/55 border-black/10',
    codeSurface: '#f4f3ee',
    tableHeader: 'bg-black/[0.04] text-black/75',
    quote: 'border-black/25 bg-black/[0.035] text-black/70',
    prose: 'prose-headings:text-[#1a1a1a] prose-p:text-black/72 prose-li:text-black/72 prose-a:text-[#0056b3] prose-code:text-[#b42318] prose-pre:bg-transparent prose-strong:text-black',
  },
};

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

const useResumeShellTheme = () => {
  const { settings, updateSettings } = useDesktopStore();
  const isDark = settings.darkMode;
  usePortfolioPageBackground(isDark);
  const theme: BlogTheme = isDark ? 'dark' : 'light';
  const toggleTheme = useCallback((origin?: { x: number; y: number }) => {
    const nextDark = !settings.darkMode;
    void transitionPortfolioTheme(nextDark, () => updateSettings({ darkMode: nextDark }), origin);
  }, [settings.darkMode, updateSettings]);

  return {
    isDark,
    theme,
    toggleTheme,
    bg: 'bg-transparent',
    bgImage: isDark ? '/bgdarkimage.png' : '/bgimage.png',
    text: isDark ? 'text-zinc-100' : 'text-[#1f1a17]',
    navBg: isDark ? 'bg-black/90 border-zinc-800' : 'bg-[#fffef9]/95 border-[#e6d8cb]',
    mutedText: isDark ? 'text-zinc-400' : 'text-[#5f5248]',
    subtleText: isDark ? 'text-zinc-500' : 'text-[#7d6b5c]',
    cardBg: isDark ? 'bg-zinc-950 border-zinc-800' : 'bg-[#fffef9] border-[#d8c8b9]',
    divider: isDark ? 'border-zinc-800' : 'border-[#e7dacb]',
    gridColumnShell: isDark ? 'border-zinc-800' : 'border-[#d8c8b9]',
    shellBase: isDark
      ? 'rounded-2xl border border-zinc-800 bg-black/80 p-6 md:p-9 shadow-[0_40px_120px_-70px_rgba(255,255,255,0.08)] backdrop-blur-xl'
      : 'rounded-2xl border border-[#ded4ca] p-6 md:p-9 bg-white/90 shadow-[0_24px_80px_-48px_rgba(67,47,31,0.22)] backdrop-blur-xl',
    labelText: isDark ? 'text-zinc-500' : 'text-[#6f5b4e]',
    filterInactive: isDark
      ? 'text-zinc-500 border-zinc-800 hover:text-zinc-300 hover:border-zinc-700'
      : 'text-[#7b6b5e] border-[#d9cabd] hover:text-[#3a312b] hover:border-[#bfaea0]',
    filterActive: isDark ? 'bg-zinc-100 text-zinc-900 border-zinc-100' : 'bg-[#ffd3fd] text-[#4f2d4c] border-[#dba5d7]',
    inputBg: isDark
      ? 'bg-zinc-950 border-zinc-800 text-zinc-100 placeholder:text-zinc-600'
      : 'bg-[#fffef9] border-[#d9cabd] text-[#1f1a17] placeholder:text-[#9a8a7d]',
    accentBtn: isDark ? 'bg-[#d0fffe] text-[#0d1515] hover:bg-[#b8f5f3]' : 'bg-[#1a1a1a] text-white hover:bg-[#333]',
    btn: isDark ? 'bg-white/6 hover:bg-white/10 text-white/70 hover:text-white' : 'bg-black/5 hover:bg-black/9 text-black/60 hover:text-black',
    badge: isDark ? 'bg-white/8 text-white/70' : 'bg-black/6 text-black/55',
  };
};

const BlogChrome = ({ children }: { children: React.ReactNode }) => {
  const shell = useResumeShellTheme();
  const { isDark, toggleTheme, bg, bgImage, text, navBg, divider, gridColumnShell } = shell;

  return (
    <div
      className={`relative min-h-screen w-full overflow-x-hidden overflow-y-auto ${bg} ${text} font-sans antialiased selection:bg-[#ffd3fd] selection:text-[#271b27]`}
      style={{
        backgroundImage: `url('${bgImage}')`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed',
      }}
    >
      <NoiseOverlay />
      <div
        aria-hidden
        className={`pointer-events-none absolute inset-0 z-[1] ${isDark ? 'bg-black/48' : 'bg-white/36'} transition-colors duration-500`}
      />
      <div aria-hidden className={`pointer-events-none absolute inset-0 z-[2] ${isDark ? 'bg-black/15' : 'bg-white/18'}`} />
      <div className="relative z-10 w-full px-3 md:px-6 pt-4 md:pt-6 pb-16">
        <div
          className={`max-w-4xl mx-auto overflow-hidden rounded-3xl border ${gridColumnShell} ${
            isDark
              ? 'bg-black/45 shadow-[0_40px_120px_-70px_rgba(255,255,255,0.08)]'
              : 'bg-white/60 shadow-[0_40px_120px_-70px_rgba(67,47,31,0.28)]'
          } backdrop-blur-xl`}
        >
          <header className={`sticky top-0 z-40 border-b ${divider} ${navBg} backdrop-blur-xl bg-opacity-90`}>
            <div className="flex items-center gap-3 px-4 md:px-5 py-3">
              <Link
                to="/"
                className={`flex items-center gap-2.5 shrink-0 rounded-xl px-1.5 py-1 transition-colors ${
                  isDark ? 'hover:bg-white/[0.05]' : 'hover:bg-black/[0.035]'
                }`}
              >
                <img
                  src="/logoimage.png"
                  alt="Hardik Gupta"
                  className={`h-8 w-8 rounded-lg object-cover ring-1 ${isDark ? 'ring-white/10' : 'ring-black/10'}`}
                />
                <span className="font-serif-display text-[17px] leading-none tracking-tight">stryker.inside</span>
              </Link>
              <div className="ml-auto flex items-center gap-2">
                <span
                  className={`text-[13px] font-medium px-3 py-2 rounded-lg ${
                    isDark ? 'text-white bg-white/[0.07]' : 'text-zinc-900 bg-black/[0.045]'
                  }`}
                >
                  Blogs
                </span>
                <PixelThemeToggle isDark={isDark} onToggle={toggleTheme} />
              </div>
            </div>
          </header>
          {children}
        </div>
      </div>
    </div>
  );
};

const usePageScroll = () => {
  useEffect(() => {
    const prevBody = document.body.style.overflow;
    const prevDoc = document.documentElement.style.overflow;
    document.body.style.overflow = 'auto';
    document.documentElement.style.overflow = 'auto';
    return () => {
      document.body.style.overflow = prevBody;
      document.documentElement.style.overflow = prevDoc;
    };
  }, []);
};

const fetchPosts = async (): Promise<BlogPost[]> => {
  const response = await fetch('/api/blogs', { cache: 'no-store' });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload.error || 'Unable to load posts.');
  return Array.isArray(payload.data) ? payload.data : [];
};

const fetchPost = async (slug: string): Promise<BlogPost> => {
  const response = await fetch(`/api/blogs/${encodeURIComponent(slug)}`, { cache: 'no-store' });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload.error || 'Unable to load article.');
  return payload.data;
};

const MarkdownCodeBlock = ({ inline, className, children, theme, ...props }: any) => {
  const match = /language-(\w+)/.exec(className || '');
  const code = String(children ?? '').replace(/\n$/, '');
  const [copied, setCopied] = useState(false);
  const isBlock = Boolean(match) || code.includes('\n');
  const C = T[theme as BlogTheme];

  if (inline || !isBlock) {
    return (
      <code
        className={`rounded border px-1 py-[0.1rem] font-mono text-[0.7em] ${C.border} ${theme === 'dark' ? 'bg-white/7' : 'bg-black/5'}`}
        {...props}
      >
        {children}
      </code>
    );
  }

  return (
    <div className={`not-prose my-3 overflow-hidden rounded-md border ${C.border}`}>
      <div className={`flex items-center justify-between border-b px-2 py-1.5 text-[9px] ${C.codeHeader}`}>
        <span className="font-mono uppercase tracking-wider">{match?.[1] || 'code'}</span>
        <button
          type="button"
          onClick={() => {
            navigator.clipboard.writeText(code);
            setCopied(true);
            window.setTimeout(() => setCopied(false), 1200);
          }}
          className="inline-flex items-center gap-1 rounded-[4px] px-1.5 py-0.5 font-medium hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
        >
          {copied ? <Check className="h-2.5 w-2.5" /> : <Copy className="h-2.5 w-2.5" />}
          {copied ? 'Copied' : 'Copy'}
        </button>
      </div>
      <SyntaxHighlighter
        language={match?.[1] || 'text'}
        style={theme === 'dark' ? vscDarkPlus : oneLight}
        customStyle={{
          margin: 0,
          padding: '0.6rem',
          background: C.codeSurface,
          fontSize: '0.7rem',
          lineHeight: 1.4,
          overflowX: 'auto',
        }}
        PreTag="div"
        {...props}
      >
        {code}
      </SyntaxHighlighter>
    </div>
  );
};

export const BlogListPage = () => {
  usePageScroll();
  const shell = useResumeShellTheme();
  const { theme } = shell;
  const C = T[theme];
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [activeTag, setActiveTag] = useState('all');
  const [sort, setSort] = useState<'latest' | 'popular'>('latest');

  useEffect(() => {
    fetchPosts()
      .then(setPosts)
      .catch((err) => setError(err instanceof Error ? err.message : 'Unable to load posts.'))
      .finally(() => setLoading(false));
  }, []);

  const tagStats = useMemo(() => {
    const map = new Map<string, number>();
    posts.forEach((post) => post.tags.forEach((tag) => map.set(tag, (map.get(tag) || 0) + 1)));
    return Array.from(map.entries()).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
  }, [posts]);

  const filteredPosts = useMemo(() => {
    const q = search.trim().toLowerCase();
    const next = posts.filter((post) => {
      const matchesSearch =
        !q ||
        post.title.toLowerCase().includes(q) ||
        post.excerpt.toLowerCase().includes(q) ||
        post.tags.some((tag) => tag.toLowerCase().includes(q));
      const matchesTag = activeTag === 'all' || post.tags.includes(activeTag);
      return matchesSearch && matchesTag;
    });
    return next.sort((a, b) => {
      if (sort === 'popular') {
        return Number(b.featured === true) - Number(a.featured === true) || (b.readingTimeMinutes || 0) - (a.readingTimeMinutes || 0);
      }
      return +new Date(b.publishedAt) - +new Date(a.publishedAt);
    });
  }, [activeTag, posts, search, sort]);

  const featuredPost = filteredPosts[0];
  const remainingPosts = filteredPosts.slice(1);
  const devToUrl = posts.find((post) => post.sourceUrl)?.sourceUrl || 'https://dev.to/strykerinside';

  return (
    <BlogChrome>
      <div className={`border-b ${shell.divider} px-4 md:px-6 py-8 md:py-10 ${shell.shellBase} mx-3 md:mx-6 mt-4 mb-6`}>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between border-b border-inherit pb-6 mb-6">
          <div>
            <h1 className={`font-serif-display text-2xl md:text-3xl ${shell.labelText} border-b ${shell.divider} pb-3`}>
              Blogs
            </h1>
            <p className={`mt-4 max-w-xl text-sm leading-relaxed ${shell.mutedText}`}>
              Thoughts, deep dives, and things I&apos;m learning - documented.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => window.location.reload()}
              className={`inline-flex h-9 w-9 items-center justify-center rounded-sm border ${shell.filterInactive}`}
              aria-label="Reload posts"
            >
              <RefreshCw className="h-4 w-4" />
            </button>
            <a
              href={devToUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={`inline-flex h-9 items-center gap-1.5 rounded-sm px-3 text-xs font-semibold uppercase tracking-wider ${shell.accentBtn}`}
            >
              DEV.to <ExternalLink className="h-3.5 w-3.5" />
            </a>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[220px_minmax(0,1fr)]">
          <aside className={`h-max rounded-sm border p-4 lg:sticky lg:top-24 ${shell.cardBg}`}>
            <div className="relative">
              <Search className={`absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 ${shell.subtleText}`} />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search posts..."
                className={`h-9 pl-9 text-sm border rounded-sm ${shell.inputBg}`}
              />
            </div>
            <p className={`mt-2 text-xs ${shell.subtleText}`}>{filteredPosts.length} of {posts.length} posts</p>

            <div className="mt-6">
              <p className={`mb-2 text-[11px] uppercase tracking-widest ${shell.subtleText}`}>Sort by</p>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setSort('latest')}
                  className={`inline-flex items-center justify-center gap-1 rounded-sm border px-2 py-2 text-xs font-semibold transition-colors ${
                    sort === 'latest' ? shell.filterActive : shell.filterInactive
                  }`}
                >
                  <Clock className="h-3.5 w-3.5" /> Latest
                </button>
                <button
                  type="button"
                  onClick={() => setSort('popular')}
                  className={`inline-flex items-center justify-center gap-1 rounded-sm border px-2 py-2 text-xs font-semibold transition-colors ${
                    sort === 'popular' ? shell.filterActive : shell.filterInactive
                  }`}
                >
                  <Flame className="h-3.5 w-3.5" /> Popular
                </button>
              </div>
            </div>

            <div className="mt-6">
              <p className={`mb-2 inline-flex items-center gap-1.5 text-[11px] uppercase tracking-widest ${shell.subtleText}`}>
                <Tag className="h-3.5 w-3.5" /> Tags
              </p>
              <div className="flex flex-col gap-1">
                <button
                  type="button"
                  onClick={() => setActiveTag('all')}
                  className={`flex items-center justify-between rounded-sm border px-2 py-1.5 text-left text-xs transition-colors ${
                    activeTag === 'all' ? shell.filterActive : shell.filterInactive
                  }`}
                >
                  <span>All posts</span>
                  <span className="opacity-70">{posts.length}</span>
                </button>
                {tagStats.map(([tag, count]) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => setActiveTag(tag)}
                    className={`flex items-center justify-between rounded-sm border px-2 py-1.5 text-left text-xs transition-colors ${
                      activeTag === tag ? shell.filterActive : shell.filterInactive
                    }`}
                  >
                    <span>#{tag}</span>
                    <span className="opacity-70">{count}</span>
                  </button>
                ))}
              </div>
            </div>
          </aside>

          <main className="space-y-3 min-w-0">
            {loading && <p className={`py-4 text-sm ${shell.mutedText}`}>Loading posts...</p>}
            {error && <p className="py-4 text-sm text-rose-400">{error}</p>}
            {!loading && !error && filteredPosts.length === 0 && (
              <p className={`py-4 text-sm ${shell.mutedText}`}>No posts found.</p>
            )}

            {featuredPost && (
              <div className="space-y-3">
                <motion.article initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                  <Link
                    to={`/blogs/${featuredPost.slug}`}
                    className={`group block border rounded-sm p-5 transition-colors hover:border-zinc-600 ${shell.cardBg}`}
                  >
                    <p className={`mb-2 text-[11px] uppercase tracking-widest ${shell.subtleText}`}>Featured</p>
                    <h2 className="text-lg font-bold leading-snug group-hover:underline underline-offset-4">{featuredPost.title}</h2>
                    <p className={`mt-2 line-clamp-3 text-sm leading-relaxed ${shell.mutedText}`}>
                      {featuredPost.excerpt || 'No description.'}
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {featuredPost.tags.slice(0, 4).map((tag) => (
                        <span key={tag} className={`rounded-sm border px-2 py-0.5 text-[10px] uppercase tracking-wider ${shell.badge} ${shell.divider}`}>
                          #{tag}
                        </span>
                      ))}
                    </div>
                    <div className={`mt-3 flex flex-wrap items-center gap-3 text-[11px] uppercase tracking-widest ${shell.subtleText}`}>
                      <span className="inline-flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5" />
                        {format(new Date(featuredPost.publishedAt), 'MMM d, yyyy')}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5" />
                        {featuredPost.readingTimeMinutes || readingTime(featuredPost.body || featuredPost.excerpt)} min read
                      </span>
                    </div>
                  </Link>
                </motion.article>

                {remainingPosts.map((post, index) => (
                  <motion.article key={post.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: index * 0.02 }}>
                    <Link
                      to={`/blogs/${post.slug}`}
                      className={`group block border rounded-sm p-4 md:p-5 transition-colors hover:border-zinc-600 ${shell.cardBg}`}
                    >
                      <div className={`flex flex-wrap items-center gap-2 text-[11px] uppercase tracking-widest ${shell.subtleText}`}>
                        <span className="inline-flex items-center gap-1">
                          <Calendar className="h-3.5 w-3.5" />
                          {format(new Date(post.publishedAt), 'MMM d, yyyy')}
                        </span>
                        <span>·</span>
                        <span className="inline-flex items-center gap-1">
                          <Clock className="h-3.5 w-3.5" />
                          {post.readingTimeMinutes || readingTime(post.body || post.excerpt)} min read
                        </span>
                      </div>
                      <h2 className="mt-2 text-lg font-bold leading-snug line-clamp-2 group-hover:underline underline-offset-4">
                        {post.title}
                      </h2>
                      <p className={`mt-1.5 text-sm leading-relaxed line-clamp-2 md:line-clamp-3 ${shell.mutedText}`}>
                        {post.excerpt || 'No description.'}
                      </p>
                    </Link>
                  </motion.article>
                ))}
              </div>
            )}
          </main>
        </div>
      </div>
    </BlogChrome>
  );
};

export const BlogPostPage = () => {
  usePageScroll();
  const shell = useResumeShellTheme();
  const { theme } = shell;
  const C = T[theme];
  const { slug } = useParams<{ slug: string }>();
  const [post, setPost] = useState<BlogPost | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const aiPrompt = useMemo(
    () => (post ? buildBlogPostPrompt(post, buildPostUrl(post.slug)) : ''),
    [post]
  );

  useEffect(() => {
    if (!slug) {
      setError('Missing article slug.');
      setLoading(false);
      return;
    }
    fetchPost(slug)
      .then(setPost)
      .catch((err) => setError(err instanceof Error ? err.message : 'Unable to load article.'))
      .finally(() => setLoading(false));
  }, [slug]);

  const markdownComponents = useMemo(() => ({
    pre: ({ children }: any) => <>{children}</>,
    h1: ({ children, ...props }: any) => (
      <h1 className="mb-3 mt-8 text-2xl font-bold leading-tight tracking-tight md:text-3xl" {...props}>{children}</h1>
    ),
    h2: ({ children, ...props }: any) => (
      <h2 className={`mb-2 mt-8 border-b ${shell.divider} pb-2 text-xl font-bold leading-tight md:text-2xl`} {...props}>{children}</h2>
    ),
    h3: ({ children, ...props }: any) => (
      <h3 className="mb-2 mt-6 text-lg font-bold leading-snug" {...props}>{children}</h3>
    ),
    h4: ({ children, ...props }: any) => (
      <h4 className="mb-1 mt-4 text-base font-bold leading-snug" {...props}>{children}</h4>
    ),
    p: ({ children, ...props }: any) => (
      <p className="my-3 text-sm leading-relaxed md:text-base md:leading-7" {...props}>{children}</p>
    ),
    a: ({ href, children, ...props }: any) => (
      <a
        href={href}
        target={href?.startsWith('http') ? '_blank' : undefined}
        rel={href?.startsWith('http') ? 'noopener noreferrer' : undefined}
        className="font-medium underline decoration-current/35 underline-offset-[3px] hover:decoration-current transition-colors"
        {...props}
      >
        {children}
      </a>
    ),
    ul: ({ children, ...props }: any) => (
      <ul className="my-3 list-disc space-y-2 pl-5 marker:text-current/45 text-sm md:text-base" {...props}>{children}</ul>
    ),
    ol: ({ children, ...props }: any) => (
      <ol className="my-3 list-decimal space-y-2 pl-5 marker:font-semibold marker:text-current/55 text-sm md:text-base" {...props}>{children}</ol>
    ),
    li: ({ children, ...props }: any) => (
      <li className="pl-1 leading-relaxed" {...props}>{children}</li>
    ),
    blockquote: ({ children, ...props }: any) => (
      <blockquote className={`my-4 rounded-r-sm border-l-2 px-4 py-3 text-sm md:text-base italic leading-relaxed ${C.quote}`} {...props}>
        {children}
      </blockquote>
    ),
    hr: (props: any) => <hr className={`my-4 border-0 border-t ${C.border}`} {...props} />,
    table: ({ children, ...props }: any) => (
      <div className={`not-prose my-3 overflow-x-auto rounded-md border ${C.border}`}>
        <table className="w-full min-w-[400px] border-collapse text-left text-[9px]" {...props}>{children}</table>
      </div>
    ),
    thead: ({ children, ...props }: any) => <thead className={C.tableHeader} {...props}>{children}</thead>,
    th: ({ children, ...props }: any) => (
      <th className={`border-b px-2 py-1.5 font-semibold ${C.border}`} {...props}>{children}</th>
    ),
    td: ({ children, ...props }: any) => (
      <td className={`border-b px-2 py-1.5 align-top leading-4 ${C.border}`} {...props}>{children}</td>
    ),
    tr: ({ children, ...props }: any) => <tr className="last:[&>td]:border-b-0" {...props}>{children}</tr>,
    code: ({ inline, className, children, ...props }: any) => (
      <MarkdownCodeBlock inline={inline} className={className} theme={theme} {...props}>
        {children}
      </MarkdownCodeBlock>
    ),
    img: ({ src, alt, ...props }: any) => (
      <span className="my-6 block">
        <img
          src={src}
          alt={alt || ''}
          className={`mx-auto h-auto w-full max-w-full rounded-sm border object-contain ${C.border}`}
          loading="lazy"
          {...props}
        />
        {alt && <span className={`mt-2 block text-center text-xs ${shell.subtleText}`}>{alt}</span>}
      </span>
    ),
  }), [C, shell.divider, shell.subtleText, theme]);

  const share = async () => {
    if (!post) return;
    const url = buildPostUrl(post.slug);
    try {
      if (navigator.share) {
        await navigator.share({ title: post.title, text: post.excerpt, url });
        return;
      }
    } catch (err: any) {
      if (err?.name === 'AbortError') return;
    }
    await navigator.clipboard.writeText(url);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1200);
  };

  return (
    <BlogChrome>
      <article className={`border-b ${shell.divider} px-4 md:px-6 py-8 md:py-10 ${shell.shellBase} mx-3 md:mx-6 mt-4 mb-6`}>
        <div className="mb-6">
          <Link
            to="/blogs"
            className={`inline-flex items-center gap-1.5 text-xs uppercase tracking-widest transition-colors ${shell.subtleText} ${
              shell.isDark ? 'hover:text-zinc-100' : 'hover:text-zinc-900'
            }`}
          >
            <ArrowLeft className="h-3.5 w-3.5" /> All posts
          </Link>
        </div>

        {loading && <p className={`py-6 text-center text-sm ${shell.mutedText}`}>Loading article...</p>}
        {error && <p className="py-6 text-center text-sm text-rose-400">{error}</p>}

        {!loading && post && (
          <>
            <header className="space-y-4 border-b border-inherit pb-6 mb-8">
              <h1 className="font-serif-display text-2xl md:text-4xl font-bold leading-tight tracking-tight">{post.title}</h1>
              {post.excerpt && <p className={`text-sm md:text-base leading-relaxed max-w-2xl ${shell.mutedText}`}>{post.excerpt}</p>}

              <div className={`flex flex-wrap items-center gap-3 text-[11px] uppercase tracking-widest ${shell.subtleText}`}>
                <span className="inline-flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5" />
                  {format(new Date(post.publishedAt), 'MMM d, yyyy')}
                </span>
                <span className="inline-flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5" />
                  {post.readingTimeMinutes || readingTime(post.body || post.excerpt)} min read
                </span>
              </div>

              {post.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 pt-1">
                  {post.tags.map((tag) => (
                    <span key={tag} className={`rounded-sm border px-2 py-0.5 text-[10px] uppercase tracking-wider ${shell.badge} ${shell.divider}`}>
                      #{tag}
                    </span>
                  ))}
                </div>
              )}
            </header>

            <div className={`prose max-w-none ${C.prose}`}>
              <ReactMarkdown remarkPlugins={[remarkGfm, remarkBreaks]} rehypePlugins={[rehypeRaw]} components={markdownComponents as any}>
                {post.body || post.excerpt || 'No content available.'}
              </ReactMarkdown>
            </div>

            <div className={`mt-10 pt-6 border-t ${shell.divider} flex flex-wrap items-center gap-2`}>
              <button
                type="button"
                onClick={share}
                className={`inline-flex h-9 items-center gap-1.5 rounded-sm border px-3 text-xs font-semibold uppercase tracking-wider transition-colors ${shell.filterInactive}`}
              >
                <Share2 className="h-3.5 w-3.5" /> Share
              </button>
              <button
                type="button"
                onClick={async () => {
                  await navigator.clipboard.writeText(buildPostUrl(post.slug));
                  setCopied(true);
                  window.setTimeout(() => setCopied(false), 1200);
                }}
                className={`inline-flex h-9 items-center gap-1.5 rounded-sm border px-3 text-xs font-semibold uppercase tracking-wider transition-colors ${shell.filterInactive}`}
              >
                {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                {copied ? 'Copied' : 'Copy link'}
              </button>
              <Link
                to="/blogs"
                className={`inline-flex h-9 items-center gap-1.5 rounded-sm border px-3 text-xs font-semibold uppercase tracking-wider transition-colors ${shell.filterInactive}`}
              >
                <ArrowLeft className="h-3.5 w-3.5" /> All articles
              </Link>
            </div>

            <section className={`mt-8 rounded-sm border p-5 md:p-6 ${shell.cardBg}`}>
              <AskAIPanel
                prompt={aiPrompt}
                darkMode={theme === 'dark'}
                variant="blog"
                title="Discuss with AI"
                subtitle="Open an assistant with this article already in context."
                showExtraProviders
              />
            </section>
          </>
        )}
      </article>
    </BlogChrome>
  );
};