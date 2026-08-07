import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { existsSync } from "fs";
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

const resolveApiRoute = (pathname: string) => {
  const relative = pathname.replace(/^\/api\/?/, "");
  const direct = path.resolve(__dirname, "api", `${relative}.ts`);
  const index = path.resolve(__dirname, "api", relative, "index.ts");
  if (existsSync(direct)) return { file: direct, query: {} };
  if (existsSync(index)) return { file: index, query: {} };

  const segments = relative.split("/").filter(Boolean);
  for (let i = segments.length - 1; i >= 0; i -= 1) {
    const dynamic = path.resolve(
      __dirname,
      "api",
      ...segments.slice(0, i),
      `[${segments[i]}].ts`
    );
    if (existsSync(dynamic)) return { file: dynamic, query: { [segments[i]]: segments[i + 1] } };
  }

  if (segments[0] === "blogs" && segments[1]) {
    const blogSlug = path.resolve(__dirname, "api", "blogs", "[slug].ts");
    if (existsSync(blogSlug)) return { file: blogSlug, query: { slug: segments[1] } };
  }

  return null;
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
      {
        name: "local-api-routes",
        configureServer(server) {
          server.middlewares.use(async (req, res, next) => {
            if (!req.url?.startsWith("/api/")) {
              next();
              return;
            }

            try {
              const url = new URL(req.url, "http://localhost");
              const route = resolveApiRoute(url.pathname);
              if (!route) {
                res.statusCode = 404;
                res.setHeader("Content-Type", "application/json");
                res.end(JSON.stringify({ error: "API route not found." }));
                return;
              }

              const mod = await server.ssrLoadModule(route.file);
              const handler = mod.default;
              if (typeof handler !== "function") throw new Error(`Missing default handler for ${url.pathname}`);

              const body = req.method === "GET" || req.method === "HEAD" ? undefined : await readBody(req);
              const query = {
                ...Object.fromEntries(url.searchParams.entries()),
                ...route.query,
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
