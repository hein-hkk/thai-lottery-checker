import type { ReactNode } from "react";
import type { ResultsMessages } from "@thai-lottery-checker/i18n";
import type { SupportedLocale } from "@thai-lottery-checker/types";
import { PublicHeader } from "./public-header";

interface PublicPageShellProps {
  locale: SupportedLocale;
  messages: ResultsMessages;
  currentPath: "home" | "latest" | "history" | "detail";
  title?: string;
  description?: string;
  children: ReactNode;
}

export function PublicPageShell({
  locale,
  messages,
  currentPath,
  title,
  description,
  children
}: PublicPageShellProps) {
  return (
    <div className="ui-page">
      <PublicHeader currentPath={currentPath} locale={locale} messages={messages} />
      <main className="ui-container py-8 md:py-10">
        <section className="ui-panel p-6 max-[420px]:p-4 md:p-8">
          {title || description ? (
            <>
              <div className="flex flex-col gap-2 pb-6">
                {title ? <h1 className="ui-title">{title}</h1> : null}
                {description ? <p className="ui-copy max-w-3xl">{description}</p> : null}
              </div>
              <div className="ui-divider pt-6">{children}</div>
            </>
          ) : (
            children
          )}
        </section>
      </main>
    </div>
  );
}
