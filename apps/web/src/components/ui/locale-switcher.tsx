"use client";

import { getLocaleLabel, supportedLocales } from "@thai-lottery-checker/i18n";
import type { SupportedLocale } from "@thai-lottery-checker/types";
import { ChevronDown } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

export function LocaleSwitcher({ label, locale }: { label: string; locale: SupportedLocale }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function handleLocaleChange(nextLocale: string) {
    if (!pathname) {
      return;
    }

    const segments = pathname.split("/");
    segments[1] = nextLocale;

    const query = searchParams.toString();
    router.push(query.length > 0 ? `${segments.join("/")}?${query}` : segments.join("/"));
  }

  return (
    <label className="ui-header-select-wrap">
      <span className="sr-only">{label}</span>
      <select className="ui-select ui-header-select" onChange={(event) => handleLocaleChange(event.target.value)} value={locale}>
        {supportedLocales.map((supportedLocale) => (
          <option key={supportedLocale} value={supportedLocale}>
            {getLocaleLabel(supportedLocale)}
          </option>
        ))}
      </select>
      <span aria-hidden="true" className="ui-header-select-icon">
        <ChevronDown />
      </span>
    </label>
  );
}
