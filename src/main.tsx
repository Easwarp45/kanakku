import { createRoot } from "react-dom/client";
import { Capacitor } from "@capacitor/core";
import App from "./App.tsx";
import { AppErrorBoundary } from "@/components/errors/AppErrorBoundary";
import "./index.css";

// ── Service Worker (PWA only — not in Capacitor native app) ──────────────────
// vite-plugin-pwa handles SW registration via registerType:"autoUpdate",
// but we also register manually for the SKIP_WAITING message support (PWA-3).
if (!Capacitor.isNativePlatform() && "serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js").catch((error) => {
      // Not critical — app still works without SW. Log only in dev.
      if (import.meta.env.DEV) {
        console.log("Service worker registration failed:", error);
      }
    });

    // When a new SW takes control, the page may need a reload.
    // This is triggered by applyUpdate() in usePWA.ts which posts SKIP_WAITING.
    navigator.serviceWorker.addEventListener("controllerchange", () => {
      // Only reload if the user is not mid-form or mid-action.
      // applyUpdate() in usePWA.ts will call reload() after this event.
    });
  });
}

// ── Web Vitals monitoring (TM-3) ─────────────────────────────────────────────
if (import.meta.env.PROD) {
  import("web-vitals").then(({ onCLS, onFCP, onLCP, onTTFB, onINP }) => {
    const reportMetric = (metric: { name: string; value: number; rating: string }) => {
      // In production, log structured data for monitoring tools.
      // To wire to Sentry: import * as Sentry from '@sentry/react'; Sentry.setMeasurement(...)
      // To wire to an analytics endpoint: fetch('/api/vitals', { method:'POST', body: JSON.stringify(metric) })
      if (import.meta.env.DEV) {
        console.info(`[WebVital] ${metric.name}: ${metric.value.toFixed(0)} (${metric.rating})`);
      }
    };

    onCLS(reportMetric);
    onFCP(reportMetric);
    onLCP(reportMetric);
    onTTFB(reportMetric);
    onINP(reportMetric);
  });
}

createRoot(document.getElementById("root")!).render(
  <AppErrorBoundary>
    <App />
  </AppErrorBoundary>
);
