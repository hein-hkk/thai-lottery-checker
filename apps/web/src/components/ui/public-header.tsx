import Link from "next/link";
import type { ResultsMessages } from "@thai-lottery-checker/i18n";
import type { SupportedLocale } from "@thai-lottery-checker/types";
import { BrandLogo } from "./brand-logo";
import { LocaleSwitcher } from "./locale-switcher";
import { ThemeToggle } from "./theme-toggle";

interface PublicHeaderProps {
  locale: SupportedLocale;
  messages: ResultsMessages;
  currentPath: "home" | "latest" | "history" | "detail";
}

export function PublicHeader({ locale, messages, currentPath }: PublicHeaderProps) {
  return (
    <header className="ui-shell-header">
      <div className="ui-container flex flex-col gap-4 py-4 lg:flex-row lg:items-center lg:justify-between">
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
            <Link className={`ui-nav-link ${currentPath === "history" ? "ui-nav-link-active" : ""}`} href={`/${locale}/results/history`}>
              {messages.resultHistory}
            </Link>
          </nav>
        </div>
        <div className="ui-header-actions">
          <LocaleSwitcher label={messages.language} locale={locale} />
          <ThemeToggle
            darkModeLabel={messages.darkMode}
            lightModeLabel={messages.lightMode}
            themeLabel={messages.theme}
          />
        </div>
      </div>
    </header>
  );
}
