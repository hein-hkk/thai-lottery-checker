import { prizeTypeMetadataByType } from "@thai-lottery-checker/domain";
import type { ResultsMessages } from "@thai-lottery-checker/i18n";
import type { PrizeGroup, PrizeType, SupportedLocale } from "@thai-lottery-checker/types";
import { CircleCheck, Clock3 } from "lucide-react";
import type { CSSProperties } from "react";
import { formatBangkokTime, formatLongDate } from "../../lib/locale-date";

export function ResultDetailHeader({
  drawDate,
  hideTitle = false,
  locale,
  messages,
  title,
  publishedAt
}: {
  drawDate: string;
  hideTitle?: boolean;
  locale: SupportedLocale;
  messages: ResultsMessages;
  title?: string;
  publishedAt: string | null;
}) {
  return (
    <div className="space-y-3">
      {hideTitle ? null : <h1 className="ui-title">{title ?? messages.officialResultTitle}</h1>}
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

export function SummaryPrizeCard({
  messages,
  prizeGroup,
  variant = "default"
}: {
  messages: ResultsMessages;
  prizeGroup: PrizeGroup;
  variant?: "compact" | "default";
}) {
  const metadata = prizeTypeMetadataByType[prizeGroup.type];
  const isFirstPrize = prizeGroup.type === "FIRST_PRIZE";
  const summaryValuesClassName = `ui-detail-summary-values ${
    prizeGroup.type === "FRONT_THREE" || prizeGroup.type === "LAST_THREE" ? "ui-detail-summary-values-paired" : ""
  }`;
  const summaryCardClassName = `ui-panel ui-detail-card ui-detail-summary-card ${
    isFirstPrize ? "ui-detail-summary-card-featured" : ""
  } ${variant === "compact" ? "ui-detail-summary-card-compact" : ""}`;
  const summaryPillClassName = `ui-detail-summary-pill ${isFirstPrize ? "ui-detail-summary-pill-featured" : ""} ${
    variant === "compact" ? "ui-detail-summary-pill-compact" : ""
  }`;
  const summaryNumberClassName = `ui-detail-summary-number ${isFirstPrize ? "ui-detail-summary-number-featured" : ""} ${
    variant === "compact" ? "ui-detail-summary-number-compact-card" : ""
  }`;

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
          <PrizeGroupPlaceholder digitLength={metadata.digitLength} expectedCount={metadata.expectedCount} variant="summary" summaryValuesClassName={summaryValuesClassName} />
        )}
      </div>
    </section>
  );
}

export function GroupedPrizeCard({ messages, prizeGroup }: { messages: ResultsMessages; prizeGroup: PrizeGroup }) {
  const metadata = prizeTypeMetadataByType[prizeGroup.type];

  return (
    <section className="ui-panel ui-detail-card ui-detail-group-card">
      <div className="space-y-4">
        <div className="flex items-start justify-between gap-3">
          <h2 className="ui-section-title">{messages.prizeLabels[prizeGroup.type]}</h2>
          <PrizeGroupStatus prizeGroup={prizeGroup} />
        </div>

        {prizeGroup.isReleased ? (
          <div className="ui-detail-chip-grid" style={chipGridStyle(2, 2)}>
            {prizeGroup.numbers.map((number) => (
              <span className="ui-detail-chip" key={`${prizeGroup.type}-${number}`}>
                <span className="ui-number-compact text-[var(--text-primary)]">{number}</span>
              </span>
            ))}
          </div>
        ) : (
          <PrizeGroupPlaceholder digitLength={metadata.digitLength} expectedCount={metadata.expectedCount} variant="grouped" />
        )}
      </div>
    </section>
  );
}

export function DensePrizeChipSection({
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
    <section className="ui-panel ui-detail-card ui-detail-section ui-detail-dense-section space-y-4">
      <div className="flex items-start justify-between gap-3">
        <h2 className="ui-section-title">{messages.prizeLabels[prizeGroup.type]}</h2>
        <PrizeGroupStatus prizeGroup={prizeGroup} />
      </div>
      {prizeGroup.isReleased ? (
        <div className="ui-detail-chip-grid" style={chipGridStyle(columnsMobile, columnsDesktop)}>
          {prizeGroup.numbers.map((number) => (
            <span className="ui-detail-chip ui-detail-chip-dense" key={`${prizeGroup.type}-${number}`}>
              <span className="ui-number-compact text-[var(--text-primary)]">{number}</span>
            </span>
          ))}
        </div>
      ) : (
        <PrizeGroupPlaceholder
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

export function PrizeGroupStatus({ prizeGroup }: { prizeGroup: PrizeGroup }) {
  return (
    <span
      className={`ui-prize-group-status ${prizeGroup.isReleased ? "ui-badge-success" : "ui-badge-warning"} shrink-0`}
      aria-label={prizeGroup.isReleased ? "Released prize group" : "Pending prize group"}
      title={prizeGroup.isReleased ? "Released" : "Pending"}
    >
      {prizeGroup.isReleased ? <CircleCheck size={14} strokeWidth={2} /> : <Clock3 size={14} strokeWidth={2} />}
    </span>
  );
}

export function createFallbackPrizeGroup(type: PrizeType): PrizeGroup {
  return {
    type,
    numbers: [],
    isReleased: false
  };
}

function PrizeGroupPlaceholder({
  columnsDesktop,
  columnsMobile,
  digitLength,
  expectedCount,
  variant,
  summaryValuesClassName
}: {
  columnsDesktop?: number;
  columnsMobile?: number;
  digitLength: number;
  expectedCount: number;
  variant: "dense" | "grouped" | "summary";
  summaryValuesClassName?: string;
}) {
  const placeholder = "•".repeat(digitLength);
  const className = variant === "summary" ? summaryValuesClassName : "ui-detail-chip-grid";
  const style = variant === "summary" ? undefined : chipGridStyle(columnsMobile ?? 2, columnsDesktop ?? 2);

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

function chipGridStyle(columnsMobile: number, columnsDesktop: number) {
  return {
    "--ui-detail-columns-desktop": columnsDesktop,
    "--ui-detail-columns-mobile": columnsMobile
  } as CSSProperties;
}

function formatPublishedAt(locale: SupportedLocale, value: string) {
  return formatBangkokTime(locale, value);
}
