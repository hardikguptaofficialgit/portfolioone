import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import fs from "fs/promises";
import { loadEnv } from "vite";
import type { IncomingMessage, ServerResponse } from "http";

const readBody = async (req: IncomingMessage) =>
  new Promise<unknown>((resolve) => {
    const chunks: Buffer[] = [];
    req.on("data", (chunk) => chunks.push(Buffer.from(chunk)));
    req.on("end", () => {
      const raw = Buffer.concat(chunks).toString("utf8");
      if (!raw) {
        resolve(undefined);
        return;
      }
      try {
        resolve(JSON.parse(raw));
      } catch {
        resolve(raw);
      }
    });
  });

const syncObsidianAttachments = async (sourceDir: string, targetDir: string) => {
  try {
    await fs.mkdir(targetDir, { recursive: true });
    const entries = await fs.readdir(sourceDir, { withFileTypes: true });
    await Promise.all(entries.map(async (entry) => {
      const source = path.join(sourceDir, entry.name);
      const target = path.join(targetDir, entry.name);
      if (entry.isDirectory()) {
        await syncObsidianAttachments(source, target);
      } else if (entry.isFile()) {
        const [sourceInfo, targetInfo] = await Promise.all([
          fs.stat(source),
          fs.stat(target).catch((error: NodeJS.ErrnoException) => {
            if (error.code !== "ENOENT") throw error;
            return null;
          }),
        ]);
        if (!targetInfo || sourceInfo.size !== targetInfo.size || sourceInfo.mtimeMs > targetInfo.mtimeMs) {
          await fs.copyFile(source, target);
        }
      }
    }));
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
  }
};

const obsidianAttachmentsPlugin = () => {
  const attachmentsDir = path.resolve(__dirname, "content/blogs/Attachments");
  const publicImagesDir = path.resolve(__dirname, "public/images/blogs/obsidian");

  return {
    name: "obsidian-attachment-sync",
    async buildStart() {
      await syncObsidianAttachments(attachmentsDir, publicImagesDir);
    },
    configureServer(server: import("vite").ViteDevServer) {
      server.watcher.add(attachmentsDir);
      server.watcher.add(path.resolve(__dirname, "content/blogs"));
      let refreshTimer: ReturnType<typeof setTimeout> | undefined;
      const notifyPortfolio = () => {
        if (refreshTimer) clearTimeout(refreshTimer);
        refreshTimer = setTimeout(() => {
          server.ws.send({ type: "custom", event: "portfolio:markdown-updated", data: {} });
        }, 250);
      };
      const copyAttachment = async (file: string) => {
        const relative = path.relative(attachmentsDir, file);
        if (relative.startsWith("..") || path.isAbsolute(relative)) return;
        const target = path.join(publicImagesDir, relative);
        await fs.mkdir(path.dirname(target), { recursive: true });
        try {
          const [sourceInfo, targetInfo] = await Promise.all([
            fs.stat(file),
            fs.stat(target).catch((error: NodeJS.ErrnoException) => {
              if (error.code !== "ENOENT") throw error;
              return null;
            }),
          ]);
          if (!targetInfo || sourceInfo.size !== targetInfo.size || sourceInfo.mtimeMs > targetInfo.mtimeMs) {
            await fs.copyFile(file, target);
          }
        } catch (error) {
          if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
        }
      };
      const handleAttachment = async (file: string) => {
        await copyAttachment(file);
        notifyPortfolio();
      };
      const handleMarkdown = (file: string) => {
        if (file.toLowerCase().endsWith(".md")) notifyPortfolio();
      };
      void syncObsidianAttachments(attachmentsDir, publicImagesDir);
      server.watcher.on("add", handleAttachment);
      server.watcher.on("change", handleAttachment);
      server.watcher.on("add", handleMarkdown);
      server.watcher.on("change", handleMarkdown);
      server.watcher.on("unlink", handleMarkdown);
      server.httpServer?.once("close", () => {
        if (refreshTimer) clearTimeout(refreshTimer);
      });
    },
  };
};

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  Object.entries(env).forEach(([key, value]) => {
    if (process.env[key] === undefined) process.env[key] = value;
  });

  return {
    server: {
      host: "::",
      port: 8080,
    },
    plugins: [
      obsidianAttachmentsPlugin(),
      {
        name: "local-api-routes",
        configureServer(server) {
          server.middlewares.use(async (req, res, next) => {
            if (req.method === "GET" && req.url?.split("?", 1)[0] === "/api/markdown-posts") {
              try {
                const contentDir = path.resolve(__dirname, "content/blogs");
                const readMarkdown = async (directory: string): Promise<Array<{ path: string; source: string }>> => {
                  const entries = await fs.readdir(directory, { withFileTypes: true });
                  const files = await Promise.all(entries.map(async (entry) => {
                    const fullPath = path.join(directory, entry.name);
                    if (entry.isDirectory()) return readMarkdown(fullPath);
                    if (!entry.isFile() || !entry.name.toLowerCase().endsWith(".md")) return [];
                    return [{ path: path.relative(contentDir, fullPath).replace(/\\/g, "/"), source: await fs.readFile(fullPath, "utf8") }];
                  }));
                  return files.flat();
                };
                res.statusCode = 200;
                res.setHeader("Content-Type", "application/json; charset=utf-8");
                res.setHeader("Cache-Control", "no-store, max-age=0");
                res.end(JSON.stringify(await readMarkdown(contentDir)));
              } catch (error) {
                res.statusCode = 500;
                res.setHeader("Content-Type", "application/json");
                res.end(JSON.stringify({ error: error instanceof Error ? error.message : "Unable to read Markdown files." }));
              }
              return;
            }
            if (!req.url?.startsWith("/api/")) {
              next();
              return;
            }

            try {
              const url = new URL(req.url, "http://localhost");
              const mod = await server.ssrLoadModule(path.resolve(__dirname, "server/router.ts"));
              const handler = mod.default || mod.handleApiRequest;
              if (typeof handler !== "function") throw new Error(`Missing default handler for ${url.pathname}`);

              const body = req.method === "GET" || req.method === "HEAD" ? undefined : await readBody(req);
              const query = {
                ...Object.fromEntries(url.searchParams.entries()),
                path: url.pathname.replace(/^\/api\/?/, ""),
              };
              const apiReq = {
                method: req.method,
                headers: req.headers,
                query,
                body,
              };
              const apiRes = createApiResponse(res);
              await handler(apiReq, apiRes);
            } catch (error) {
              res.statusCode = 500;
              res.setHeader("Content-Type", "application/json");
              res.end(JSON.stringify({ error: error instanceof Error ? error.message : "API route failed." }));
            }
          });
        },
      },
      react(),
    ],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
  };
});

const createApiResponse = (res: ServerResponse) => {
  let statusCode = 200;
  return {
    status(code: number) {
      statusCode = code;
      return this;
    },
    setHeader(name: string, value: string) {
      res.setHeader(name, value);
      return this;
    },
    json(payload: unknown) {
      res.statusCode = statusCode;
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify(payload));
    },
    end(payload?: string) {
      res.statusCode = statusCode;
      res.end(payload);
    },
  };
};
