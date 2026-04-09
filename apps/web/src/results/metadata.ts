import type { Metadata } from "next";
import type { ResultDetailResponse, SupportedLocale } from "@thai-lottery-checker/types";
import type { ResultsMessages } from "@thai-lottery-checker/i18n";
import { getPublicEnv } from "../config/env";
import { formatLongDate } from "../lib/locale-date";

export function getLandingMetadata(locale: SupportedLocale, messages: ResultsMessages): Metadata {
  return {
    title: messages.officialLatestResultsTitle,
    description: messages.officialLatestResultsDescription,
    alternates: {
      canonical: `${getPublicEnv().appUrl}/${locale}`
    }
  };
}

export function getLatestResultsMetadata(locale: SupportedLocale, messages: ResultsMessages): Metadata {
  return {
    title: messages.officialLatestResultsTitle,
    description: messages.officialLatestResultsDescription,
    alternates: {
      canonical: `${getPublicEnv().appUrl}/${locale}/results`
    }
  };
}

export function getResultDetailMetadata(
  locale: SupportedLocale,
  detail: ResultDetailResponse,
  messages: ResultsMessages
): Metadata {
  const formattedDate = formatLongDate(locale, detail.drawDate);

  return {
    title: `${messages.officialResultTitle} - ${formattedDate}`,
    description: buildResultDetailDescription(locale, formattedDate),
    alternates: {
      canonical: `${getPublicEnv().appUrl}/${locale}/results/${detail.drawDate}`
    }
  };
}

function buildResultDetailDescription(locale: SupportedLocale, formattedDate: string): string {
  switch (locale) {
    case "th":
      return `ดูผลสลากกินแบ่งรัฐบาลอย่างเป็นทางการสำหรับงวดวันที่ ${formattedDate} พร้อมหมายเลขรางวัลและรายละเอียดการออกรางวัล`;
    case "my":
      return `${formattedDate} အတွက် တရားဝင် ထိုင်းထီရလဒ်၊ ဆုနံပါတ်များနှင့် အကြိမ်အကြောင်းအရာ အသေးစိတ်ကို ကြည့်ရှုပါ။`;
    case "en":
    default:
      return `View the official Thai lottery result for ${formattedDate}, including published prize numbers and draw details.`;
  }
}
