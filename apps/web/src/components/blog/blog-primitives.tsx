import type { SupportedLocale } from "@thai-lottery-checker/types";

export function formatBlogPublishedAt(locale: SupportedLocale, value: string): string {
  return new Intl.DateTimeFormat(toIntlLocale(locale), {
    dateStyle: "medium",
    timeStyle: "short"
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
