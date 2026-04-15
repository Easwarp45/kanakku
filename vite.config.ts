import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { VitePWA } from "vite-plugin-pwa";

// https://vitejs.dev/config/
export default defineConfig(() => ({
  server: {
    host: "::",
    port: 8080,
  },
  build: {
    // P-4: Manual chunk splitting for optimal long-term caching.
    // Each chunk changes independently — updating Framer Motion doesn't bust the React cache.
    rollupOptions: {
      output: {
        manualChunks: {
          // Core React runtime — almost never changes
          "vendor-react": ["react", "react-dom", "react-router-dom"],
          // Animation — large but stable
          "vendor-motion": ["framer-motion"],
          // Charts — only used on Analytics / Intelligence pages
          "vendor-charts": ["recharts"],
          // Supabase — stable
          "vendor-supabase": ["@supabase/supabase-js"],
          // TanStack Query
          "vendor-query": ["@tanstack/react-query"],
          // Date utilities
          "vendor-dates": ["date-fns"],
        },
      },
    },
    // Warn if any chunk exceeds 400 KB gzipped
    chunkSizeWarningLimit: 400,
    // ES2020+ is supported natively by Capacitor's WebView
    target: "es2020",
  },
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["favicon.svg", "favicon.ico", "apple-touch-icon.png", "icons/*.png", "offline.html"],
      manifest: false, // Using external manifest.webmanifest
      devOptions: {
        enabled: true,
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,ico,png,svg,woff2,webmanifest}"],
        // PWA-4: navigateFallback set to offline.html for graceful offline UX
        navigateFallback: "/offline.html",
        navigateFallbackDenylist: [/^\/api/],
        cleanupOutdatedCaches: true,
        // PWA-3: Handle SKIP_WAITING message from applyUpdate()
        additionalManifestEntries: [{ url: "/offline.html", revision: null }],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: "CacheFirst",
            options: {
              cacheName: "google-fonts-cache",
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365, // 1 year
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
          {
            urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
            handler: "CacheFirst",
            options: {
              cacheName: "gstatic-fonts-cache",
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365, // 1 year
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
          {
            urlPattern: /^https:\/\/.*\.supabase\.co\/.*/i,
            handler: "NetworkFirst",
            options: {
              cacheName: "supabase-cache",
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 5, // 5 minutes
              },
              networkTimeoutSeconds: 10,
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
          {
            urlPattern: /\.(png|jpg|jpeg|svg|gif|webp)$/i,
            handler: "CacheFirst",
            options: {
              cacheName: "images-cache",
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 60 * 24 * 30, // 30 days
              },
            },
          },
        ],
      },
    }),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));