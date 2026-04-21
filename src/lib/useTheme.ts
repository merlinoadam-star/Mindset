import { useEffect, useState } from "react";

const THEME_KEY = "mindset-theme";

export type Theme = "light" | "dark" | "system";

function getSystemTheme(): "light" | "dark" {
  if (typeof window === "undefined") return "light";
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

function applyTheme(theme: Theme) {
  const resolved = theme === "system" ? getSystemTheme() : theme;
  if (resolved === "dark") {
    document.documentElement.classList.add("dark");
  } else {
    document.documentElement.classList.remove("dark");
  }
}

// The Fearless brand lives on a dark stage (icon background, splash
// screen, landing / auth page). Default new users to "dark" so the
// in-app look matches rather than flipping to a pale light palette.
// Anyone who has explicitly picked a theme before keeps their choice.
export function useTheme() {
  const [theme, setThemeState] = useState<Theme>(() => {
    const stored = localStorage.getItem(THEME_KEY) as Theme | null;
    return stored ?? "dark";
  });

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  // Listen for system theme changes when set to "system"
  useEffect(() => {
    if (theme !== "system") return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = () => applyTheme("system");
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, [theme]);

  const setTheme = (t: Theme) => {
    localStorage.setItem(THEME_KEY, t);
    setThemeState(t);
  };

  return { theme, setTheme };
}

/** Apply stored theme on page load (before React hydrates). */
export function initTheme() {
  const stored = localStorage.getItem(THEME_KEY) as Theme | null;
  applyTheme(stored ?? "dark");
}
