import { useEffect, useRef, useState } from "react";

/**
 * Phase 5 — PWA install prompt hook.
 *
 * Captures the browser's `beforeinstallprompt` event so we can show a
 * custom in-app install banner instead of relying on the user to find
 * "Add to Home Screen" in the browser menu.
 *
 * On iOS this event never fires — we detect iOS separately and show
 * manual instructions instead.
 */

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export function useInstallPrompt() {
  const deferredPrompt = useRef<BeforeInstallPromptEvent | null>(null);
  const [canInstall, setCanInstall] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIos, setIsIos] = useState(false);

  useEffect(() => {
    // Check if already installed (standalone mode)
    if (
      window.matchMedia("(display-mode: standalone)").matches ||
      (navigator as unknown as { standalone: boolean }).standalone === true
    ) {
      setIsInstalled(true);
      return;
    }

    // Detect iOS (which doesn't support beforeinstallprompt)
    const ua = navigator.userAgent;
    const iosDevice =
      /iPad|iPhone|iPod/.test(ua) ||
      (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
    if (iosDevice) {
      setIsIos(true);
    }

    const handler = (e: Event) => {
      e.preventDefault();
      deferredPrompt.current = e as BeforeInstallPromptEvent;
      setCanInstall(true);
    };
    window.addEventListener("beforeinstallprompt", handler);

    const installed = () => {
      setIsInstalled(true);
      setCanInstall(false);
    };
    window.addEventListener("appinstalled", installed);

    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
      window.removeEventListener("appinstalled", installed);
    };
  }, []);

  const promptInstall = async () => {
    if (!deferredPrompt.current) return;
    await deferredPrompt.current.prompt();
    const { outcome } = await deferredPrompt.current.userChoice;
    if (outcome === "accepted") {
      setIsInstalled(true);
      setCanInstall(false);
    }
    deferredPrompt.current = null;
  };

  return { canInstall, isInstalled, isIos, promptInstall };
}
