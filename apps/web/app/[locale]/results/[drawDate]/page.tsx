import type { Metadata } from "next";
import { getResultsMessages, isSupportedLocale } from "@thai-lottery-checker/i18n";
import type { SupportedLocale } from "@thai-lottery-checker/types";
import Link from "next/link";
import { notFound } from "next/navigation";
import { EmbeddedChecker } from "../../../../src/components/results/embedded-checker";
import { CheckerResultOverlay } from "../../../../src/components/results/checker-result-overlay";
import { getResultDetailMetadata } from "../../../../src/results/metadata";
import { ResultDetailSections } from "../../../../src/components/results/result-detail-sections";
import { ResultsPageShell } from "../../../../src/components/results/results-page-shell";
import { StatusCard } from "../../../../src/components/results/status-card";
import { checkLotteryTicket, getResultDetail, ResultsApiError } from "../../../../src/results/api";

export const dynamic = "force-dynamic";

interface ResultDetailPageProps {
  params: Promise<{ locale: string; drawDate: string }>;
  searchParams: Promise<{ checker?: string | string[]; ticket?: string | string[] }>;
}

export async function generateMetadata({ params }: ResultDetailPageProps): Promise<Metadata> {
  const { locale, drawDate } = await params;

  if (!isSupportedLocale(locale)) {
    return {};
  }

  try {
    const detail = await getResultDetail(drawDate);

    if (!detail) {
      return {};
    }

    return getResultDetailMetadata(locale as SupportedLocale, detail, getResultsMessages(locale as SupportedLocale));
  } catch {
    return {};
  }
}

export default async function ResultDetailPage({ params, searchParams }: ResultDetailPageProps) {
  const { locale, drawDate } = await params;
  const { checker, ticket } = await searchParams;

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

    const shouldOpenChecker = getSingleSearchParam(checker) === "1";
    const checkerTicket = getSingleSearchParam(ticket);
    const checkerResult =
      shouldOpenChecker && checkerTicket && /^\d{6}$/.test(checkerTicket)
        ? await loadCheckerResult(checkerTicket, detail.drawDate)
        : null;

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
        {checkerResult ? <CheckerResultOverlay locale={supportedLocale} messages={messages} result={checkerResult} /> : null}
        <ResultDetailSections
          drawDate={detail.drawDate}
          locale={supportedLocale}
          messages={messages}
          prizeGroups={detail.prizeGroups}
          publishedAt={detail.publishedAt}
          summaryAside={
            <EmbeddedChecker
              defaultDrawDate={detail.drawDate}
              defaultDrawStatus={detail.publishedAt ? "published" : "draft"}
              locale={supportedLocale}
              messages={messages}
            />
          }
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

function getSingleSearchParam(value: string | string[] | undefined): string | null {
  if (Array.isArray(value)) {
    return value[0] ?? null;
  }

  return value ?? null;
}

async function loadCheckerResult(ticketNumber: string, drawDate: string) {
  try {
    return await checkLotteryTicket({ ticketNumber, drawDate });
  } catch (error) {
    if (error instanceof ResultsApiError) {
      return null;
    }

    throw error;
  }
}
