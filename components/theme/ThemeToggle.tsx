"use client";

import { Moon, Sun } from "lucide-react";
import { useRef, useSyncExternalStore } from "react";

type Theme = "light" | "dark";

const storageKey = "taptaptap-theme";
const themeChangeEvent = "taptaptap-theme-change";

function subscribe(onStoreChange: () => void) {
  window.addEventListener(themeChangeEvent, onStoreChange);
  return () => window.removeEventListener(themeChangeEvent, onStoreChange);
}

function getSnapshot(): Theme {
  return document.documentElement.dataset.theme === "dark" ? "dark" : "light";
}

function getServerSnapshot(): Theme {
  return "light";
}

export function ThemeToggle({ onToggle }: { onToggle?: () => void }) {
  const buttonRef = useRef<HTMLButtonElement>(null);
  const theme = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const switchTheme = () => {
    const nextTheme: Theme = theme === "light" ? "dark" : "light";
    const button = buttonRef.current;

    const applyTheme = () => {
      document.documentElement.dataset.theme = nextTheme;
      try {
        localStorage.setItem(storageKey, nextTheme);
      } catch {
        // Theme switching should still work when storage is blocked.
      }
      window.dispatchEvent(new Event(themeChangeEvent));
    };

    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    if (
      !button ||
      prefersReducedMotion ||
      !document.startViewTransition
    ) {
      applyTheme();
      onToggle?.();
      return;
    }

    const rect = button.getBoundingClientRect();
    const x = rect.left + rect.width / 2;
    const y = rect.top + rect.height / 2;
    const radius = Math.hypot(
      Math.max(x, window.innerWidth - x),
      Math.max(y, window.innerHeight - y),
    );

    const root = document.documentElement;
    root.style.setProperty("--theme-origin-x", `${x}px`);
    root.style.setProperty("--theme-origin-y", `${y}px`);
    root.style.setProperty("--theme-reveal-radius", `${radius}px`);
    root.dataset.themeTransition = "active";

    const transition = document.startViewTransition(() => {
      applyTheme();
    });

    transition.finished.finally(() => {
      delete root.dataset.themeTransition;
      root.style.removeProperty("--theme-origin-x");
      root.style.removeProperty("--theme-origin-y");
      root.style.removeProperty("--theme-reveal-radius");
    });

    onToggle?.();
  };

  const isLight = theme === "light";
  const label = isLight ? "Switch to dark mode" : "Switch to light mode";

  return (
    <button
      ref={buttonRef}
      type="button"
      aria-label={label}
      title={label}
      onClick={switchTheme}
      className="inline-flex h-11 w-11 items-center justify-center rounded-md border theme-border bg-[var(--surface)] text-[var(--text-primary)] transition hover:border-[var(--accent)] hover:bg-[var(--accent-soft)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
    >
      {isLight ? (
        <Moon className="h-4 w-4 transition duration-200" aria-hidden />
      ) : (
        <Sun className="h-4 w-4 transition duration-200" aria-hidden />
      )}
    </button>
  );
}
