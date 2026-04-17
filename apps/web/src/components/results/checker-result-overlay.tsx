"use client";

import { prizeTypeMetadataByType } from "@thai-lottery-checker/domain";
import type { ResultsMessages } from "@thai-lottery-checker/i18n";
import type { CheckerCheckResponse, SupportedLocale } from "@thai-lottery-checker/types";
import { ChevronDown, X } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef } from "react";
import { formatLongDate } from "../../lib/locale-date";

interface CheckerResultOverlayProps {
  locale: SupportedLocale;
  messages: ResultsMessages;
  result: CheckerCheckResponse;
}

export function CheckerResultOverlay({ locale, messages, result }: CheckerResultOverlayProps) {
  const router = useRouter();
  const pathname = usePathname();
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  function handleClose() {
    router.replace(pathname, { scroll: false });
  }

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeButtonRef.current?.focus();

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        handleClose();
      }
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [pathname, router]);

  return (
    <div className="ui-modal-root">
      <button
        aria-label={messages.checkerClose}
        className="ui-modal-overlay"
        onClick={handleClose}
        type="button"
      />
      <aside aria-modal="true" className="ui-modal-panel" role="dialog">
        <div className="ui-modal-header">
          <div className="space-y-2">
            <p className="ui-kicker">{messages.checkerResultsTitle}</p>
            <h2 className="ui-section-title">
              {messages.checkerResultFor} {formatLongDate(locale, result.drawDate)}
            </h2>
          </div>
          <button
            aria-label={messages.checkerClose}
            className="ui-button-secondary ui-header-icon-button"
            onClick={handleClose}
            ref={closeButtonRef}
            type="button"
          >
            <X size={18} strokeWidth={2} />
          </button>
        </div>

        <div className="ui-modal-body">
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-3">
              <span className="ui-badge">{result.ticketNumber}</span>
              <span className={result.drawStatus === "draft" ? "ui-badge-warning" : "ui-badge-success"}>
                {result.drawStatus === "draft" ? messages.checkerDrawStatusDraft : messages.checkerDrawStatusPublished}
              </span>
            </div>

            <p className={result.checkStatus === "partial" ? "ui-inline-error" : "ui-inline-info"}>
              {result.checkStatus === "partial" ? messages.checkerPartialSummary : messages.checkerCompleteSummary}
            </p>

            <div className="ui-panel-muted rounded-2xl p-4">
              <div className="ui-kicker">{messages.checkerTotalWinningAmount}</div>
              <div className="mt-2 text-2xl font-semibold text-[var(--text-primary)]">
                {formatBaht(locale, result.totalWinningAmount)}
              </div>
            </div>

            {result.matches.length > 0 ? (
              <div className="space-y-3">
                <p className="ui-kicker">{messages.checkerMatches}</p>
                <div className="ui-checker-match-list">
                  {result.matches.map((match) => (
                    <article
                      className="ui-panel-muted rounded-2xl p-4"
                      key={`${match.prizeType}-${match.matchKind}-${match.matchedNumber}`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <h3 className="font-semibold text-[var(--text-primary)]">{messages.prizeLabels[match.prizeType]}</h3>
                          <p className="ui-kicker mt-1">{messages.checkerMatchKinds[match.matchKind]}</p>
                        </div>
                        <div className="text-right">
                          <div className="font-semibold text-[var(--text-primary)]">{formatBaht(locale, match.prizeAmount)}</div>
                          <div className="ui-number-compact mt-1 text-sm text-[var(--text-secondary)]">{match.matchedNumber}</div>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              </div>
            ) : (
              <p className="ui-inline-info">{messages.checkerNoMatch}</p>
            )}

            <CheckerCoverageDetails locale={locale} messages={messages} result={result} />
          </div>
        </div>
      </aside>
    </div>
  );
}

function GroupList({
  variant = "checked",
  label,
  locale,
  messages,
  prizeTypes
}: {
  variant?: "checked" | "unchecked";
  label: string;
  locale: SupportedLocale;
  messages: ResultsMessages;
  prizeTypes: CheckerCheckResponse["checkedPrizeTypes"];
}) {
  if (prizeTypes.length === 0) {
    return null;
  }

  return (
    <div className="space-y-2">
      <p className="ui-kicker">{label}</p>
      <div className="ui-checker-group-list">
        {prizeTypes.map((prizeType) => (
          <span className={`ui-checker-group-token ui-checker-group-token-${variant}`} key={prizeType}>
            {messages.prizeLabels[prizeType]} · {formatBaht(locale, prizeTypeMetadataByType[prizeType].prizeAmount)}
          </span>
        ))}
      </div>
    </div>
  );
}

function CheckerCoverageDetails({
  locale,
  messages,
  result
}: {
  locale: SupportedLocale;
  messages: ResultsMessages;
  result: CheckerCheckResponse;
}) {
  const hasUncheckedGroups = result.uncheckedPrizeTypes.length > 0;
  const hasAnyGroups = result.checkedPrizeTypes.length > 0 || hasUncheckedGroups;

  if (!hasAnyGroups) {
    return null;
  }

  const coverageSummary =
    result.checkStatus === "partial"
      ? formatCoverageSummary(
          messages.checkerCoveragePartial,
          result.checkedPrizeTypes.length,
          result.uncheckedPrizeTypes.length
        )
      : messages.checkerCoverageComplete;

  return (
    <div className="space-y-3">
      <p className="ui-checker-coverage-summary">{coverageSummary}</p>
      <details className="ui-checker-groups-details">
        <summary className="ui-checker-groups-summary">
          <span className="ui-kicker">{messages.checkerGroupDetails}</span>
          <span aria-hidden="true" className="ui-checker-groups-summary-icon">
            <ChevronDown size={16} strokeWidth={2} />
          </span>
        </summary>
        <div className="ui-checker-groups-panel">
          <GroupList label={messages.checkerCheckedGroups} locale={locale} messages={messages} prizeTypes={result.checkedPrizeTypes} />
          <GroupList
            label={messages.checkerUncheckedGroups}
            locale={locale}
            messages={messages}
            prizeTypes={result.uncheckedPrizeTypes}
            variant="unchecked"
          />
        </div>
      </details>
    </div>
  );
}

function formatBaht(locale: SupportedLocale | "en", value: number) {
  const intlLocale = locale === "en" ? "en-GB" : toIntlLocale(locale);
  return new Intl.NumberFormat(intlLocale, {
    style: "currency",
    currency: "THB",
    maximumFractionDigits: 0
  }).format(value);
}

function formatCoverageSummary(template: string, checkedCount: number, uncheckedCount: number) {
  return template
    .replace("{checkedCount}", checkedCount.toString())
    .replace("{uncheckedCount}", uncheckedCount.toString());
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
