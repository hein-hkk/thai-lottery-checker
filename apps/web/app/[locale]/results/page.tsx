import type { Metadata } from "next";
import { getResultsMessages, isSupportedLocale } from "@thai-lottery-checker/i18n";
import type { SupportedLocale } from "@thai-lottery-checker/types";
import Link from "next/link";
import { notFound } from "next/navigation";
import { EmbeddedChecker } from "../../../src/components/results/embedded-checker";
import { LatestResultSections } from "../../../src/components/results/latest-result-sections";
import { getLatestResultsMetadata } from "../../../src/results/metadata";
import { ResultsPageShell } from "../../../src/components/results/results-page-shell";
import { StatusCard } from "../../../src/components/results/status-card";
import { getLatestResults, ResultsApiError } from "../../../src/results/api";

export const dynamic = "force-dynamic";

interface LatestResultsPageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;

  if (!isSupportedLocale(locale)) {
    return {};
  }

  return getLatestResultsMetadata(locale as SupportedLocale, getResultsMessages(locale as SupportedLocale));
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
      <ResultsPageShell
        bottomAction={
          <Link className="ui-button-secondary" href={`/${supportedLocale}/results/history`}>
            {messages.viewHistory}
          </Link>
        }
        currentPath="latest"
        description={messages.officialLatestResultsDescription}
        locale={supportedLocale}
        messages={messages}
        title={messages.officialLatestResultsTitle}
      >
        <LatestResultSections
          drawDate={latest.drawDate}
          hideSummaryTitle
          locale={supportedLocale}
          messages={messages}
          prizeGroups={latest.prizeGroups}
          publishedAt={latest.publishedAt}
          summaryAside={
            <EmbeddedChecker
              defaultDrawDate={latest.drawDate}
              defaultDrawStatus={latest.publishedAt ? "published" : "draft"}
              locale={supportedLocale}
              messages={messages}
            />
          }
        />
      </ResultsPageShell>
    );
  } catch (error) {
    const message =
      error instanceof ResultsApiError && error.status === 404 ? messages.noResults : messages.latestUnavailable;

    return (
      <ResultsPageShell
        bottomAction={
          <Link className="ui-button-secondary" href={`/${supportedLocale}/results/history`}>
            {messages.viewHistory}
          </Link>
        }
        currentPath="latest"
        description={messages.officialLatestResultsDescription}
        locale={supportedLocale}
        messages={messages}
        title={messages.officialLatestResultsTitle}
      >
        <StatusCard message={message} />
      </ResultsPageShell>
    );
  }
}
