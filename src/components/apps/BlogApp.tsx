import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Interfaces, Files } from 'doodle-icons';
import { format } from 'date-fns';
import { fetchBlogPostsList } from '@/lib/portfolio/fetch-portfolio';

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  featured_image?: string;
  tags: string[];
  published_at: string;
  created_at: string;
  views: number;
}

export const BlogApp = () => {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const loadPosts = async () => {
      try {
        const data = await fetchBlogPostsList();
        setPosts(
          data.map((post) => ({
            id: post.id,
            title: post.title,
            slug: post.slug,
            excerpt: post.excerpt || 'No description.',
            featured_image: post.coverImage || undefined,
            tags: post.tags || [],
            published_at: post.publishedAt,
            created_at: post.publishedAt,
            views: post.readingTimeMinutes || 1,
          })),
        );
      } catch (error) {
        console.error('Error loading posts:', error);
      } finally {
        setLoading(false);
      }
    };

    loadPosts();
  }, []);

  const filteredPosts = posts.filter(
    (post) =>
      post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.excerpt.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.tags.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase())),
  );

  const openBlogPost = (slug: string) => {
    window.open(`/blogs/${slug}`, '_blank');
  };

  const openBlogPage = () => {
    window.open('/blogs', '_blank');
  };

  return (
    <div className="h-full flex flex-col bg-zinc-950">
      {/* Header */}
      <div className="p-3 border-b border-white/10 space-y-3 bg-zinc-900/80 backdrop-blur-sm">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold">Technical Blog</h2>
          <div className="flex gap-2">
            <Button size="sm" onClick={openBlogPage} className="text-xs h-7">
              <Interfaces.Link className="w-3 h-3 mr-1.5" />
              Open Site
            </Button>
          </div>
        </div>
        <Input
          placeholder="Search posts..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="h-8 text-xs bg-zinc-900 border-white/10"
        />
      </div>

      <ScrollArea className="flex-1 p-3">
        {loading ? (
          <div className="text-center text-zinc-500 text-sm py-8">Loading posts...</div>
        ) : filteredPosts.length === 0 ? (
          <div className="text-center text-zinc-500 text-sm py-8">No posts found.</div>
        ) : (
          <div className="space-y-3">
            {filteredPosts.map((post) => (
              <Card
                key={post.id}
                className="bg-zinc-900/50 border-white/10 hover:border-white/20 cursor-pointer transition-colors"
                onClick={() => openBlogPost(post.slug)}
              >
                <CardContent className="p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-sm text-white truncate">{post.title}</h3>
                      <p className="text-xs text-zinc-400 mt-1 line-clamp-2">{post.excerpt}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-[10px] text-zinc-500">
                          {format(new Date(post.published_at), 'MMM d, yyyy')}
                        </span>
                        {post.tags.slice(0, 2).map((tag) => (
                          <Badge key={tag} variant="secondary" className="text-[9px] px-1.5 py-0">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <Files.File className="w-4 h-4 text-zinc-500 shrink-0" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  );
};
