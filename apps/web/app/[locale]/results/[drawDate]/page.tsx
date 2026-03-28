import { getResultsMessages, isSupportedLocale } from "@thai-lottery-checker/i18n";
import type { SupportedLocale } from "@thai-lottery-checker/types";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ResultDetailSections } from "../../../../src/components/results/result-detail-sections";
import { ResultsPageShell } from "../../../../src/components/results/results-page-shell";
import { StatusCard } from "../../../../src/components/results/status-card";
import { getResultDetail } from "../../../../src/results/api";

export const dynamic = "force-dynamic";

interface ResultDetailPageProps {
  params: Promise<{ locale: string; drawDate: string }>;
}

export default async function ResultDetailPage({ params }: ResultDetailPageProps) {
  const { locale, drawDate } = await params;

  if (!isSupportedLocale(locale)) {
    notFound();
  }

  const supportedLocale = locale as SupportedLocale;
  const messages = getResultsMessages(supportedLocale);

  try {
    const detail = await getResultDetail(drawDate);

    if (!detail) {
      notFound();
    }

    return (
      <ResultsPageShell
        bottomAction={
          <Link className="ui-button-secondary" href={`/${supportedLocale}/results/history`}>
            {messages.backToHistory}
          </Link>
        }
        currentPath="detail"
        locale={supportedLocale}
        messages={messages}
      >
        <ResultDetailSections
          drawDate={detail.drawDate}
          locale={supportedLocale}
          messages={messages}
          prizeGroups={detail.prizeGroups}
          publishedAt={detail.publishedAt}
        />
      </ResultsPageShell>
    );
  } catch {
    return (
      <ResultsPageShell
        bottomAction={
          <Link className="ui-button-secondary" href={`/${supportedLocale}/results/history`}>
            {messages.backToHistory}
          </Link>
        }
        currentPath="detail"
        locale={supportedLocale}
        messages={messages}
      >
        <StatusCard message={messages.detailUnavailable} />
      </ResultsPageShell>
    );
  }
}
