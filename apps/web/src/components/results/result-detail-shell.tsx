import Link from "next/link";
import type { ReactNode } from "react";
import type { ResultsMessages } from "@thai-lottery-checker/i18n";
import type { SupportedLocale } from "@thai-lottery-checker/types";
import { PublicHeader } from "../ui/public-header";

interface ResultDetailShellProps {
  children: ReactNode;
  locale: SupportedLocale;
  messages: ResultsMessages;
}

export function ResultDetailShell({ children, locale, messages }: ResultDetailShellProps) {
  return (
    <div className="ui-page">
      <PublicHeader currentPath="detail" locale={locale} messages={messages} />
      <main className="ui-container py-8 md:py-10">
        <section className="ui-panel p-6 md:p-8">
          <div className="space-y-6">
            {children}
            <div className="flex justify-end">
              <Link className="ui-button-secondary" href={`/${locale}/results/history`}>
                {messages.backToHistory}
              </Link>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
