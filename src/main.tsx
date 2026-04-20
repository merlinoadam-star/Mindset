import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { initTheme } from './lib/useTheme'

// Apply saved theme before first paint to prevent light→dark flash.
initTheme();

// --- Diagnostic: trace every history.replaceState call ---
// We're chasing an "Attempt to use history.replaceState() more than 100
// times per 10 seconds" crash on coach login. Patch the API so every
// call logs a warning with the caller's stack. Remove once the bug
// is fixed.
if (typeof window !== "undefined" && typeof window.history !== "undefined") {
  const originalReplaceState = window.history.replaceState.bind(window.history);
  let count = 0;
  let lastReset = Date.now();
  window.history.replaceState = function (
    state: unknown,
    unused: string,
    url?: string | URL | null
  ) {
    const now = Date.now();
    if (now - lastReset > 2000) {
      count = 0;
      lastReset = now;
    }
    count += 1;
    if (count <= 10 || count % 20 === 0) {
      console.warn(
        `[replaceState#${count}] url=${String(url)}`,
        new Error("trace").stack
      );
    }
    return originalReplaceState(state, unused, url as string | URL | null);
  };
}

// Register the service worker so push notifications work even when
// the tab is closed. Silently no-ops on unsupported browsers.
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("/sw.js")
      .catch((err) => console.warn("SW registration failed", err));
  });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
