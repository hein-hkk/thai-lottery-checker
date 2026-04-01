"use client";

import Link from "next/link";
import { Menu } from "lucide-react";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import type { PublicMessages } from "@thai-lottery-checker/i18n";
import type { SupportedLocale } from "@thai-lottery-checker/types";
import { BrandLogo } from "./brand-logo";
import { HeaderDrawer } from "./header-drawer";
import { LocaleSwitcher } from "./locale-switcher";
import { ThemeToggle } from "./theme-toggle";

interface PublicHeaderProps {
  locale: SupportedLocale;
  messages: PublicMessages;
  currentPath: "home" | "latest" | "history" | "detail" | "blog";
}

export function PublicHeader({ locale, messages, currentPath }: PublicHeaderProps) {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();
  const menuTriggerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  return (
    <header className="ui-shell-header">
      <div className="ui-container py-4">
        <div className="ui-mobile-topbar lg:hidden">
          <div className="ui-mobile-topbar-side">
            <button
              aria-controls="public-mobile-drawer"
              aria-expanded={isOpen}
              aria-label={isOpen ? "Close navigation menu" : "Open navigation menu"}
              className="ui-button-secondary ui-header-icon-button"
              onClick={() => setIsOpen((current) => !current)}
              ref={menuTriggerRef}
              type="button"
            >
              <Menu size={18} strokeWidth={2} />
            </button>
          </div>

          <Link aria-label="LottoKai home" className="ui-brand-link ui-mobile-brand" href={`/${locale}`}>
            <BrandLogo alt="LottoKai" className="ui-brand-logo" priority variant="full" />
          </Link>

          <div className="ui-mobile-topbar-side ui-mobile-topbar-side-end">
            <LocaleSwitcher compact label={messages.language} locale={locale} />
          </div>
        </div>

        <HeaderDrawer id="public-mobile-drawer" isOpen={isOpen} onClose={() => setIsOpen(false)} title="Menu" triggerRef={menuTriggerRef}>
          <nav className="ui-mobile-nav" aria-label="Public navigation">
            <Link
              className={`ui-mobile-nav-link ${currentPath === "home" ? "ui-mobile-nav-link-active" : ""}`}
              href={`/${locale}`}
              onClick={() => setIsOpen(false)}
            >
              {messages.home}
            </Link>
            <Link
              className={`ui-mobile-nav-link ${currentPath === "latest" || currentPath === "detail" ? "ui-mobile-nav-link-active" : ""}`}
              href={`/${locale}/results`}
              onClick={() => setIsOpen(false)}
            >
              {messages.latestResults}
            </Link>
            <Link
              className={`ui-mobile-nav-link ${currentPath === "blog" ? "ui-mobile-nav-link-active" : ""}`}
              href={`/${locale}/blog`}
              onClick={() => setIsOpen(false)}
            >
              {messages.blog}
            </Link>
          </nav>

          <div className="ui-divider my-4" />

          <div className="ui-drawer-controls">
            <ThemeToggle darkModeLabel={messages.darkMode} lightModeLabel={messages.lightMode} themeLabel={messages.theme} />
          </div>
        </HeaderDrawer>

        <div className="hidden lg:flex lg:items-center lg:justify-between lg:gap-6">
          <div className="ui-header-main">
            <Link aria-label="LottoKai home" className="ui-brand-link" href={`/${locale}`}>
              <BrandLogo alt="LottoKai" className="ui-brand-logo" priority variant="full" />
            </Link>
            <nav className="ui-shell-nav" aria-label="Public navigation">
              <Link className={`ui-nav-link ${currentPath === "home" ? "ui-nav-link-active" : ""}`} href={`/${locale}`}>
                {messages.home}
              </Link>
              <Link className={`ui-nav-link ${currentPath === "latest" || currentPath === "detail" ? "ui-nav-link-active" : ""}`} href={`/${locale}/results`}>
                {messages.latestResults}
              </Link>
              <Link className={`ui-nav-link ${currentPath === "blog" ? "ui-nav-link-active" : ""}`} href={`/${locale}/blog`}>
                {messages.blog}
              </Link>
            </nav>
          </div>

          <div className="ui-header-actions">
            <LocaleSwitcher label={messages.language} locale={locale} />
            <ThemeToggle darkModeLabel={messages.darkMode} lightModeLabel={messages.lightMode} themeLabel={messages.theme} />
          </div>
        </div>
      </div>
    </header>
  );
}
