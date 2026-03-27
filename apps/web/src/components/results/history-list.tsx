import Link from "next/link";
import type { ResultsMessages } from "@thai-lottery-checker/i18n";
import type { ResultHistoryResponse, SupportedLocale } from "@thai-lottery-checker/types";
import { HistoryResultCard } from "./history-result-card";

interface HistoryListProps {
  locale: SupportedLocale;
  messages: ResultsMessages;
  page: number;
  history: ResultHistoryResponse;
}

export function HistoryList({ locale, messages, page, history }: HistoryListProps) {
  const hasPrevious = page > 1;
  const hasNext = page * history.limit < history.total;

  return (
    <div className="space-y-6">
      <ul className="space-y-4">
        {history.items.map((item) => (
          <li key={item.drawDate}>
            <HistoryResultCard item={item} locale={locale} messages={messages} />
          </li>
        ))}
      </ul>
      <div className="ui-panel-muted flex flex-col gap-4 p-4 md:flex-row md:items-center md:justify-between">
        <div className="text-sm font-medium text-[var(--text-secondary)]">
          {messages.page} {history.page}
        </div>
        <div className="flex gap-3">
          {hasPrevious ? (
            <Link className="ui-button-secondary" href={`/${locale}/results/history?page=${page - 1}`}>
              {messages.previousPage}
            </Link>
          ) : (
            <span className="ui-button-secondary opacity-50">
              {messages.previousPage}
            </span>
          )}
          {hasNext ? (
            <Link className="ui-button-primary" href={`/${locale}/results/history?page=${page + 1}`}>
              {messages.nextPage}
            </Link>
          ) : (
            <span className="ui-button-primary opacity-50">
              {messages.nextPage}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
