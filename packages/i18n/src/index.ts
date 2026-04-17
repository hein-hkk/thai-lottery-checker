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
  blog: string;
  footerCopyright: string;
  officialLatestResultsTitle: string;
  officialLatestResultsDescription: string;
  resultHistory: string;
  homeBlogTeasersTitle: string;
  homeBlogTeasersDescription: string;
  blogListTitle: string;
  blogListDescription: string;
  blogDetailDescriptionFallback: string;
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
  browseBlog: string;
  latestUnavailable: string;
  historyUnavailable: string;
  detailUnavailable: string;
  noResults: string;
  noHistory: string;
  noBlogPosts: string;
  blogListUnavailable: string;
  blogDetailUnavailable: string;
  previousPage: string;
  nextPage: string;
  page: string;
  readArticle: string;
  backToBlog: string;
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
  checkerGroupDetails: string;
  checkerCoverageComplete: string;
  checkerCoveragePartial: string;
  checkerTotalWinningAmount: string;
  checkerMatches: string;
  checkerMatchKinds: Record<"exact" | "front3" | "last3" | "last2", string>;
  prizeLabels: Record<PrizeType, string>;
}

const resultsMessagesByLocale: Record<SupportedLocale, ResultsMessages> = {
  en: {
    home: "Home",
    latestResults: "Latest results",
    blog: "Blogs",
    footerCopyright: "© {year} LottoKai. All rights reserved.",
    officialLatestResultsTitle: "Check the Latest Thai Lottery Results",
    officialLatestResultsDescription:
      "View official results and check your ticket instantly.",
    resultHistory: "Result history",
    homeBlogTeasersTitle: "Latest articles",
    homeBlogTeasersDescription: "Learn how Thai lottery works and how to check results",
    blogListTitle: "Thai Lottery Guides & Tips",
    blogListDescription: "Learn how Thai lottery results work, how to check your ticket, and what each prize means.",
    blogDetailDescriptionFallback: "Read this Thai lottery article and guide.",
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
    browseLatest: "View full latest results",
    browseBlog: "View more",
    latestUnavailable: "Latest results are temporarily unavailable.",
    historyUnavailable: "Result history is temporarily unavailable.",
    detailUnavailable: "This result detail is temporarily unavailable.",
    noResults: "No published results are available yet.",
    noHistory: "No published draw history is available yet.",
    noBlogPosts: "No published blog posts are available for this language yet.",
    blogListUnavailable: "The blog list is temporarily unavailable.",
    blogDetailUnavailable: "This blog article is temporarily unavailable.",
    previousPage: "Previous",
    nextPage: "Next",
    page: "Page",
    readArticle: "Read article",
    backToBlog: "Back to blog",
    language: "Language",
    theme: "Theme",
    lightMode: "Light",
    darkMode: "Dark",
    checkerTitle: "Check Your Ticket",
    checkerDateLabel: "Draw date",
    checkerTicketLabel: "Lottery number",
    checkerTicketPlaceholder: "Enter 6-digit lottery number",
    checkerChangeDraw: "Change draw",
    checkerDrawLoading: "Loading draw dates...",
    checkerSelectDraw: "Select draw date",
    checkerSubmit: "Check Ticket",
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
    checkerGroupDetails: "Prize group details",
    checkerCoverageComplete: "Checked all public prize groups.",
    checkerCoveragePartial: "Checked {checkedCount} prize groups. {uncheckedCount} prize groups are still pending.",
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
    blog: "บทความ",
    footerCopyright: "© {year} LottoKai สงวนลิขสิทธิ์",
    officialLatestResultsTitle: "ตรวจผลสลากกินแบ่งรัฐบาล",
    officialLatestResultsDescription: "ดูผลสลากกินแบ่งรัฐบาลอย่างเป็นทางการ และตรวจรางวัลได้ทันที",
    resultHistory: "สถิติหวยย้อนหลัง",
    homeBlogTeasersTitle: "บทความที่น่าสนใจ",
    homeBlogTeasersDescription: "วิธีเล่นหวยไทยและวิธีตรวจรางวัลอย่างละเอียด",
    blogListTitle: "คู่มือและเทคนิคหวยไทย",
    blogListDescription: "รวมวิธีตรวจรางวัล ความหมายของแต่ละรางวัล และสาระน่ารู้เกี่ยวกับสลากกินแบ่ง",
    blogDetailDescriptionFallback: "อ่านบทความแนะนำและคู่มือสลากกินแบ่งรัฐบาล",
    drawDetail: "รายละเอียดงวดนี้",
    officialResultTitle: "ผลสลากกินแบ่งรัฐบาลอย่างเป็นทางการ",
    drawDate: "งวดวันที่",
    drawCode: "รหัสงวด",
    publishedAt: "ประกาศเมื่อ",
    pendingPublication: "รอประกาศผล",
    currentLocale: "ภาษาปัจจุบัน",
    defaultLocale: "ภาษาเริ่มต้น",
    viewHistory: "ดูประวัติย้อนหลัง",
    viewDetail: "ดูรายละเอียด",
    backToHistory: "กลับไปหน้ารวม",
    browseLatest: "ดูผลรางวัลฉบับเต็ม",
    browseBlog: "ดูเพิ่มเติม",
    latestUnavailable: "ขออภัย ไม่สามารถดึงข้อมูลล่าสุดได้ในขณะนี้",
    historyUnavailable: "ขออภัย ไม่สามารถดึงข้อมูลย้อนหลังได้ในขณะนี้",
    detailUnavailable: "ไม่พบข้อมูลรายละเอียดของงวดนี้",
    noResults: "ยังไม่มีข้อมูลการออกรางวัล",
    noHistory: "ยังไม่มีประวัติการออกรางวัลในระบบ",
    noBlogPosts: "ยังไม่มีบทความในภาษานี้",
    blogListUnavailable: "ไม่สามารถโหลดรายการบทความได้",
    blogDetailUnavailable: "ไม่สามารถเข้าถึงเนื้อหาบทความนี้ได้",
    previousPage: "ก่อนหน้า",
    nextPage: "ถัดไป",
    page: "หน้า",
    readArticle: "อ่านต่อ",
    backToBlog: "กลับไปหน้าบทความ",
    language: "ภาษา",
    theme: "ธีม",
    lightMode: "สว่าง",
    darkMode: "มืด",
    checkerTitle: "ตรวจหวย",
    checkerDateLabel: "งวดวันที่",
    checkerTicketLabel: "เลขสลาก",
    checkerTicketPlaceholder: "กรอกเลข 6 หลัก",
    checkerChangeDraw: "เปลี่ยนงวด",
    checkerDrawLoading: "กำลังโหลดข้อมูล...",
    checkerSelectDraw: "เลือกงวดที่ต้องการตรวจ",
    checkerSubmit: "ตรวจรางวัล",
    checkerSubmitting: "กำลังตรวจสอบ...",
    checkerResultsTitle: "ผลการตรวจรางวัล",
    checkerClose: "ปิด",
    checkerResultFor: "ผลรางวัลของเลข",
    checkerDrawStatusDraft: "ร่าง",
    checkerDrawStatusPublished: "ประกาศผลแล้ว",
    checkerPartialSummary: "ตรวจสอบเบื้องต้น: ยังมีบางรางวัลที่อยู่ระหว่างการอัปเดต",
    checkerCompleteSummary: "ตรวจสอบครบทุกรางวัลเรียบร้อยแล้ว",
    checkerNoMatch: "เสียใจด้วย คุณไม่ถูกรางวัลในงวดนี้",
    checkerTicketInvalid: "กรุณากรอกเลขสลากให้ครบ 6 หลัก",
    checkerCheckedGroups: "รางวัลที่ตรวจแล้ว",
    checkerUncheckedGroups: "รางวัลที่ยังไม่ได้ตรวจ",
    checkerGroupDetails: "รายละเอียดรางวัล",
    checkerCoverageComplete: "ตรวจครบทุกรางวัลแล้ว",
    checkerCoveragePartial: "ตรวจแล้ว {checkedCount} รางวัล (เหลืออีก {uncheckedCount} รางวัลที่ยังไม่ประกาศ)",
    checkerTotalWinningAmount: "เงินรางวัลรวมที่จะได้รับ",
    checkerMatches: "รางวัลที่ถูก",
    checkerMatchKinds: {
      exact: "ถูกรางวัลตรงตัว",
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
    home: "ပင်မ",
    latestResults: "နောက်ဆုံးထွက်ဂဏန်းများ",
    blog: "ဆောင်းပါးများ",
    footerCopyright: "© {year} LottoKai မူပိုင်ခွင့်အားလုံး လက်ဝယ်ရှိသည်။",
    officialLatestResultsTitle: "ထိုင်းထီ နောက်ဆုံးရလဒ် စစ်ဆေးရန်",
    officialLatestResultsDescription: "တရားဝင် ထိုင်းထီရလဒ်များကို ကြည့်ရှုပြီး မိမိထီလက်မှတ်ကို ချက်ချင်းစစ်ဆေးပါ။",
    resultHistory: "ထီထွက်စဉ်မှတ်တမ်း",
    homeBlogTeasersTitle: "နောက်ဆုံးရ ဆောင်းပါးများ",
    homeBlogTeasersDescription: "ထိုင်းထီအကြောင်းနှင့် ထီစစ်ဆေးနည်း လမ်းညွှန်များ",
    blogListTitle: "ထိုင်းထီ လမ်းညွှန်နှင့် နည်းလမ်းများ",
    blogListDescription: "ထိုင်းထီရလဒ်များ၊ ထီစစ်ဆေးနည်းနှင့် ဆုအမျိုးအစားများအကြောင်း လေ့လာပါ။",
    blogDetailDescriptionFallback: "ဤထိုင်းထီဆောင်းပါးနှင့် လမ်းညွှန်ကို ဖတ်ရှုပါ။",
    drawDetail: "အကြိမ်အသေးစိတ်",
    officialResultTitle: "တရားဝင် ထိုင်းထီရလဒ်",
    drawDate: "ထွက်သည့်နေ့",
    drawCode: "အကြိမ်ကုဒ်",
    publishedAt: "ထုတ်ပြန်ချိန်",
    pendingPublication: "မထုတ်ပြန်ရသေးပါ",
    currentLocale: "လက်ရှိဘာသာစကား",
    defaultLocale: "မူလဘာသာစကား",
    viewHistory: "မှတ်တမ်းကြည့်ရန်",
    viewDetail: "အသေးစိတ်ကြည့်ရန်",
    backToHistory: "မှတ်တမ်းသို့ပြန်ရန်",
    browseLatest: "နောက်ဆုံးရလဒ်အပြည့်အစုံကြည့်ရန်",
    browseBlog: "ပိုမိုကြည့်ရှုရန်",
    latestUnavailable: "နောက်ဆုံးရလဒ်များကို ယာယီဖော်ပြ၍မရနိုင်သေးပါ။",
    historyUnavailable: "ရလဒ်မှတ်တမ်းများကို ယာယီဖော်ပြ၍မရနိုင်သေးပါ။",
    detailUnavailable: "ဤအကြိမ်အတွက် အသေးစိတ်အချက်အလက်များ မရှိသေးပါ။",
    noResults: "ထုတ်ပြန်ထားသော ရလဒ်များ မရှိသေးပါ။",
    noHistory: "ထုတ်ပြန်ထားသော မှတ်တမ်းများ မရှိသေးပါ။",
    noBlogPosts: "ဤဘာသာစကားဖြင့် ဆောင်းပါးများ မရှိသေးပါ။",
    blogListUnavailable: "ဆောင်းပါးစာရင်းကို ယာယီကြည့်၍မရနိုင်ပါ။",
    blogDetailUnavailable: "ဤဆောင်းပါးကို ယာယီကြည့်၍မရနိုင်ပါ။",
    previousPage: "ရှေ့သို့",
    nextPage: "နောက်သို့",
    page: "စာမျက်နှာ",
    readArticle: "ဖတ်ရှုရန်",
    backToBlog: "ဆောင်းပါးများသို့ပြန်ရန်",
    language: "ဘာသာစကား",
    theme: "အပြင်အဆင်",
    lightMode: "အလင်း",
    darkMode: "အမှောင်",
    checkerTitle: "ထီတိုက်ရန်",
    checkerDateLabel: "ထွက်သည့်နေ့စွဲ",
    checkerTicketLabel: "ထီနံပါတ်",
    checkerTicketPlaceholder: "၆ လုံးထီနံပါတ် ရိုက်ထည့်ပါ",
    checkerChangeDraw: "အကြိမ်ပြောင်းရန်",
    checkerDrawLoading: "အချက်အလက်များ ဆွဲယူနေသည်...",
    checkerSelectDraw: "စစ်ဆေးလိုသည့်နေ့စွဲ ရွေးချယ်ပါ",
    checkerSubmit: "ထီစစ်ရန်",
    checkerSubmitting: "စစ်ဆေးနေသည်...",
    checkerResultsTitle: "စစ်ဆေးမှုရလဒ်",
    checkerClose: "ပိတ်ရန်",
    checkerResultFor: "စစ်ဆေးသည့်နံပါတ်",
    checkerDrawStatusDraft: "မူကြမ်း",
    checkerDrawStatusPublished: "ထုတ်ပြန်ပြီး",
    checkerPartialSummary: "တစ်စိတ်တစ်ပိုင်း စစ်ဆေးမှုသာ ဖြစ်သည်။ ကျန်ရှိသောဆုများကို စောင့်ဆိုင်းနေဆဲဖြစ်သည်။",
    checkerCompleteSummary: "အများပြည်သူဆိုင်ရာ ဆုအုပ်စုအားလုံး စစ်ဆေးပြီးပါပြီ။",
    checkerNoMatch: "ကံမကောင်းပါ၊ ဤအကြိမ်တွင် ဆုမပေါက်ပါ။",
    checkerTicketInvalid: "မှန်ကန်သော ၆ လုံးထီနံပါတ်ကို ရိုက်ထည့်ပါ။",
    checkerCheckedGroups: "စစ်ဆေးပြီးသော ဆုများ",
    checkerUncheckedGroups: "မစစ်ဆေးရသေးသော ဆုများ",
    checkerGroupDetails: "ဆုအမျိုးအစား အသေးစိတ်",
    checkerCoverageComplete: "ဆုအားလုံး စစ်ဆေးပြီးပါပြီ။",
    checkerCoveragePartial: "ဆုအမျိုးအစား {checkedCount} ခု စစ်ဆေးပြီး၊ {uncheckedCount} ခု စောင့်ဆိုင်းနေဆဲ။",
    checkerTotalWinningAmount: "စုစုပေါင်း ရရှိမည့်ဆုကြေး",
    checkerMatches: "ပေါက်သောဆုများ",
    checkerMatchKinds: {
      exact: "ဂဏန်းတည့် ပေါက်သည်",
      front3: "ရှေ့ ၃ လုံး",
      last3: "နောက် ၃ လုံး",
      last2: "နောက် ၂ လုံး"
    },
    prizeLabels: {
      FIRST_PRIZE: "ပထမဆု",
      NEAR_FIRST_PRIZE: "ပထမဆု ဘေးချင်းကပ်ဆု",
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

export type PublicMessages = ResultsMessages;

export function getPublicMessages(locale: SupportedLocale): PublicMessages {
  return getResultsMessages(locale);
}
