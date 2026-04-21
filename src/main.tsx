import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { initTheme } from './lib/useTheme'

// Apply saved theme before first paint to prevent light→dark flash.
initTheme();

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
