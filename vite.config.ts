import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig(() => {
  return {
    server: {
      host: "::",
      port: 8080,
    },
    plugins: [react()],
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
