import { parse as parseYaml } from 'yaml';
import type { BlogPost } from '@/content/types';

const markdownFiles = import.meta.glob('../../../content/blogs/**/*.md', {
  eager: true,
  query: '?raw',
  import: 'default',
}) as Record<string, string>;

const getExcerpt = (body: string) => body
  .replace(/```[\s\S]*?```/g, ' ')
  .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')
  .replace(/[#>*_`~|]/g, ' ')
  .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
  .replace(/\s+/g, ' ')
  .trim()
  .slice(0, 220);

const resolveImage = (source: string) => {
  const clean = source.trim().replace(/^<|>$/g, '');
  if (!clean || /^(https?:|data:|blob:)/i.test(clean)) return clean;
  // Decode first so this resolver stays idempotent when an Obsidian embed is
  // converted to Markdown and then passes through the regular Markdown image
  // normalizer immediately afterwards.
  const encodePath = (path: string) => {
    try {
      return encodeURI(decodeURI(path));
    } catch {
      return encodeURI(path);
    }
  };
  if (clean.startsWith('/')) return encodePath(clean);
  const publicImage = clean.replace(/\\/g, '/').match(/(?:^|\/)public\/(images\/blogs\/.*)$/i);
  if (publicImage) return encodePath(`/${publicImage[1]}`);
  const relative = clean.replace(/\\/g, '/').replace(/^\.\//, '').replace(/^\.\.\//, '');
  const attachmentPath = relative.replace(/^Attachments\//i, '');
  return encodePath(`/images/blogs/obsidian/${attachmentPath}`);
};

const prepareMarkdown = (body: string) => body
  // Obsidian image embeds: ![[diagram.png]] and ![[diagram.png|Alt text]]
  .replace(/!\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g, (_match, file: string, label?: string) => {
    const alt = (label || file.split('/').pop() || 'Article image').replace(/\|\d+$/, '').trim();
    return `![${alt}](${resolveImage(file)})`;
  })
  // Relative Markdown image paths are stored in the Obsidian attachment folder.
  .replace(/!\[([^\]]*)\]\(([^)]+)\)/g, (_match, alt: string, source: string) => `![${alt}](${resolveImage(source)})`)
  // Turn Obsidian callout headers into readable Markdown while retaining the quote.
  .replace(/^>\s*\[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION|INFO|SUCCESS|DANGER)\](?:\s*(.*))?$/gim, (_match, kind: string, title?: string) => `> **${kind[0]}${kind.slice(1).toLowerCase()}${title ? ` — ${title}` : ''}**`);

const parsePost = (filePath: string, source: string): BlogPost => {
  const normalized = source.replace(/^\uFEFF/, '').replace(/\r\n/g, '\n');
  const frontmatter = normalized.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
  if (!frontmatter) throw new Error(`${filePath}: missing or invalid YAML frontmatter`);
  const metadata = (parseYaml(frontmatter[1]) || {}) as Record<string, unknown>;
  const body = prepareMarkdown(frontmatter[2].trim());
  const filename = filePath.split('/').pop() || 'untitled.md';
  const slug = String(metadata.slug || filename.replace(/\.md$/i, ''));
  const words = body.replace(/```[\s\S]*?```/g, ' ').split(/\s+/).filter(Boolean).length;
  const excerpt = String(metadata.excerpt || getExcerpt(body));
  const coverImage = metadata.coverImage ? resolveImage(String(metadata.coverImage)) : null;

  if (!metadata.title) throw new Error(`${filePath}: frontmatter needs a title`);

  return {
    id: String(metadata.id || slug),
    slug,
    title: String(metadata.title),
    excerpt,
    body,
    coverImage,
    tags: Array.isArray(metadata.tags) ? metadata.tags.map(String) : [],
    readingTimeMinutes: Number(metadata.readingTimeMinutes) || Math.max(1, Math.ceil(words / 220)),
    featured: metadata.featured === true,
    archived: metadata.archived === true,
    ...(metadata.sortOrder !== undefined ? { sortOrder: Number(metadata.sortOrder) } : {}),
  };
};

export const fetchMarkdownPosts = async (collection: 'blogs' | 'writings'): Promise<BlogPost[]> => {
  const writingCollection = collection === 'writings';
  const sources = import.meta.env.DEV
    ? await fetch('/api/markdown-posts', { cache: 'no-store' }).then(async (response) => {
      if (!response.ok) throw new Error('Unable to read Markdown files from the Obsidian vault.');
      return await response.json() as Array<{ path: string; source: string }>;
    })
    : Object.entries(markdownFiles).map(([path, source]) => ({ path, source }));
  const posts = sources
    .filter(({ path }) => !/(^|\/)Templates\//.test(path) && !/(^|\/)\.obsidian\//.test(path))
    .filter(({ path }) => /(^|\/)Writings\//.test(path.replace(/\\/g, '/')) === writingCollection)
    .map(({ path, source }) => parsePost(path.replace(/\\/g, '/'), source))
    .filter((post) => !post.archived);

  const slugs = new Set<string>();
  for (const post of posts) {
    if (slugs.has(post.slug)) throw new Error(`Duplicate ${collection} slug: ${post.slug}`);
    slugs.add(post.slug);
  }

  return posts.sort((a, b) => (a.sortOrder ?? 999) - (b.sortOrder ?? 999) || a.title.localeCompare(b.title));
};
