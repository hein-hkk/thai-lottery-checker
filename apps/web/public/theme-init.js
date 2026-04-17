/* global document, window */

(() => {
  try {
    const storageKey = "thai-lottery-theme";
    const storedTheme = window.localStorage.getItem(storageKey);
    const theme =
      storedTheme === "light" || storedTheme === "dark"
        ? storedTheme
        : window.matchMedia("(prefers-color-scheme: dark)").matches
          ? "dark"
          : "light";

    document.documentElement.classList.toggle("dark", theme === "dark");
    document.documentElement.style.colorScheme = theme;
  } catch {
    // Ignore storage access issues and let the app fall back to defaults.
  }
})();
