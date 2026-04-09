import type { SupportedLocale } from "@thai-lottery-checker/types";
import { formatBangkokDateTime } from "../../lib/locale-date";

export function formatBlogPublishedAt(locale: SupportedLocale, value: string): string {
  return formatBangkokDateTime(locale, value);
}
