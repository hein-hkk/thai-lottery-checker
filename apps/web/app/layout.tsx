import "./globals.css";
import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "LottoKai",
  description: "Thai lottery results and number checker."
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
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
                } catch (_error) {}
              })();
            `
          }}
        />
      </head>
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}
