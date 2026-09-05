"use client";

export type Theme = "light" | "dark";

export const storageKey = "taptaptap-theme";
export const themeChangeEvent = "taptaptap-theme-change";

const cookieMaxAge = 60 * 60 * 24 * 365;

export function getCurrentTheme(): Theme {
  return document.documentElement.dataset.theme === "dark" ? "dark" : "light";
}

export function getStoredTheme(): Theme {
  try {
    const stored = localStorage.getItem(storageKey);
    if (stored === "dark" || stored === "light") return stored;
  } catch {
    // Fall back to the cookie below.
  }

  try {
    const match = document.cookie.match(new RegExp(`(?:^|; )${storageKey}=(light|dark)(?:;|$)`));
    return match?.[1] === "dark" ? "dark" : "light";
  } catch {
    return "light";
  }
}

export function applyStoredTheme() {
  setTheme(getStoredTheme(), { persist: false });
}

export function setTheme(theme: Theme, options: { persist?: boolean } = {}) {
  document.documentElement.dataset.theme = theme;

  if (options.persist !== false) {
    try {
      localStorage.setItem(storageKey, theme);
    } catch {
      // Theme switching should still work when storage is blocked.
    }
  }

  try {
    document.cookie = `${storageKey}=${theme}; Path=/; Max-Age=${cookieMaxAge}; SameSite=Lax`;
  } catch {
    // Cookie persistence is best-effort and should not block theme changes.
  }

  window.dispatchEvent(new Event(themeChangeEvent));
}
