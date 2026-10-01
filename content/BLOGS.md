# Writing blog posts (`content/blogs.json`)

Posts live in the `blogPosts` array in **`content/blogs.json`**. Copy fields from **`content/blog-post.template.json`** when adding a new entry.

## Is the body Markdown?

**Yes.** The `body` field is a **Markdown** string (GitHub-flavored: tables, strikethrough, task lists, fenced code blocks). The site renders it with `react-markdown` + GFM.

In JSON you write Markdown as one string. Use `\n` for new lines (or format the JSON across multiple lines if your editor allows string newlines).

## Required fields

| Field | Notes |
|-------|--------|
| `id` | Unique, lowercase letters, numbers, hyphens only (e.g. `my-post-slug`) |
| `slug` | URL path: `/blogs/my-post-slug` - usually same as `id` |
| `title` | Headline |
| `excerpt` | Short blurb for list cards |
| `body` | Full article (Markdown) |
| `publishedAt` | ISO date string, e.g. `2026-10-02T12:00:00.000Z` |

## Common optional fields

| Field | Notes |
|-------|--------|
| `tags` | String array, e.g. `["react", "career"]` |
| `coverImage` | `null` or path like `/images/blogs/foo.webp` (list UI ignores cover; inline images in `body` still show) |
| `featured` | `true` to include on the home page blog section |
| `archived` | `true` hides the post from public APIs |
| `readingTimeMinutes` | Optional; site can estimate from word count if omitted |
| `sortOrder` | Higher sorts earlier when featured |
| `sourceUrl` | Optional link to original (e.g. DEV.to) |

## Images inside a post

Put files under `public/images/blogs/` and reference them in Markdown:

```markdown
![Description](/images/blogs/my-screenshot.png)
```

## Workflow

1. Add a new object to the **top** (or anywhere) of `blogPosts` in `content/blogs.json`.
2. Run `npm run dev` and open `/blogs/your-slug`.
3. Deploy - content is read from the repo JSON (no database).

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
