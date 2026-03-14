import type { SupportedLocale } from "@thai-lottery-checker/types";

export const supportedLocales = ["en", "th", "my"] as const satisfies readonly SupportedLocale[];

export const defaultLocale: SupportedLocale = "en";

export function isSupportedLocale(value: string): value is SupportedLocale {
  return supportedLocales.includes(value as SupportedLocale);
}

export function getLocaleLabel(locale: SupportedLocale): string {
  switch (locale) {
    case "th":
      return "Thai";
    case "my":
      return "Myanmar";
    case "en":
    default:
      return "English";
  }
}

