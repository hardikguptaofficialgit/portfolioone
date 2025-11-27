import React, { useEffect, useState } from 'react';
import { ExternalLink, Calendar, Clock, ChevronRight } from 'lucide-react';
import { format } from 'date-fns';

interface SubstackPost {
    id: number;
    title: string;
    subtitle: string;
    slug: string;
    post_date: string;
    audience: string;
    cover_image: string;
    description: string;
    canonical_url: string;
}

export const SubstackFeed = () => {
    const [posts, setPosts] = useState<SubstackPost[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchPosts = async () => {
            try {
                setLoading(true);
                // Using a CORS proxy to bypass CORS restrictions if needed, 
                // but let's try direct first or use a known proxy.
                // Substack API usually has CORS enabled for their embed endpoints, but maybe not the main API.
                // Let's try the archive endpoint via a proxy just in case.
                // Using allorigins as a reliable proxy for public JSON.
                const SUBSTACK_URL = 'https://strykerinside.substack.com/api/v1/archive?sort=new&limit=20';
                const PROXY_URL = `https://api.allorigins.win/get?url=${encodeURIComponent(SUBSTACK_URL)}`;

                const response = await fetch(PROXY_URL);

                if (!response.ok) {
                    throw new Error('Failed to fetch posts');
                }

                const data = await response.json();
                const contents = JSON.parse(data.contents);

                if (Array.isArray(contents)) {
                    setPosts(contents);
                } else {
                    // Sometimes the structure might be different
                    console.error('Unexpected data structure:', contents);
                    setError('Unexpected data structure from Substack');
                }
            } catch (err) {
                console.error('Error fetching Substack posts:', err);
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
                    <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
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
                            StrykerInside
                        </h2>
                        <p className="text-zinc-400">
                            Thoughts, tutorials, and insights.
                        </p>
                    </div>
                    <a
                        href="https://strykerinside.substack.com"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-4 py-2 bg-[#FF6719] hover:bg-[#ff7a33] text-black rounded-lg font-medium transition-colors flex items-center gap-2"
                    >
                        Subscribe <ExternalLink size={16} />
                    </a>
                </div>
            </header>

            <div className="grid gap-6">
                {posts.map((post) => (
                    <article
                        key={post.id}
                        className="group relative bg-zinc-900/50 border border-zinc-800 rounded-xl overflow-hidden"
                    >
                        <div className="flex flex-col md:flex-row gap-6 p-6">
                            {post.cover_image && (
                                <div className="w-full md:w-48 h-32 flex-shrink-0 rounded-lg overflow-hidden bg-zinc-800">
                                    <img
                                        src={post.cover_image}
                                        alt={post.title}
                                        className="w-full h-full object-cover"
                                    />
                                </div>
                            )}

                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-3 text-xs text-zinc-500 mb-2">
                                    <span className="flex items-center gap-1">
                                        <Calendar size={12} />
                                        {format(new Date(post.post_date), 'MMM d, yyyy')}
                                    </span>
                                    {post.audience === 'paid' && (
                                        <span className="px-1.5 py-0.5 bg-yellow-500/10 text-yellow-500 rounded border border-yellow-500/20">
                                            Premium
                                        </span>
                                    )}
                                </div>

                                <h3 className="text-xl font-bold text-white mb-2 line-clamp-2">
                                    {post.title}
                                </h3>

                                <p className="text-zinc-400 text-sm line-clamp-2 mb-4">
                                    {post.subtitle || post.description}
                                </p>

                                <div className="flex items-center gap-2 text-sm font-medium text-orange-500">
                                    Read Article <ChevronRight size={16} />
                                </div>
                            </div>
                        </div>

                        <a
                            href={post.canonical_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="absolute inset-0 z-10 focus:outline-none focus:ring-2 focus:ring-orange-500 rounded-xl"
                            aria-label={`Read ${post.title}`}
                        />
                    </article>
                ))}
            </div>
        </div>
    );
};
