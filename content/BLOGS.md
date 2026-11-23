# Writing blog posts with Obsidian

The **`content/blogs/`** folder is the Obsidian vault and the only source of truth for both collections. Keep technical articles in the vault root and personal pieces in **`content/blogs/Writings/`**. Each post is one Markdown file with YAML frontmatter. The website imports these Markdown files directly at build time. There are no blog or writing JSON files to maintain or generate.

## Is the body Markdown?

Write normal Markdown directly in the file. The site renders GitHub-flavoured Markdown, including tables, strikethrough, task lists, syntax-highlighted code, Mermaid diagrams, Obsidian callouts, and images.

## Required fields

| Field | Notes |
|-------|--------|
| `id` | Unique identifier, usually the same as the slug |
| `slug` | URL path: `/blogs/my-post-slug` (omit to use the filename) |
| `title` | Headline (required) |
| `excerpt` | Short blurb for list cards (generated from the opening paragraph if omitted) |

## Common optional fields

| Field | Notes |
|-------|--------|
| `tags` | String array, e.g. `["react", "career"]` |
| `coverImage` | Optional path like `/images/blogs/foo.webp` |
| `featured` | `true` to include on the home page blog section |
| `archived` | `true` hides the post from public APIs |
| `readingTimeMinutes` | Optional; site can estimate from word count if omitted |
| `sortOrder` | Higher sorts earlier when featured |

## Images inside a post

Obsidian is configured to save pasted or attached images under `public/images/blogs/`. Pasting an image into a note automatically copies it there. Both Obsidian embeds and regular Markdown image links work:

```markdown
![[my-screenshot.png]]

![Description](/images/blogs/my-screenshot.png)
```

## Workflow

1. Open `content/blogs/` as a vault in Obsidian.
2. Create a technical article using `Templates/Blog-template`, or a personal piece using `Templates/Writing-template` inside the `Writings` folder.
3. Write and save your Markdown post. Give each post a unique filename/slug within its collection.
4. Run `npm run dev` and open `/blogs/your-slug` to preview it. Markdown files are loaded directly by Vite; no sync command is needed.
5. Commit and push the Markdown file (and any images) to GitHub. The production build reads the Markdown files and generates SEO metadata automatically.

Existing technical blogs are date-free. There are no generated `blogs.json` or `writings.json` files.

### Frontmatter example

```yaml
---
id: my-post-slug
slug: my-post-slug
title: My post title
excerpt: A short introduction for the blog listing.
tags:
  - webdev
  - notes
featured: true
archived: false
coverImage: null
---

Your article starts here in Markdown.
```

Personal writing uses the same fields and Markdown format. Save those notes in `Writings/`; they appear at `/writings`, while technical posts appear at `/blogs`.

## Markdown cheat sheet

```markdown
## Heading
### Subheading

**bold** *italic*

- list item

1. numbered

> blockquote

`inline code`

```language
code block
```

[link text](https://example.com)

---

horizontal rule
```
