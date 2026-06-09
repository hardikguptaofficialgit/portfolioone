import { useEffect, useMemo, useState, useCallback, type ReactNode } from 'react';
import { Link, useParams } from 'react-router-dom';
import { format } from 'date-fns';
import {
  ArrowLeft,
  ArrowUpRight,
  Calendar,
  Check,
  Copy,
  Clock,
  Flame,
  Heart,
  MessageCircle,
  Moon,
  RefreshCw,
  Search,
  Share2,
  Sun,
  Tag,
  ExternalLink,
} from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import Copilot from '@lobehub/icons/es/Copilot';
import { ModelIcon } from '@lobehub/icons/es/features';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus, oneLight } from 'react-syntax-highlighter/dist/esm/styles/prism';
import remarkGfm from 'remark-gfm';
import remarkBreaks from 'remark-breaks';
import rehypeRaw from 'rehype-raw';
import { DevToArticle, DevToComment, fetchDevToArticleById, fetchDevToArticleBySlug, fetchDevToArticles, fetchDevToComments } from '@/lib/devto';
import { Input } from '@/components/ui/input';
import { useDesktopStore } from '@/store/desktopStore';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
type BlogTheme = 'dark' | 'light';
type SortMode = 'latest' | 'popular';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
const getUsername = () => {
  const envUser =
    typeof import.meta !== 'undefined' && import.meta.env
      ? import.meta.env.VITE_DEV_USERNAME
      : '';
  return (envUser || 'strykerinside').replace(/^@/, '');
};

const buildAppPostUrl = (slug: string) => {
  const path = `/blog/${slug}`;
  if (typeof window === 'undefined') return path;
  return new URL(path, window.location.origin).toString();
};

const readingTime = (text: string) =>
  Math.max(1, Math.round((text || '').split(/\s+/).filter(Boolean).length / 220));

const stripHtml = (value: string) =>
  value.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();

const flattenComments = (comments: DevToComment[]): DevToComment[] => {
  const output: DevToComment[] = [];
  const walk = (nodes: DevToComment[]) => {
    nodes.forEach((node) => {
      output.push(node);
      if (node.children?.length) walk(node.children);
    });
  };
  walk(comments);
  return output;
};

/**
 * Normalize DEV.to body_markdown for external rendering.
 *
 * DEV.to uses Liquid tags ({% %} blocks) for rich embeds that only work
 * inside their platform. We strip/convert them here so markdown renders
 * cleanly in react-markdown.
 *
 * Liquid patterns handled:
 *   {% embed https://... %}          → clickable link block
 *   {% youtube VIDEO_ID %}           → YouTube link
 *   {% twitter TWEET_ID %}           → Twitter/X link
 *   {% codepen ... %}                → CodePen link
 *   {% gist ... %}                   → GitHub Gist link
 *   {% link ... %}                   → plain link
 *   {% raw %}...{% endraw %}         → strip wrapper, keep content
 *   {% ... %}                        → remove unknown tags
 *
 * Also fixes:
 *   - Relative image paths (DEV CDN)
 *   - Windows-style line endings
 */
const normalizeDEVMarkdown = (raw: string): string => {
  if (!raw) return '';

  let md = raw;

  // Normalize line endings
  md = md.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

  // {% raw %} / {% endraw %}- keep inner content
  md = md.replace(/\{%\s*raw\s*%\}([\s\S]*?)\{%\s*endraw\s*%\}/gi, '$1');

  // {% embed url %} → markdown link block
  md = md.replace(
    /\{%\s*embed\s+(https?:\/\/[^\s%}]+)\s*%\}/gi,
    (_m, url) => `\n> 🔗 [View embed](${url})\n`
  );

  // {% youtube VIDEO_ID %} → YouTube link
  md = md.replace(
    /\{%\s*youtube\s+([A-Za-z0-9_-]+)\s*%\}/gi,
    (_m, id) => `\n> ▶️ [Watch on YouTube](https://www.youtube.com/watch?v=${id})\n`
  );

  // {% twitter TWEET_ID %} or {% tweet TWEET_ID %}
  md = md.replace(
    /\{%\s*(?:twitter|tweet)\s+([0-9]+)\s*%\}/gi,
    (_m, id) => `\n> 🐦 [View tweet](https://twitter.com/i/web/status/${id})\n`
  );

  // {% codepen slug %}- minimal
  md = md.replace(
    /\{%\s*codepen\s+([^\s%}]+)\s*[^%]*%\}/gi,
    (_m, slug) => `\n> 🖊️ [View on CodePen](https://codepen.io/pen/${slug})\n`
  );

  // {% gist user/hash %} or {% gist hash %}
  md = md.replace(
    /\{%\s*gist\s+([^\s%}]+)\s*%\}/gi,
    (_m, ref) => `\n> 📋 [View Gist](https://gist.github.com/${ref})\n`
  );

  // {% link url_or_slug %} or {% post_url ... %}
  md = md.replace(
    /\{%\s*(?:link|post_url)\s+(https?:\/\/[^\s%}]+)\s*%\}/gi,
    (_m, url) => `\n> 🔗 [Read more](${url})\n`
  );
  md = md.replace(
    /\{%\s*(?:link|post_url)\s+([^\s%}]+)\s*%\}/gi,
    (_m, slug) => `\n> 🔗 [Read more](https://dev.to/${slug})\n`
  );

  // Remove any remaining unrecognized {% ... %} liquid tags
  md = md.replace(/\{%[^%]*%\}/g, '');

  // Fix DEV.to relative image URLs (shouldn't be common but just in case)
  md = md.replace(
    /!\[([^\]]*)\]\(\/\/(.+?)\)/g,
    '![$1](https://$2)'
  );

  return md;
};

// ---------------------------------------------------------------------------
// Markdown Code Block component
// ---------------------------------------------------------------------------
const MarkdownCodeBlock = ({
  inline,
  className,
  children,
  theme,
  ...props
}: any) => {
  const match = /language-(\w+)/.exec(className || '');
  const code = String(children ?? '').replace(/\n$/, '');
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  };

  if (inline) {
    return (
      <code
        className={`rounded px-1.5 py-0.5 font-mono text-[0.85em] ${
          theme === 'dark' ? 'bg-white/10 text-[#ffd3c4]' : 'bg-black/6 text-[#c7254e]'
        }`}
        {...props}
      >
        {children}
      </code>
    );
  }

  return (
    <div
      className={`not-prose group relative my-5 overflow-hidden rounded-xl border ${
        theme === 'dark' ? 'border-white/10 bg-[#0b0d0d]' : 'border-black/10 bg-[#f8f8f8]'
      }`}
    >
      {/* Language label + copy button */}
      <div
        className={`flex items-center justify-between px-4 py-2 text-[10px] font-mono ${
          theme === 'dark' ? 'border-b border-white/8 text-white/40' : 'border-b border-black/8 text-black/40'
        }`}
      >
        <span>{match?.[1] || 'code'}</span>
        <button
          onClick={handleCopy}
          className={`flex items-center gap-1 rounded px-1.5 py-0.5 transition-colors ${
            theme === 'dark' ? 'hover:bg-white/10 hover:text-white/70' : 'hover:bg-black/8 hover:text-black/70'
          }`}
        >
          {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
          {copied ? 'Copied' : 'Copy'}
        </button>
      </div>
      <SyntaxHighlighter
        language={match?.[1] || 'text'}
        style={theme === 'dark' ? vscDarkPlus : oneLight}
        customStyle={{
          margin: 0,
          padding: '1rem',
          background: 'transparent',
          fontSize: '0.875rem',
          lineHeight: 1.65,
        }}
        codeTagProps={{
          style: {
            fontFamily:
              'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
          },
        }}
        PreTag="div"
        {...props}
      >
        {code}
      </SyntaxHighlighter>
    </div>
  );
};

// ---------------------------------------------------------------------------
// AI Quick Actions
// ---------------------------------------------------------------------------
type AIToolOption = {
  label: string;
  shortLabel: string;
  model: string;
  urlBase: string;
};

const AI_TOOL_OPTIONS: AIToolOption[] = [
  { label: 'Chat with ChatGPT', shortLabel: 'Ask ChatGPT', model: 'gpt-5', urlBase: 'https://chatgpt.com/?q=' },
  { label: 'Extend conversation with Claude', shortLabel: 'Ask Claude', model: 'claude', urlBase: 'https://claude.ai/new?q=' },
  { label: 'Chat with Gemini', shortLabel: 'Ask Gemini', model: 'gemini', urlBase: 'https://gemini.google.com/app?prompt=' },
  { label: 'Ask Perplexity', shortLabel: 'Ask Perplexity', model: 'pplx', urlBase: 'https://www.perplexity.ai/search/new?q=' },
  { label: 'Open Microsoft Copilot', shortLabel: 'Ask Copilot', model: 'copilot', urlBase: 'https://copilot.microsoft.com/?q=' },
  { label: 'Try Hugging Face Chat', shortLabel: 'Ask HuggingFace', model: 'openrouter', urlBase: 'https://huggingface.co/chat/?q=' },
];

const PRIMARY_AI_TOOLS = AI_TOOL_OPTIONS.slice(0, 3);
const EXTRA_AI_TOOLS = AI_TOOL_OPTIONS.slice(3);

const buildAIConversationPrompt = (post: Pick<DevToArticle, 'title' | 'url' | 'description'>) =>
  [
    `Let's discuss this article in detail.`,
    `Title: ${post.title}`,
    `Summary: ${post.description || 'No summary provided.'}`,
    `URL: ${post.url}`,
    `I want key takeaways, critique, practical next steps, and production-grade implementation ideas.`,
  ].join('\n');

const AIQuickActions = ({
  post,
  buttonClass,
}: {
  post: Pick<DevToArticle, 'title' | 'url' | 'description'>;
  buttonClass: string;
}) => {
  const [visibleSet, setVisibleSet] = useState<'primary' | 'extra'>('primary');
  const prompt = useMemo(
    () => buildAIConversationPrompt(post),
    [post.title, post.url, post.description]
  );

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {(visibleSet === 'primary' ? PRIMARY_AI_TOOLS : EXTRA_AI_TOOLS).map((tool) => (
        <a
          key={tool.label}
          href={`${tool.urlBase}${encodeURIComponent(prompt)}`}
          target="_blank"
          rel="noopener noreferrer"
          className={`inline-flex h-7 items-center gap-1 rounded-lg px-2 text-[11px] font-medium transition-colors ${buttonClass}`}
          title={tool.label}
        >
          {tool.model === 'copilot' ? (
            <Copilot.Color size={16} />
          ) : (
            <ModelIcon model={tool.model} size={16} type="color" />
          )}
          <span>{tool.shortLabel}</span>
        </a>
      ))}

      {EXTRA_AI_TOOLS.length > 0 && (
        <GhostBtn
          onClick={() => setVisibleSet((v) => (v === 'primary' ? 'extra' : 'primary'))}
          className={buttonClass}
          aria-pressed={visibleSet === 'extra'}
        >
          {visibleSet === 'primary' ? 'More...' : 'Back'}
          <motion.span
            animate={{ rotate: visibleSet === 'primary' ? 0 : 180 }}
            transition={{ type: 'spring', stiffness: 420, damping: 28 }}
            className="inline-flex"
          >
            <ArrowUpRight className="h-3 w-3 rotate-45" />
          </motion.span>
        </GhostBtn>
      )}
    </div>
  );
};

// ---------------------------------------------------------------------------
// Hooks
// ---------------------------------------------------------------------------
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

const useMobileCompactHeader = (threshold = 56) => {
  const [isCompact, setIsCompact] = useState(false);
  useEffect(() => {
    const update = () => setIsCompact(window.innerWidth < 768 && window.scrollY > threshold);
    update();
    window.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
    return () => {
      window.removeEventListener('scroll', update);
      window.removeEventListener('resize', update);
    };
  }, [threshold]);
  return isCompact;
};

// ---------------------------------------------------------------------------
// Theme tokens
// ---------------------------------------------------------------------------
const T = {
  dark: {
    root: 'bg-[#0d0f0f] text-[#f0f0ee]',
    sidebar: 'bg-[#111414]',
    card: 'bg-[#141818] hover:bg-[#181d1d]',
    featuredCard: 'bg-[#141818]',
    input: 'bg-[#1a1f1f] border-0 text-[#f0f0ee] placeholder:text-white/35 focus-visible:ring-1 focus-visible:ring-white/20 rounded-lg',
    muted: 'text-white/60',
    subtle: 'text-white/40',
    badge: 'bg-white/8 text-white/70 border-0',
    pill: { active: 'bg-white/12 text-white font-medium', inactive: 'text-white/50 hover:bg-white/6 hover:text-white/80' },
    btn: 'bg-white/6 hover:bg-white/10 text-white/70 hover:text-white',
    accentBtn: 'bg-[#d0fffe] text-[#0d1515] hover:bg-[#b8f5f3]',
    coverFallback: 'bg-[#1a1f1f] text-white/25',
    divider: 'bg-white/8',
    prose: 'prose-invert prose-headings:text-[#f0f0ee] prose-a:text-[#d0fffe] prose-code:text-[#ffd3c4] prose-pre:bg-[#0d0f0f] prose-blockquote:border-l-white/20 prose-blockquote:text-white/60 prose-strong:text-white prose-th:text-white',
    accent: '#d0fffe',
    accentFg: '#0d1515',
    spinnerColor: '#d0fffe',
    embedBlock: 'bg-white/5 border border-white/10 text-white/70 hover:bg-white/8',
    imgBorder: 'border-white/10',
  },
  light: {
    root: 'bg-[#f6f5f0] text-[#1a1a1a]',
    sidebar: 'bg-[#eeede8]',
    card: 'bg-white hover:bg-[#fafaf8]',
    featuredCard: 'bg-white',
    input: 'bg-white border-0 text-[#1a1a1a] placeholder:text-black/35 focus-visible:ring-1 focus-visible:ring-black/15 rounded-lg',
    muted: 'text-black/55',
    subtle: 'text-black/38',
    badge: 'bg-black/6 text-black/55 border-0',
    pill: { active: 'bg-black/10 text-black font-medium', inactive: 'text-black/45 hover:bg-black/5 hover:text-black/70' },
    btn: 'bg-black/5 hover:bg-black/9 text-black/60 hover:text-black',
    accentBtn: 'bg-[#1a1a1a] text-white hover:bg-[#333]',
    coverFallback: 'bg-[#e8e7e2] text-black/25',
    divider: 'bg-black/8',
    prose: 'prose-headings:text-[#1a1a1a] prose-a:text-[#0070f3] prose-code:text-[#c7254e] prose-pre:bg-[#f0efe9] prose-blockquote:border-l-black/20 prose-blockquote:text-black/60',
    accent: '#1a1a1a',
    accentFg: '#ffffff',
    spinnerColor: '#1a1a1a',
    embedBlock: 'bg-black/4 border border-black/10 text-black/60 hover:bg-black/6',
    imgBorder: 'border-black/10',
  },
};

// ---------------------------------------------------------------------------
// Shared sub-components
// ---------------------------------------------------------------------------
const ArticleMeta = ({ post, subtle }: { post: DevToArticle; subtle: string }) => (
  <div className={`flex flex-wrap items-center gap-3 text-[11px] font-mono tracking-wide ${subtle}`}>
    <span className="inline-flex items-center gap-1">
      <Calendar className="h-3 w-3" />
      {format(new Date(post.published_at), 'MMM d, yyyy')}
    </span>
    <span className="inline-flex items-center gap-1">
      <Clock className="h-3 w-3" />
      {post.reading_time_minutes || readingTime(post.description)} min read
    </span>
    {post.public_reactions_count > 0 && (
      <span className="inline-flex items-center gap-1">
        <Heart className="h-3 w-3" />
        {post.public_reactions_count}
      </span>
    )}
    {post.comments_count > 0 && (
      <span className="inline-flex items-center gap-1">
        <MessageCircle className="h-3 w-3" />
        {post.comments_count}
      </span>
    )}
  </div>
);

const GhostBtn = ({
  onClick,
  children,
  className = '',
  size = 'sm',
  ...buttonProps
}: {
  onClick?: (e: React.MouseEvent) => void;
  children: React.ReactNode;
  className?: string;
  size?: 'sm' | 'md';
} & React.ButtonHTMLAttributes<HTMLButtonElement>) => (
  <button
    type="button"
    onClick={onClick}
    {...buttonProps}
    className={`inline-flex items-center gap-1.5 rounded-lg font-medium transition-colors
      ${size === 'sm' ? 'h-7 px-2.5 text-[11px]' : 'h-9 px-3.5 text-xs'}
      ${className}`}
  >
    {children}
  </button>
);

// ---------------------------------------------------------------------------
// Spinner
// ---------------------------------------------------------------------------
const Spinner = ({ color }: { color: string }) => (
  <span
    className="inline-block h-4 w-4 rounded-full border-2 animate-spin"
    style={{ borderColor: `${color} transparent transparent transparent` }}
  />
);

// ---------------------------------------------------------------------------
// BlogListPage
// ---------------------------------------------------------------------------
export const BlogListPage = () => {
  usePageScroll();
  const isMobileCompact = useMobileCompactHeader(56);
  const { theme, toggleTheme } = useBlogTheme();
  const C = T[theme];

  const [posts, setPosts] = useState<DevToArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [activeTag, setActiveTag] = useState<string>('all');
  const [sortMode, setSortMode] = useState<SortMode>('latest');
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const [imageErrors, setImageErrors] = useState<Record<number, boolean>>({});
  const username = getUsername();

  const copyToClipboard = async (value: string) => {
    try { await navigator.clipboard.writeText(value); return true; } catch { return false; }
  };

  const openComments = (post: DevToArticle) =>
    window.open(`${post.url}#comments`, '_blank', 'noopener,noreferrer');

  const sharePost = async (post: DevToArticle) => {
    try {
      if (navigator.share) {
        await navigator.share({ title: post.title, text: post.description || post.title, url: post.url });
        return;
      }
    } catch (err: any) { if (err?.name === 'AbortError') return; }
    const copied = await copyToClipboard(post.url);
    if (copied) { setCopiedId(post.id); window.setTimeout(() => setCopiedId((c) => (c === post.id ? null : c)), 1200); }
  };

  const copyLink = async (post: DevToArticle) => {
    const copied = await copyToClipboard(buildAppPostUrl(post.slug));
    if (copied) { setCopiedId(post.id); window.setTimeout(() => setCopiedId((c) => (c === post.id ? null : c)), 1200); }
  };

  const loadPosts = useCallback(async (signal?: AbortSignal) => {
    try {
      setLoading(true); setError(null);
      const data = await fetchDevToArticles(username, 24, { perPage: 24, signal });
      if (signal?.aborted) return;
      setPosts(data);
    } catch (err: any) {
      if (signal?.aborted || err.name === 'AbortError') return;
      setError(err instanceof Error ? err.message : 'Unable to load DEV.to posts.');
      setPosts([]);
    } finally { if (!signal?.aborted) setLoading(false); }
  }, [username]);

  useEffect(() => {
    const ctrl = new AbortController();
    loadPosts(ctrl.signal);
    return () => ctrl.abort();
  }, [loadPosts]);

  const tagStats = useMemo(() => {
    const map = new Map<string, number>();
    posts.forEach((p) => p.tag_list.forEach((t) => map.set(t, (map.get(t) || 0) + 1)));
    return Array.from(map.entries())
      .map(([tag, count]) => ({ tag, count }))
      .sort((a, b) => b.count - a.count || a.tag.localeCompare(b.tag));
  }, [posts]);

  const searched = useMemo(() => {
    if (!search.trim()) return posts;
    const q = search.toLowerCase();
    return posts.filter((p) =>
      [p.title, p.description, p.tag_list.join(' ')].join(' ').toLowerCase().includes(q)
    );
  }, [posts, search]);

  const filtered = useMemo(() => {
    const tagFiltered = activeTag === 'all' ? searched : searched.filter((p) => p.tag_list.includes(activeTag));
    return [...tagFiltered].sort((a, b) => {
      if (sortMode === 'popular')
        return (b.public_reactions_count * 2 + b.comments_count) - (a.public_reactions_count * 2 + a.comments_count);
      return +new Date(b.published_at) - +new Date(a.published_at);
    });
  }, [searched, activeTag, sortMode]);

  const featured = filtered[0];
  const rest = filtered.slice(1);

  return (
    <div className={`min-h-screen font-sans antialiased ${C.root}`}>
      <div className="mx-auto max-w-7xl px-4 py-8 md:px-8 md:py-12">
        {/* Header */}
        <header className="mb-8 md:mb-10">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"
          >
            <div>
              <h1 className="text-3xl font-bold tracking-tight md:text-4xl">Blogs</h1>
              <p className={`mt-1.5 max-w-xl text-sm leading-relaxed ${C.muted}`}>
                Thoughts, deep dives, and things I'm learning- documented.
              </p>
            </div>
            <div className={`flex items-center gap-2 ${isMobileCompact ? 'hidden md:flex' : 'flex'}`}>
              <GhostBtn onClick={() => loadPosts()} className={C.btn} size="md">
                <RefreshCw className="h-3.5 w-3.5" />
              </GhostBtn>
              <GhostBtn onClick={toggleTheme} className={C.btn} size="md">
                {theme === 'dark' ? <Sun className="h-3.5 w-3.5" /> : <Moon className="h-3.5 w-3.5" />}
                {theme === 'dark' ? 'Light' : 'Dark'}
              </GhostBtn>
              <a
                href={`https://dev.to/${username}`}
                target="_blank"
                rel="noopener noreferrer"
                className={`inline-flex h-9 items-center gap-1.5 rounded-lg px-4 text-xs font-semibold transition-colors ${C.accentBtn}`}
              >
                DEV.to <ArrowUpRight className="h-3.5 w-3.5" />
              </a>
            </div>
          </motion.div>
        </header>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[260px_minmax(0,1fr)]">
          {/* Sidebar */}
          <aside>
            <div className={`space-y-1 rounded-xl p-3 lg:sticky lg:top-6 ${C.sidebar}`}>
              {/* Search */}
              <div className="px-1 pb-3">
                <div className="relative">
                  <Search className={`pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 ${C.subtle}`} />
                  <Input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search posts…"
                    className={`pl-9 h-9 text-sm ${C.input}`}
                  />
                </div>
                {posts.length > 0 && (
                  <p className={`mt-2 px-1 text-[11px] font-mono ${C.subtle}`}>
                    {filtered.length} of {posts.length} posts
                  </p>
                )}
              </div>

              <div className={`h-px mx-1 ${C.divider}`} />

              {/* Sort */}
              <div className="px-1 py-2">
                <p className={`mb-2 text-[10px] uppercase tracking-[0.3em] font-mono px-1 ${C.subtle}`}>Sort</p>
                <div className="flex gap-1">
                  {(['latest', 'popular'] as SortMode[]).map((m) => (
                    <button
                      key={m}
                      onClick={() => setSortMode(m)}
                      className={`flex-1 rounded-lg py-1.5 text-xs capitalize transition-colors ${sortMode === m ? C.pill.active : C.pill.inactive}`}
                    >
                      {m === 'latest'
                        ? <span className="flex items-center justify-center gap-1"><Clock className="h-3 w-3" />{m}</span>
                        : <span className="flex items-center justify-center gap-1"><Flame className="h-3 w-3" />{m}</span>
                      }
                    </button>
                  ))}
                </div>
              </div>

              <div className={`h-px mx-1 ${C.divider}`} />

              {/* Tags */}
              <div className="px-1 py-2">
                <p className={`mb-2 text-[10px] uppercase tracking-[0.3em] font-mono px-1 flex items-center gap-1.5 ${C.subtle}`}>
                  <Tag className="h-3 w-3" />Tags
                </p>
                <div className="flex flex-col gap-0.5">
                  <button
                    onClick={() => setActiveTag('all')}
                    className={`flex items-center justify-between rounded-lg px-2.5 py-1.5 text-xs text-left transition-colors ${activeTag === 'all' ? C.pill.active : C.pill.inactive}`}
                  >
                    <span>All posts</span>
                    <span className={`text-[10px] font-mono ${C.subtle}`}>{posts.length}</span>
                  </button>
                  {tagStats.slice(0, 14).map(({ tag, count }) => (
                    <button
                      key={tag}
                      onClick={() => setActiveTag(tag)}
                      className={`flex items-center justify-between rounded-lg px-2.5 py-1.5 text-xs text-left transition-colors ${activeTag === tag ? C.pill.active : C.pill.inactive}`}
                    >
                      <span>#{tag}</span>
                      <span className={`text-[10px] font-mono ${C.subtle}`}>{count}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </aside>

          {/* Main */}
          <main className="min-w-0 pb-8">
            {loading && (
              <div className="flex items-center gap-2.5 py-8 text-sm">
                <Spinner color={C.spinnerColor} />
                <span className={C.muted}>Loading posts…</span>
              </div>
            )}

            {error && (
              <div className="py-8">
                <p className="text-sm text-rose-400 font-mono mb-3">{error}</p>
                <GhostBtn onClick={() => loadPosts()} className={C.btn} size="md">
                  <RefreshCw className="h-3.5 w-3.5" /> Retry
                </GhostBtn>
              </div>
            )}

            {!loading && !error && filtered.length === 0 && (
              <p className={`py-8 text-sm ${C.muted}`}>No posts match this filter.</p>
            )}

            {!loading && !error && filtered.length > 0 && (
              <div className="space-y-6">
                {/* Featured post */}
                {featured && (
                  <Link
                    to={`/blog/${featured.slug}`}
                    className={`group block rounded-2xl overflow-hidden transition-colors ${C.featuredCard}`}
                  >
                    <div className="grid md:grid-cols-[minmax(0,1fr)_420px] md:items-stretch">
                      <div className="flex flex-col justify-between gap-5 p-6 md:p-8">
                        <div className="space-y-3">
                          <p className={`text-[10px] font-mono uppercase tracking-[0.3em] ${C.subtle}`}>Featured</p>
                          <h2 className="text-xl font-bold leading-snug md:text-2xl group-hover:opacity-90 transition-opacity">
                            {featured.title}
                          </h2>
                          <p className={`text-sm leading-relaxed line-clamp-3 ${C.muted}`}>
                            {featured.description || 'No description.'}
                          </p>
                        </div>
                        <div className="space-y-3">
                          <div className="flex flex-wrap gap-1.5">
                            {featured.tag_list.slice(0, 4).map((tag) => (
                              <span key={tag} className={`rounded-md px-2 py-0.5 text-[10px] font-mono ${C.badge}`}>#{tag}</span>
                            ))}
                          </div>
                          <ArticleMeta post={featured} subtle={C.subtle} />
                          <div className={`flex flex-wrap gap-2 ${isMobileCompact ? 'hidden md:flex' : 'flex'}`}>
                            <GhostBtn onClick={(e) => { e.preventDefault(); e.stopPropagation(); sharePost(featured); }} className={C.btn}>
                              <Share2 className="h-3 w-3" />Share
                            </GhostBtn>
                            <GhostBtn onClick={(e) => { e.preventDefault(); e.stopPropagation(); copyLink(featured); }} className={C.btn}>
                              {copiedId === featured.id ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                              {copiedId === featured.id ? 'Copied' : 'Copy link'}
                            </GhostBtn>
                            <GhostBtn onClick={(e) => { e.preventDefault(); e.stopPropagation(); openComments(featured); }} className={C.btn}>
                              <MessageCircle className="h-3 w-3" />Comments
                            </GhostBtn>
                          </div>
                        </div>
                      </div>

                      <div className="relative min-h-[240px] overflow-hidden md:h-full bg-black">
                        {featured.cover_image && !imageErrors[featured.id] ? (
                          <img
                            src={featured.cover_image}
                            alt={featured.title}
                            className="absolute inset-0 h-full w-full object-contain object-center"
                            loading="lazy"
                            decoding="async"
                            referrerPolicy="no-referrer"
                            onError={() => setImageErrors((p) => ({ ...p, [featured.id]: true }))}
                          />
                        ) : (
                          <div className={`absolute inset-0 flex items-center justify-center text-xs font-mono ${C.coverFallback}`}>
                            no cover
                          </div>
                        )}
                      </div>
                    </div>
                  </Link>
                )}

                {/* Post grid */}
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
                  {rest.map((post, idx) => (
                    <motion.div
                      key={post.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.02, ease: [0.22, 1, 0.36, 1] }}
                    >
                      <Link
                        to={`/blog/${post.slug}`}
                        className={`group flex h-full flex-col rounded-xl overflow-hidden transition-colors ${C.card}`}
                      >
                        <div className="relative w-full shrink-0 overflow-hidden aspect-video bg-black">
                          {post.cover_image && !imageErrors[post.id] ? (
                            <img
                              src={post.cover_image}
                              alt={post.title}
                              className="absolute inset-0 h-full w-full object-contain object-center transition-transform duration-500 group-hover:scale-[1.02]"
                              loading="lazy"
                              decoding="async"
                              referrerPolicy="no-referrer"
                              onError={() => setImageErrors((p) => ({ ...p, [post.id]: true }))}
                            />
                          ) : (
                            <div className={`absolute inset-0 flex items-center justify-center text-[11px] font-mono ${C.coverFallback}`}>
                              no cover
                            </div>
                          )}
                        </div>

                        <div className="flex flex-1 flex-col gap-2.5 p-4">
                          <h3 className="text-sm font-semibold leading-snug line-clamp-2 group-hover:opacity-80 transition-opacity">
                            {post.title}
                          </h3>
                          <p className={`text-xs leading-relaxed line-clamp-2 ${C.muted}`}>
                            {post.description || 'No description.'}
                          </p>

                          <div className="mt-auto space-y-2">
                            <div className="flex flex-wrap gap-1">
                              {post.tag_list.slice(0, 3).map((tag) => (
                                <span key={tag} className={`rounded px-1.5 py-0.5 text-[10px] font-mono ${C.badge}`}>#{tag}</span>
                              ))}
                            </div>
                            <ArticleMeta post={post} subtle={C.subtle} />
                            <div className={`flex items-center gap-1.5 ${isMobileCompact ? 'hidden md:flex' : 'flex'}`}>
                              <GhostBtn onClick={(e) => { e.preventDefault(); e.stopPropagation(); sharePost(post); }} className={C.btn}>
                                <Share2 className="h-3 w-3" />Share
                              </GhostBtn>
                              <GhostBtn onClick={(e) => { e.preventDefault(); e.stopPropagation(); copyLink(post); }} className={C.btn}>
                                {copiedId === post.id ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                                {copiedId === post.id ? 'Copied' : 'Copy'}
                              </GhostBtn>
                              <GhostBtn onClick={(e) => { e.preventDefault(); e.stopPropagation(); openComments(post); }} className={C.btn}>
                                <MessageCircle className="h-3 w-3" />
                              </GhostBtn>
                            </div>
                          </div>
                        </div>
                      </Link>
                    </motion.div>
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

// ---------------------------------------------------------------------------
// BlogPostPage- core fix: always use body_markdown + normalizeDEVMarkdown
// ---------------------------------------------------------------------------
export const BlogPostPage = () => {
  usePageScroll();
  const isMobileCompact = useMobileCompactHeader(56);
  const { theme, toggleTheme } = useBlogTheme();
  const C = T[theme];

  const { slug } = useParams<{ slug: string }>();
  const [post, setPost] = useState<DevToArticle | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [comments, setComments] = useState<DevToComment[]>([]);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [commentsError, setCommentsError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [coverError, setCoverError] = useState(false);
  const username = getUsername();

  const appPostUrl = useMemo(() => (post?.slug ? buildAppPostUrl(post.slug) : ''), [post?.slug]);

  /**
   * CORE FIX: We always render from body_markdown (after normalization) using
   * react-markdown + rehype-raw. This gives us:
   * - Proper heading hierarchy
   * - Correct code blocks with language detection
   * - GFM tables, task lists, strikethrough
   * - DEV liquid tags stripped/converted to links
   * - No broken Liquid HTML fragments from body_html
   *
   * We only fall back to body_html as a last resort.
   */
  const renderedMarkdown = useMemo(
    () => normalizeDEVMarkdown(post?.body_markdown || ''),
    [post?.body_markdown]
  );

  // Markdown component overrides
  const markdownComponents: any = useMemo(() => ({
    // Code blocks + inline code
    code: ({ inline, className, children, node, ...props }: any) => (
      <MarkdownCodeBlock inline={inline} className={className} theme={theme} {...props}>
        {children}
      </MarkdownCodeBlock>
    ),

    // Images- responsive, rounded, no overflow
    img: ({ node, src, alt, ...props }: any) => (
      <span className="block my-6">
        <img
          src={src}
          alt={alt || ''}
          className={`rounded-xl w-full h-auto border shadow-sm ${C.imgBorder}`}
          loading="lazy"
          referrerPolicy="no-referrer"
          {...props}
        />
        {alt && (
          <span className={`block text-center text-xs mt-2 font-mono ${C.subtle}`}>{alt}</span>
        )}
      </span>
    ),

    // Links- open external in new tab
    a: ({ node, href, children, ...props }: any) => {
      const isExternal = href?.startsWith('http');
      return (
        <a
          href={href}
          target={isExternal ? '_blank' : undefined}
          rel={isExternal ? 'noopener noreferrer' : undefined}
          className="font-medium underline underline-offset-4 decoration-current/30 hover:decoration-current/70 transition-colors"
          {...props}
        >
          {children}
          {isExternal && <ExternalLink className="inline h-3 w-3 ml-0.5 opacity-50" />}
        </a>
      );
    },

    // Blockquote- styled embed blocks from liquid tag conversion
    blockquote: ({ node, children, ...props }: any) => (
      <blockquote
        className={`my-5 flex items-start gap-3 rounded-xl px-4 py-3 border-l-4 not-italic ${
          theme === 'dark'
            ? 'border-white/20 bg-white/4 text-white/70'
            : 'border-black/15 bg-black/3 text-black/60'
        }`}
        {...props}
      >
        <div className="min-w-0">{children}</div>
      </blockquote>
    ),

    // Tables- make them scrollable
    table: ({ node, children, ...props }: any) => (
      <div className="my-6 overflow-x-auto rounded-xl">
        <table
          className={`w-full border-collapse text-sm ${
            theme === 'dark' ? 'border border-white/10' : 'border border-black/10'
          }`}
          {...props}
        >
          {children}
        </table>
      </div>
    ),
    th: ({ node, children, ...props }: any) => (
      <th
        className={`px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide ${
          theme === 'dark' ? 'bg-white/8 border-b border-white/10' : 'bg-black/5 border-b border-black/10'
        }`}
        {...props}
      >
        {children}
      </th>
    ),
    td: ({ node, children, ...props }: any) => (
      <td
        className={`px-4 py-2 text-sm ${
          theme === 'dark' ? 'border-b border-white/6' : 'border-b border-black/6'
        }`}
        {...props}
      >
        {children}
      </td>
    ),

    // Headings with anchor IDs
    h1: ({ node, children, ...props }: any) => (
      <h1 className="text-2xl font-bold mt-10 mb-4 tracking-tight" {...props}>{children}</h1>
    ),
    h2: ({ node, children, ...props }: any) => (
      <h2 className="text-xl font-bold mt-8 mb-3 tracking-tight" {...props}>{children}</h2>
    ),
    h3: ({ node, children, ...props }: any) => (
      <h3 className="text-lg font-semibold mt-6 mb-2" {...props}>{children}</h3>
    ),
    h4: ({ node, children, ...props }: any) => (
      <h4 className="text-base font-semibold mt-5 mb-2" {...props}>{children}</h4>
    ),

    // Horizontal rule
    hr: ({ node, ...props }: any) => (
      <hr className={`my-8 border-0 h-px ${theme === 'dark' ? 'bg-white/10' : 'bg-black/10'}`} {...props} />
    ),

    // Paragraph
    p: ({ node, children, ...props }: any) => (
      <p className="my-5 leading-8" {...props}>{children}</p>
    ),
  }), [theme]);

  const articleProseClass = `prose max-w-none
    text-[0.9375rem] leading-8
    prose-li:my-1 prose-li:leading-7
    prose-ul:my-4 prose-ul:list-disc prose-ul:pl-6
    prose-ol:my-4 prose-ol:list-decimal prose-ol:pl-6
    prose-strong:font-semibold
    prose-em:italic
    ${C.prose}
  `;

  const copyToClipboard = async (value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1200);
      return true;
    } catch { return false; }
  };

  const openComments = (target?: DevToArticle | null) => {
    if (!target?.url) return;
    window.open(`${target.url}#comments`, '_blank', 'noopener,noreferrer');
  };

  const sharePost = async (target?: DevToArticle | null) => {
    if (!target?.url) return;
    try {
      if (navigator.share) {
        await navigator.share({ title: target.title, text: target.description || target.title, url: target.url });
        return;
      }
    } catch (err: any) { if (err?.name === 'AbortError') return; }
    await copyToClipboard(target.url);
  };

  // Load article
  useEffect(() => {
    const ctrl = new AbortController();
    const load = async () => {
      if (!slug) { setError('Missing article slug.'); setLoading(false); return; }
      try {
        setLoading(true); setError(null);
        const slugData = await fetchDevToArticleBySlug(username, slug, ctrl.signal);
        let article = slugData;

        // Fetch by ID to get body_markdown (sometimes missing from slug endpoint)
        if (slugData?.id) {
          try {
            const idData = await fetchDevToArticleById(slugData.id, ctrl.signal);
            article = {
              ...slugData,
              ...idData,
              // Prefer body_markdown- it's the source of truth, always use it
              body_markdown: idData.body_markdown ?? slugData.body_markdown,
              body_html: idData.body_html ?? slugData.body_html,
            };
          } catch {
            // Fall back to slug payload
          }
        }

        if (!ctrl.signal.aborted) setPost(article);
      } catch (err: any) {
        if (err.name === 'AbortError' || ctrl.signal.aborted) return;
        setError(err instanceof Error ? err.message : 'Unable to load article.');
      } finally { if (!ctrl.signal.aborted) setLoading(false); }
    };
    load();
    return () => ctrl.abort();
  }, [slug, username]);

  useEffect(() => { setCoverError(false); }, [post?.id]);

  // Load comments
  useEffect(() => {
    if (!post?.id) { setComments([]); setCommentsError(null); return; }
    const ctrl = new AbortController();
    const loadComments = async () => {
      try {
        setCommentsLoading(true); setCommentsError(null);
        const tree = await fetchDevToComments(post.id, ctrl.signal);
        if (!ctrl.signal.aborted) setComments(flattenComments(tree));
      } catch (err: any) {
        if (err?.name === 'AbortError' || ctrl.signal.aborted) return;
        setCommentsError(err instanceof Error ? err.message : 'Unable to load comments.');
        setComments([]);
      } finally { if (!ctrl.signal.aborted) setCommentsLoading(false); }
    };
    loadComments();
    return () => ctrl.abort();
  }, [post?.id]);

  return (
    <div className={`min-h-screen font-sans antialiased ${C.root}`}>
      <div className="mx-auto max-w-3xl px-4 py-8 md:px-6 md:py-12">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
        >
          {/* Top nav */}
          <div className="mb-6 flex items-center justify-between">
            <Link
              to="/blogs"
              className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${C.btn}`}
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              All posts
            </Link>

            <div className={`items-center gap-2 ${isMobileCompact ? 'hidden md:flex' : 'flex'}`}>
              {post?.url && (
                <a
                  href={post.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`inline-flex h-8 items-center gap-1.5 rounded-lg px-3 text-xs font-medium transition-colors ${C.btn}`}
                >
                  DEV.to <ArrowUpRight className="h-3.5 w-3.5" />
                </a>
              )}
              <GhostBtn onClick={toggleTheme} className={C.btn} size="md">
                {theme === 'dark' ? <Sun className="h-3.5 w-3.5" /> : <Moon className="h-3.5 w-3.5" />}
                {theme === 'dark' ? 'Light' : 'Dark'}
              </GhostBtn>
            </div>
          </div>

          {/* Loading state */}
          {loading && (
            <div className="flex items-center gap-2.5 py-16 text-sm">
              <Spinner color={C.spinnerColor} />
              <span className={C.muted}>Loading article…</span>
            </div>
          )}

          {/* Error state */}
          {error && (
            <div className="py-16">
              <p className="text-sm text-rose-400 font-mono mb-4">{error}</p>
              <Link
                to="/blogs"
                className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${C.btn}`}
              >
                <ArrowLeft className="h-3.5 w-3.5" /> Back to posts
              </Link>
            </div>
          )}

          {!loading && post && (
            <article>
              {/* Cover image */}
              {post.cover_image && !coverError && (
                <div className="relative w-full overflow-hidden rounded-2xl bg-black aspect-video mb-8">
                  <img
                    src={post.cover_image}
                    alt={post.title}
                    className="absolute inset-0 h-full w-full object-contain"
                    loading="eager"
                    decoding="async"
                    referrerPolicy="no-referrer"
                    onError={() => setCoverError(true)}
                  />
                </div>
              )}

              {/* Title + meta */}
              <div className="space-y-3 mb-8">
                <h1 className="text-2xl font-bold leading-tight tracking-tight md:text-3xl">{post.title}</h1>
                {post.description && (
                  <p className={`text-base leading-relaxed ${C.muted}`}>{post.description}</p>
                )}
                <ArticleMeta post={post} subtle={C.subtle} />
                <div className="flex flex-wrap gap-1.5 pt-0.5">
                  {post.tag_list.map((tag) => (
                    <span key={tag} className={`rounded-md px-2 py-0.5 text-[11px] font-mono ${C.badge}`}>#{tag}</span>
                  ))}
                </div>
              </div>

              <div className={`h-px w-full mb-8 ${C.divider}`} />

              {/* Article body- always use body_markdown */}
              <div className={`rounded-2xl p-5 md:p-8 ${C.sidebar}`}>
                {renderedMarkdown ? (
                  <div className={articleProseClass}>
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm, remarkBreaks]}
                      rehypePlugins={[rehypeRaw]}
                      components={markdownComponents}
                    >
                      {renderedMarkdown}
                    </ReactMarkdown>
                  </div>
                ) : post.body_html ? (
                  /* Last resort: sanitized HTML fallback */
                  <div
                    className={articleProseClass}
                    dangerouslySetInnerHTML={{ __html: post.body_html }}
                  />
                ) : (
                  <p className={`text-sm whitespace-pre-wrap ${C.muted}`}>
                    {post.description || 'No content available.'}
                  </p>
                )}
              </div>

              {/* Post actions */}
              <div className="mt-6 flex flex-wrap gap-2">
                {post?.url && (
                  <>
                    <GhostBtn onClick={() => sharePost(post)} className={C.btn} size="md">
                      <Share2 className="h-3.5 w-3.5" />Share
                    </GhostBtn>
                    <GhostBtn onClick={() => appPostUrl && copyToClipboard(appPostUrl)} className={C.btn} size="md">
                      {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                      {copied ? 'Copied' : 'Copy link'}
                    </GhostBtn>
                    <GhostBtn onClick={() => openComments(post)} className={C.btn} size="md">
                      <MessageCircle className="h-3.5 w-3.5" />Comments
                    </GhostBtn>
                    <a
                      href={post.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`inline-flex h-9 items-center gap-1.5 rounded-lg px-3.5 text-xs font-medium transition-colors ${C.btn}`}
                    >
                      <Heart className="h-3.5 w-3.5" />React on DEV.to
                    </a>
                  </>
                )}
                <Link
                  to="/blogs"
                  className={`inline-flex h-9 items-center gap-1.5 rounded-lg px-3.5 text-xs font-medium transition-colors ${C.btn}`}
                >
                  ← All articles
                </Link>
              </div>

              {/* AI quick actions */}
              {post?.url && (
                <div className={`mt-4 rounded-2xl p-4 md:p-5 ${C.sidebar}`}>
                  <p className={`text-[10px] uppercase tracking-[0.3em] font-mono mb-3 ${C.subtle}`}>
                    Discuss with AI
                  </p>
                  <AIQuickActions post={post} buttonClass={C.btn} />
                </div>
              )}

              {/* Comments */}
              <section className={`mt-6 rounded-2xl p-5 md:p-6 ${C.sidebar}`}>
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="text-base font-semibold">Comments</h2>
                  {comments.length > 0 && (
                    <span className={`text-[11px] font-mono ${C.subtle}`}>{comments.length} visible</span>
                  )}
                </div>

                {commentsLoading && (
                  <div className="flex items-center gap-2 py-2">
                    <Spinner color={C.spinnerColor} />
                    <span className={`text-sm ${C.muted}`}>Loading comments…</span>
                  </div>
                )}
                {commentsError && <p className="text-sm text-rose-400">{commentsError}</p>}
                {!commentsLoading && !commentsError && comments.length === 0 && (
                  <p className={`text-sm ${C.muted}`}>No comments yet.</p>
                )}

                {!commentsLoading && !commentsError && comments.length > 0 && (
                  <div className="space-y-3">
                    {comments.slice(0, 12).map((comment) => {
                      const text =
                        comment.body_markdown?.trim() ||
                        (comment.body_html ? stripHtml(comment.body_html) : '');
                      return (
                        <div key={comment.id} className={`rounded-xl p-3.5 ${C.card}`}>
                          <div className="flex items-center gap-2.5 mb-2">
                            {comment.user.profile_image ? (
                              <img
                                src={comment.user.profile_image}
                                alt={comment.user.name || comment.user.username}
                                className="h-8 w-8 rounded-full object-cover shrink-0 ring-1 ring-white/10"
                                loading="lazy"
                                referrerPolicy="no-referrer"
                              />
                            ) : (
                              <div className={`h-8 w-8 rounded-full shrink-0 flex items-center justify-center text-xs font-bold ${C.coverFallback}`}>
                                {(comment.user.name || comment.user.username || '?')[0].toUpperCase()}
                              </div>
                            )}
                            <div className="min-w-0">
                              <p className="text-xs font-semibold truncate">
                                {comment.user.name || `@${comment.user.username}`}
                              </p>
                              <p className={`text-[11px] ${C.subtle}`}>
                                {format(new Date(comment.created_at), 'MMM d, yyyy')}
                              </p>
                            </div>
                          </div>
                          <p className={`text-sm leading-relaxed ${C.muted} line-clamp-4`}>
                            {text || 'Comment body unavailable.'}
                          </p>
                        </div>
                      );
                    })}
                    <GhostBtn onClick={() => openComments(post)} className={`mt-1 ${C.btn}`} size="md">
                      <MessageCircle className="h-3.5 w-3.5" />
                      View full thread on DEV.to
                    </GhostBtn>
                  </div>
                )}
              </section>
            </article>
          )}
        </motion.div>
      </div>
    </div>
  );
};
