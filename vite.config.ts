import { loadEnv } from "vite";
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import type { Plugin } from "vite";

/**
 * Dev-only plugin: intercepts POST /api/tarot inside Vite's Node.js process.
 * Loads the Vercel handler via Vite's SSR module runner so TypeScript and
 * .env.local are handled automatically — no second server required.
 */
function localApiPlugin(): Plugin {
  return {
    name: "local-api",
    apply: "serve",
    configureServer(server) {
      // Load .env / .env.local eagerly so GEMINI_API_KEY is in process.env
      // before the first request. Vite doesn't do this automatically for
      // non-VITE_-prefixed vars.
      const env = loadEnv("development", process.cwd(), "");
      for (const [k, v] of Object.entries(env)) {
        process.env[k] = v; // always overwrite — .env.local wins
      }

      server.middlewares.use("/api/tarot", (req, res) => {
        const chunks: Buffer[] = [];
        req.on("data", (chunk: Buffer) => chunks.push(chunk));
        req.on("end", async () => {
          try {
            const body = Buffer.concat(chunks).toString();
            const request = new Request("http://localhost/api/tarot", {
              method: req.method,
              headers: req.headers as Record<string, string>,
              body: req.method !== "GET" ? body : undefined,
            });
            const mod = await server.ssrLoadModule("/api/tarot.ts");
            const response: Response = await mod.default(request);
            res.statusCode = response.status;
            response.headers.forEach((v, k) => res.setHeader(k, v));
            res.end(await response.text());
          } catch (err) {
            console.error("[local-api]", err);
            res.statusCode = 500;
            res.end(JSON.stringify({ error: "handler error" }));
          }
        });
      });
    },
  };
}

export default defineConfig({
  plugins: [react(), localApiPlugin()],
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: ["./src/test-setup.ts"],
  },
});
