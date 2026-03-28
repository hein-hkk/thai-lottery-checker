import { getResultsMessages, isSupportedLocale } from "@thai-lottery-checker/i18n";
import type { SupportedLocale } from "@thai-lottery-checker/types";
import Link from "next/link";
import { notFound } from "next/navigation";
import { HistoryList } from "../../../../src/components/results/history-list";
import { ResultsPageShell } from "../../../../src/components/results/results-page-shell";
import { StatusCard } from "../../../../src/components/results/status-card";
import { getResultHistory } from "../../../../src/results/api";
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
    const history = await getResultHistory(currentPage);

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
        {history.items.length === 0 ? (
          <StatusCard message={messages.noHistory} />
        ) : (
          <HistoryList locale={supportedLocale} messages={messages} page={currentPage} history={history} />
        )}
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
