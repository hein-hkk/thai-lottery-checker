"use client";

import type { ResultsMessages } from "@thai-lottery-checker/i18n";
import type {
  CheckerDrawOption,
  PublishStatus,
  SupportedLocale
} from "@thai-lottery-checker/types";
import { Check, ChevronDown } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useId, useRef, useState, type FormEvent } from "react";
import { getCheckerDrawOptions, ResultsApiError } from "../../results/api";

interface EmbeddedCheckerProps {
  defaultDrawDate: string;
  defaultDrawStatus: PublishStatus;
  locale: SupportedLocale;
  messages: ResultsMessages;
}

export function EmbeddedChecker({
  defaultDrawDate,
  defaultDrawStatus,
  locale,
  messages
}: EmbeddedCheckerProps) {
  const router = useRouter();
  const [selectedDrawDate, setSelectedDrawDate] = useState(defaultDrawDate);
  const [selectedDrawStatus, setSelectedDrawStatus] = useState<PublishStatus>(defaultDrawStatus);
  const [ticketNumber, setTicketNumber] = useState("");
  const [isNavigating, setIsNavigating] = useState(false);
  const [isLoadingDraws, setIsLoadingDraws] = useState(false);
  const [isDrawMenuOpen, setIsDrawMenuOpen] = useState(false);
  const [drawOptions, setDrawOptions] = useState<CheckerDrawOption[] | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const drawMenuRef = useRef<HTMLDivElement>(null);
  const drawMenuId = useId();

  const availableDrawOptions =
    drawOptions ?? [{ drawDate: defaultDrawDate, drawStatus: defaultDrawStatus satisfies PublishStatus }];

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage(null);
    const normalizedTicketNumber = ticketNumber.trim();

    if (!/^\d{6}$/.test(normalizedTicketNumber)) {
      setErrorMessage(messages.checkerTicketInvalid);
      return;
    }

    try {
      setIsNavigating(true);
      router.push(`/${locale}/results/${selectedDrawDate}?checker=1&ticket=${normalizedTicketNumber}`, {
        scroll: false
      });
    } finally {
      setIsNavigating(false);
    }
  }

  async function ensureDrawOptionsLoaded() {
    if (drawOptions !== null || isLoadingDraws) {
      return;
    }

    setIsLoadingDraws(true);
    setErrorMessage(null);

    try {
      const response = await getCheckerDrawOptions();
      setDrawOptions(response.items);
    } catch (error) {
      setErrorMessage(error instanceof ResultsApiError ? error.message : "Failed to load draw options");
    } finally {
      setIsLoadingDraws(false);
    }
  }

  function handleSelectDraw(drawDate: string) {
    const nextDraw = drawOptions?.find((item) => item.drawDate === drawDate);
    setSelectedDrawDate(drawDate);
    setSelectedDrawStatus(nextDraw?.drawStatus ?? "published");
    setIsDrawMenuOpen(false);
  }

  async function handleToggleDrawMenu() {
    if (!isDrawMenuOpen) {
      await ensureDrawOptionsLoaded();
    }

    setIsDrawMenuOpen((current) => !current);
  }

  useEffect(() => {
    if (!isDrawMenuOpen) {
      return;
    }

    function handlePointerDown(event: MouseEvent) {
      if (!drawMenuRef.current?.contains(event.target as Node)) {
        setIsDrawMenuOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsDrawMenuOpen(false);
      }
    }

    window.addEventListener("mousedown", handlePointerDown);
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("mousedown", handlePointerDown);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isDrawMenuOpen]);

  return (
    <aside className="ui-panel ui-checker-panel">
      <div className="ui-checker-stack">
        <div className="ui-checker-header">
          <h2 className="ui-checker-title">{messages.checkerTitle}</h2>
          <span className={selectedDrawStatus === "draft" ? "ui-badge-warning" : "ui-badge-success"}>
            {selectedDrawStatus === "draft" ? messages.checkerDrawStatusDraft : messages.checkerDrawStatusPublished}
          </span>
        </div>

        <form className="ui-checker-form" onSubmit={handleSubmit}>
          <label className="ui-field">
            <span className="ui-field-label">{messages.checkerDateLabel}</span>
            <div className="ui-checker-date-select-wrap" ref={drawMenuRef}>
              <button
                aria-controls={drawMenuId}
                aria-expanded={isDrawMenuOpen}
                aria-haspopup="listbox"
                className="ui-checker-date-trigger"
                onClick={() => void handleToggleDrawMenu()}
                type="button"
              >
                <span className="ui-checker-date-display">{formatLongDate(locale, selectedDrawDate)}</span>
                <span aria-hidden="true" className="ui-checker-date-icon">
                  <ChevronDown size={18} strokeWidth={2} />
                </span>
              </button>
              {isDrawMenuOpen ? (
                <div aria-label={messages.checkerDateLabel} className="ui-checker-date-menu" id={drawMenuId} role="listbox">
                  {availableDrawOptions.map((option) => {
                    const isSelected = option.drawDate === selectedDrawDate;

                    return (
                      <button
                        aria-selected={isSelected}
                        className={`ui-checker-date-option ${isSelected ? "ui-checker-date-option-active" : ""}`}
                        key={option.drawDate}
                        onClick={() => handleSelectDraw(option.drawDate)}
                        role="option"
                        type="button"
                      >
                        <span className="ui-checker-date-option-label">
                          {formatLongDate(locale, option.drawDate)}
                          {option.drawStatus === "draft" ? ` (${messages.checkerDrawStatusDraft})` : ""}
                        </span>
                        {isSelected ? (
                          <span aria-hidden="true" className="ui-checker-date-option-icon">
                            <Check size={16} strokeWidth={2} />
                          </span>
                        ) : null}
                      </button>
                    );
                  })}
                </div>
              ) : null}
            </div>
            {isLoadingDraws ? <p className="ui-inline-info ui-checker-inline-note">{messages.checkerDrawLoading}</p> : null}
          </label>

          <label className="ui-field">
            <span className="ui-field-label">{messages.checkerTicketLabel}</span>
            <input
              className="ui-input ui-number-compact ui-checker-input-compact"
              inputMode="numeric"
              maxLength={6}
              onChange={(event) => {
                setTicketNumber(event.target.value.replace(/\D+/g, "").slice(0, 6));
                setErrorMessage(null);
              }}
              placeholder={messages.checkerTicketPlaceholder}
              required
              value={ticketNumber}
            />
          </label>

          {errorMessage ? <p className="ui-inline-error ui-checker-inline-note">{errorMessage}</p> : null}

          <button className="ui-button-primary ui-checker-submit" disabled={isNavigating} type="submit">
            {isNavigating ? messages.checkerSubmitting : messages.checkerSubmit}
          </button>
        </form>
      </div>
    </aside>
  );
}

function formatLongDate(locale: SupportedLocale, value: string) {
  return new Intl.DateTimeFormat(toIntlLocale(locale), {
    day: "numeric",
    month: "long",
    year: "numeric"
  }).format(new Date(`${value}T12:00:00Z`));
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
