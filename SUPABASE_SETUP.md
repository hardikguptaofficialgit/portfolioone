# Supabase Setup Guide

## Step 1: Create a Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Create a new project
3. Copy your project URL and anon key to `.env` file

## Step 2: Create Database Tables

Run these SQL commands in your Supabase SQL Editor:

```sql
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create blog_posts table
CREATE TABLE blog_posts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  content TEXT NOT NULL,
  excerpt TEXT NOT NULL,
  featured_image TEXT,
  tags TEXT[] DEFAULT '{}',
  published BOOLEAN DEFAULT false,
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  author_id TEXT NOT NULL,
  views INTEGER DEFAULT 0,
  substack_posted BOOLEAN DEFAULT false,
  substack_post_id TEXT
);

-- Create index for faster queries
CREATE INDEX idx_blog_posts_published ON blog_posts(published);
CREATE INDEX idx_blog_posts_slug ON blog_posts(slug);
CREATE INDEX idx_blog_posts_created_at ON blog_posts(created_at DESC);

-- Create function to increment views
CREATE OR REPLACE FUNCTION increment_views(post_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE blog_posts SET views = views + 1 WHERE id = post_id;
END;
$$ LANGUAGE plpgsql;

-- Create blog_images table
CREATE TABLE blog_images (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  post_id UUID REFERENCES blog_posts(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  filename TEXT NOT NULL,
  size INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security (RLS)
ALTER TABLE blog_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE blog_images ENABLE ROW LEVEL SECURITY;

-- Create policies for public read access
CREATE POLICY "Public can view published posts"
  ON blog_posts FOR SELECT
  USING (published = true);

CREATE POLICY "Public can view images"
  ON blog_images FOR SELECT
  USING (true);

-- Create policies for authenticated admin users (you'll need to adjust based on your auth)
CREATE POLICY "Admin can do everything with posts"
  ON blog_posts FOR ALL
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Admin can do everything with images"
  ON blog_images FOR ALL
  USING (true)
  WITH CHECK (true);
```

## Step 3: Create Storage Bucket

1. Go to Storage in your Supabase dashboard
2. Create a new bucket called `blog-media`
3. Make it public
4. Set the following policies:

```sql
-- Allow public read access
CREATE POLICY "Public read access"
ON storage.objects FOR SELECT
USING (bucket_id = 'blog-media');

-- Allow authenticated users to upload
CREATE POLICY "Authenticated users can upload"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'blog-media');

-- Allow authenticated users to delete
CREATE POLICY "Authenticated users can delete"
ON storage.objects FOR DELETE
USING (bucket_id = 'blog-media');
```

## Step 4: Configure Environment Variables

Update your `.env` file with:
- `VITE_SUPABASE_URL`: Your Supabase project URL
- `VITE_SUPABASE_ANON_KEY`: Your Supabase anon/public key
- `VITE_ADMIN_EMAIL`: Your admin email
- `VITE_ADMIN_PASSWORD`: Your admin password (for simple auth)

## Step 5: Substack Integration (Optional)

**Important**: Substack does not provide a public API for most users.

### Configuration:
1. Find your Substack subdomain:
   - If your Substack URL is `https://myblog.substack.com`
   - Your publication ID is: `myblog`

2. Add to `.env`:
   ```env
   VITE_SUBSTACK_API_KEY=          # Leave empty (no public API)
   VITE_SUBSTACK_PUBLICATION_ID=myblog  # Your subdomain
   ```

### How It Works:
- Clicking "Post to Substack" opens your Substack editor in a new tab
- You can then copy/paste your content manually
- Alternative: Use automation tools like Zapier or Make (formerly Integromat)

### Alternative Options:
1. **Email Publishing**: Send posts via email to `post@yourblog.substack.com`
2. **Zapier/Make**: Set up automation workflows
3. **Manual Copy**: Use the "Post to Substack" button to open editor

See `SUBSTACK_INTEGRATION.md` for detailed instructions.

## Security Notes

- The current setup uses simple email/password auth for the admin panel
- For production, consider implementing proper Supabase Auth
- Never commit your `.env` file
- The admin password is stored in env variables (not secure for production)
- Consider implementing proper authentication with Supabase Auth for production use
