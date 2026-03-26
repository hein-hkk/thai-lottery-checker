"use client";

import Image from "next/image";
import { getLocaleLabel, supportedLocales } from "@thai-lottery-checker/i18n";
import type { SupportedLocale } from "@thai-lottery-checker/types";
import { Check, ChevronDown } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

const localeFlags: Record<SupportedLocale, { src: string }> = {
  en: { src: "/flags/flag-en.svg" },
  my: { src: "/flags/flag-my.svg" },
  th: { src: "/flags/flag-th.svg" }
};

export function LocaleSwitcher({
  compact = false,
  label,
  locale
}: {
  compact?: boolean;
  label: string;
  locale: SupportedLocale;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  function handleLocaleChange(nextLocale: string) {
    if (!pathname) {
      return;
    }

    const segments = pathname.split("/");
    segments[1] = nextLocale;

    const query = searchParams.toString();
    router.push(query.length > 0 ? `${segments.join("/")}?${query}` : segments.join("/"));
    setIsOpen(false);
  }

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    function handlePointerDown(event: MouseEvent) {
      if (!wrapperRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    }

    window.addEventListener("mousedown", handlePointerDown);
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("mousedown", handlePointerDown);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  return (
    <div className="ui-locale-menu" ref={wrapperRef}>
      <button
        aria-expanded={isOpen}
        aria-haspopup="menu"
        aria-label={`${label}: ${getLocaleLabel(locale)}`}
        className={`ui-button-secondary ui-header-control ui-locale-trigger ${compact ? "ui-locale-trigger-compact" : ""}`}
        onClick={() => setIsOpen((current) => !current)}
        type="button"
      >
        <span aria-hidden="true" className="ui-locale-flag">
          <Image alt="" height={16} src={localeFlags[locale].src} width={20} />
        </span>
        {!compact ? <span>{getLocaleLabel(locale)}</span> : null}
        {!compact ? (
          <span aria-hidden="true" className="ui-header-select-icon">
            <ChevronDown />
          </span>
        ) : null}
      </button>

      {isOpen ? (
        <div aria-label={label} className="ui-locale-popover" role="menu">
          {supportedLocales.map((supportedLocale) => (
            <button
              aria-checked={supportedLocale === locale}
              className={`ui-locale-option ${supportedLocale === locale ? "ui-locale-option-active" : ""}`}
              key={supportedLocale}
              onClick={() => handleLocaleChange(supportedLocale)}
              role="menuitemradio"
              type="button"
            >
              <span aria-hidden="true" className="ui-locale-flag">
                <Image alt="" height={16} src={localeFlags[supportedLocale].src} width={20} />
              </span>
              <span>{getLocaleLabel(supportedLocale)}</span>
              {supportedLocale === locale ? (
                <span aria-hidden="true" className="ui-locale-option-icon">
                  <Check />
                </span>
              ) : null}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
