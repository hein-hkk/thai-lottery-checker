import { getResultsMessages, isSupportedLocale } from "@thai-lottery-checker/i18n";
import type { PrizeGroup, SupportedLocale } from "@thai-lottery-checker/types";
import Link from "next/link";
import { notFound } from "next/navigation";
import { DrawMetaCard } from "../../src/components/results/draw-meta-card";
import { PrizeGroupsSection } from "../../src/components/results/prize-groups-section";
import { StatusCard } from "../../src/components/results/status-card";
import { getResultHistory, getLatestResults, ResultsApiError } from "../../src/results/api";

export const dynamic = "force-dynamic";

interface LocalePageProps {
  params: Promise<{ locale: string }>;
}

const heroPrizeTypes = new Set<PrizeGroup["type"]>(["FIRST_PRIZE", "FRONT_THREE", "LAST_THREE", "LAST_TWO"]);

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
    <main className="min-h-screen px-5 py-10 md:px-8">
      <div className="mx-auto flex max-w-6xl flex-col gap-8">
        <section className="rounded-[2rem] border border-shell-border bg-white/90 p-6 shadow-[0_18px_60px_rgba(18,49,79,0.08)] backdrop-blur-sm md:p-10">
          <div className="flex flex-col gap-4 border-b border-shell-border pb-6 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-sm font-medium tracking-wide text-slate-500">{supportedLocale.toUpperCase()}</p>
              <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-900 md:text-4xl">{messages.latestResults}</h1>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link
                className="inline-flex rounded-full bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800"
                href={`/${supportedLocale}/results`}
              >
                {messages.browseLatest}
              </Link>
              <Link
                className="inline-flex rounded-full border border-shell-border bg-white px-4 py-2 text-sm font-medium text-slate-800 transition hover:bg-slate-50"
                href={`/${supportedLocale}/results/history`}
              >
                {messages.viewHistory}
              </Link>
            </div>
          </div>

          <div className="mt-8">
            {latest ? (
              <div className="space-y-6">
                <DrawMetaCard
                  messages={messages}
                  drawCode={latest.drawCode}
                  drawDate={latest.drawDate}
                  publishedAt={latest.publishedAt}
                />
                <PrizeGroupsSection
                  messages={messages}
                  prizeGroups={latest.prizeGroups.filter((group) => heroPrizeTypes.has(group.type))}
                />
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
          </div>
        </section>

        <section className="rounded-[2rem] border border-shell-border bg-white/90 p-6 shadow-[0_18px_60px_rgba(18,49,79,0.08)] backdrop-blur-sm md:p-10">
          <div className="flex items-end justify-between gap-4 border-b border-shell-border pb-6">
            <div>
              <p className="text-sm font-medium tracking-wide text-slate-500">{messages.resultHistory}</p>
              <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">{messages.resultHistory}</h2>
            </div>
            <Link
              className="inline-flex rounded-full border border-shell-border bg-white px-4 py-2 text-sm font-medium text-slate-800 transition hover:bg-slate-50"
              href={`/${supportedLocale}/results/history`}
            >
              {messages.viewHistory}
            </Link>
          </div>

          <div className="mt-6">
            {history && history.items.length > 0 ? (
              <div className="grid gap-3">
                {history.items.slice(0, 5).map((item) => (
                  <Link
                    className="flex items-center justify-between gap-4 rounded-2xl border border-shell-border px-4 py-4 transition hover:border-slate-300 hover:bg-slate-50"
                    href={`/${supportedLocale}/results/${item.drawDate}`}
                    key={item.drawDate}
                  >
                    <div>
                      <p className="text-sm font-semibold text-slate-900">{item.drawDate}</p>
                      <p className="mt-1 text-sm text-slate-600">{item.drawCode ?? "-"}</p>
                    </div>
                    <div className="text-right text-sm">
                      <p className="font-mono font-semibold tracking-[0.16em] text-slate-900">{item.firstPrize}</p>
                      <p className="mt-1 font-mono tracking-[0.16em] text-slate-500">{item.lastTwo}</p>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <StatusCard message={history ? messages.noHistory : messages.historyUnavailable} />
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
