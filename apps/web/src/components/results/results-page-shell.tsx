import type { ReactNode } from "react";
import type { ResultsMessages } from "@thai-lottery-checker/i18n";
import type { SupportedLocale } from "@thai-lottery-checker/types";
import { PublicPageShell } from "../ui/public-page-shell";

interface ResultsPageShellProps {
  bottomAction?: ReactNode;
  children: ReactNode;
  currentPath: "latest" | "history" | "detail";
  description?: string;
  locale: SupportedLocale;
  messages: ResultsMessages;
  title?: string;
  topActions?: ReactNode;
}

export function ResultsPageShell({
  bottomAction,
  children,
  currentPath,
  description,
  locale,
  messages,
  title,
  topActions
}: ResultsPageShellProps) {
  return (
    <PublicPageShell
      currentPath={currentPath}
      description={description}
      locale={locale}
      messages={messages}
      title={title ?? ""}
    >
      <div className="space-y-6">
        {topActions ? <div className="flex flex-wrap gap-3">{topActions}</div> : null}
        {children}
        {bottomAction ? <div className="flex justify-end">{bottomAction}</div> : null}
      </div>
    </PublicPageShell>
  );
}
