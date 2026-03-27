import Link from "next/link";
import type { ResultsMessages } from "@thai-lottery-checker/i18n";
import type { ResultHistoryResponse, SupportedLocale } from "@thai-lottery-checker/types";
import { ArrowRight } from "lucide-react";

interface HistoryResultCardProps {
  item: ResultHistoryResponse["items"][number];
  locale: SupportedLocale;
  messages: ResultsMessages;
}

export function HistoryResultCard({ item, locale, messages }: HistoryResultCardProps) {
  return (
    <Link
      aria-label={`${messages.drawDate}: ${item.drawDate}`}
      className="ui-history-link-card ui-panel"
      href={`/${locale}/results/${item.drawDate}`}
      title={item.drawDate}
    >
      <div className="ui-history-row">
        <div className="ui-history-date-badge" aria-hidden="true">
          <span className="ui-history-date-day">{getDayLabel(item.drawDate)}</span>
          <span className="ui-history-date-month">{getMonthLabel(locale, item.drawDate)}</span>
        </div>

        <div className="ui-history-content">
          <div className="ui-history-summary-grid">
            <HistoryValueBlock
              label={messages.prizeLabels.FIRST_PRIZE}
              value={item.firstPrize}
              variant="featured"
            />
            <HistoryValueBlock
              hideOnMobile
              label={messages.prizeLabels.FRONT_THREE}
              values={item.frontThree}
            />
            <HistoryValueBlock
              hideOnMobile
              label={messages.prizeLabels.LAST_THREE}
              values={item.lastThree}
            />
            <HistoryValueBlock
              label={messages.prizeLabels.LAST_TWO}
              value={item.lastTwo}
            />
          </div>

          <span aria-hidden="true" className="ui-history-arrow">
            <ArrowRight size={16} strokeWidth={2} />
          </span>
        </div>
      </div>
    </Link>
  );
}

function HistoryValueBlock({
  label,
  value,
  values,
  variant = "default",
  hideOnMobile = false
}: {
  label: string;
  value?: string;
  values?: string[];
  variant?: "default" | "featured";
  hideOnMobile?: boolean;
}) {
  const displayValues = values ?? (value ? [value] : []);

  return (
    <div
      className={`ui-history-value-block ${variant === "featured" ? "ui-history-value-block-featured" : ""} ${
        hideOnMobile ? "ui-history-value-block-desktop-only" : ""
      }`}
    >
      <p className="ui-history-value-label">{label}</p>
      <div className={`ui-history-value-row ${displayValues.length > 1 ? "ui-history-value-row-paired" : ""}`}>
        {displayValues.map((entry) => (
          <span
            className={`ui-history-value ${variant === "featured" ? "ui-history-value-featured" : ""}`}
            key={`${label}-${entry}`}
          >
            {entry}
          </span>
        ))}
      </div>
    </div>
  );
}

function getDayLabel(drawDate: string) {
  return new Intl.DateTimeFormat("en-GB", { day: "2-digit", timeZone: "UTC" }).format(new Date(`${drawDate}T00:00:00.000Z`));
}

function getMonthLabel(locale: SupportedLocale, drawDate: string) {
  return new Intl.DateTimeFormat(toIntlLocale(locale), { month: "short", timeZone: "UTC" })
    .format(new Date(`${drawDate}T00:00:00.000Z`))
    .replace(".", "");
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
