import type { PrizeType, SupportedLocale } from "@thai-lottery-checker/types";

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

export interface ResultsMessages {
  home: string;
  latestResults: string;
  officialLatestResultsTitle: string;
  officialLatestResultsDescription: string;
  resultHistory: string;
  drawDetail: string;
  officialResultTitle: string;
  drawDate: string;
  drawCode: string;
  publishedAt: string;
  pendingPublication: string;
  currentLocale: string;
  defaultLocale: string;
  viewHistory: string;
  viewDetail: string;
  backToHistory: string;
  browseLatest: string;
  latestUnavailable: string;
  historyUnavailable: string;
  detailUnavailable: string;
  noResults: string;
  noHistory: string;
  previousPage: string;
  nextPage: string;
  page: string;
  language: string;
  theme: string;
  lightMode: string;
  darkMode: string;
  checkerTitle: string;
  checkerDateLabel: string;
  checkerTicketLabel: string;
  checkerTicketPlaceholder: string;
  checkerChangeDraw: string;
  checkerDrawLoading: string;
  checkerSelectDraw: string;
  checkerSubmit: string;
  checkerSubmitting: string;
  checkerResultsTitle: string;
  checkerClose: string;
  checkerResultFor: string;
  checkerDrawStatusDraft: string;
  checkerDrawStatusPublished: string;
  checkerPartialSummary: string;
  checkerCompleteSummary: string;
  checkerNoMatch: string;
  checkerTicketInvalid: string;
  checkerCheckedGroups: string;
  checkerUncheckedGroups: string;
  checkerTotalWinningAmount: string;
  checkerMatches: string;
  checkerMatchKinds: Record<"exact" | "front3" | "last3" | "last2", string>;
  prizeLabels: Record<PrizeType, string>;
}

const resultsMessagesByLocale: Record<SupportedLocale, ResultsMessages> = {
  en: {
    home: "Home",
    latestResults: "Latest results",
    officialLatestResultsTitle: "Official Latest Thai Lottery Result",
    officialLatestResultsDescription:
      "View the latest official Thai lottery result with the draw date, publish time, and key prize numbers in one trusted update.",
    resultHistory: "Result history",
    drawDetail: "Draw detail",
    officialResultTitle: "Official Thai Lottery Result",
    drawDate: "Draw date",
    drawCode: "Draw code",
    publishedAt: "Published at",
    pendingPublication: "Not yet published",
    currentLocale: "Current locale",
    defaultLocale: "Default locale",
    viewHistory: "View history",
    viewDetail: "View detail",
    backToHistory: "Back to history",
    browseLatest: "Browse latest results",
    latestUnavailable: "Latest results are temporarily unavailable.",
    historyUnavailable: "Result history is temporarily unavailable.",
    detailUnavailable: "This result detail is temporarily unavailable.",
    noResults: "No published results are available yet.",
    noHistory: "No published draw history is available yet.",
    previousPage: "Previous",
    nextPage: "Next",
    page: "Page",
    language: "Language",
    theme: "Theme",
    lightMode: "Light",
    darkMode: "Dark",
    checkerTitle: "Check lottery results",
    checkerDateLabel: "Draw date",
    checkerTicketLabel: "Lottery number",
    checkerTicketPlaceholder: "Enter 6-digit lottery number",
    checkerChangeDraw: "Change draw",
    checkerDrawLoading: "Loading draw dates...",
    checkerSelectDraw: "Select draw date",
    checkerSubmit: "Check lottery",
    checkerSubmitting: "Checking...",
    checkerResultsTitle: "Checker result",
    checkerClose: "Close checker result",
    checkerResultFor: "Result for",
    checkerDrawStatusDraft: "Draft",
    checkerDrawStatusPublished: "Published",
    checkerPartialSummary: "Partial check only. Unreleased prize groups are still pending.",
    checkerCompleteSummary: "Complete check across all public prize groups.",
    checkerNoMatch: "No winning match found in the checked prize groups.",
    checkerTicketInvalid: "Please enter a valid 6-digit lottery number.",
    checkerCheckedGroups: "Checked prize groups",
    checkerUncheckedGroups: "Unchecked prize groups",
    checkerTotalWinningAmount: "Total winning amount",
    checkerMatches: "Winning matches",
    checkerMatchKinds: {
      exact: "Exact match",
      front3: "Front 3 digits",
      last3: "Last 3 digits",
      last2: "Last 2 digits"
    },
    prizeLabels: {
      FIRST_PRIZE: "First prize",
      NEAR_FIRST_PRIZE: "Near first prize",
      SECOND_PRIZE: "Second prize",
      THIRD_PRIZE: "Third prize",
      FOURTH_PRIZE: "Fourth prize",
      FIFTH_PRIZE: "Fifth prize",
      FRONT_THREE: "Front three",
      LAST_THREE: "Last three",
      LAST_TWO: "Last two"
    }
  },
  th: {
    home: "หน้าหลัก",
    latestResults: "ผลรางวัลล่าสุด",
    officialLatestResultsTitle: "ผลสลากกินแบ่งรัฐบาลงวดล่าสุดอย่างเป็นทางการ",
    officialLatestResultsDescription:
      "ดูผลสลากกินแบ่งรัฐบาลงวดล่าสุดอย่างเป็นทางการ พร้อมวันที่ออกรางวัล เวลาเผยแพร่ และหมายเลขรางวัลสำคัญในหน้าเดียว",
    resultHistory: "ประวัติผลรางวัล",
    drawDetail: "รายละเอียดงวด",
    officialResultTitle: "ผลสลากกินแบ่งรัฐบาลอย่างเป็นทางการ",
    drawDate: "วันที่ออกรางวัล",
    drawCode: "รหัสงวด",
    publishedAt: "เผยแพร่เมื่อ",
    pendingPublication: "ยังไม่เผยแพร่",
    currentLocale: "ภาษาปัจจุบัน",
    defaultLocale: "ภาษาเริ่มต้น",
    viewHistory: "ดูประวัติผลรางวัล",
    viewDetail: "ดูรายละเอียด",
    backToHistory: "กลับไปประวัติผลรางวัล",
    browseLatest: "ดูผลรางวัลล่าสุด",
    latestUnavailable: "ยังไม่สามารถแสดงผลรางวัลล่าสุดได้ในขณะนี้",
    historyUnavailable: "ยังไม่สามารถแสดงประวัติผลรางวัลได้ในขณะนี้",
    detailUnavailable: "ยังไม่สามารถแสดงรายละเอียดผลรางวัลงวดนี้ได้ในขณะนี้",
    noResults: "ยังไม่มีผลรางวัลที่เผยแพร่",
    noHistory: "ยังไม่มีประวัติผลรางวัลที่เผยแพร่",
    previousPage: "ก่อนหน้า",
    nextPage: "ถัดไป",
    page: "หน้า",
    language: "ภาษา",
    theme: "ธีม",
    lightMode: "สว่าง",
    darkMode: "มืด",
    checkerTitle: "ตรวจผลสลากกินแบ่ง",
    checkerDateLabel: "งวดวันที่",
    checkerTicketLabel: "เลขสลาก",
    checkerTicketPlaceholder: "กรอกเลขสลาก 6 หลัก",
    checkerChangeDraw: "เปลี่ยนงวด",
    checkerDrawLoading: "กำลังโหลดงวด...",
    checkerSelectDraw: "เลือกงวดวันที่",
    checkerSubmit: "ตรวจลอตเตอรี่",
    checkerSubmitting: "กำลังตรวจ...",
    checkerResultsTitle: "ผลการตรวจ",
    checkerClose: "ปิดผลการตรวจ",
    checkerResultFor: "ผลสำหรับงวด",
    checkerDrawStatusDraft: "ฉบับร่าง",
    checkerDrawStatusPublished: "เผยแพร่แล้ว",
    checkerPartialSummary: "เป็นการตรวจแบบบางส่วนเท่านั้น กลุ่มรางวัลที่ยังไม่เผยแพร่ยังรอตรวจอยู่",
    checkerCompleteSummary: "ตรวจครบทุกกลุ่มรางวัลสาธารณะแล้ว",
    checkerNoMatch: "ยังไม่พบถูกรางวัลในกลุ่มรางวัลที่ตรวจได้ตอนนี้",
    checkerTicketInvalid: "กรุณากรอกเลขสลาก 6 หลักให้ถูกต้อง",
    checkerCheckedGroups: "กลุ่มรางวัลที่ตรวจแล้ว",
    checkerUncheckedGroups: "กลุ่มรางวัลที่ยังไม่ตรวจ",
    checkerTotalWinningAmount: "ยอดเงินรางวัลรวม",
    checkerMatches: "รายการที่ถูกรางวัล",
    checkerMatchKinds: {
      exact: "ตรงทั้ง 6 หลัก",
      front3: "เลขหน้า 3 ตัว",
      last3: "เลขท้าย 3 ตัว",
      last2: "เลขท้าย 2 ตัว"
    },
    prizeLabels: {
      FIRST_PRIZE: "รางวัลที่ 1",
      NEAR_FIRST_PRIZE: "รางวัลข้างเคียงรางวัลที่ 1",
      SECOND_PRIZE: "รางวัลที่ 2",
      THIRD_PRIZE: "รางวัลที่ 3",
      FOURTH_PRIZE: "รางวัลที่ 4",
      FIFTH_PRIZE: "รางวัลที่ 5",
      FRONT_THREE: "เลขหน้า 3 ตัว",
      LAST_THREE: "เลขท้าย 3 ตัว",
      LAST_TWO: "เลขท้าย 2 ตัว"
    }
  },
  my: {
    home: "ပင်မစာမျက်နှာ",
    latestResults: "နောက်ဆုံးထွက်အောင်ဘာသာရလဒ်",
    officialLatestResultsTitle: "နောက်ဆုံး ထိုင်းထီတရားဝင်ရလဒ်",
    officialLatestResultsDescription:
      "နောက်ဆုံး ထိုင်းထီတရားဝင်ရလဒ်ကို ထီဖွင့်သည့်နေ့၊ ထုတ်ပြန်ချိန်နှင့် အဓိကဆုနံပါတ်များအပါအဝင် တစ်နေရာတည်းတွင် ကြည့်ရှုနိုင်ပါသည်။",
    resultHistory: "ရလဒ်မှတ်တမ်း",
    drawDetail: "အကြိမ်အသေးစိတ်",
    officialResultTitle: "တရားဝင် ထိုင်းထီရလဒ်",
    drawDate: "ထွက်သည့်နေ့",
    drawCode: "အကြိမ်ကုဒ်",
    publishedAt: "ထုတ်ပြန်ချိန်",
    pendingPublication: "မထုတ်ပြန်ရသေးပါ",
    currentLocale: "လက်ရှိဘာသာ",
    defaultLocale: "မူလဘာသာ",
    viewHistory: "ရလဒ်မှတ်တမ်းကြည့်ရန်",
    viewDetail: "အသေးစိတ်ကြည့်ရန်",
    backToHistory: "မှတ်တမ်းသို့ပြန်ရန်",
    browseLatest: "နောက်ဆုံးရလဒ်ကြည့်ရန်",
    latestUnavailable: "နောက်ဆုံးရလဒ်ကို ယာယီမပြနိုင်သေးပါ",
    historyUnavailable: "ရလဒ်မှတ်တမ်းကို ယာယီမပြနိုင်သေးပါ",
    detailUnavailable: "ဤအကြိမ်ရလဒ်အသေးစိတ်ကို ယာယီမပြနိုင်သေးပါ",
    noResults: "ထုတ်ပြန်ထားသော ရလဒ်မရှိသေးပါ",
    noHistory: "ထုတ်ပြန်ထားသော ရလဒ်မှတ်တမ်းမရှိသေးပါ",
    previousPage: "ရှေ့",
    nextPage: "နောက်",
    page: "စာမျက်နှာ",
    language: "ဘာသာစကား",
    theme: "အပြင်အဆင်",
    lightMode: "အလင်း",
    darkMode: "အမှောင်",
    checkerTitle: "ထီရလဒ်စစ်ရန်",
    checkerDateLabel: "အကြိမ်နေ့စွဲ",
    checkerTicketLabel: "ထီနံပါတ်",
    checkerTicketPlaceholder: "၆ လုံးထီနံပါတ်ထည့်ပါ",
    checkerChangeDraw: "အကြိမ်ပြောင်းရန်",
    checkerDrawLoading: "အကြိမ်များကို ဖွင့်နေသည်...",
    checkerSelectDraw: "အကြိမ်နေ့စွဲရွေးပါ",
    checkerSubmit: "ထီစစ်ရန်",
    checkerSubmitting: "စစ်နေသည်...",
    checkerResultsTitle: "စစ်ဆေးမှုရလဒ်",
    checkerClose: "စစ်ဆေးမှုရလဒ် ပိတ်ရန်",
    checkerResultFor: "ဤအကြိမ်အတွက် ရလဒ်",
    checkerDrawStatusDraft: "မူကြမ်း",
    checkerDrawStatusPublished: "ထုတ်ပြန်ပြီး",
    checkerPartialSummary: "တစ်စိတ်တစ်ပိုင်းသာ စစ်ဆေးထားပါသည်။ မထုတ်ပြန်ရသေးသော ဆုအုပ်စုများ ကျန်ရှိနေသေးသည်။",
    checkerCompleteSummary: "အများပြည်သူမြင်နိုင်သော ဆုအုပ်စုအားလုံး စစ်ဆေးပြီးပါပြီ။",
    checkerNoMatch: "လက်ရှိစစ်ဆေးနိုင်သော ဆုအုပ်စုများတွင် မကိုက်ညီပါ။",
    checkerTicketInvalid: "မှန်ကန်သော ၆ လုံးထီနံပါတ်ကို ထည့်ပါ။",
    checkerCheckedGroups: "စစ်ဆေးပြီး ဆုအုပ်စုများ",
    checkerUncheckedGroups: "မစစ်ဆေးရသေးသော ဆုအုပ်စုများ",
    checkerTotalWinningAmount: "စုစုပေါင်းဆုကြေး",
    checkerMatches: "ကိုက်ညီသော ဆုများ",
    checkerMatchKinds: {
      exact: "အတိအကျကိုက်ညီ",
      front3: "ရှေ့ ၃ လုံး",
      last3: "နောက် ၃ လုံး",
      last2: "နောက် ၂ လုံး"
    },
    prizeLabels: {
      FIRST_PRIZE: "ပထမဆု",
      NEAR_FIRST_PRIZE: "ပထမဆုဘေးချင်းကပ်ဆု",
      SECOND_PRIZE: "ဒုတိယဆု",
      THIRD_PRIZE: "တတိယဆု",
      FOURTH_PRIZE: "စတုတ္ထဆု",
      FIFTH_PRIZE: "ပဉ္စမဆု",
      FRONT_THREE: "ရှေ့သုံးလုံး",
      LAST_THREE: "နောက်သုံးလုံး",
      LAST_TWO: "နောက်နှစ်လုံး"
    }
  }
};

export function getResultsMessages(locale: SupportedLocale): ResultsMessages {
  return resultsMessagesByLocale[locale];
}
