import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Interfaces, Files } from 'doodle-icons';
import { format } from 'date-fns';
import type { BlogPost as PortfolioBlogPost } from '@/content/types';
import BlogCover from '@/components/blog/BlogCover';

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
        const response = await fetch('/api/blogs', { cache: 'no-store' });
        const payload = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(payload.error || 'Unable to load posts.');
        const data = Array.isArray(payload.data) ? (payload.data as PortfolioBlogPost[]) : [];
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
          }))
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
      post.tags.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase()))
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
              View All
            </Button>
          </div>
        </div>
        
        <div className="relative">
          <Interfaces.Search className="absolute left-2.5 top-1/2 transform -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <Input
            placeholder="Search posts..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8 h-8 text-xs"
          />
        </div>
      </div>

      {/* Content */}
      <ScrollArea className="flex-1">
        <div className="p-3 space-y-3">
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto mb-3"></div>
              <p className="text-muted-foreground text-xs">Loading posts...</p>
            </div>
          ) : filteredPosts.length === 0 ? (
            <div className="text-center py-8 space-y-3">
              <Files.FileText className="w-10 h-10 mx-auto text-muted-foreground" />
              <div>
                <p className="font-medium text-sm">
                  {searchQuery ? 'No posts found' : 'No posts published yet'}
                </p>
                <p className="text-xs text-muted-foreground">
                  {searchQuery ? 'Try a different search term' : 'Check back soon!'}
                </p>
              </div>
            </div>
          ) : (
            filteredPosts.map((post) => (
              <Card
                key={post.id}
                className="cursor-pointer hover:shadow-md transition-all border-white/10 bg-zinc-900/60 backdrop-blur-sm shadow-[0_2px_8px_rgba(0,0,0,0.3)]"
                onClick={() => openBlogPost(post.slug)}
              >
                <CardContent className="p-3 space-y-2.5">
                  <div className="aspect-video overflow-hidden rounded-md">
                    <BlogCover
                      title={post.title}
                      coverImage={post.featured_image}
                      theme="dark"
                      tags={post.tags}
                      variant="card"
                      className="h-full w-full transition-transform duration-300 hover:scale-105"
                    />
                  </div>

                  <div>
                    <h3 className="font-bold text-sm mb-1.5 line-clamp-2">
                      {post.title}
                    </h3>
                    <p className="text-xs text-muted-foreground line-clamp-2">
                      {post.excerpt}
                    </p>
                  </div>

                  {post.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {post.tags.slice(0, 3).map((tag) => (
                        <Badge key={tag} variant="secondary" className="text-[10px] px-1.5 py-0.5">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  )}

                  <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Interfaces.Calendar className="w-2.5 h-2.5" />
                      {format(new Date(post.published_at || post.created_at), 'MMM d, yyyy')}
                    </div>
                    <div className="flex items-center gap-1">
                      <Interfaces.Hide className="w-2.5 h-2.5" />
                      {post.views} views
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
};
