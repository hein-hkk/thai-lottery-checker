import Link from "next/link";
import type { ResultsMessages } from "@thai-lottery-checker/i18n";
import type { ResultHistoryResponse, SupportedLocale } from "@thai-lottery-checker/types";

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
          <li
            key={item.drawDate}
            className="flex flex-col gap-4 rounded-3xl border border-shell-border bg-white p-5 shadow-[0_12px_40px_rgba(18,49,79,0.06)] md:flex-row md:items-center md:justify-between"
          >
            <div className="grid gap-3 md:grid-cols-3 md:gap-6">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">{messages.drawDate}</p>
                <p className="mt-2 text-base font-semibold text-slate-900">{item.drawDate}</p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                  {messages.prizeLabels.FIRST_PRIZE}
                </p>
                <p className="mt-2 font-mono text-base font-semibold tracking-[0.2em] text-slate-900">{item.firstPrize}</p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                  {messages.prizeLabels.LAST_TWO}
                </p>
                <p className="mt-2 font-mono text-base font-semibold tracking-[0.2em] text-slate-900">{item.lastTwo}</p>
              </div>
            </div>
            <Link
              className="inline-flex rounded-full bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800"
              href={`/${locale}/results/${item.drawDate}`}
            >
              {messages.viewDetail}
            </Link>
          </li>
        ))}
      </ul>
      <div className="flex items-center justify-between gap-4 rounded-3xl border border-shell-border bg-slate-50/80 p-4">
        <div className="text-sm font-medium text-slate-700">
          {messages.page} {history.page}
        </div>
        <div className="flex gap-3">
          {hasPrevious ? (
            <Link
              className="inline-flex rounded-full border border-shell-border bg-white px-4 py-2 text-sm font-medium text-slate-800 transition hover:bg-slate-100"
              href={`/${locale}/results/history?page=${page - 1}`}
            >
              {messages.previousPage}
            </Link>
          ) : (
            <span className="inline-flex rounded-full border border-shell-border bg-slate-100 px-4 py-2 text-sm font-medium text-slate-400">
              {messages.previousPage}
            </span>
          )}
          {hasNext ? (
            <Link
              className="inline-flex rounded-full bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800"
              href={`/${locale}/results/history?page=${page + 1}`}
            >
              {messages.nextPage}
            </Link>
          ) : (
            <span className="inline-flex rounded-full bg-slate-200 px-4 py-2 text-sm font-medium text-slate-500">
              {messages.nextPage}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
