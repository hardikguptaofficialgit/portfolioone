import React, { useEffect, useState } from 'react';
import { Interfaces, Arrow } from 'doodle-icons';
import { format } from 'date-fns';
import { fetchDevToArticles, DevToArticle } from '@/lib/devto';

export const DevToFeed = () => {
    const [posts, setPosts] = useState<DevToArticle[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchPosts = async () => {
            try {
                setLoading(true);
                const devToUsername = import.meta.env.VITE_DEV_USERNAME || 'strykerinside';
                const articles = await fetchDevToArticles(devToUsername, 20);
                setPosts(articles);
            } catch (err) {
                console.error('Error fetching DEV.to posts:', err);
                setError('Failed to load posts. Please check your connection.');
            } finally {
                setLoading(false);
            }
        };

        fetchPosts();
    }, []);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-full min-h-[300px]">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-zinc-500">Loading articles...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex items-center justify-center h-full min-h-[300px]">
                <div className="text-center">
                    <p className="text-red-400 mb-2">{error}</p>
                    <button
                        onClick={() => window.location.reload()}
                        className="text-sm text-zinc-400 hover:text-white underline"
                    >
                        Try again
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto space-y-8">
            <header className="border-b border-zinc-800 pb-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-3xl font-bold text-white tracking-tight mb-2">
                            DEV.to Articles
                        </h2>
                        <p className="text-zinc-400">
                            Technical tutorials, guides, and insights.
                        </p>
                    </div>
                    <a
                        href={`https://dev.to/${import.meta.env.VITE_DEV_USERNAME || 'strykerinside'}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors text-sm font-medium"
                    >
                        <Interfaces.Link width={16} height={16} fill="currentColor" />
                        Visit DEV.to
                    </a>
                </div>
            </header>

            {posts.length === 0 ? (
                <div className="text-center py-12">
                    <p className="text-zinc-400">No articles published yet.</p>
                </div>
            ) : (
                <div className="space-y-6">
                    {posts.map((post) => (
                        <article
                            key={post.id}
                            className="group bg-zinc-900/60 backdrop-blur-sm border border-white/10 rounded-xl p-6 hover:bg-zinc-900 hover:shadow-[0_6px_16px_rgba(0,0,0,0.5)] transition-all shadow-[0_4px_12px_rgba(0,0,0,0.4)]"
                        >
                            <div className="flex gap-6">
                                {/* Cover Image */}
                                {post.cover_image && (
                                    <div className="hidden md:block flex-shrink-0 w-48 h-32 rounded-lg overflow-hidden bg-zinc-800">
                                        <img
                                            src={post.cover_image}
                                            alt={post.title}
                                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                            loading="lazy"
                                        />
                                    </div>
                                )}

                                {/* Content */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-start justify-between gap-4 mb-3">
                                        <h3 className="text-xl font-bold text-white group-hover:text-purple-400 transition-colors line-clamp-2">
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
                                        <p className="text-zinc-400 text-sm mb-4 line-clamp-2">
                                            {post.description}
                                        </p>
                                    )}

                                    {/* Meta Information */}
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
                                                ❤️ {post.public_reactions_count}
                                            </div>
                                        )}
                                        {post.comments_count > 0 && (
                                            <div className="flex items-center gap-1">
                                                💬 {post.comments_count}
                                            </div>
                                        )}
                                    </div>

                                    {/* Tags */}
                                    {post.tag_list.length > 0 && (
                                        <div className="flex flex-wrap gap-2 mb-3">
                                            {post.tag_list.slice(0, 4).map((tag) => (
                                                <span
                                                    key={tag}
                                                    className="inline-flex items-center gap-1 px-2 py-1 bg-purple-500/10 text-purple-400 border border-purple-500/20 rounded-md text-xs"
                                                >
                                                    <span className="text-purple-400">#</span>
                                                    {tag}
                                                </span>
                                            ))}
                                        </div>
                                    )}

                                    {/* Read More Link */}
                                    <a
                                        href={post.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-1 text-sm text-purple-400 hover:text-purple-300 transition-colors font-medium"
                                    >
                                        Read article
                                        <Arrow.ArrowRight width={16} height={16} fill="currentColor" />
                                    </a>
                                </div>
                            </div>
                        </article>
                    ))}
                </div>
            )}
        </div>
    );
};
