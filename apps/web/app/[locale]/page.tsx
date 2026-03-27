import { getResultsMessages, isSupportedLocale } from "@thai-lottery-checker/i18n";
import type { SupportedLocale } from "@thai-lottery-checker/types";
import Link from "next/link";
import { notFound } from "next/navigation";
import { HistoryResultCard } from "../../src/components/results/history-result-card";
import { LatestSummarySection } from "../../src/components/results/latest-summary-section";
import { StatusCard } from "../../src/components/results/status-card";
import { PublicPageShell } from "../../src/components/ui/public-page-shell";
import { getResultHistory, getLatestResults, ResultsApiError } from "../../src/results/api";

export const dynamic = "force-dynamic";

interface LocalePageProps {
  params: Promise<{ locale: string }>;
}

export default async function LocalePage({ params }: LocalePageProps) {
  const { locale } = await params;

  if (!isSupportedLocale(locale)) {
    notFound();
  }

  const supportedLocale = locale as SupportedLocale;
  const messages = getResultsMessages(supportedLocale);
  const [latestResult, historyResult] = await Promise.allSettled([getLatestResults(), getResultHistory(1)]);

  const latest = latestResult.status === "fulfilled" ? latestResult.value : null;
  const history = historyResult.status === "fulfilled" ? historyResult.value : null;

  return (
    <PublicPageShell
      currentPath="home"
      description={messages.officialLatestResultsDescription}
      locale={supportedLocale}
      messages={messages}
      title={messages.officialLatestResultsTitle}
    >
      <div className="space-y-8">
        <section className="space-y-6">
          {latest ? (
            <div className="space-y-6">
              <LatestSummarySection
                drawDate={latest.drawDate}
                hideTitle
                locale={supportedLocale}
                messages={messages}
                prizeGroups={latest.prizeGroups}
                publishedAt={latest.publishedAt}
              />
              <div className="flex justify-start">
                <Link className="ui-button-primary" href={`/${supportedLocale}/results`}>
                  {messages.browseLatest}
                </Link>
              </div>
            </div>
          ) : (
            <StatusCard
              message={
                latestResult.status === "rejected" && latestResult.reason instanceof ResultsApiError && latestResult.reason.status === 404
                  ? messages.noResults
                  : messages.latestUnavailable
              }
            />
          )}
        </section>

        <section className="ui-panel p-6 md:p-8">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="ui-kicker">{messages.resultHistory}</p>
              <h2 className="ui-section-title mt-2">{messages.resultHistory}</h2>
            </div>
            <Link className="ui-button-secondary" href={`/${supportedLocale}/results/history`}>
              {messages.viewHistory}
            </Link>
          </div>

          <div className="ui-divider mt-6 pt-6">
            {history && history.items.length > 0 ? (
              <div className="grid gap-4">
                {history.items.slice(0, 5).map((item) => (
                  <HistoryResultCard item={item} key={item.drawDate} locale={supportedLocale} messages={messages} />
                ))}
              </div>
            ) : (
              <StatusCard message={history ? messages.noHistory : messages.historyUnavailable} />
            )}
          </div>
        </section>
      </div>
    </PublicPageShell>
  );
}
