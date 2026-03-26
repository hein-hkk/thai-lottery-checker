import { getResultsMessages, isSupportedLocale } from "@thai-lottery-checker/i18n";
import type { SupportedLocale } from "@thai-lottery-checker/types";
import { notFound } from "next/navigation";
import { LatestResultSections } from "../../../src/components/results/latest-result-sections";
import { LatestResultsShell } from "../../../src/components/results/latest-results-shell";
import { StatusCard } from "../../../src/components/results/status-card";
import { getLatestResults, ResultsApiError } from "../../../src/results/api";

export const dynamic = "force-dynamic";

interface LatestResultsPageProps {
  params: Promise<{ locale: string }>;
}

export default async function LatestResultsPage({ params }: LatestResultsPageProps) {
  const { locale } = await params;

  if (!isSupportedLocale(locale)) {
    notFound();
  }

  const supportedLocale = locale as SupportedLocale;
  const messages = getResultsMessages(supportedLocale);

  try {
    const latest = await getLatestResults();

    return (
      <LatestResultsShell locale={supportedLocale} messages={messages}>
        <LatestResultSections
          drawDate={latest.drawDate}
          locale={supportedLocale}
          messages={messages}
          prizeGroups={latest.prizeGroups}
          publishedAt={latest.publishedAt}
        />
      </LatestResultsShell>
    );
  } catch (error) {
    const message =
      error instanceof ResultsApiError && error.status === 404 ? messages.noResults : messages.latestUnavailable;

    return (
      <LatestResultsShell locale={supportedLocale} messages={messages}>
        <StatusCard message={message} />
      </LatestResultsShell>
    );
  }
}
