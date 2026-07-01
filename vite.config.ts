import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      manifest: {
        name: "local-ai-kit — private on-device AI",
        short_name: "local-ai-kit",
        description:
          "Fully-private AI in your browser. Inference runs on-device; nothing leaves your machine.",
        theme_color: "#15803d",
        background_color: "#ffffff",
        display: "standalone",
        icons: [
          { src: "icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" },
          {
            src: "icon.svg",
            sizes: "any",
            type: "image/svg+xml",
            purpose: "maskable",
          },
        ],
      },
      workbox: {
        // Precache only the small shell (html/css/svg). JS chunks — including
        // the ~6MB engine + worker — are runtime-cached on first use, so a cold
        // install stays light and the app still works offline afterwards.
        globPatterns: ["**/*.{css,html,svg}"],
        navigateFallback: "index.html",
        runtimeCaching: [
          {
            urlPattern: ({ url, sameOrigin }) =>
              sameOrigin && url.pathname.includes("/assets/"),
            handler: "CacheFirst",
            options: {
              cacheName: "lak-assets",
              expiration: { maxEntries: 40, maxAgeSeconds: 60 * 60 * 24 * 30 },
            },
          },
        ],
      },
    }),
  ],
  worker: { format: "es" },
});
