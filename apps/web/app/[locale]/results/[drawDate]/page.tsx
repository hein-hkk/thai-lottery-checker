import { getResultsMessages, isSupportedLocale } from "@thai-lottery-checker/i18n";
import type { SupportedLocale } from "@thai-lottery-checker/types";
import { notFound } from "next/navigation";
import { ResultDetailSections } from "../../../../src/components/results/result-detail-sections";
import { ResultDetailShell } from "../../../../src/components/results/result-detail-shell";
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
      <ResultDetailShell locale={supportedLocale} messages={messages}>
        <ResultDetailSections
          drawDate={detail.drawDate}
          locale={supportedLocale}
          messages={messages}
          prizeGroups={detail.prizeGroups}
          publishedAt={detail.publishedAt}
        />
      </ResultDetailShell>
    );
  } catch {
    return (
      <ResultDetailShell locale={supportedLocale} messages={messages}>
        <StatusCard message={messages.detailUnavailable} />
      </ResultDetailShell>
    );
  }
}
