import { useEffect, useMemo, useState } from 'react';
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
  Moon,
  RefreshCw,
  Search,
  Share2,
  Sun,
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
import BlogCover from '@/components/blog/BlogCover';

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
    root: 'bg-[#0d0f0f] text-[#f0f0ee]',
    surface: 'bg-[#111414]',
    card: 'bg-[#141818] hover:bg-[#181d1d]',
    input: 'bg-[#1a1f1f] border-0 text-[#f0f0ee] placeholder:text-white/35 focus-visible:ring-1 focus-visible:ring-white/20 rounded-md',
    muted: 'text-white/60',
    subtle: 'text-white/40',
    badge: 'bg-white/8 text-white/70',
    btn: 'bg-white/6 hover:bg-white/10 text-white/70 hover:text-white',
    accentBtn: 'bg-[#d0fffe] text-[#0d1515] hover:bg-[#b8f5f3]',
    divider: 'bg-white/8',
    border: 'border-white/10',
    codeHeader: 'bg-white/[0.04] text-white/55 border-white/10',
    codeSurface: '#0b0d0d',
    tableHeader: 'bg-white/[0.05] text-white/80',
    quote: 'border-[#d0fffe]/45 bg-white/[0.035] text-white/78',
    prose: 'prose-invert prose-headings:text-[#f0f0ee] prose-p:text-white/78 prose-li:text-white/78 prose-a:text-[#d0fffe] prose-code:text-[#ffd3c4] prose-pre:bg-transparent prose-strong:text-white',
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

const useBlogTheme = () => {
  const { settings, updateSettings } = useDesktopStore();
  const theme: BlogTheme = settings.darkMode ? 'dark' : 'light';
  return { theme, toggleTheme: () => updateSettings({ darkMode: !settings.darkMode }) };
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
  const { theme, toggleTheme } = useBlogTheme();
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
    <div className={`min-h-screen font-sans antialiased ${C.root}`}>
      <div className="mx-auto max-w-6xl px-3 py-4 md:px-5 md:py-6">
        <header className="mb-6 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="text-xl font-black leading-none tracking-tight md:text-2xl">Blogs</h1>
            <p className={`mt-1.5 max-w-xl text-xs md:text-sm md:leading-5 ${C.muted}`}>
              Thoughts, deep dives, and things I'm learning- documented.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button onClick={() => window.location.reload()} className={`inline-flex h-6 w-6 items-center justify-center rounded-md ${C.btn}`} aria-label="Reload posts">
              <RefreshCw className="h-3 w-3" />
            </button>
            <button onClick={toggleTheme} className={`inline-flex h-6 items-center gap-1.5 rounded-md px-2 text-[10px] font-semibold ${C.btn}`}>
              {theme === 'dark' ? <Sun className="h-3 w-3" /> : <Moon className="h-3 w-3" />}
              {theme === 'dark' ? 'Light' : 'Dark'}
            </button>
            <a href={devToUrl} target="_blank" rel="noopener noreferrer" className={`inline-flex h-6 items-center gap-1.5 rounded-md px-2 text-[10px] font-bold ${C.accentBtn}`}>
              DEV.to <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        </header>

        <div className="grid gap-4 lg:grid-cols-[200px_minmax(0,1fr)]">
          <aside className={`h-max rounded-lg p-3 lg:sticky lg:top-4 border ${C.border} ${C.surface}`}>
            <div className="relative">
              <Search className={`absolute left-2 top-1/2 h-3 w-3 -translate-y-1/2 ${C.subtle}`} />
              <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search posts..." className={`h-6 pl-6 text-[10px] ${C.input}`} />
            </div>
            <p className={`mt-2 font-mono text-[9px] ${C.muted}`}>{filteredPosts.length} of {posts.length} posts</p>

            <div className="mt-5">
              <p className={`mb-2 font-mono text-[9px] uppercase tracking-[0.1em] ${C.subtle}`}>Sort By</p>
              <div className="grid grid-cols-2 gap-1.5">
                <button onClick={() => setSort('latest')} className={`inline-flex items-center justify-center gap-1 rounded-[4px] px-1 py-1.5 text-[9px] font-semibold transition-colors ${sort === 'latest' ? C.accentBtn : C.btn}`}>
                  <Clock className="h-2.5 w-2.5" /> Latest
                </button>
                <button onClick={() => setSort('popular')} className={`inline-flex items-center justify-center gap-1 rounded-[4px] px-1 py-1.5 text-[9px] font-semibold transition-colors ${sort === 'popular' ? C.accentBtn : C.btn}`}>
                  <Flame className="h-2.5 w-2.5" /> Popular
                </button>
              </div>
            </div>

            <div className="mt-5">
              <p className={`mb-2 inline-flex items-center gap-1.5 font-mono text-[9px] uppercase tracking-[0.1em] ${C.subtle}`}>
                <Tag className="h-2.5 w-2.5" /> Tags
              </p>
              <div className="flex flex-col gap-1">
                <button onClick={() => setActiveTag('all')} className={`flex items-center justify-between rounded-[4px] px-2 py-1 text-left text-[10px] transition-colors ${activeTag === 'all' ? C.accentBtn : C.btn}`}>
                  <span>All posts</span><span className="opacity-70">{posts.length}</span>
                </button>
                {tagStats.map(([tag, count]) => (
                  <button key={tag} onClick={() => setActiveTag(tag)} className={`flex items-center justify-between rounded-[4px] px-2 py-1 text-left text-[10px] transition-colors ${activeTag === tag ? C.accentBtn : C.btn}`}>
                    <span>#{tag}</span><span className="opacity-70">{count}</span>
                  </button>
                ))}
              </div>
            </div>
          </aside>

          <main>
            {loading && <p className={`py-4 text-[10px] ${C.muted}`}>Loading posts...</p>}
            {error && <p className="py-4 text-[10px] text-rose-400">{error}</p>}
            {!loading && !error && filteredPosts.length === 0 && <p className={`py-4 text-[10px] ${C.muted}`}>No posts found.</p>}

            {featuredPost && (
              <div className="grid gap-4">
                <motion.article initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                  <Link to={`/blogs/${featuredPost.slug}`} className={`grid min-h-[200px] overflow-hidden rounded-xl border ${C.border} lg:grid-cols-[1.5fr_1fr] ${C.card}`}>
                    <div className="flex flex-col justify-center p-4">
                      <p className={`mb-2 font-mono text-[9px] uppercase tracking-[0.2em] ${C.subtle}`}>Featured</p>
                      <h2 className="text-base font-bold leading-tight tracking-tight sm:text-lg">{featuredPost.title}</h2>
                      <p className={`mt-2 line-clamp-2 text-[10px] leading-relaxed ${C.muted}`}>{featuredPost.excerpt || 'No description.'}</p>
                      
                      <div className="mt-3 flex flex-wrap gap-1.5 font-mono text-[9px]">
                        {featuredPost.tags.slice(0, 3).map((tag) => (
                           <span key={tag} className={`rounded-[4px] px-1.5 py-0.5 ${C.badge}`}>#{tag}</span>
                        ))}
                      </div>
                      
                      <div className={`mt-3 flex flex-wrap items-center gap-3 font-mono text-[9px] ${C.subtle}`}>
                        <span className="inline-flex items-center gap-1"><Calendar className="h-2.5 w-2.5" />{format(new Date(featuredPost.publishedAt), 'MMM d, yyyy')}</span>
                        <span className="inline-flex items-center gap-1"><Clock className="h-2.5 w-2.5" />{featuredPost.readingTimeMinutes || readingTime(featuredPost.body || featuredPost.excerpt)} min read</span>
                      </div>
                    </div>
                    
                    <div className="relative h-40 w-full shrink-0 overflow-hidden lg:h-full">
                      <BlogCover
                        title={featuredPost.title}
                        coverImage={featuredPost.coverImage}
                        theme={theme}
                        tags={featuredPost.tags}
                        variant="featured"
                        className="absolute inset-0"
                        loading="eager"
                      />
                    </div>
                  </Link>
                </motion.article>

                <div className="grid gap-3 sm:grid-cols-2">
                  {remainingPosts.map((post, index) => (
                    <motion.article key={post.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: index * 0.02 }}>
                      <Link to={`/blogs/${post.slug}`} className={`flex flex-col h-full overflow-hidden rounded-lg border ${C.border} ${C.card}`}>
                        <div className="relative h-24 shrink-0 overflow-hidden sm:h-28">
                          <BlogCover
                            title={post.title}
                            coverImage={post.coverImage}
                            theme={theme}
                            tags={post.tags}
                            variant="card"
                            className="absolute inset-0"
                            loading="lazy"
                          />
                        </div>
                        <div className="flex flex-col grow p-3">
                          <h2 className="line-clamp-2 text-[11px] font-bold leading-tight">{post.title}</h2>
                          <p className={`mt-1.5 line-clamp-2 text-[9px] leading-relaxed grow ${C.muted}`}>{post.excerpt || 'No description.'}</p>
                          <div className={`mt-3 flex flex-wrap items-center gap-2 font-mono text-[8px] ${C.subtle}`}>
                            <span className="inline-flex items-center gap-1"><Calendar className="h-2 w-2" />{format(new Date(post.publishedAt), 'MMM d, yyyy')}</span>
                            <span className="inline-flex items-center gap-1"><Clock className="h-2 w-2" />{post.readingTimeMinutes || readingTime(post.body || post.excerpt)} min</span>
                          </div>
                        </div>
                      </Link>
                    </motion.article>
                  ))}
                </div>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
};

export const BlogPostPage = () => {
  usePageScroll();
  const { theme, toggleTheme } = useBlogTheme();
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
      <h1 className="mb-2 mt-4 text-xl font-bold leading-tight tracking-tight" {...props}>{children}</h1>
    ),
    h2: ({ children, ...props }: any) => (
      <h2 className="mb-2 mt-4 border-b border-current/10 pb-1 text-lg font-bold leading-tight tracking-tight" {...props}>{children}</h2>
    ),
    h3: ({ children, ...props }: any) => (
      <h3 className="mb-1 mt-3 text-base font-bold leading-snug" {...props}>{children}</h3>
    ),
    h4: ({ children, ...props }: any) => (
      <h4 className="mb-1 mt-2 text-sm font-bold leading-snug" {...props}>{children}</h4>
    ),
    p: ({ children, ...props }: any) => (
      <p className="my-2 text-[10px] leading-5 md:text-xs md:leading-6" {...props}>{children}</p>
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
      <ul className="my-2 list-disc space-y-1 pl-4 marker:text-current/45 text-[10px] md:text-xs" {...props}>{children}</ul>
    ),
    ol: ({ children, ...props }: any) => (
      <ol className="my-2 list-decimal space-y-1 pl-4 marker:font-semibold marker:text-current/55 text-[10px] md:text-xs" {...props}>{children}</ol>
    ),
    li: ({ children, ...props }: any) => (
      <li className="pl-1 leading-5 md:leading-6" {...props}>{children}</li>
    ),
    blockquote: ({ children, ...props }: any) => (
      <blockquote className={`my-3 rounded-r-md border-l-2 px-3 py-2 text-[10px] md:text-xs italic leading-5 ${C.quote}`} {...props}>
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
      <span className="my-3 block">
        <img src={src} alt={alt || ''} className={`mx-auto h-auto max-h-[300px] w-full max-w-full rounded-lg border object-cover ${C.border}`} loading="lazy" {...props} />
        {alt && <span className={`mt-1.5 block text-center text-[9px] leading-4 ${C.subtle}`}>{alt}</span>}
      </span>
    ),
  }), [C, theme]);

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
    <div className={`min-h-screen font-sans antialiased ${C.root}`}>
      <main className="mx-auto max-w-3xl px-3 py-4 md:px-5 md:py-6">
        <div className="mb-4 flex items-center justify-between">
          <Link to="/blogs" className={`inline-flex items-center gap-1 rounded-md px-2 py-1 text-[9px] font-medium transition-colors ${C.btn}`}>
            <ArrowLeft className="h-2.5 w-2.5" /> All posts
          </Link>
          <button onClick={toggleTheme} className={`inline-flex h-5 items-center gap-1 rounded-md px-2 text-[9px] font-medium transition-colors ${C.btn}`}>
            {theme === 'dark' ? <Sun className="h-2.5 w-2.5" /> : <Moon className="h-2.5 w-2.5" />}
            {theme === 'dark' ? 'Light' : 'Dark'}
          </button>
        </div>

        {loading && <p className={`py-6 text-center text-[10px] ${C.muted}`}>Loading article...</p>}
        {error && <p className="py-6 text-center text-[10px] text-rose-400">{error}</p>}
        
        {!loading && post && (
          <article>
            <div className={`mb-5 aspect-[16/6] w-full overflow-hidden rounded-xl border md:aspect-[21/8] ${C.border}`}>
              <BlogCover
                title={post.title}
                coverImage={post.coverImage}
                theme={theme}
                tags={post.tags}
                variant="hero"
                loading="eager"
              />
            </div>
            <header className="mx-auto mb-5 max-w-2xl space-y-2">
              <h1 className="text-xl font-bold leading-tight tracking-tight md:text-2xl">{post.title}</h1>
              {post.excerpt && <p className={`text-[10px] leading-5 md:text-xs md:leading-6 ${C.muted}`}>{post.excerpt}</p>}
              
              <div className={`flex flex-wrap items-center gap-3 text-[9px] font-mono mt-1 ${C.subtle}`}>
                <span className="inline-flex items-center gap-1"><Calendar className="h-2.5 w-2.5" />{format(new Date(post.publishedAt), 'MMM d, yyyy')}</span>
                <span className="inline-flex items-center gap-1"><Clock className="h-2.5 w-2.5" />{post.readingTimeMinutes || readingTime(post.body || post.excerpt)} min read</span>
              </div>
              
              <div className="flex flex-wrap gap-1.5 pt-1.5">
                {post.tags.map((tag) => (
                   <span key={tag} className={`rounded-[4px] px-1.5 py-0.5 text-[8px] font-medium ${C.badge}`}>#{tag}</span>
                ))}
              </div>
            </header>
            
            <div className={`mx-auto mb-5 h-px max-w-2xl ${C.divider}`} />
            
            <div className={`mx-auto max-w-2xl rounded-xl border p-3 sm:p-5 md:p-6 ${C.border} ${C.surface}`}>
              <div className={`prose max-w-none text-[10px] leading-5 md:text-xs md:leading-6 ${C.prose}`}>
                <ReactMarkdown remarkPlugins={[remarkGfm, remarkBreaks]} rehypePlugins={[rehypeRaw]} components={markdownComponents as any}>
                  {post.body || post.excerpt || 'No content available.'}
                </ReactMarkdown>
              </div>
            </div>
            
            <div className="mx-auto mt-5 flex max-w-2xl flex-wrap items-center gap-2">
              <button onClick={share} className={`inline-flex h-6 items-center gap-1.5 rounded-md px-2.5 text-[10px] font-semibold transition-colors ${C.btn}`}>
                <Share2 className="h-3 w-3" /> Share
              </button>
              <button
                onClick={async () => {
                  await navigator.clipboard.writeText(buildPostUrl(post.slug));
                  setCopied(true);
                  window.setTimeout(() => setCopied(false), 1200);
                }}
                className={`inline-flex h-6 items-center gap-1.5 rounded-md px-2.5 text-[10px] font-semibold transition-colors ${C.btn}`}
              >
                {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                {copied ? 'Copied' : 'Copy link'}
              </button>
              <Link to="/blogs" className={`inline-flex h-6 items-center gap-1.5 rounded-md px-2.5 text-[10px] font-semibold transition-colors ${C.btn}`}>
                <ArrowLeft className="h-3 w-3" /> All articles
              </Link>
            </div>

            <section className={`mx-auto mt-5 max-w-2xl rounded-xl border p-4 ${C.border} ${C.surface}`}>
              <AskAIPanel
                prompt={aiPrompt}
                darkMode={theme === 'dark'}
                variant="blog"
                title="Discuss with AI"
                subtitle="Open an assistant with this article already in context."
                showExtraProviders
              />
            </section>
          </article>
        )}
      </main>
    </div>
  );
};