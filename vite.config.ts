import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
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
