import { loadEnv } from "vite";
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";
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
  plugins: [
    react(),
    localApiPlugin(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["favicon.svg", "favicon.ico", "apple-touch-icon-180x180.png", "og-image.png", "art/**/*"],
      manifest: {
        name: "Arcane Poker",
        short_name: "Arcane Poker",
        description: "Texas Hold'Em meets the Tarot",
        theme_color: "#242424",
        background_color: "#242424",
        display: "standalone",
        start_url: "/",
        icons: [
          { src: "pwa-64x64.png", sizes: "64x64", type: "image/png" },
          { src: "pwa-192x192.png", sizes: "192x192", type: "image/png" },
          { src: "pwa-512x512.png", sizes: "512x512", type: "image/png" },
          { src: "maskable-icon-512x512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
        ],
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,ico,png,svg,webp,woff,woff2,mp3,ogg,wav}"],
        runtimeCaching: [
          {
            // Network-only for tarot API — no stale prophecies cached
            urlPattern: /\/api\/tarot/,
            handler: "NetworkOnly",
          },
        ],
      },
    }),
  ],
  base: "./",
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: ["./src/test-setup.ts"],
    exclude: ["**/node_modules/**", "**/dist/**", ".worktrees/**"],
  },
});
