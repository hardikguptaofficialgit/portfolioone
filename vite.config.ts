import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { portfolioLocalApiPlugin } from "./api/_lib/portfolio-vite-plugin";

const readJsonBody = async (req: any) => {
  const chunks: Buffer[] = [];
  for await (const chunk of req) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }

  if (chunks.length === 0) return {};
  const raw = Buffer.concat(chunks).toString("utf-8");
  try {
    return JSON.parse(raw);
  } catch {
    return {};
  }
};
  const normalizeDevToMarkdown = (value: string) => {
    if (!value) return '';

    return value
      .replace(/\r\n/g, '\n')
      .replace(/\{\%\s*embed\s+(https?:\/\/[^%\s]+)\s*\%\}/gi, '\n\n[$1]($1)\n\n')
      .replace(/\{\%\s*youtube\s+([^\s%]+)\s*\%\}/gi, '\n\n[YouTube video](https://www.youtube.com/watch?v=$1)\n\n')
      .replace(/\{\%\s*agent_session\s+([^\s%]+)\s*\%\}/gi, '\n\n> Agent session: $1\n\n');
  };

const sendJson = (res: any, status: number, payload: unknown) => {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json");
  res.end(JSON.stringify(payload));
};

const normalizeTagList = (value: unknown): string[] => {
  if (Array.isArray(value)) {
    return value.filter((tag): tag is string => typeof tag === "string" && tag.trim().length > 0);
  }
  if (typeof value === "string") {
    return value
      .split(",")
      .map((tag) => tag.trim())
      .filter(Boolean);
  }
  return [];
};

const normalizeArticle = (article: any) => ({
  id: Number(article?.id) || 0,
  title: article?.title ?? "Untitled",
  description: article?.description ?? article?.social_image ?? "",
  cover_image: article?.cover_image ?? article?.social_image ?? null,
  published_at: article?.published_at ?? article?.published_timestamp ?? article?.created_at ?? new Date().toISOString(),
  tag_list: normalizeTagList(article?.tag_list ?? article?.tags),
  slug: article?.slug ?? "",
  url: article?.url ?? article?.canonical_url ?? "",
  canonical_url: article?.canonical_url ?? article?.url ?? "",
  body_markdown: typeof article?.body_markdown === "string" ? article.body_markdown : undefined,
  body_html: typeof article?.body_html === "string" ? article.body_html : undefined,
  reading_time_minutes: Number(article?.reading_time_minutes) || 1,
  public_reactions_count: Number(article?.public_reactions_count) || 0,
  comments_count: Number(article?.comments_count) || 0,
  user: {
    name: article?.user?.name ?? "",
    username: article?.user?.username ?? "",
    profile_image: article?.user?.profile_image ?? article?.user?.profile_image_90 ?? "",
  },
});

const parseDevToError = (payload: { error?: string | string[]; message?: string }, status: number) => {
  if (typeof payload?.error === "string") return payload.error;
  if (Array.isArray(payload?.error)) return payload.error.join(", ");
  if (typeof payload?.message === "string") return payload.message;
  return `DEV.to request failed (${status})`;
};

const normalizeTags = (tags: unknown) => {
  if (!Array.isArray(tags)) return [];
  const normalized = tags
    .map((tag) => String(tag || "").trim().toLowerCase())
    .filter(Boolean)
    .map((tag) => tag.replace(/[^a-z0-9]+/g, ""))
    .filter(Boolean)
    .slice(0, 4);

  return Array.from(new Set(normalized));
};

const isRecentTitleError = (message: string) =>
  /title has already been used in the last five minutes/i.test(message) ||
  /title.*already been used/i.test(message);

const uniqueTitle = (title: string, index: number) => {
  const stamp = new Date().toISOString().replace(/[:.]/g, '').slice(0, 15);
  return `${title} (${index + 1}-${stamp})`;
};

const devToLocalPublishPlugin = (mode: string) => {
  const env = loadEnv(mode, process.cwd(), "");
  const apiKey = env.DEV_API_KEY || env.VITE_DEV_API_KEY;

  return {
    name: "devto-local-publish",
    configureServer(server: any) {
      server.middlewares.use(async (req: any, res: any, next: any) => {
        const rawUrl = String(req.url || "");
        const [pathname, queryString = ""] = rawUrl.split("?");
        const query = new URLSearchParams(queryString);

        if (pathname !== "/api/devto/publish" && pathname !== "/api/devto/articles") {
          next();
          return;
        }

        if (pathname === "/api/devto/articles") {
          if (req.method !== "GET") {
            sendJson(res, 405, { error: "Method not allowed." });
            return;
          }

          try {
            const perPage = Math.min(50, Math.max(1, Number(query.get("perPage") || 24)));
            const username = String(query.get("username") || env.VITE_DEV_USERNAME || "strykerinside").replace(/^@/, "").trim();

            if (apiKey) {
              const response = await fetch(`https://dev.to/api/articles/me/published?per_page=${perPage}&page=1`, {
                headers: {
                  Accept: "application/json",
                  "api-key": apiKey,
                },
              });
              const payload = (await response.json().catch(() => ([]))) as any;
              if (response.ok && Array.isArray(payload)) {
                const articles = payload.map(normalizeArticle);
                if (articles.length > 0) {
                  sendJson(res, 200, { ok: true, source: "me/published", articles });
                  return;
                }
              }
            }

            const publicResponse = await fetch(`https://dev.to/api/articles?username=${encodeURIComponent(username)}&per_page=${perPage}&page=1`, {
              headers: { Accept: "application/json" },
            });
            const publicPayload = (await publicResponse.json().catch(() => ([]))) as any;

            if (!publicResponse.ok) {
              const msg = parseDevToError(publicPayload || {}, publicResponse.status);
              sendJson(res, 500, { error: msg });
              return;
            }

            const articles = Array.isArray(publicPayload) ? publicPayload.map(normalizeArticle) : [];
            sendJson(res, 200, { ok: true, source: `username/${username}`, articles });
          } catch (error) {
            const message = error instanceof Error ? error.message : "Local article fetch failed.";
            sendJson(res, 500, { error: message });
          }
          return;
        }

        if (req.method !== "POST") {
          sendJson(res, 405, { error: "Method not allowed." });
          return;
        }

        if (!apiKey) {
          sendJson(res, 500, { error: "Missing DEV_API_KEY (or VITE_DEV_API_KEY) for local publishing." });
          return;
        }

        try {
          const body = await readJsonBody(req);
          const posts = Array.isArray(body?.posts) ? body.posts : [];

          if (posts.length === 0) {
            sendJson(res, 400, { error: "Provide at least one post." });
            return;
          }

          const published: Array<{ id?: number; title?: string; url?: string }> = [];
          for (const [index, post] of posts.entries()) {
            if (!post?.title || !post?.content) {
              sendJson(res, 400, { error: "Each post requires title and content." });
              return;
            }

            const publishOnce = async (title: string) => {
              const response = await fetch("https://dev.to/api/articles", {
                method: "POST",
                headers: {
                  "api-key": apiKey,
                  "Content-Type": "application/json",
                  Accept: "application/json",
                },
                body: JSON.stringify({
                  article: {
                    title,
                    published: false,
                    body_markdown: normalizeDevToMarkdown(post.content),
                    description: post.excerpt,
                    main_image: post.featuredImage,
                    tags: normalizeTags(post.tags),
                    canonical_url: post.canonicalUrl,
                    series: post.series,
                  },
                }),
              });

              const payload = (await response.json().catch(() => ({}))) as {
                error?: string | string[];
                id?: number;
                title?: string;
                url?: string;
              };

              if (!response.ok) {
                const message =
                  typeof payload?.error === "string"
                    ? payload.error
                    : Array.isArray(payload?.error)
                      ? payload.error.join(", ")
                      : `DEV.to publish failed (${response.status})`;
                throw new Error(message);
              }

              return payload;
            };

            let payload;
            try {
              payload = await publishOnce(post.title);
            } catch (error) {
              const message = error instanceof Error ? error.message : "";
              if (!isRecentTitleError(message)) throw error;
              payload = await publishOnce(uniqueTitle(post.title, index));
            }

            published.push({ id: payload?.id, title: payload?.title, url: payload?.url });
          }

          sendJson(res, 200, { ok: true, published });
        } catch (error) {
          const message = error instanceof Error ? error.message : "Local publish failed.";
          sendJson(res, 500, { error: message });
        }
      });
    },
  };
};

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  return {
    server: {
      host: "::",
      port: 8080,
    },
    plugins: [react(), devToLocalPublishPlugin(mode), portfolioLocalApiPlugin(mode)],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    build: {
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (!id.includes("node_modules")) return undefined;
            if (/[\\/]node_modules[\\/](react|react-dom|react-router-dom|@tanstack)[\\/]/.test(id)) return "vendor-react";
            if (/[\\/]node_modules[\\/](@react-three|three|@use-gesture|meshline|leva)[\\/]/.test(id)) return "vendor-3d";
            if (/[\\/]node_modules[\\/](antd|antd-style|@radix-ui)[\\/]/.test(id)) return "vendor-ui";
            if (/[\\/]node_modules[\\/](react-markdown|react-syntax-highlighter|remark-|rehype-|prismjs)[\\/]/.test(id)) return "vendor-markdown";
            if (/[\\/]node_modules[\\/](@lobehub|iconoir|doodle-icons|lucide-react)[\\/]/.test(id)) return "vendor-icons";
            if (/[\\/]node_modules[\\/](@azure-rest|@azure)[\\/]/.test(id)) return "vendor-ai";
            return "vendor";
          },
        },
      },
    },
  };
});
