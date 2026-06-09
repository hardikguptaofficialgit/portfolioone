import React, { useEffect, useState } from 'react';
import { Interfaces, Arrow } from 'doodle-icons';
import { format } from 'date-fns';
import { Check, Copy, Heart, MessageCircle, Share2 } from 'lucide-react';
import { fetchDevToArticles, DevToArticle } from '@/lib/devto';
import { useDesktopStore } from '@/store/desktopStore';
import { cn } from '@/lib/utils';
import { getDevUsername } from '@/lib/runtimeConfig';

export const DevToFeed = () => {
    const { settings } = useDesktopStore();
    const isDark = settings.darkMode;

    const [posts, setPosts] = useState<DevToArticle[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [copiedId, setCopiedId] = useState<number | null>(null);

    const [devUsername, setDevUsername] = useState('strykerinside');

    const copyToClipboard = async (value: string) => {
        try {
            await navigator.clipboard.writeText(value);
            return true;
        } catch {
            return false;
        }
    };

    const openComments = (post: DevToArticle) => {
        const commentsUrl = `${post.url}#comments`;
        window.open(commentsUrl, '_blank', 'noopener,noreferrer');
    };

    const sharePost = async (post: DevToArticle) => {
        try {
            if (navigator.share) {
                await navigator.share({
                    title: post.title,
                    text: post.description || post.title,
                    url: post.url,
                });
                return;
            }
        } catch (err: any) {
            if (err?.name === 'AbortError') return;
        }

        const copied = await copyToClipboard(post.url);
        if (copied) {
            setCopiedId(post.id);
            window.setTimeout(() => setCopiedId((curr) => (curr === post.id ? null : curr)), 1200);
        }
    };

    const copyLink = async (post: DevToArticle) => {
        const copied = await copyToClipboard(post.url);
        if (copied) {
            setCopiedId(post.id);
            window.setTimeout(() => setCopiedId((curr) => (curr === post.id ? null : curr)), 1200);
        }
    };

    const fetchPosts = async () => {
        try {
            setLoading(true);
            setError(null);
            const username = await getDevUsername();
            setDevUsername(username);
            const articles = await fetchDevToArticles(username, 24, { perPage: 24 });
            setPosts(articles);
        } catch (err) {
            console.error('Error fetching DEV.to posts:', err);
            setError('Failed to load posts. Please check your connection.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPosts();
    }, []);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-full min-h-[300px]">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
                    <p className={cn('text-sm', isDark ? 'text-zinc-400' : 'text-zinc-600')}>Loading articles...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex items-center justify-center h-full min-h-[300px]">
                <div className="text-center">
                    <p className="text-red-500 mb-2">{error}</p>
                    <button
                        onClick={fetchPosts}
                        className={cn(
                            'text-sm underline underline-offset-4 transition-colors',
                            isDark ? 'text-zinc-400 hover:text-zinc-100' : 'text-zinc-600 hover:text-zinc-900'
                        )}
                    >
                        Try again
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="w-full space-y-8">
            <header className={cn('border-b pb-6', isDark ? 'border-zinc-800' : 'border-zinc-200')}>
                <div className="flex items-center justify-between gap-4 flex-wrap">
                    <div>
                        <h2 className={cn('text-3xl font-bold tracking-tight mb-2', isDark ? 'text-white' : 'text-zinc-900')}>
                            Blog Posts
                        </h2>
                        <p className={cn(isDark ? 'text-zinc-400' : 'text-zinc-600')}>
                            Latest posts from DEV.to with quick actions.
                        </p>
                    </div>
                    <a
                        href={`https://dev.to/${devUsername}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={cn(
                            'flex items-center gap-2 px-4 py-2 rounded-lg transition-colors text-sm font-medium',
                            isDark ? 'bg-purple-600 hover:bg-purple-700 text-white' : 'bg-purple-100 text-purple-700 hover:bg-purple-200'
                        )}
                    >
                        <Interfaces.Link width={16} height={16} fill="currentColor" />
                        Visit DEV.to
                    </a>
                </div>
            </header>

            {posts.length === 0 ? (
                <div className="text-center py-12">
                    <p className={cn(isDark ? 'text-zinc-400' : 'text-zinc-600')}>No articles published yet.</p>
                </div>
            ) : (
                <div className="space-y-6">
                    {posts.map((post) => (
                        <article
                            key={post.id}
                            className={cn(
                                'group rounded-xl p-6 transition-all',
                                isDark
                                    ? 'bg-zinc-900/60 backdrop-blur-sm border border-white/10 hover:bg-zinc-900 hover:shadow-[0_6px_16px_rgba(0,0,0,0.5)] shadow-[0_4px_12px_rgba(0,0,0,0.4)]'
                                    : 'bg-white border border-zinc-200 hover:bg-zinc-50 hover:shadow-[0_8px_20px_rgba(0,0,0,0.08)] shadow-[0_2px_10px_rgba(0,0,0,0.04)]'
                            )}
                        >
                            <div className="flex gap-6">
                                {post.cover_image && (
                                    <div className={cn('hidden md:block flex-shrink-0 w-48 h-32 rounded-lg overflow-hidden', isDark ? 'bg-zinc-800' : 'bg-zinc-200')}>
                                        <img
                                            src={post.cover_image}
                                            alt={post.title}
                                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                            loading="lazy"
                                        />
                                    </div>
                                )}

                                <div className="flex-1 min-w-0">
                                    <div className="flex items-start justify-between gap-4 mb-3">
                                        <h3 className={cn('text-xl font-bold transition-colors line-clamp-2', isDark ? 'text-white group-hover:text-purple-400' : 'text-zinc-900 group-hover:text-purple-700')}>
                                            <a
                                                href={post.url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="hover:underline"
                                            >
                                                {post.title}
                                            </a>
                                        </h3>
                                    </div>

                                    {post.description && (
                                        <p className={cn('text-sm mb-4 line-clamp-2', isDark ? 'text-zinc-400' : 'text-zinc-600')}>
                                            {post.description}
                                        </p>
                                    )}

                                    <div className="flex flex-wrap items-center gap-4 text-xs text-zinc-500 mb-3">
                                        <div className="flex items-center gap-1">
                                            <Interfaces.Calendar width={14} height={14} fill="currentColor" />
                                            {format(new Date(post.published_at), 'MMM d, yyyy')}
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <Interfaces.Clock width={14} height={14} fill="currentColor" />
                                            {post.reading_time_minutes || 5} min read
                                        </div>
                                        {post.public_reactions_count > 0 && (
                                            <div className="flex items-center gap-1">
                                                <Heart size={13} className={cn(isDark ? 'text-pink-400' : 'text-pink-600')} />
                                                {post.public_reactions_count}
                                            </div>
                                        )}
                                        {post.comments_count > 0 && (
                                            <div className="flex items-center gap-1">
                                                <MessageCircle size={13} className={cn(isDark ? 'text-sky-400' : 'text-sky-600')} />
                                                {post.comments_count}
                                            </div>
                                        )}
                                    </div>

                                    {post.tag_list.length > 0 && (
                                        <div className="flex flex-wrap gap-2 mb-3">
                                            {post.tag_list.slice(0, 4).map((tag) => (
                                                <span
                                                    key={tag}
                                                    className={cn(
                                                        'inline-flex items-center gap-1 px-2 py-1 border rounded-md text-xs',
                                                        isDark
                                                            ? 'bg-purple-500/10 text-purple-400 border-purple-500/20'
                                                            : 'bg-purple-50 text-purple-700 border-purple-200'
                                                    )}
                                                >
                                                    <span className={cn(isDark ? 'text-purple-400' : 'text-purple-700')}>#</span>
                                                    {tag}
                                                </span>
                                            ))}
                                        </div>
                                    )}

                                    <a
                                        href={post.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className={cn(
                                            'inline-flex items-center gap-1 text-sm transition-colors font-medium',
                                            isDark ? 'text-purple-400 hover:text-purple-300' : 'text-purple-700 hover:text-purple-900'
                                        )}
                                    >
                                        Read article
                                        <Arrow.ArrowRight width={16} height={16} fill="currentColor" />
                                    </a>

                                    <div className="mt-3 flex flex-wrap items-center gap-2">
                                        <button
                                            type="button"
                                            onClick={() => sharePost(post)}
                                            className={cn(
                                                "inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs transition-colors",
                                                isDark
                                                    ? "border-zinc-700 text-zinc-300 hover:bg-zinc-800"
                                                    : "border-zinc-300 text-zinc-700 hover:bg-zinc-100"
                                            )}
                                        >
                                            <Share2 size={12} />
                                            Share
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => copyLink(post)}
                                            className={cn(
                                                "inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs transition-colors",
                                                isDark
                                                    ? "border-zinc-700 text-zinc-300 hover:bg-zinc-800"
                                                    : "border-zinc-300 text-zinc-700 hover:bg-zinc-100"
                                            )}
                                        >
                                            {copiedId === post.id ? <Check size={12} /> : <Copy size={12} />}
                                            {copiedId === post.id ? 'Copied' : 'Copy Link'}
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => openComments(post)}
                                            className={cn(
                                                "inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs transition-colors",
                                                isDark
                                                    ? "border-zinc-700 text-zinc-300 hover:bg-zinc-800"
                                                    : "border-zinc-300 text-zinc-700 hover:bg-zinc-100"
                                            )}
                                        >
                                            <MessageCircle size={12} />
                                            Open Comments
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </article>
                    ))}
                </div>
            )}
        </div>
    );
};
