import type { ResultsMessages } from "@thai-lottery-checker/i18n";
import type { PrizeGroup, PrizeType, SupportedLocale } from "@thai-lottery-checker/types";
import {
  createFallbackPrizeGroup,
  ResultDetailHeader,
  SummaryPrizeCard
} from "./result-detail-primitives";

interface LatestSummarySectionProps {
  drawDate: string;
  hideTitle?: boolean;
  locale: SupportedLocale;
  messages: ResultsMessages;
  prizeGroups: PrizeGroup[];
  publishedAt: string | null;
  title?: string;
}

type PrizeGroupMap = Partial<Record<PrizeType, PrizeGroup>>;

const topSummaryPrizeTypes: PrizeType[] = ["FIRST_PRIZE", "FRONT_THREE", "LAST_THREE", "LAST_TWO"];

export function LatestSummarySection({
  drawDate,
  hideTitle = false,
  locale,
  messages,
  prizeGroups,
  publishedAt,
  title
}: LatestSummarySectionProps) {
  const prizeGroupMap = prizeGroups.reduce((accumulator, prizeGroup) => {
    accumulator[prizeGroup.type] = prizeGroup;
    return accumulator;
  }, {} as PrizeGroupMap);

  return (
    <section className="space-y-6">
      <ResultDetailHeader
        drawDate={drawDate}
        hideTitle={hideTitle}
        locale={locale}
        messages={messages}
        publishedAt={publishedAt}
        title={title ?? messages.latestResults}
      />
      <div className="ui-detail-summary-grid">
        {topSummaryPrizeTypes.map((type) => (
          <SummaryPrizeCard key={type} messages={messages} prizeGroup={getDisplayPrizeGroup(prizeGroupMap, type)} />
        ))}
      </div>
    </section>
  );
}

function getDisplayPrizeGroup(prizeGroupMap: PrizeGroupMap, type: PrizeType): PrizeGroup {
  return prizeGroupMap[type] ?? createFallbackPrizeGroup(type);
}
