import { getResultsMessages, isSupportedLocale } from "@thai-lottery-checker/i18n";
import type { SupportedLocale } from "@thai-lottery-checker/types";
import Link from "next/link";
import { notFound } from "next/navigation";
import { EmbeddedChecker } from "../../../../src/components/results/embedded-checker";
import { HistoryList } from "../../../../src/components/results/history-list";
import { ResultsPageShell } from "../../../../src/components/results/results-page-shell";
import { StatusCard } from "../../../../src/components/results/status-card";
import { getLatestResults, getResultHistory } from "../../../../src/results/api";
import { parseHistoryPage } from "../../../../src/results/queries";

export const dynamic = "force-dynamic";

interface ResultsHistoryPageProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ page?: string | string[] }>;
}

export default async function ResultsHistoryPage({ params, searchParams }: ResultsHistoryPageProps) {
  const { locale } = await params;

  if (!isSupportedLocale(locale)) {
    notFound();
  }

  const supportedLocale = locale as SupportedLocale;
  const messages = getResultsMessages(supportedLocale);
  const { page } = await searchParams;
  const currentPage = parseHistoryPage(page);

  try {
    const [history, latest] = await Promise.all([getResultHistory(currentPage), getLatestResults()]);

    return (
      <ResultsPageShell
        currentPath="history"
        locale={supportedLocale}
        messages={messages}
        title={messages.resultHistory}
        topActions={
          <Link className="ui-button-secondary" href={`/${supportedLocale}/results`}>
            {messages.latestResults}
          </Link>
        }
      >
        <div className="space-y-6">
          <div className="flex justify-end">
            <EmbeddedChecker
              defaultDrawDate={latest.drawDate}
              defaultDrawStatus={latest.publishedAt ? "published" : "draft"}
              locale={supportedLocale}
              messages={messages}
            />
          </div>
          {history.items.length === 0 ? (
            <StatusCard message={messages.noHistory} />
          ) : (
            <HistoryList locale={supportedLocale} messages={messages} page={currentPage} history={history} />
          )}
        </div>
      </ResultsPageShell>
    );
  } catch {
    return (
      <ResultsPageShell
        currentPath="history"
        locale={supportedLocale}
        messages={messages}
        title={messages.resultHistory}
        topActions={
          <Link className="ui-button-secondary" href={`/${supportedLocale}/results`}>
            {messages.latestResults}
          </Link>
        }
      >
        <StatusCard message={messages.historyUnavailable} />
      </ResultsPageShell>
    );
  }
}
