import { getResultsMessages, isSupportedLocale } from "@thai-lottery-checker/i18n";
import type { SupportedLocale } from "@thai-lottery-checker/types";
import Link from "next/link";
import { notFound } from "next/navigation";
import { DrawMetaCard } from "../../../../src/components/results/draw-meta-card";
import { PrizeGroupsSection } from "../../../../src/components/results/prize-groups-section";
import { ResultsShell } from "../../../../src/components/results/results-shell";
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
      <ResultsShell currentPath="detail" locale={supportedLocale} messages={messages} title={messages.drawDetail}>
        <div className="space-y-6">
          <DrawMetaCard
            messages={messages}
            drawDate={detail.drawDate}
            drawCode={detail.drawCode}
            publishedAt={detail.publishedAt}
          />
          <PrizeGroupsSection messages={messages} prizeGroups={detail.prizeGroups} />
          <div className="flex justify-end">
            <Link className="ui-button-secondary" href={`/${supportedLocale}/results/history`}>
              {messages.backToHistory}
            </Link>
          </div>
        </div>
      </ResultsShell>
    );
  } catch {
    return (
      <ResultsShell currentPath="detail" locale={supportedLocale} messages={messages} title={messages.drawDetail}>
        <StatusCard message={messages.detailUnavailable} />
      </ResultsShell>
    );
  }
}
