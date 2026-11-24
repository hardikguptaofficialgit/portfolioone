import { useCallback, useEffect, useId, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  Check,
  Clock,
  Copy,
  RefreshCw,
  Search,
  Share2,
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
import { useSeo } from '@/hooks/useSeo';
import { DEFAULT_OG_IMAGE, SITE_NAME, SITE_URL } from '@/lib/seo/site-config';
import { usePortfolioPageBackground } from '@/hooks/usePortfolioPageBackground';
import { fetchBlogPostBySlug, fetchBlogPostsList } from '@/lib/portfolio/fetch-portfolio';

type BlogTheme = 'dark' | 'light';

const buildPostUrl = (slug: string, collection: 'blogs' | 'writings' = 'blogs') => {
  const path = `/${collection}/${slug}`;
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

const BlogChrome = ({ children, sectionTitle = 'Blogs' }: { children: React.ReactNode; sectionTitle?: string }) => {
  const shell = useResumeShellTheme();
  const navigate = useNavigate();
  const { isDark, toggleTheme, text, divider } = shell;

  return (
    <div className={`min-h-screen w-full overflow-x-hidden ${isDark ? 'bg-[#09090b]' : 'bg-[#faf9f6]'} ${text} font-sans antialiased selection:bg-[#d0fffe] selection:text-zinc-950`}>
      <header className={`sticky top-0 z-40 border-b ${divider} ${isDark ? 'bg-[#09090b]/95' : 'bg-[#faf9f6]/95'} backdrop-blur-sm`}>
        <div className="mx-auto flex h-16 max-w-3xl items-center justify-between px-5">
          <div className="flex items-center gap-4">
            <Link to="/" className="flex items-center gap-2.5 transition-opacity hover:opacity-70" aria-label="Back to portfolio">
              <img src="/logoimage.png" alt="Hardik Gupta" className="h-7 w-7 rounded-full object-cover" />
              <span className="font-serif-display text-lg tracking-tight">stryker.inside</span>
            </Link>
          </div>
          <div className="flex items-center gap-4">
            <span className={`text-sm ${shell.mutedText}`}>{sectionTitle}</span>
            <PixelThemeToggle isDark={isDark} onToggle={toggleTheme} />
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-3xl px-5 pb-24 pt-12 md:pt-16">
        <button
          type="button"
          onClick={() => window.history.length > 1 ? navigate(-1) : navigate('/')}
          className={`mb-8 inline-flex items-center gap-2 text-sm transition-opacity hover:opacity-60 ${shell.mutedText}`}
        >
          <ArrowLeft className="h-4 w-4" /> Back
        </button>
        {children}
      </main>
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

const fetchPosts = async (collection: 'blogs' | 'writings'): Promise<BlogPost[]> => fetchBlogPostsList(collection);

const fetchPost = async (slug: string, collection: 'blogs' | 'writings'): Promise<BlogPost> => fetchBlogPostBySlug(slug, collection);

const MarkdownCodeBlock = ({ inline, className, children, theme, ...props }: any) => {
  const match = /language-(\w+)/.exec(className || '');
  const code = String(children ?? '').replace(/\n$/, '');
  const [copied, setCopied] = useState(false);
  const isBlock = Boolean(match) || code.includes('\n');
  const C = T[theme as BlogTheme];

  if (match?.[1]?.toLowerCase() === 'mermaid' && !inline) {
    return <MermaidDiagram source={code} darkMode={theme === 'dark'} />;
  }

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

const MermaidDiagram = ({ source, darkMode }: { source: string; darkMode: boolean }) => {
  const [svg, setSvg] = useState('');
  const [failed, setFailed] = useState(false);
  const reactId = useId();
  const id = `mermaid-${reactId.replace(/[^a-zA-Z0-9_-]/g, '')}`;

  useEffect(() => {
    let active = true;
    import('mermaid').then(({ default: mermaid }) => {
      mermaid.initialize({ startOnLoad: false, securityLevel: 'strict', theme: darkMode ? 'dark' : 'neutral' });
      return mermaid.render(id, source);
    }).then(({ svg: rendered }) => {
      if (active) { setSvg(rendered); setFailed(false); }
    }).catch(() => { if (active) setFailed(true); });
    return () => { active = false; };
  }, [darkMode, id, source]);

  if (failed) return <pre className="my-5 overflow-x-auto rounded-lg border p-4 text-xs"><code>{source}</code></pre>;
  return (
    <div className={`not-prose my-7 overflow-x-auto rounded-xl border p-4 md:p-6 ${darkMode ? 'border-zinc-800 bg-zinc-900/60' : 'border-black/10 bg-white/80'}`}>
      {svg ? <div className="mx-auto min-w-[520px] [&_svg]:mx-auto [&_svg]:h-auto [&_svg]:max-w-full" dangerouslySetInnerHTML={{ __html: svg }} /> : <p className="text-center text-xs opacity-50">Rendering diagram…</p>}
    </div>
  );
};

export const BlogListPage = () => {
  usePageScroll();
  const { pathname } = useLocation();
  const collection = pathname.startsWith('/writings') ? 'writings' : 'blogs';
  const collectionPath = `/${collection}`;
  const isWritings = collection === 'writings';
  const shell = useResumeShellTheme();
  const { theme } = shell;
  const C = T[theme];
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [activeTag, setActiveTag] = useState('all');
  const [sort, setSort] = useState<'featured' | 'popular'>('featured');

  useEffect(() => {
    setLoading(true);
    setError(null);
    setPosts([]);
    fetchPosts(collection)
      .then(setPosts)
      .catch((err) => setError(err instanceof Error ? err.message : 'Unable to load posts.'))
      .finally(() => setLoading(false));
  }, [collection]);

  useEffect(() => {
    if (!import.meta.hot) return;
    const refreshPosts = () => {
      fetchPosts(collection)
        .then(setPosts)
        .catch((err) => setError(err instanceof Error ? err.message : 'Unable to refresh posts.'));
    };
    import.meta.hot.on('portfolio:markdown-updated', refreshPosts);
    return () => import.meta.hot?.off('portfolio:markdown-updated', refreshPosts);
  }, [collection]);

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
      return Number(b.featured === true) - Number(a.featured === true) || (a.sortOrder ?? 999) - (b.sortOrder ?? 999) || a.title.localeCompare(b.title);
    });
  }, [activeTag, posts, search, sort]);

  const featuredPost = filteredPosts[0];
  const remainingPosts = filteredPosts.slice(1);
  return (
    <BlogChrome sectionTitle={isWritings ? 'Writings' : 'Blogs'}>
      <section>
        <div className="mb-10 flex items-start justify-between gap-5">
          <div>
            <p className={`mb-3 text-xs font-medium uppercase tracking-[0.18em] ${shell.subtleText}`}>{isWritings ? 'Personal' : 'Engineering'}</p>
            <h1 className="font-serif-display text-4xl tracking-tight md:text-5xl">{isWritings ? 'Writings' : 'Blogs'}</h1>
            <p className={`mt-4 max-w-xl text-sm leading-7 ${shell.mutedText}`}>
              {isWritings ? 'Personal notes, reflections, stories, and ideas.' : 'Technical deep dives, engineering notes, and things I learn while building.'}
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-2 pt-1">
            <button
              type="button"
              onClick={() => window.location.reload()}
              className={`inline-flex h-9 w-9 items-center justify-center rounded-full transition-colors ${shell.btn}`}
              aria-label="Reload posts"
            >
              <RefreshCw className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative w-full sm:max-w-xs">
            <Search className={`absolute left-0 top-1/2 h-4 w-4 -translate-y-1/2 ${shell.subtleText}`} />
            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search..." className={`h-10 rounded-none border-0 border-b pl-7 text-sm shadow-none focus-visible:ring-0 ${shell.divider} ${isWritings ? shell.inputBg : shell.inputBg}`} />
          </div>
          <div className="flex items-center gap-3">
            <span className={`text-xs ${shell.subtleText}`}>{filteredPosts.length} posts</span>
            <button type="button" onClick={() => setSort('featured')} className={`text-xs transition-colors ${sort === 'featured' ? shell.text : shell.subtleText}`}>Featured</button>
            <button type="button" onClick={() => setSort('popular')} className={`text-xs transition-colors ${sort === 'popular' ? shell.text : shell.subtleText}`}>Popular</button>
          </div>
        </div>
        {tagStats.length > 0 && <div className="mb-7 flex flex-wrap gap-2">
          <button type="button" onClick={() => setActiveTag('all')} className={`rounded-full px-3 py-1.5 text-xs transition-colors ${activeTag === 'all' ? (isWritings ? 'bg-white/10 text-white' : 'bg-black/8 text-black') : shell.mutedText}`}>All</button>
          {tagStats.map(([tag]) => <button key={tag} type="button" onClick={() => setActiveTag(tag)} className={`rounded-full px-3 py-1.5 text-xs transition-colors ${activeTag === tag ? (isWritings ? 'bg-white/10 text-white' : 'bg-black/8 text-black') : shell.mutedText}`}>#{tag}</button>)}
        </div>}

        <div className={`divide-y ${shell.divider}`}>
            {loading && <p className={`py-4 text-sm ${shell.mutedText}`}>Loading posts...</p>}
            {error && <p className="py-4 text-sm text-rose-400">{error}</p>}
            {!loading && !error && filteredPosts.length === 0 && (
              <p className={`py-4 text-sm ${shell.mutedText}`}>No posts found.</p>
            )}

            {featuredPost && (
              <div>
                <motion.article initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="border-b-0">
                  <Link
                    to={`${collectionPath}/${featuredPost.slug}`}
                    className="group block py-5 transition-opacity hover:opacity-75"
                  >
                    <p className={`mb-2 text-[11px] uppercase tracking-[0.16em] ${shell.subtleText}`}>Featured</p>
                    <h2 className="font-serif-display text-2xl leading-snug md:text-3xl">{featuredPost.title}</h2>
                    <p className={`mt-3 line-clamp-3 max-w-2xl text-sm leading-7 ${shell.mutedText}`}>
                      {featuredPost.excerpt || 'No description.'}
                    </p>
                    <span className={`mt-3 inline-flex items-center gap-1.5 text-xs ${shell.subtleText}`}><Clock className="h-3.5 w-3.5" /> {featuredPost.readingTimeMinutes || readingTime(featuredPost.body || featuredPost.excerpt)} min read</span>
                  </Link>
                </motion.article>

                {remainingPosts.map((post, index) => (
                  <motion.article key={post.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: index * 0.02 }} className={`border-t ${shell.divider}`}>
                    <Link
                      to={`${collectionPath}/${post.slug}`}
                      className="group block py-5 transition-opacity hover:opacity-75"
                    >
                      <h2 className="font-serif-display text-xl leading-snug md:text-2xl">
                        {post.title}
                      </h2>
                      <p className={`mt-2 max-w-2xl text-sm leading-7 line-clamp-2 ${shell.mutedText}`}>
                        {post.excerpt || 'No description.'}
                      </p>
                      <span className={`mt-2 inline-flex items-center gap-1.5 text-xs ${shell.subtleText}`}><Clock className="h-3.5 w-3.5" /> {post.readingTimeMinutes || readingTime(post.body || post.excerpt)} min read</span>
                    </Link>
                  </motion.article>
                ))}
              </div>
            )}
        </div>
      </section>
    </BlogChrome>
  );
};

export const BlogPostPage = () => {
  usePageScroll();
  const { pathname } = useLocation();
  const collection = pathname.startsWith('/writings/') ? 'writings' : 'blogs';
  const collectionPath = `/${collection}`;
  const isWritings = collection === 'writings';
  const shell = useResumeShellTheme();
  const { theme } = shell;
  const C = T[theme];
  const { slug } = useParams<{ slug: string }>();
  const [post, setPost] = useState<BlogPost | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const aiPrompt = useMemo(
    () => (post ? buildBlogPostPrompt(post, buildPostUrl(post.slug, collection)) : ''),
    [post, collection]
  );

  const postSeo = useMemo(() => {
    if (!post) return null;
    const description = post.excerpt?.trim() || post.title;
    const ogImage = post.coverImage
      ? post.coverImage.startsWith('http')
        ? post.coverImage
        : `${SITE_URL}${post.coverImage}`
      : DEFAULT_OG_IMAGE;
    return {
      title: `${post.title} | ${SITE_NAME}`,
      description,
      canonicalPath: `${collectionPath}/${post.slug}`,
      ogType: 'article' as const,
      ogImage,
      jsonLd: {
        '@context': 'https://schema.org',
        '@type': 'BlogPosting',
        headline: post.title,
        description,
        author: { '@type': 'Person', name: 'Hardik Gupta', url: SITE_URL },
        mainEntityOfPage: `${SITE_URL}${collectionPath}/${post.slug}`,
        image: ogImage,
      },
    };
  }, [post, collectionPath]);

  useSeo(postSeo);

  useEffect(() => {
    if (!slug) {
      setError('Missing article slug.');
      setLoading(false);
      return;
    }
    setLoading(true);
    fetchPost(slug, collection)
      .then(setPost)
      .catch((err) => setError(err instanceof Error ? err.message : 'Unable to load article.'))
      .finally(() => setLoading(false));
  }, [slug, collection]);

  useEffect(() => {
    if (!import.meta.hot || !slug) return;
    const refreshPost = () => {
      fetchPost(slug, collection)
        .then((nextPost) => {
          setPost(nextPost);
          setError(null);
        })
        .catch((err) => setError(err instanceof Error ? err.message : 'Unable to refresh article.'));
    };
    import.meta.hot.on('portfolio:markdown-updated', refreshPost);
    return () => import.meta.hot?.off('portfolio:markdown-updated', refreshPost);
  }, [slug, collection]);

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
        <table className="w-full min-w-[480px] border-collapse text-left text-xs md:text-sm" {...props}>{children}</table>
      </div>
    ),
    thead: ({ children, ...props }: any) => <thead className={C.tableHeader} {...props}>{children}</thead>,
    th: ({ children, ...props }: any) => (
      <th className={`border-b px-3 py-2 font-semibold ${C.border}`} {...props}>{children}</th>
    ),
    td: ({ children, ...props }: any) => (
      <td className={`border-b px-3 py-2 align-top leading-5 ${C.border}`} {...props}>{children}</td>
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
    const url = buildPostUrl(post.slug, collection);
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
    <BlogChrome sectionTitle={isWritings ? 'Writings' : 'Blogs'}>
      <article className="mx-auto max-w-2xl">
        <div className="mb-6">
          <Link
            to={collectionPath}
            className={`inline-flex items-center gap-1.5 text-xs uppercase tracking-widest transition-colors ${shell.subtleText} ${
              shell.isDark ? 'hover:text-zinc-100' : 'hover:text-zinc-900'
            }`}
          >
            <ArrowLeft className="h-3.5 w-3.5" /> All {isWritings ? 'writings' : 'posts'}
          </Link>
        </div>

        {loading && <p className={`py-6 text-center text-sm ${shell.mutedText}`}>Loading article...</p>}
        {error && <p className="py-6 text-center text-sm text-rose-400">{error}</p>}

        {!loading && post && (
          <>
            <header className={`mb-9 space-y-4 border-b pb-7 ${shell.divider}`}>
              <h1 className="font-serif-display text-3xl leading-tight tracking-tight md:text-5xl">{post.title}</h1>
              {post.excerpt && <p className={`text-sm md:text-base leading-relaxed max-w-2xl ${shell.mutedText}`}>{post.excerpt}</p>}

              <div className={`flex flex-wrap items-center gap-3 text-[11px] uppercase tracking-widest ${shell.subtleText}`}>
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

            <div className={`prose prose-sm max-w-none md:prose-base prose-headings:scroll-mt-24 prose-headings:font-semibold prose-p:leading-8 prose-li:leading-7 prose-pre:my-5 prose-img:my-0 prose-img:rounded-xl prose-img:border ${theme === 'dark' ? 'prose-img:border-zinc-800' : 'prose-img:border-black/10'} prose-figure:my-8 prose-figcaption:mt-2 prose-figcaption:text-center prose-figcaption:text-xs prose-figcaption:opacity-60 prose-table:text-sm prose-th:whitespace-nowrap prose-td:align-top ${C.prose}`}>
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
                  await navigator.clipboard.writeText(buildPostUrl(post.slug, collection));
                  setCopied(true);
                  window.setTimeout(() => setCopied(false), 1200);
                }}
                className={`inline-flex h-9 items-center gap-1.5 rounded-sm border px-3 text-xs font-semibold uppercase tracking-wider transition-colors ${shell.filterInactive}`}
              >
                {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                {copied ? 'Copied' : 'Copy link'}
              </button>
              <Link
                to={collectionPath}
                className={`inline-flex h-9 items-center gap-1.5 rounded-sm border px-3 text-xs font-semibold uppercase tracking-wider transition-colors ${shell.filterInactive}`}
              >
                <ArrowLeft className="h-3.5 w-3.5" /> All {isWritings ? 'writings' : 'articles'}
              </Link>
            </div>

            {!isWritings && (
              <section className={`mt-10 border-t pt-8 ${shell.divider}`}>
                <AskAIPanel
                  prompt={aiPrompt}
                  darkMode={theme === 'dark'}
                  variant="blog"
                  title="Discuss with AI"
                  subtitle="Open an assistant with this article already in context."
                  showExtraProviders
                />
              </section>
            )}
          </>
        )}
      </article>
    </BlogChrome>
  );
};
