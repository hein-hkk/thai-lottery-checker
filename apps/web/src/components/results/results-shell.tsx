import Link from "next/link";
import type { ReactNode } from "react";
import type { ResultsMessages } from "@thai-lottery-checker/i18n";
import type { SupportedLocale } from "@thai-lottery-checker/types";
import { PublicPageShell } from "../ui/public-page-shell";

interface ResultsShellProps {
  locale: SupportedLocale;
  messages: ResultsMessages;
  title: string;
  currentPath: "latest" | "history" | "detail";
  children: ReactNode;
}

export function ResultsShell({ locale, messages, title, currentPath, children }: ResultsShellProps) {
  return (
    <PublicPageShell currentPath={currentPath} locale={locale} messages={messages} title={title}>
      <div className="space-y-6">
        <div className="flex flex-wrap gap-3">
          <Link className="ui-button-primary" href={`/${locale}/results`}>
            {messages.latestResults}
          </Link>
          <Link className="ui-button-secondary" href={`/${locale}/results/history`}>
            {messages.resultHistory}
          </Link>
        </div>
        {children}
      </div>
    </PublicPageShell>
  );
}
