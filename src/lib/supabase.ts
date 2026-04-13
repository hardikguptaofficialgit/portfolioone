import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase credentials not found. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env file');
}

export const supabase = createClient(supabaseUrl || '', supabaseAnonKey || '');

// Database types
export interface BlogPost {
  id: string;
  title: string;
  slug: string;
  content: string;
  excerpt: string;
  featured_image?: string;
  tags: string[];
  published: boolean;
  published_at?: string;
  created_at: string;
  updated_at: string;
  author_id: string;
  views: number;
  devto_posted: boolean;
  devto_post_id?: string;
}

export interface BlogImage {
  id: string;
  post_id?: string;
  url: string;
  filename: string;
  size: number;
  created_at: string;
}

// Helper functions
export const uploadImage = async (file: File, folder: string = 'blog-images') => {
  const fileExt = file.name.split('.').pop();
  const fileName = `${Math.random().toString(36).substring(2)}_${Date.now()}.${fileExt}`;
  const filePath = `${folder}/${fileName}`;

  const { data, error } = await supabase.storage
    .from('blog-media')
    .upload(filePath, file);

  if (error) throw error;

  const { data: { publicUrl } } = supabase.storage
    .from('blog-media')
    .getPublicUrl(filePath);

  return { path: data.path, url: publicUrl, filename: file.name, size: file.size };
};

export const deleteImage = async (path: string) => {
  const { error } = await supabase.storage
    .from('blog-media')
    .remove([path]);

  if (error) throw error;
};

export const createBlogPost = async (post: Omit<BlogPost, 'id' | 'created_at' | 'updated_at' | 'views' | 'devto_posted'>) => {
  const { data, error } = await supabase
    .from('blog_posts')
    .insert([post])
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const updateBlogPost = async (id: string, updates: Partial<BlogPost>) => {
  const { data, error } = await supabase
    .from('blog_posts')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const getBlogPosts = async (published?: boolean) => {
  let query = supabase
    .from('blog_posts')
    .select('*')
    .order('created_at', { ascending: false });

  if (published !== undefined) {
    query = query.eq('published', published);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data as BlogPost[];
};

export const getBlogPost = async (slug: string) => {
  const { data, error } = await supabase
    .from('blog_posts')
    .select('*')
    .eq('slug', slug)
    .single();

  if (error) throw error;
  return data as BlogPost;
};

export const deleteBlogPost = async (id: string) => {
  const { error } = await supabase
    .from('blog_posts')
    .delete()
    .eq('id', id);

  if (error) throw error;
};

export const incrementViews = async (id: string) => {
  const { error } = await supabase.rpc('increment_views', { post_id: id });
  if (error) console.error('Error incrementing views:', error);
};
