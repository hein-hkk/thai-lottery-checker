import "./globals.css";
import type { Metadata } from "next";
import type { ReactNode } from "react";
import Script from "next/script";

export const metadata: Metadata = {
  title: "LottoKai",
  description: "Thai lottery results and number checker."
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <Script id="theme-init" src="/theme-init.js" strategy="beforeInteractive" />
      </head>
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}
