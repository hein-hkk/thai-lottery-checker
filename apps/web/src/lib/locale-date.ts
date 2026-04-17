import type { SupportedLocale } from "@thai-lottery-checker/types";

const bangkokDateTimeFormatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: "Asia/Bangkok",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  hour12: false
});

const englishMonthsLong = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December"
];

const englishMonthsShort = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const thaiMonthsLong = [
  "มกราคม",
  "กุมภาพันธ์",
  "มีนาคม",
  "เมษายน",
  "พฤษภาคม",
  "มิถุนายน",
  "กรกฎาคม",
  "สิงหาคม",
  "กันยายน",
  "ตุลาคม",
  "พฤศจิกายน",
  "ธันวาคม"
];

const thaiMonthsShort = ["ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."];

const myanmarMonthsLong = [
  "ဇန်နဝါရီ",
  "ဖေဖော်ဝါရီ",
  "မတ်",
  "ဧပြီ",
  "မေ",
  "ဇွန်",
  "ဇူလိုင်",
  "ဩဂုတ်",
  "စက်တင်ဘာ",
  "အောက်တိုဘာ",
  "နိုဝင်ဘာ",
  "ဒီဇင်ဘာ"
];

const myanmarMonthsShort = ["ဇန်", "ဖေ", "မတ်", "ဧပြီ", "မေ", "ဇွန်", "ဇူ", "ဩ", "စက်", "အောက်", "နို", "ဒီ"];

const myanmarDigits = ["၀", "၁", "၂", "၃", "၄", "၅", "၆", "၇", "၈", "၉"];

export function formatLongDate(locale: SupportedLocale, value: string): string {
  const { year, month, day } = parseDateOnly(value);
  return formatLocalizedDate(locale, { year, month, day }, "long");
}

export function formatBangkokTime(locale: SupportedLocale, value: string): string {
  const { hour, minute } = getBangkokDateTimeParts(value);
  return localizeDigits(locale, `${hour}:${minute}`);
}

export function formatBangkokDateTime(locale: SupportedLocale, value: string): string {
  const { year, month, day, hour, minute } = getBangkokDateTimeParts(value);
  const dateLabel = formatLocalizedDate(locale, { year, month, day }, "short");
  const timeLabel = localizeDigits(locale, `${hour}:${minute}`);

  return locale === "my" ? `${dateLabel}၊ ${timeLabel}` : `${dateLabel}, ${timeLabel}`;
}

export function formatHistoryDayLabel(locale: SupportedLocale, drawDate: string): string {
  const { day } = parseDateOnly(drawDate);
  return localizeDigits(locale, String(day).padStart(2, "0"));
}

export function formatHistoryMonthLabel(locale: SupportedLocale, drawDate: string): string {
  const { month } = parseDateOnly(drawDate);
  return getMonthName(locale, month, "short");
}

function formatLocalizedDate(
  locale: SupportedLocale,
  parts: { year: number; month: number; day: number },
  width: "long" | "short"
): string {
  const monthLabel = getMonthName(locale, parts.month, width);
  const yearValue = locale === "th" ? parts.year + 543 : parts.year;
  const yearLabel = localizeDigits(locale, String(yearValue));
  const dayLabel = localizeDigits(locale, String(parts.day));

  if (locale === "my") {
    return `${yearLabel} ${monthLabel} ${dayLabel}`;
  }

  return `${dayLabel} ${monthLabel} ${yearLabel}`;
}

function getMonthName(locale: SupportedLocale, month: number, width: "long" | "short"): string {
  const index = month - 1;

  switch (locale) {
    case "th":
      return width === "long" ? thaiMonthsLong[index] ?? "" : thaiMonthsShort[index] ?? "";
    case "my":
      return width === "long" ? myanmarMonthsLong[index] ?? "" : myanmarMonthsShort[index] ?? "";
    case "en":
    default:
      return width === "long" ? englishMonthsLong[index] ?? "" : englishMonthsShort[index] ?? "";
  }
}

function parseDateOnly(value: string): { year: number; month: number; day: number } {
  const [year, month, day] = value.slice(0, 10).split("-").map((part) => Number(part));

  if (!Number.isInteger(year) || !Number.isInteger(month) || !Number.isInteger(day)) {
    throw new Error(`Invalid date value: ${value}`);
  }

  return { year, month, day };
}

function getBangkokDateTimeParts(value: string): {
  year: number;
  month: number;
  day: number;
  hour: string;
  minute: string;
} {
  const parts = bangkokDateTimeFormatter.formatToParts(new Date(value));
  const year = Number(parts.find((part) => part.type === "year")?.value);
  const month = Number(parts.find((part) => part.type === "month")?.value);
  const day = Number(parts.find((part) => part.type === "day")?.value);
  const hour = parts.find((part) => part.type === "hour")?.value;
  const minute = parts.find((part) => part.type === "minute")?.value;

  if (!Number.isInteger(year) || !Number.isInteger(month) || !Number.isInteger(day) || !hour || !minute) {
    throw new Error(`Invalid date time value: ${value}`);
  }

  return { year, month, day, hour, minute };
}

function localizeDigits(locale: SupportedLocale, value: string): string {
  if (locale !== "my") {
    return value;
  }

  return value.replace(/\d/g, (digit) => myanmarDigits[Number(digit)] ?? digit);
}
