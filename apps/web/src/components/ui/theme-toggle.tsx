"use client";

import { useEffect, useState } from "react";

export type ThemePreference = "light" | "dark";

const storageKey = "thai-lottery-theme";

function applyTheme(theme: ThemePreference) {
  const root = document.documentElement;
  root.classList.toggle("dark", theme === "dark");
  root.style.colorScheme = theme;
}

export function ThemeToggle({
  darkModeLabel,
  lightModeLabel,
  themeLabel
}: {
  darkModeLabel: string;
  lightModeLabel: string;
  themeLabel: string;
}) {
  const [theme, setTheme] = useState<ThemePreference>("light");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const storedTheme = window.localStorage.getItem(storageKey);
    const resolvedTheme =
      storedTheme === "light" || storedTheme === "dark"
        ? storedTheme
        : window.matchMedia("(prefers-color-scheme: dark)").matches
          ? "dark"
          : "light";

    applyTheme(resolvedTheme);
    setTheme(resolvedTheme);
    setMounted(true);
  }, []);

  function handleToggle() {
    const nextTheme = theme === "dark" ? "light" : "dark";
    window.localStorage.setItem(storageKey, nextTheme);
    applyTheme(nextTheme);
    setTheme(nextTheme);
  }

  const label = mounted ? (theme === "dark" ? darkModeLabel : lightModeLabel) : themeLabel;

  return (
    <button
      aria-label={
        mounted ? `${themeLabel}: ${theme === "dark" ? lightModeLabel : darkModeLabel}` : themeLabel
      }
      className="ui-button-secondary ui-header-control ui-header-toggle"
      onClick={handleToggle}
      type="button"
    >
      <span aria-hidden="true" className="ui-header-toggle-icon">
        {theme === "dark" ? "◐" : "◑"}
      </span>
      <span>{label}</span>
    </button>
  );
}
