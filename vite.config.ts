import { defineConfig, type PluginOption } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
    },
    proxy: {
      "/api": {
        target: "http://127.0.0.1:5000",
        changeOrigin: true,
      },
    },
  },
  plugins: [
    react() as any,
    VitePWA({
      registerType: "autoUpdate",
      devOptions: { enabled: true },
      manifest: {
        name: " · Campus Occupancy",
        short_name: "FlowState",
        description: "Real-time campus space availability — find your spot before you arrive.",
        start_url: "/",
        display: "standalone",
        orientation: "portrait-primary",
        background_color: "#03050d",
        theme_color: "#03050d",
        icons: [
          { src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any maskable" },
        ],
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,svg,png,ico,woff2}"],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/api\.mapbox\.com\/.*/i,
            handler: "NetworkFirst",
            options: { cacheName: "mapbox-api", expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 } },
          },
          {
            urlPattern: /^https:\/\/.*\.tiles\.mapbox\.com\/.*/i,
            handler: "CacheFirst",
            options: { cacheName: "mapbox-tiles", expiration: { maxEntries: 100, maxAgeSeconds: 60 * 60 * 24 } },
          },
        ],
      },
    }),
  ] as PluginOption[],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});