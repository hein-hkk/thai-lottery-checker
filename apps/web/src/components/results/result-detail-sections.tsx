import { prizeTypeMetadataByType } from "@thai-lottery-checker/domain";
import type { ResultsMessages } from "@thai-lottery-checker/i18n";
import type { PrizeGroup, PrizeType, SupportedLocale } from "@thai-lottery-checker/types";
import { CircleCheck, Clock3 } from "lucide-react";
import type { CSSProperties } from "react";

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
        <DensePrizeSection
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

function ResultDetailHeader({
  drawDate,
  locale,
  messages,
  publishedAt
}: {
  drawDate: string;
  locale: SupportedLocale;
  messages: ResultsMessages;
  publishedAt: string | null;
}) {
  return (
    <div className="space-y-3">
      <h1 className="ui-title">{messages.officialResultTitle}</h1>
      <p className="ui-detail-date">{formatLongDate(locale, drawDate)}</p>
      <p className="ui-detail-published">
        <Clock3 size={15} strokeWidth={2} />
        <span>
          {messages.publishedAt}: {publishedAt ? formatPublishedAt(locale, publishedAt) : messages.pendingPublication}
        </span>
      </p>
    </div>
  );
}

function SummaryPrizeCard({ messages, prizeGroup }: { messages: ResultsMessages; prizeGroup: PrizeGroup }) {
  const metadata = prizeTypeMetadataByType[prizeGroup.type];
  const isFirstPrize = prizeGroup.type === "FIRST_PRIZE";
  const summaryValuesClassName = `ui-detail-summary-values ${
    prizeGroup.type === "FRONT_THREE" || prizeGroup.type === "LAST_THREE" ? "ui-detail-summary-values-paired" : ""
  }`;
  const summaryCardClassName = `ui-panel ui-detail-card ui-detail-summary-card ${
    isFirstPrize ? "ui-detail-summary-card-featured" : ""
  }`;
  const summaryPillClassName = `ui-detail-summary-pill ${isFirstPrize ? "ui-detail-summary-pill-featured" : ""}`;
  const summaryNumberClassName = `ui-detail-summary-number ${isFirstPrize ? "ui-detail-summary-number-featured" : ""}`;

  return (
    <section className={summaryCardClassName}>
      <div className="space-y-3">
        <div className="flex items-start justify-between gap-3">
          <h2 className="ui-kicker text-[var(--text-secondary)]">{messages.prizeLabels[prizeGroup.type]}</h2>
          <PrizeGroupStatus prizeGroup={prizeGroup} />
        </div>
        {prizeGroup.isReleased ? (
          <div className={summaryValuesClassName}>
            {prizeGroup.numbers.map((number) => (
              <span className={summaryPillClassName} key={`${prizeGroup.type}-${number}`}>
                <span className={`${summaryNumberClassName} text-[var(--text-primary)]`}>{number}</span>
              </span>
            ))}
          </div>
        ) : (
          <PlaceholderGrid digitLength={metadata.digitLength} expectedCount={metadata.expectedCount} variant="summary" />
        )}
      </div>
    </section>
  );
}

function GroupedPrizeCard({ messages, prizeGroup }: { messages: ResultsMessages; prizeGroup: PrizeGroup }) {
  const metadata = prizeTypeMetadataByType[prizeGroup.type];

  return (
    <section className="ui-panel ui-detail-card ui-detail-group-card">
      <div className="space-y-4">
        <div className="flex items-start justify-between gap-3">
          <h2 className="ui-section-title">{messages.prizeLabels[prizeGroup.type]}</h2>
          <PrizeGroupStatus prizeGroup={prizeGroup} />
        </div>

        {prizeGroup.isReleased ? (
          <div className="ui-detail-chip-grid" style={detailTableStyle(2, 2)}>
            {prizeGroup.numbers.map((number) => (
              <span className="ui-detail-chip" key={`${prizeGroup.type}-${number}`}>
                <span className="ui-number-compact text-[var(--text-primary)]">{number}</span>
              </span>
            ))}
          </div>
        ) : (
          <PlaceholderGrid digitLength={metadata.digitLength} expectedCount={metadata.expectedCount} variant="grouped" />
        )}
      </div>
    </section>
  );
}

function DensePrizeSection({
  columnsDesktop,
  columnsMobile,
  messages,
  prizeGroup
}: {
  columnsDesktop: number;
  columnsMobile: number;
  messages: ResultsMessages;
  prizeGroup: PrizeGroup;
}) {
  const metadata = prizeTypeMetadataByType[prizeGroup.type];

  return (
    <section className="ui-panel ui-detail-card ui-detail-section space-y-4">
      <div className="flex items-start justify-between gap-3">
        <h2 className="ui-section-title">{messages.prizeLabels[prizeGroup.type]}</h2>
        <PrizeGroupStatus prizeGroup={prizeGroup} />
      </div>
      {prizeGroup.isReleased ? (
        <div className="ui-detail-chip-grid" style={detailTableStyle(columnsMobile, columnsDesktop)}>
          {prizeGroup.numbers.map((number) => (
            <span className="ui-detail-chip ui-detail-chip-dense" key={`${prizeGroup.type}-${number}`}>
              <span className="ui-number-compact text-[var(--text-primary)]">{number}</span>
            </span>
          ))}
        </div>
      ) : (
        <PlaceholderGrid
          columnsDesktop={columnsDesktop}
          columnsMobile={columnsMobile}
          digitLength={metadata.digitLength}
          expectedCount={metadata.expectedCount}
          variant="dense"
        />
      )}
    </section>
  );
}

function PlaceholderGrid({
  columnsDesktop,
  columnsMobile,
  digitLength,
  expectedCount,
  variant
}: {
  columnsDesktop?: number;
  columnsMobile?: number;
  digitLength: number;
  expectedCount: number;
  variant: "dense" | "grouped" | "summary";
}) {
  const placeholder = "•".repeat(digitLength);
  const className =
    variant === "summary"
      ? "ui-detail-summary-values"
      : "ui-detail-chip-grid";
  const style = variant === "summary" ? undefined : detailTableStyle(columnsMobile ?? 2, columnsDesktop ?? 2);

  return (
    <div className={className} style={style}>
      {Array.from({ length: expectedCount }, (_, index) => (
        <span
          aria-hidden="true"
          className={
            variant === "summary"
              ? "ui-detail-summary-pill ui-detail-summary-pill-muted"
              : "ui-detail-chip ui-detail-chip-muted"
          }
          key={`${variant}-${digitLength}-${index}`}
        >
          <span className="ui-number-compact text-[var(--text-muted)]">{placeholder}</span>
        </span>
      ))}
    </div>
  );
}

function detailTableStyle(columnsMobile: number, columnsDesktop: number) {
  return {
    "--ui-detail-columns-desktop": columnsDesktop,
    "--ui-detail-columns-mobile": columnsMobile
  } as CSSProperties;
}

function formatLongDate(locale: SupportedLocale, value: string) {
  return new Intl.DateTimeFormat(toIntlLocale(locale), {
    day: "numeric",
    month: "long",
    year: "numeric"
  }).format(new Date(`${value}T12:00:00Z`));
}

function formatPublishedAt(locale: SupportedLocale, value: string) {
  return new Intl.DateTimeFormat(toIntlLocale(locale), {
    hour: "numeric",
    minute: "2-digit"
  }).format(new Date(value));
}

function toIntlLocale(locale: SupportedLocale) {
  switch (locale) {
    case "th":
      return "th-TH";
    case "my":
      return "my-MM";
    case "en":
    default:
      return "en-GB";
  }
}

function getDisplayPrizeGroup(prizeGroupMap: PrizeGroupMap, type: PrizeType): PrizeGroup {
  return prizeGroupMap[type] ?? {
    type,
    numbers: [],
    isReleased: false
  };
}

function PrizeGroupStatus({ prizeGroup }: { prizeGroup: PrizeGroup }) {
  return (
    <span
      className={`${prizeGroup.isReleased ? "ui-badge-success" : "ui-badge-warning"} shrink-0`}
      aria-label={prizeGroup.isReleased ? "Released prize group" : "Pending prize group"}
      title={prizeGroup.isReleased ? "Released" : "Pending"}
    >
      {prizeGroup.isReleased ? <CircleCheck size={14} strokeWidth={2} /> : <Clock3 size={14} strokeWidth={2} />}
    </span>
  );
}
