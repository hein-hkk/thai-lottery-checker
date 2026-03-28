import type { ResultsMessages } from "@thai-lottery-checker/i18n";
import type { PrizeGroup, PrizeType, SupportedLocale } from "@thai-lottery-checker/types";
import {
  createFallbackPrizeGroup,
  DensePrizeChipSection,
  GroupedPrizeCard,
  ResultDetailHeader,
  SummaryPrizeCard
} from "./result-detail-primitives";

interface ResultDetailSectionsProps {
  drawDate: string;
  locale: SupportedLocale;
  messages: ResultsMessages;
  prizeGroups: PrizeGroup[];
  publishedAt: string | null;
}

type PrizeGroupMap = Partial<Record<PrizeType, PrizeGroup>>;

const topSummaryPrizeTypes: PrizeType[] = ["FIRST_PRIZE", "FRONT_THREE", "LAST_THREE", "LAST_TWO"];
const secondaryPrizeTypes: PrizeType[] = ["NEAR_FIRST_PRIZE", "SECOND_PRIZE"];
const densePrizeTypeConfig: Array<{ columnsDesktop: number; columnsMobile: number; type: PrizeType }> = [
  { type: "THIRD_PRIZE", columnsMobile: 2, columnsDesktop: 5 },
  { type: "FOURTH_PRIZE", columnsMobile: 2, columnsDesktop: 5 },
  { type: "FIFTH_PRIZE", columnsMobile: 2, columnsDesktop: 5 }
];

export function ResultDetailSections({
  drawDate,
  locale,
  messages,
  prizeGroups,
  publishedAt
}: ResultDetailSectionsProps) {
  const prizeGroupMap = prizeGroups.reduce((accumulator, prizeGroup) => {
    accumulator[prizeGroup.type] = prizeGroup;
    return accumulator;
  }, {} as PrizeGroupMap);

  return (
    <div className="ui-detail-page space-y-8 md:space-y-10">
      <section className="space-y-6">
        <ResultDetailHeader drawDate={drawDate} locale={locale} messages={messages} publishedAt={publishedAt} />
        <div className="ui-detail-summary-grid">
          {topSummaryPrizeTypes.map((type) => (
            <SummaryPrizeCard key={type} messages={messages} prizeGroup={getDisplayPrizeGroup(prizeGroupMap, type)} />
          ))}
        </div>
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
