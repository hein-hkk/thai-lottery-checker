import type { ReactNode } from "react";
import type { ResultsMessages } from "@thai-lottery-checker/i18n";
import type { PrizeGroup, PrizeType, SupportedLocale } from "@thai-lottery-checker/types";
import {
  createFallbackPrizeGroup,
  DensePrizeChipSection,
  GroupedPrizeCard,
} from "./result-detail-primitives";
import { LatestSummarySection } from "./latest-summary-section";

interface LatestResultSectionsProps {
  drawDate: string;
  hideSummaryTitle?: boolean;
  locale: SupportedLocale;
  messages: ResultsMessages;
  prizeGroups: PrizeGroup[];
  publishedAt: string | null;
  summaryAside?: ReactNode;
}

type PrizeGroupMap = Partial<Record<PrizeType, PrizeGroup>>;
const secondaryPrizeTypes: PrizeType[] = ["NEAR_FIRST_PRIZE", "SECOND_PRIZE"];
const densePrizeTypeConfig: Array<{ columnsDesktop: number; columnsMobile: number; type: PrizeType }> = [
  { type: "THIRD_PRIZE", columnsMobile: 2, columnsDesktop: 5 },
  { type: "FOURTH_PRIZE", columnsMobile: 2, columnsDesktop: 5 },
  { type: "FIFTH_PRIZE", columnsMobile: 2, columnsDesktop: 5 }
];

export function LatestResultSections({
  drawDate,
  hideSummaryTitle = false,
  locale,
  messages,
  prizeGroups,
  publishedAt,
  summaryAside
}: LatestResultSectionsProps) {
  const prizeGroupMap = prizeGroups.reduce((accumulator, prizeGroup) => {
    accumulator[prizeGroup.type] = prizeGroup;
    return accumulator;
  }, {} as PrizeGroupMap);

  return (
    <div className="ui-detail-page space-y-8 md:space-y-10">
      <section className={summaryAside ? "ui-hero-with-aside" : undefined}>
        <LatestSummarySection
          drawDate={drawDate}
          hideTitle={hideSummaryTitle}
          locale={locale}
          messages={messages}
          prizeGroups={prizeGroups}
          publishedAt={publishedAt}
        />
        {summaryAside}
      </section>

      <section className="ui-detail-section">
        <div className="ui-detail-two-up">
          {secondaryPrizeTypes.map((type) => (
            <GroupedPrizeCard key={type} messages={messages} prizeGroup={getDisplayPrizeGroup(prizeGroupMap, type)} />
          ))}
        </div>
      </section>

      {densePrizeTypeConfig.map((config) => (
        <DensePrizeChipSection
          columnsDesktop={config.columnsDesktop}
          columnsMobile={config.columnsMobile}
          key={config.type}
          messages={messages}
          prizeGroup={getDisplayPrizeGroup(prizeGroupMap, config.type)}
        />
      ))}
    </div>
  );
}

function getDisplayPrizeGroup(prizeGroupMap: PrizeGroupMap, type: PrizeType): PrizeGroup {
  return prizeGroupMap[type] ?? createFallbackPrizeGroup(type);
}
