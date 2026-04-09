import type { Metadata } from "next";
import { getResultsMessages, isSupportedLocale } from "@thai-lottery-checker/i18n";
import type { SupportedLocale } from "@thai-lottery-checker/types";
import Link from "next/link";
import { notFound } from "next/navigation";
import { HomeBlogTeasers } from "../../src/components/blog/home-blog-teasers";
import { EmbeddedChecker } from "../../src/components/results/embedded-checker";
import { HistoryResultCard } from "../../src/components/results/history-result-card";
import { LatestSummarySection } from "../../src/components/results/latest-summary-section";
import { StatusCard } from "../../src/components/results/status-card";
import { PublicPageShell } from "../../src/components/ui/public-page-shell";
import { getBlogList } from "../../src/blog/api";
import { getResultHistory, getLatestResults, ResultsApiError } from "../../src/results/api";
import { getLandingMetadata } from "../../src/results/metadata";

export const dynamic = "force-dynamic";

interface LocalePageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;

  if (!isSupportedLocale(locale)) {
    return {};
  }

  return getLandingMetadata(locale as SupportedLocale, getResultsMessages(locale as SupportedLocale));
}

export default async function LocalePage({ params }: LocalePageProps) {
  const { locale } = await params;

  if (!isSupportedLocale(locale)) {
    notFound();
  }

  const supportedLocale = locale as SupportedLocale;
  const messages = getResultsMessages(supportedLocale);
  const [latestResult, historyResult, teaserPostsResult] = await Promise.allSettled([
    getLatestResults(),
    getResultHistory(1),
    getBlogList(supportedLocale, 1, 3)
  ]);

  const latest = latestResult.status === "fulfilled" ? latestResult.value : null;
  const history = historyResult.status === "fulfilled" ? historyResult.value : null;
  const teaserPosts = teaserPostsResult.status === "fulfilled" ? teaserPostsResult.value : null;

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
              <div className="ui-hero-with-aside">
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
                <EmbeddedChecker
                  defaultDrawDate={latest.drawDate}
                  defaultDrawStatus={latest.publishedAt ? "published" : "draft"}
                  locale={supportedLocale}
                  messages={messages}
                />
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

        <section className="space-y-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <h2 className="ui-section-title">{messages.resultHistory}</h2>
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

        {teaserPosts && teaserPosts.items.length > 0 ? (
          <HomeBlogTeasers locale={supportedLocale} messages={messages} posts={teaserPosts.items} />
        ) : null}
      </div>
    </PublicPageShell>
  );
}
