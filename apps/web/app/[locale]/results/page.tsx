import { getResultsMessages, isSupportedLocale } from "@thai-lottery-checker/i18n";
import type { SupportedLocale } from "@thai-lottery-checker/types";
import Link from "next/link";
import { notFound } from "next/navigation";
import { DrawMetaCard } from "../../../src/components/results/draw-meta-card";
import { PrizeGroupsSection } from "../../../src/components/results/prize-groups-section";
import { ResultsShell } from "../../../src/components/results/results-shell";
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
      <ResultsShell locale={supportedLocale} messages={messages} title={messages.latestResults}>
        <div className="space-y-6">
          <DrawMetaCard
            messages={messages}
            drawDate={latest.drawDate}
            drawCode={latest.drawCode}
            publishedAt={latest.publishedAt}
          />
          <PrizeGroupsSection messages={messages} prizeGroups={latest.prizeGroups} />
          <div className="flex justify-end">
            <Link
              className="inline-flex rounded-full border border-shell-border bg-white px-4 py-2 text-sm font-medium text-slate-800 transition hover:bg-slate-50"
              href={`/${supportedLocale}/results/history`}
            >
              {messages.viewHistory}
            </Link>
          </div>
        </div>
      </ResultsShell>
    );
  } catch (error) {
    const message =
      error instanceof ResultsApiError && error.status === 404 ? messages.noResults : messages.latestUnavailable;

    return (
      <ResultsShell locale={supportedLocale} messages={messages} title={messages.latestResults}>
        <StatusCard message={message} />
      </ResultsShell>
    );
  }
}
