import { assertValidPrizeNumber, groupPrizeRows, hasCompletePrizeGroups } from "@thai-lottery-checker/domain";
import type { BlogBodyBlock, GroupableLotteryResult, PrizeType, SupportedLocale } from "@thai-lottery-checker/types";
import { getApiEnv } from "../src/config/env.js";
import { prisma } from "../src/db/client.js";
import { hashPassword } from "../src/modules/admin-auth/admin-auth.crypto.js";

type SeedPrizeGroup = {
  type: PrizeType;
  numbers: string[];
  isReleased?: boolean;
};

type SeedBlogTranslation = {
  title: string;
  body: BlogBodyBlock[];
  excerpt: string;
  seoTitle: string | null;
  seoDescription: string | null;
};

type SeedBlogTopic = {
  slug: string;
  bannerImageUrl: string | null;
  status: "draft" | "published";
  publishedAt: string | null;
  titles: Record<SupportedLocale, string>;
  takeaways: Record<SupportedLocale, string>;
  customTranslations?: Partial<Record<SupportedLocale, SeedBlogTranslation>>;
};

const supportedLocales: SupportedLocale[] = ["en", "th", "my"];

const publishedDrawGroupsLatest: SeedPrizeGroup[] = [
  { type: "FIRST_PRIZE", numbers: ["902341"] },
  { type: "NEAR_FIRST_PRIZE", numbers: ["902340", "902342"] },
  { type: "SECOND_PRIZE", numbers: ["120441", "230552", "340663", "450774", "560885"] },
  {
    type: "THIRD_PRIZE",
    numbers: ["112233", "223344", "334455", "445566", "556677", "667788", "778899", "889900", "990011", "101122"]
  },
  {
    type: "FOURTH_PRIZE",
    numbers: Array.from({ length: 50 }, (_, index) => String(610100 + index).padStart(6, "0"))
  },
  {
    type: "FIFTH_PRIZE",
    numbers: Array.from({ length: 100 }, (_, index) => String(720100 + index).padStart(6, "0"))
  },
  { type: "FRONT_THREE", numbers: ["112", "745"] },
  { type: "LAST_THREE", numbers: ["331", "842"] },
  { type: "LAST_TWO", numbers: ["19"] }
];

const publishedDrawGroupsOne: SeedPrizeGroup[] = [
  { type: "FIRST_PRIZE", numbers: ["820866"] },
  { type: "NEAR_FIRST_PRIZE", numbers: ["820865", "820867"] },
  { type: "SECOND_PRIZE", numbers: ["328032", "716735", "320227", "000001", "999999"] },
  {
    type: "THIRD_PRIZE",
    numbers: ["123456", "234567", "345678", "456789", "567890", "678901", "789012", "890123", "901234", "012345"]
  },
  {
    type: "FOURTH_PRIZE",
    numbers: Array.from({ length: 50 }, (_, index) => String(400001 + index).padStart(6, "0"))
  },
  {
    type: "FIFTH_PRIZE",
    numbers: Array.from({ length: 100 }, (_, index) => String(500001 + index).padStart(6, "0"))
  },
  { type: "FRONT_THREE", numbers: ["068", "837"] },
  { type: "LAST_THREE", numbers: ["054", "479"] },
  { type: "LAST_TWO", numbers: ["06"] }
];

const publishedDrawGroupsTwo: SeedPrizeGroup[] = [
  { type: "FIRST_PRIZE", numbers: ["451209"] },
  { type: "NEAR_FIRST_PRIZE", numbers: ["451208", "451210"] },
  { type: "SECOND_PRIZE", numbers: ["200145", "300245", "400345", "500445", "600545"] },
  {
    type: "THIRD_PRIZE",
    numbers: ["101111", "202222", "303333", "404444", "505555", "606666", "707777", "808888", "909999", "010101"]
  },
  {
    type: "FOURTH_PRIZE",
    numbers: Array.from({ length: 50 }, (_, index) => String(610000 + index).padStart(6, "0"))
  },
  {
    type: "FIFTH_PRIZE",
    numbers: Array.from({ length: 100 }, (_, index) => String(710000 + index).padStart(6, "0"))
  },
  { type: "FRONT_THREE", numbers: ["145", "908"] },
  { type: "LAST_THREE", numbers: ["301", "772"] },
  { type: "LAST_TWO", numbers: ["45"] }
];

const draftDrawGroups: SeedPrizeGroup[] = [
  { type: "FIRST_PRIZE", numbers: ["300001"], isReleased: false },
  { type: "NEAR_FIRST_PRIZE", numbers: ["300000"], isReleased: false },
  { type: "FRONT_THREE", numbers: ["111"], isReleased: false }
];

const blogTopics: SeedBlogTopic[] = [
  {
    slug: "how-to-check-thai-lottery",
    bannerImageUrl: "https://example.com/blog/how-to-check-thai-lottery.jpg",
    status: "published",
    publishedAt: "2026-03-31T08:00:00.000Z",
    titles: {
      en: "How to Check Thai Lottery Results",
      th: "วิธีตรวจผลสลากกินแบ่งรัฐบาล",
      my: "ထိုင်းထီရလဒ် စစ်နည်း"
    },
    takeaways: {
      en: "Start with the draw date, then match your ticket against each prize group in order.",
      th: "เริ่มจากตรวจวันที่ออกรางวัลก่อน แล้วค่อยเทียบเลขกับแต่ละกลุ่มรางวัลตามลำดับ",
      my: "ပထမဆုံး ထီဖွင့်ရက်ကို စစ်ပြီးနောက် ဆုအုပ်စုတစ်ခုစီနှင့် အစဉ်လိုက်တိုက်ဆိုင်စစ်ပါ"
    },
    customTranslations: {
      en: {
        title: "How to Check Thai Lottery Results",
        body: paragraphBody([
          "Learn how to read official Thai lottery results step by step.",
          "Start with the draw date and prize labels so you compare your ticket against the correct result sheet before checking individual digits.",
          "Move through the first prize, near first prize, and supporting prize groups in a calm order to avoid skipping any winning section.",
          "If you are checking more than one ticket, mark each completed comparison before moving to the next ticket so you do not repeat or miss a number."
        ]),
        excerpt: "A simple guide to reading Thai lottery results.",
        seoTitle: "How to Check Thai Lottery Results",
        seoDescription: "Learn how to read and check Thai lottery results."
      },
      th: {
        title: "วิธีตรวจผลสลากกินแบ่งรัฐบาล",
        body: paragraphBody([
          "เรียนรู้วิธีอ่านผลสลากกินแบ่งรัฐบาลอย่างเป็นขั้นตอน.",
          "เริ่มจากดูวันที่ออกรางวัลและชื่อกลุ่มรางวัลให้ถูกต้องก่อน เพื่อไม่ให้เทียบเลขกับงวดผิด.",
          "ค่อย ๆ ไล่ตรวจรางวัลที่ 1 เลขข้างเคียง รางวัลรอง และเลขท้ายตามลำดับ จะช่วยลดความผิดพลาดได้มาก.",
          "ถ้ามีหลายใบ ควรทำเครื่องหมายว่าใบไหนตรวจแล้ว เพื่อให้ตรวจครบทุกใบอย่างเป็นระเบียบ."
        ]),
        excerpt: "คู่มือง่าย ๆ สำหรับการตรวจผลสลากกินแบ่งรัฐบาล",
        seoTitle: "วิธีตรวจผลสลากกินแบ่งรัฐบาล",
        seoDescription: "เรียนรู้วิธีอ่านและตรวจผลสลากกินแบ่งรัฐบาล"
      },
      my: {
        title: "ထိုင်းထီရလဒ် စစ်နည်း",
        body: paragraphBody([
          "တရားဝင် ထိုင်းထီရလဒ်ကို အဆင့်လိုက် ဖတ်ရှုစစ်ဆေးနည်းကို လေ့လာပါ။",
          "အရင်ဆုံး ထီဖွင့်ရက်နှင့် ဆုအုပ်စုအမည်များကို သေချာကြည့်ပြီး မိမိလက်မှတ်ကို မှန်ကန်သော ရလဒ်စာရင်းနှင့် တိုက်စစ်ပါ။",
          "ပထမဆု၊ နီးစပ်ပထမဆု၊ အခြားဆုအုပ်စုများနှင့် နောက်ဆုံးဂဏန်းဆုများကို အစဉ်လိုက်စစ်လျှင် မှားယွင်းမှုနည်းသွားပါမည်။",
          "လက်မှတ်အများကြီး စစ်ရမယ်ဆိုရင် တစ်ရွက်ပြီးတစ်ရွက် မှတ်သားပြီး စစ်ခြင်းက လက်တွေ့အသုံးဝင်ဆုံး နည်းလမ်းဖြစ်ပါသည်။"
        ]),
        excerpt: "ထိုင်းထီရလဒ်ကို ဖတ်ရှုစစ်ဆေးရန် လွယ်ကူသော လမ်းညွှန်ချက်",
        seoTitle: "ထိုင်းထီရလဒ် စစ်နည်း",
        seoDescription: "ထိုင်းထီရလဒ်ကို ဖတ်ရှုစစ်ဆေးနည်းကို လေ့လာပါ။"
      }
    }
  },
  {
    slug: "thai-lottery-draw-day-tips",
    bannerImageUrl: null,
    status: "published",
    publishedAt: "2026-03-28T08:00:00.000Z",
    titles: {
      en: "Thai Lottery Draw Day Tips",
      th: "เคล็ดลับเตรียมตัวในวันออกรางวัล",
      my: "ထီဖွင့်ရက်အတွက် အဆင်သင့်ဖြစ်စေမည့် အကြံပြုချက်များ"
    },
    takeaways: {
      en: "Prepare your ticket numbers and trusted result sources before draw time.",
      th: "เตรียมหมายเลขสลากและแหล่งผลรางวัลที่เชื่อถือได้ไว้ล่วงหน้าก่อนถึงเวลาออกรางวัล",
      my: "လက်မှတ်နံပါတ်များနှင့် ယုံကြည်ရသော ရလဒ်အရင်းအမြစ်များကို ထီဖွင့်ချိန်မတိုင်မီ ပြင်ဆင်ထားပါ"
    }
  },
  {
    slug: "understanding-first-prize-and-near-prize",
    bannerImageUrl: null,
    status: "published",
    publishedAt: "2026-03-25T08:00:00.000Z",
    titles: {
      en: "Understanding First Prize and Near First Prize",
      th: "ทำความเข้าใจรางวัลที่ 1 และเลขข้างเคียง",
      my: "ပထမဆုနှင့် နီးစပ်ပထမဆုကို နားလည်ရန်"
    },
    takeaways: {
      en: "Check the first prize first, then confirm the two neighboring numbers before moving on.",
      th: "ตรวจรางวัลที่ 1 ก่อน แล้วค่อยเช็กเลขข้างเคียงทั้งสองหมายเลขให้ครบ",
      my: "ပထမဆုကို အရင်စစ်ပြီးနောက် ကပ်လျက်နံပါတ်နှစ်ခုကို ဆက်လက်အတည်ပြုပါ"
    }
  },
  {
    slug: "how-thai-lottery-history-pages-help",
    bannerImageUrl: null,
    status: "published",
    publishedAt: "2026-03-22T08:00:00.000Z",
    titles: {
      en: "How History Pages Help You Recheck Results",
      th: "หน้าประวัติผลรางวัลช่วยให้ตรวจซ้ำได้อย่างไร",
      my: "မှတ်တမ်းရလဒ်စာမျက်နှာက ပြန်စစ်ရာတွင် ဘယ်လိုကူညီသလဲ"
    },
    takeaways: {
      en: "Use the history page to confirm older draw dates instead of relying on memory or screenshots.",
      th: "ใช้หน้าประวัติผลรางวัลเพื่อตรวจงวดเก่าให้ชัดเจน แทนการจำเองหรือดูจากภาพแคปหน้าจอ",
      my: "အဟောင်းထီဖွင့်ရက်များကို မှတ်တမ်းစာမျက်နှာမှ စစ်ဆေးပြီး ကိုယ်တိုင်မှတ်မိထားခြင်းအပေါ် မမှီခိုပါနှင့်"
    }
  },
  {
    slug: "common-ticket-reading-errors",
    bannerImageUrl: null,
    status: "published",
    publishedAt: "2026-03-19T08:00:00.000Z",
    titles: {
      en: "Common Ticket Reading Errors to Avoid",
      th: "ข้อผิดพลาดในการอ่านสลากที่ควรหลีกเลี่ยง",
      my: "ထီလက်မှတ်ဖတ်ရာတွင် ရှောင်သင့်သော အမှားများ"
    },
    takeaways: {
      en: "Read the digits slowly from left to right so similar numbers do not blend together.",
      th: "อ่านตัวเลขจากซ้ายไปขวาอย่างช้า ๆ เพื่อไม่ให้สับสนกับเลขที่คล้ายกัน",
      my: "တူညီသလိုမြင်ရသော နံပါတ်များ မရောထွေးစေရန် ဘယ်မှညာသို့ ဖြည်းဖြည်းဖတ်ပါ"
    }
  },
  {
    slug: "morning-checklist-before-the-draw",
    bannerImageUrl: null,
    status: "published",
    publishedAt: "2026-03-16T08:00:00.000Z",
    titles: {
      en: "A Morning Checklist Before the Draw",
      th: "เช็กลิสต์ตอนเช้าก่อนวันประกาศผล",
      my: "ထီဖွင့်မတိုင်မီ မနက်ခင်း စစ်ဆေးစာရင်း"
    },
    takeaways: {
      en: "Keep your tickets together, note the draw date, and decide where you will verify the results.",
      th: "รวบรวมสลากให้อยู่ที่เดียว จดจำวันที่ออกรางวัล และเลือกช่องทางที่จะใช้ตรวจผลไว้ล่วงหน้า",
      my: "လက်မှတ်များကို တစ်နေရာတည်းတွင်ထားပြီး ထီဖွင့်ရက်ကို မှတ်သားကာ ဘယ်နေရာမှ ရလဒ်စစ်မည်ကို ကြိုတင်ဆုံးဖြတ်ပါ"
    }
  },
  {
    slug: "how-to-compare-ticket-digits-correctly",
    bannerImageUrl: null,
    status: "published",
    publishedAt: "2026-03-13T08:00:00.000Z",
    titles: {
      en: "How to Compare Ticket Digits Correctly",
      th: "วิธีเทียบตัวเลขบนสลากให้ถูกต้อง",
      my: "ထီလက်မှတ်နံပါတ်များကို မှန်ကန်စွာ တိုက်စစ်နည်း"
    },
    takeaways: {
      en: "Match the full number for exact prizes and only compare endings for the ending-digit groups.",
      th: "รางวัลเลขตรงต้องเทียบครบทุกหลัก ส่วนรางวัลเลขท้ายให้ดูเฉพาะช่วงท้ายตามกติกา",
      my: "တိကျသောဆုများအတွက် နံပါတ်အပြည့်တိုက်စစ်ပြီး နောက်ဆုံးဂဏန်းဆုများအတွက် အဆုံးဘက်ကိုသာစစ်ပါ"
    }
  },
  {
    slug: "front-three-and-last-three-explained",
    bannerImageUrl: null,
    status: "published",
    publishedAt: "2026-03-10T08:00:00.000Z",
    titles: {
      en: "Front Three and Last Three Explained",
      th: "อธิบายรางวัลเลขหน้า 3 ตัวและเลขท้าย 3 ตัว",
      my: "ရှေ့သုံးလုံးနှင့် နောက်သုံးလုံးဆု အကြောင်း"
    },
    takeaways: {
      en: "Three-digit prizes use shorter comparisons, so mark those sections separately from the six-digit prizes.",
      th: "รางวัล 3 ตัวใช้การเทียบเลขสั้นกว่า จึงควรแยกตรวจจากรางวัล 6 หลักให้ชัดเจน",
      my: "သုံးလုံးဆုများသည် တိုတောင်းသောနှိုင်းယှဉ်မှုဖြစ်သဖြင့် ခြောက်လုံးဆုများနှင့် သီးခြားစစ်ပါ"
    }
  },
  {
    slug: "last-two-prize-quick-guide",
    bannerImageUrl: null,
    status: "published",
    publishedAt: "2026-03-07T08:00:00.000Z",
    titles: {
      en: "A Quick Guide to the Last Two Prize",
      th: "คู่มือสั้น ๆ สำหรับรางวัลเลขท้าย 2 ตัว",
      my: "နောက်ဆုံးနှစ်လုံးဆု အတွက် အမြန်လမ်းညွှန်"
    },
    takeaways: {
      en: "The last two prize is simple to verify, but it is still easy to misread if you are checking in a rush.",
      th: "เลขท้าย 2 ตัวตรวจง่าย แต่ก็ยังอ่านผิดได้ถ้าตรวจอย่างเร่งรีบ",
      my: "နောက်ဆုံးနှစ်လုံးဆုကို စစ်ရလွယ်ကူသော်လည်း အလျင်လိုစစ်လျှင် မှားနိုင်ပါသည်"
    }
  },
  {
    slug: "why-official-sources-matter",
    bannerImageUrl: null,
    status: "published",
    publishedAt: "2026-03-04T08:00:00.000Z",
    titles: {
      en: "Why Official Result Sources Matter",
      th: "ทำไมการอ้างอิงผลจากแหล่งทางการจึงสำคัญ",
      my: "တရားဝင်ရလဒ်အရင်းအမြစ်များ အရေးကြီးသောအကြောင်း"
    },
    takeaways: {
      en: "Use trusted published results so rumors, cropped images, and copied posts do not mislead you.",
      th: "ใช้ผลรางวัลจากแหล่งที่เชื่อถือได้ เพื่อหลีกเลี่ยงข่าวลือ ภาพตัดต่อ หรือข้อความที่ถูกคัดลอกผิด",
      my: "ယုံကြည်ရသော ရလဒ်များကို အသုံးပြုပါ၊ ထင်မြင်ချက်များနှင့် ဖြတ်တောက်ထားသောပုံများ မလှည့်ဖြားစေရန်"
    }
  },
  {
    slug: "results-checking-routine-for-families",
    bannerImageUrl: null,
    status: "published",
    publishedAt: "2026-03-01T08:00:00.000Z",
    titles: {
      en: "A Results Checking Routine for Families",
      th: "วิธีจัดลำดับการตรวจผลสำหรับคนในครอบครัว",
      my: "မိသားစုအတွက် ရလဒ်စစ်ဆေးနည်းစနစ်"
    },
    takeaways: {
      en: "When several people share tickets, agree on one order and one place to record each result.",
      th: "ถ้าคนในครอบครัวมีสลากหลายใบ ควรตกลงลำดับการตรวจและจุดบันทึกผลให้ชัดเจน",
      my: "မိသားစုဝင်များ လက်မှတ်များမျှဝေစစ်ရပါက စစ်ဆေးမည့်အစီအစဉ်နှင့် မှတ်တမ်းနေရာကို ကြိုတင်သတ်မှတ်ပါ"
    }
  },
  {
    slug: "what-to-do-after-a-small-win",
    bannerImageUrl: null,
    status: "published",
    publishedAt: "2026-02-26T08:00:00.000Z",
    titles: {
      en: "What to Do After a Small Win",
      th: "เมื่อถูกรางวัลเล็กควรทำอย่างไรต่อ",
      my: "အသေးစားဆုရပြီးနောက် ဘာလုပ်သင့်သလဲ"
    },
    takeaways: {
      en: "Confirm the prize type carefully, then keep the ticket safe until you complete the official next step.",
      th: "ยืนยันประเภทของรางวัลให้แน่ชัด แล้วเก็บสลากไว้ให้ปลอดภัยก่อนดำเนินขั้นตอนต่อไป",
      my: "ဆုအမျိုးအစားကို သေချာအတည်ပြုပြီးနောက် နောက်တစ်ဆင့် မလုပ်ခင် လက်မှတ်ကို လုံခြုံစွာသိမ်းဆည်းပါ"
    }
  },
  {
    slug: "saving-old-tickets-until-confirmed",
    bannerImageUrl: null,
    status: "published",
    publishedAt: "2026-02-23T08:00:00.000Z",
    titles: {
      en: "Why You Should Keep Old Tickets Until Confirmed",
      th: "ทำไมควรเก็บสลากเก่าไว้จนกว่าจะยืนยันผล",
      my: "ရလဒ်သေချာမအတည်ပြုမီ လက်မှတ်အဟောင်းကို ဘာကြောင့်သိမ်းထားသင့်သလဲ"
    },
    takeaways: {
      en: "Do not throw away a ticket before you verify the draw date and review the official result page again.",
      th: "อย่าเพิ่งทิ้งสลากก่อนตรวจวันที่ออกรางวัลและกลับไปทบทวนผลทางการอีกครั้ง",
      my: "ထီဖွင့်ရက်နှင့် တရားဝင်ရလဒ်စာမျက်နှာကို မပြန်စစ်မချင်း လက်မှတ်မပစ်ပါနှင့်"
    }
  },
  {
    slug: "how-admins-publish-results-carefully",
    bannerImageUrl: null,
    status: "published",
    publishedAt: "2026-02-20T08:00:00.000Z",
    titles: {
      en: "How Careful Publishing Improves Trust",
      th: "การเผยแพร่อย่างรอบคอบช่วยสร้างความน่าเชื่อถืออย่างไร",
      my: "ဂရုတစိုက် ထုတ်ပြန်ခြင်းက ယုံကြည်မှုကို ဘယ်လိုတိုးစေသလဲ"
    },
    takeaways: {
      en: "Clear review steps and careful publishing make public result pages easier to trust.",
      th: "ขั้นตอนตรวจทานที่ชัดเจนและการเผยแพร่อย่างระมัดระวังทำให้ผู้ใช้เชื่อถือผลรางวัลได้มากขึ้น",
      my: "ရှင်းလင်းသော စစ်ဆေးမှုအဆင့်များနှင့် ဂရုတစိုက်ထုတ်ပြန်မှုက အများပြည်သူယုံကြည်မှုကို တိုးစေပါသည်"
    }
  },
  {
    slug: "avoiding-rumors-on-draw-day",
    bannerImageUrl: null,
    status: "published",
    publishedAt: "2026-02-17T08:00:00.000Z",
    titles: {
      en: "Avoiding Rumors on Draw Day",
      th: "หลีกเลี่ยงข่าวลือในวันออกรางวัล",
      my: "ထီဖွင့်ရက်တွင် သတင်းကောလာဟလများကို ရှောင်ခြင်း"
    },
    takeaways: {
      en: "Wait for the published numbers instead of forwarding unverified lists from chat groups.",
      th: "รอผลที่ประกาศอย่างเป็นทางการก่อน แทนการส่งต่อรายการเลขที่ยังไม่ยืนยันในกลุ่มแชต",
      my: "အတည်မပြုရသေးသော စာရင်းများကို မဖြန့်ဝေမီ တရားဝင်ထုတ်ပြန်ချက်ကို စောင့်ပါ"
    }
  },
  {
    slug: "reading-prize-groups-with-confidence",
    bannerImageUrl: null,
    status: "published",
    publishedAt: "2026-02-14T08:00:00.000Z",
    titles: {
      en: "Reading Prize Groups With Confidence",
      th: "อ่านกลุ่มรางวัลอย่างมั่นใจ",
      my: "ဆုအုပ်စုများကို ယုံကြည်စွာဖတ်ရှုနည်း"
    },
    takeaways: {
      en: "A fixed order for checking prize groups helps you stay calm and reduces skipped sections.",
      th: "การมีกำหนดลำดับการตรวจกลุ่มรางวัลที่ชัดเจนช่วยให้ตรวจได้ครบและไม่สับสน",
      my: "ဆုအုပ်စုများကို သတ်မှတ်အစီအစဉ်ဖြင့်စစ်ခြင်းက စိတ်တည်ငြိမ်စေပြီး အုပ်စုကျော်သွားခြင်းကို လျော့နည်းစေသည်"
    }
  },
  {
    slug: "a-simple-guide-to-lottery-pages",
    bannerImageUrl: null,
    status: "published",
    publishedAt: "2026-02-11T08:00:00.000Z",
    titles: {
      en: "A Simple Guide to Lottery Result Pages",
      th: "คู่มือง่าย ๆ สำหรับหน้าผลรางวัล",
      my: "ထီရလဒ်စာမျက်နှာများအတွက် ရိုးရှင်းသော လမ်းညွှန်"
    },
    takeaways: {
      en: "Latest, history, and detail pages each answer different questions, so use the page that matches your task.",
      th: "หน้า Latest, History และ Detail มีหน้าที่ต่างกัน จึงควรเลือกใช้ให้ตรงกับสิ่งที่ต้องการตรวจ",
      my: "Latest, History နှင့် Detail စာမျက်နှာများသည် မတူညီသော အလုပ်များအတွက်ဖြစ်သောကြောင့် လိုအပ်သလိုရွေးသုံးပါ"
    }
  },
  {
    slug: "how-to-spot-number-order-mistakes",
    bannerImageUrl: null,
    status: "published",
    publishedAt: "2026-02-08T08:00:00.000Z",
    titles: {
      en: "How to Spot Number Order Mistakes",
      th: "สังเกตความผิดพลาดจากการอ่านเลขสลับตำแหน่ง",
      my: "နံပါတ်အစီအစဉ်မှားဖတ်မှုကို ဘယ်လိုသိနိုင်သလဲ"
    },
    takeaways: {
      en: "If a number looks close but not exact, read it again digit by digit before assuming it is a miss.",
      th: "ถ้าเลขดูเหมือนใกล้เคียงแต่ไม่ตรง ควรย้อนอ่านทีละหลักก่อนสรุปว่าไม่ถูกรางวัล",
      my: "နံပါတ်တူသလိုထင်ရသော်လည်း တိတိကျကျမတူပါက တစ်ဂဏန်းချင်း ပြန်ဖတ်ပါ"
    }
  },
  {
    slug: "preparing-multiple-tickets-for-checking",
    bannerImageUrl: null,
    status: "published",
    publishedAt: "2026-02-05T08:00:00.000Z",
    titles: {
      en: "Preparing Multiple Tickets for Checking",
      th: "การเตรียมสลากหลายใบก่อนตรวจผล",
      my: "လက်မှတ်အများကို စစ်ဆေးရန် ကြိုတင်ပြင်ဆင်နည်း"
    },
    takeaways: {
      en: "Sort tickets by draw date first so older and newer entries do not get mixed together.",
      th: "แยกสลากตามวันที่ออกรางวัลก่อน เพื่อไม่ให้งวดเก่าและงวดใหม่ปะปนกัน",
      my: "လက်မှတ်များကို ထီဖွင့်ရက်အလိုက် အရင်ခွဲထားပြီး အဟောင်းအသစ် မရောစပ်ပါနှင့်"
    }
  },
  {
    slug: "why-draw-date-matters",
    bannerImageUrl: null,
    status: "published",
    publishedAt: "2026-02-02T08:00:00.000Z",
    titles: {
      en: "Why the Draw Date Matters First",
      th: "ทำไมวันที่ออกรางวัลจึงต้องตรวจเป็นอย่างแรก",
      my: "ဘာကြောင့် ထီဖွင့်ရက်ကို အရင်စစ်သင့်သလဲ"
    },
    takeaways: {
      en: "The same number means nothing without the correct draw date attached to it.",
      th: "ต่อให้เลขเหมือนกันก็ไม่มีความหมาย หากตรวจคนละวันที่ออกรางวัล",
      my: "တူညီသောနံပါတ်ဖြစ်နေသော်လည်း ထီဖွင့်ရက်မမှန်ပါက အဓိပ္ပာယ်မရှိပါ"
    }
  },
  {
    slug: "lottery-result-page-basics",
    bannerImageUrl: null,
    status: "published",
    publishedAt: "2026-01-30T08:00:00.000Z",
    titles: {
      en: "Lottery Result Page Basics",
      th: "พื้นฐานการอ่านหน้าผลรางวัล",
      my: "ထီရလဒ်စာမျက်နှာ၏ အခြေခံများ"
    },
    takeaways: {
      en: "Start with the page heading, draw metadata, and group labels before checking individual numbers.",
      th: "เริ่มจากหัวข้อหน้า วันที่ออกรางวัล และชื่อกลุ่มรางวัลก่อนเทียบเลขแต่ละตัว",
      my: "စာမျက်နှာခေါင်းစဉ်၊ ထီဖွင့်ရက်နှင့် ဆုအုပ်စုခေါင်းစဉ်များကို အရင်ဖတ်ပြီး နံပါတ်များကို ဆက်စစ်ပါ"
    }
  },
  {
    slug: "checking-shared-family-tickets",
    bannerImageUrl: null,
    status: "published",
    publishedAt: "2026-01-27T08:00:00.000Z",
    titles: {
      en: "Checking Shared Family Tickets Smoothly",
      th: "ตรวจสลากที่ซื้อร่วมกันในครอบครัวอย่างเป็นระบบ",
      my: "မိသားစုဝင်များ မျှဝေဝယ်ထားသော လက်မှတ်များကို စနစ်တကျစစ်နည်း"
    },
    takeaways: {
      en: "Write down who holds each ticket before the draw so follow-up conversations stay clear.",
      th: "จดไว้ล่วงหน้าว่าสลากแต่ละใบเป็นของใคร เพื่อให้ตรวจและยืนยันผลได้ง่าย",
      my: "ထီမဖွင့်မီ လက်မှတ်တစ်ရွက်စီကို ဘယ်သူပိုင်သည်ကို မှတ်သားထားပါ"
    }
  },
  {
    slug: "keeping-a-draw-notebook",
    bannerImageUrl: null,
    status: "published",
    publishedAt: "2026-01-24T08:00:00.000Z",
    titles: {
      en: "Keeping a Simple Draw Notebook",
      th: "การจดบันทึกงวดอย่างง่าย",
      my: "ထီဖွင့်မှတ်တမ်းစာအုပ်လေး တစ်အုပ်ထားခြင်း"
    },
    takeaways: {
      en: "A short notebook for dates, ticket numbers, and checked outcomes reduces confusion over time.",
      th: "สมุดบันทึกสั้น ๆ สำหรับวันที่ออกรางวัล เลขสลาก และผลที่ตรวจแล้ว ช่วยลดความสับสนได้มาก",
      my: "ရက်စွဲ၊ လက်မှတ်နံပါတ်နှင့် စစ်ပြီးရလဒ်များကို မှတ်သားထားသော မှတ်စုစာအုပ်က ရေရှည်တွင် အထောက်အကူပြုပါသည်"
    }
  },
  {
    slug: "when-to-recheck-the-results",
    bannerImageUrl: null,
    status: "published",
    publishedAt: "2026-01-21T08:00:00.000Z",
    titles: {
      en: "When It Makes Sense to Recheck Results",
      th: "เมื่อไหร่ที่ควรกลับไปตรวจผลอีกครั้ง",
      my: "ဘယ်အချိန်တွင် ရလဒ်ကို ပြန်စစ်သင့်သလဲ"
    },
    takeaways: {
      en: "Recheck if the ticket is hard to read, the draw date is unclear, or someone copied the numbers for you.",
      th: "ควรตรวจซ้ำเมื่อสลากอ่านยาก วันที่ออกรางวัลไม่ชัด หรือมีคนอื่นช่วยคัดลอกเลขให้",
      my: "လက်မှတ်ဖတ်ရခက်ခြင်း၊ ထီဖွင့်ရက်မရှင်းခြင်း သို့မဟုတ် အခြားသူတစ်ဦးက နံပါတ်ကူးပေးထားခြင်းများတွင် ပြန်စစ်သင့်ပါသည်"
    }
  },
  {
    slug: "making-sense-of-result-history",
    bannerImageUrl: null,
    status: "published",
    publishedAt: "2026-01-18T08:00:00.000Z",
    titles: {
      en: "Making Sense of Result History",
      th: "ทำความเข้าใจกับหน้าประวัติผลรางวัล",
      my: "ရလဒ်မှတ်တမ်းစာမျက်နှာကို နားလည်စေရန်"
    },
    takeaways: {
      en: "History pages are best for older checks, while the latest page is best for the current public draw.",
      th: "หน้าประวัติผลเหมาะกับการย้อนตรวจงวดเก่า ส่วนหน้า Latest เหมาะกับงวดปัจจุบัน",
      my: "မှတ်တမ်းစာမျက်နှာသည် အဟောင်းစစ်ဆေးမှုများအတွက်သင့်တော်ပြီး Latest စာမျက်နှာသည် လတ်တလောထီအတွက်သင့်တော်ပါသည်"
    }
  },
  {
    slug: "tracking-which-ticket-was-checked",
    bannerImageUrl: null,
    status: "published",
    publishedAt: "2026-01-09T08:00:00.000Z",
    titles: {
      en: "Tracking Which Ticket Was Already Checked",
      th: "วิธีจำว่าใบไหนตรวจแล้ว ใบไหนยังไม่ได้ตรวจ",
      my: "ဘယ်လက်မှတ်ကို စစ်ပြီးပြီ၊ ဘယ်လက်မှတ်မစစ်ရသေးသည်ကို မှတ်သားနည်း"
    },
    takeaways: {
      en: "Use a simple mark or envelope system so repeated checks do not create confusion.",
      th: "ใช้เครื่องหมายง่าย ๆ หรือแยกซองเก็บ เพื่อไม่ให้หยิบใบเดิมมาตรวจซ้ำจนสับสน",
      my: "အမှတ်အသား သို့မဟုတ် စာအိတ်ခွဲထားခြင်းက ထပ်စစ်မှုကြောင့် မရှုပ်ထွေးစေပါ"
    }
  },
  {
    slug: "why-clear-result-layouts-help",
    bannerImageUrl: null,
    status: "published",
    publishedAt: "2026-01-06T08:00:00.000Z",
    titles: {
      en: "Why Clear Result Layouts Help Everyone",
      th: "ทำไมหน้าผลรางวัลที่ชัดเจนจึงช่วยผู้ใช้ทุกคนได้มาก",
      my: "ရှင်းလင်းသော ရလဒ်ပုံစံက လူတိုင်းကို ဘာကြောင့်ကူညီသလဲ"
    },
    takeaways: {
      en: "Clear labels and spacing make it easier for readers to move from summary information to full detail.",
      th: "ป้ายกำกับและการจัดวางที่ชัดเจนช่วยให้ผู้ใช้ไล่ดูจากสรุปไปยังรายละเอียดเต็มได้ง่ายขึ้น",
      my: "ရှင်းလင်းသော ခေါင်းစဉ်နှင့် အကွာအဝေးများက အကျဉ်းချုပ်မှ အသေးစိတ်သို့ လွယ်ကူစွာရွှေ့နိုင်စေပါသည်"
    }
  },
  {
    slug: "thai-lottery-common-mistakes",
    bannerImageUrl: null,
    status: "draft",
    publishedAt: null,
    titles: {
      en: "Common Mistakes When Checking Thai Lottery Results",
      th: "ข้อผิดพลาดที่พบบ่อยในการตรวจหวย",
      my: "ထိုင်းထီရလဒ် စစ်ရာတွင် တွေ့ရတတ်သော အမှားများ"
    },
    takeaways: {
      en: "Most mistakes happen when people compare digits too quickly or use the wrong draw date.",
      th: "ความผิดพลาดส่วนใหญ่มักเกิดจากการเทียบเลขเร็วเกินไปหรือใช้วันที่ออกรางวัลผิด",
      my: "အမှားများအများစုသည် နံပါတ်များကို အလျင်လိုတိုက်စစ်ခြင်း သို့မဟုတ် ထီဖွင့်ရက်မှားခြင်းကြောင့် ဖြစ်တတ်သည်"
    }
  },
  {
    slug: "admin-review-checklist-before-publishing",
    bannerImageUrl: null,
    status: "draft",
    publishedAt: null,
    titles: {
      en: "An Admin Review Checklist Before Publishing",
      th: "เช็กลิสต์สำหรับผู้ดูแลก่อนเผยแพร่ข้อมูล",
      my: "ထုတ်ပြန်မီ အက်ဒမင်စစ်ဆေးစာရင်း"
    },
    takeaways: {
      en: "A short review checklist helps prevent missed digits, wrong dates, and inconsistent copy.",
      th: "เช็กลิสต์สั้น ๆ ช่วยลดโอกาสพลาดเลขผิด วันที่ผิด และข้อความที่ไม่สอดคล้องกัน",
      my: "တိုတောင်းသော စစ်ဆေးစာရင်းက နံပါတ်လွဲခြင်း၊ ရက်စွဲမှားခြင်းနှင့် စာသားမညီမှုကို လျော့နည်းစေသည်"
    }
  },
  {
    slug: "planning-localized-lottery-guides",
    bannerImageUrl: null,
    status: "draft",
    publishedAt: null,
    titles: {
      en: "Planning Localized Lottery Guides",
      th: "การวางแผนทำคู่มือตรวจหวยหลายภาษา",
      my: "ဘာသာစုံ ထီလမ်းညွှန်များကို စီစဉ်ခြင်း"
    },
    takeaways: {
      en: "Localized guides work best when the same core advice is adapted clearly for each audience.",
      th: "คู่มือหลายภาษาจะมีประโยชน์ที่สุดเมื่อเนื้อหาหลักเหมือนกันแต่ปรับคำอธิบายให้เหมาะกับแต่ละกลุ่มผู้อ่าน",
      my: "ဘာသာစုံလမ်းညွှန်များသည် အကြံပြုချက်အဓိကတူညီသော်လည်း ပရိသတ်အလိုက် ရှင်းလင်းစွာပြင်ဆင်ထားသင့်ပါသည်"
    }
  }
];

function paragraphBody(texts: string[]): BlogBodyBlock[] {
  return texts.map((text) => ({
    type: "paragraph",
    text
  }));
}

function createRowsFromGroups(prizeGroups: readonly SeedPrizeGroup[]): GroupableLotteryResult[] {
  return prizeGroups.flatMap((prizeGroup) =>
    prizeGroup.numbers.map((number, prizeIndex) => {
      assertValidPrizeNumber(prizeGroup.type, number);

      return {
        prizeType: prizeGroup.type,
        prizeIndex,
        number
      };
    })
  );
}

function padDigits(value: number, digits: number): string {
  const max = 10 ** digits;
  const normalized = ((value % max) + max) % max;
  return String(normalized).padStart(digits, "0");
}

function generateUniqueNumbers(count: number, digits: number, start: number, step: number): string[] {
  const numbers = new Set<string>();
  let current = start;

  while (numbers.size < count) {
    numbers.add(padDigits(current, digits));
    current += step;
  }

  return Array.from(numbers);
}

function previousThaiDrawDate(value: string): string {
  const [yearString, monthString, dayString] = value.split("-");
  const year = Number(yearString);
  const month = Number(monthString);
  const day = Number(dayString);

  if (day === 16) {
    return `${yearString}-${monthString}-01`;
  }

  const previousMonthDate = new Date(Date.UTC(year, month - 2, 1));
  return `${previousMonthDate.getUTCFullYear()}-${String(previousMonthDate.getUTCMonth() + 1).padStart(2, "0")}-16`;
}

function buildPublishedDrawDates(count: number, latestDrawDate: string): string[] {
  const dates: string[] = [];
  let current = latestDrawDate;

  while (dates.length < count) {
    dates.push(current);
    current = previousThaiDrawDate(current);
  }

  return dates;
}

function getGeneratedPublishedPrizeGroups(drawDate: string): SeedPrizeGroup[] {
  const numericSeed = Number(drawDate.replaceAll("-", ""));
  const firstPrizeNumber = padDigits(numericSeed * 13 + 17, 6);
  const firstPrizeValue = Number(firstPrizeNumber);

  return [
    { type: "FIRST_PRIZE", numbers: [firstPrizeNumber] },
    { type: "NEAR_FIRST_PRIZE", numbers: [padDigits(firstPrizeValue - 1, 6), padDigits(firstPrizeValue + 1, 6)] },
    { type: "SECOND_PRIZE", numbers: generateUniqueNumbers(5, 6, numericSeed * 17 + 20000, 137) },
    { type: "THIRD_PRIZE", numbers: generateUniqueNumbers(10, 6, numericSeed * 19 + 30000, 173) },
    { type: "FOURTH_PRIZE", numbers: generateUniqueNumbers(50, 6, numericSeed * 23 + 40000, 97) },
    { type: "FIFTH_PRIZE", numbers: generateUniqueNumbers(100, 6, numericSeed * 29 + 50000, 89) },
    { type: "FRONT_THREE", numbers: generateUniqueNumbers(2, 3, numericSeed * 31 + 600, 37) },
    { type: "LAST_THREE", numbers: generateUniqueNumbers(2, 3, numericSeed * 37 + 700, 41) },
    { type: "LAST_TWO", numbers: generateUniqueNumbers(1, 2, numericSeed * 41 + 80, 1) }
  ];
}

function getPublishedPrizeGroups(drawDate: string): SeedPrizeGroup[] {
  switch (drawDate) {
    case "2026-04-01":
      return publishedDrawGroupsLatest;
    case "2026-03-01":
      return publishedDrawGroupsOne;
    case "2026-02-16":
      return publishedDrawGroupsTwo;
    default:
      return getGeneratedPublishedPrizeGroups(drawDate);
  }
}

function createPublishedDrawFixtures(): Array<{
  drawDate: Date;
  drawCode: string;
  publishedAt: Date;
  prizeGroups: SeedPrizeGroup[];
}> {
  return buildPublishedDrawDates(32, "2026-04-01").map((drawDate) => ({
    drawDate: new Date(`${drawDate}T00:00:00.000Z`),
    drawCode: drawDate,
    publishedAt: new Date(`${drawDate}T09:30:00.000Z`),
    prizeGroups: getPublishedPrizeGroups(drawDate)
  }));
}

function createGeneratedTranslation(locale: SupportedLocale, title: string, takeaway: string): SeedBlogTranslation {
  if (locale === "th") {
    return {
      title,
      body: paragraphBody([
        `${title} เป็นบทความที่ช่วยให้ผู้อ่านมองภาพรวมของการตรวจผลได้ชัดขึ้น โดยเริ่มจากข้อมูลที่ควรเช็กก่อนเสมอ.`,
        `${takeaway}. เมื่อเตรียมขั้นตอนนี้ไว้ล่วงหน้า การตรวจผลในหน้าล่าสุดหรือหน้ารายละเอียดจะเป็นระบบมากขึ้น.`,
        "ผู้ใช้จำนวนมากพลาดเพราะอ่านเลขเร็วเกินไป หรือสลับการตรวจระหว่างกลุ่มรางวัลหลักกับเลขท้าย ดังนั้นการแบ่งขั้นตอนให้ชัดเจนจึงสำคัญมาก.",
        "หากต้องตรวจหลายใบ ควรจดผลที่ตรวจแล้วทันที เพื่อให้ย้อนกลับมาตรวจซ้ำหรือยืนยันผลได้อย่างมั่นใจมากขึ้น."
      ]),
      excerpt: takeaway,
      seoTitle: title,
      seoDescription: takeaway
    };
  }

  if (locale === "my") {
    return {
      title,
      body: paragraphBody([
        `${title} သည် ထီရလဒ်များကို ပိုမိုစနစ်တကျ ဖတ်ရှုစစ်ဆေးနိုင်ရန် အခြေခံအချက်များကို ရှင်းပြထားသော ဆောင်းပါးဖြစ်ပါသည်။`,
        `${takeaway}။ ဒီအဆင့်ကို ကြိုတင်သတ်မှတ်ထားပါက latest စာမျက်နှာနှင့် အသေးစိတ်စာမျက်နှာများတွင် ပိုမိုသေချာစွာ စစ်ဆေးနိုင်ပါသည်။`,
        "လူအများသည် အလျင်လိုဖတ်ခြင်း၊ ဆုအုပ်စုမှားစစ်ခြင်း သို့မဟုတ် ရက်စွဲမမှန်ခြင်းကြောင့် အမှားလုပ်တတ်ကြသဖြင့် စစ်ဆေးမှုအစီအစဉ်တစ်ခုထားရှိရန် အရေးကြီးပါသည်။",
        "လက်မှတ်အများကို စစ်ရသည့်အခါ ရလဒ်တစ်ခုချင်းကို ချက်ချင်းမှတ်သားထားခြင်းက နောက်တစ်ကြိမ် ပြန်စစ်ရာတွင် ယုံကြည်မှု ပိုမိုရရှိစေပါသည်။"
      ]),
      excerpt: takeaway,
      seoTitle: title,
      seoDescription: takeaway
    };
  }

  return {
    title,
    body: paragraphBody([
      `${title} gives readers a calmer way to work through Thai lottery information without jumping straight into a confusing list of numbers.`,
      `${takeaway} This small routine makes the latest page, history page, and draw detail page easier to use with confidence.`,
      "Many checking mistakes happen when people rush through similar-looking digits or forget which prize group they were reading, so a steady order matters.",
      "When you keep a simple note of what you have already checked, it becomes much easier to verify the result again later or explain it to someone else."
    ]),
    excerpt: takeaway,
    seoTitle: title,
    seoDescription: takeaway
  };
}

function buildBlogTranslations(topic: SeedBlogTopic): SeedBlogTranslation[] {
  return supportedLocales.map((locale) => {
    const customTranslation = topic.customTranslations?.[locale];

    if (customTranslation) {
      return customTranslation;
    }

    return createGeneratedTranslation(locale, topic.titles[locale], topic.takeaways[locale]);
  });
}

export async function seed(): Promise<void> {
  const env = getApiEnv();
  const passwordHash = await hashPassword(env.ADMIN_BOOTSTRAP_PASSWORD);
  const bootstrapEmail = env.ADMIN_BOOTSTRAP_EMAIL.toLowerCase();

  await prisma.blogPostTranslation.deleteMany();
  await prisma.blogPost.deleteMany();
  await prisma.adminAuditLog.deleteMany();
  await prisma.adminPasswordReset.deleteMany();
  await prisma.adminInvitation.deleteMany();
  await prisma.adminPermissionGrant.deleteMany();
  await prisma.lotteryResultGroupRelease.deleteMany();
  await prisma.lotteryResult.deleteMany();
  await prisma.lotteryDraw.deleteMany();
  await prisma.admin.deleteMany({
    where: {
      email: {
        not: bootstrapEmail
      }
    }
  });

  const bootstrapAdmin = await prisma.admin.upsert({
    where: { email: bootstrapEmail },
    update: {
      name: env.ADMIN_BOOTSTRAP_NAME,
      passwordHash,
      role: "super_admin",
      isActive: true,
      deactivatedAt: null,
      invitedByAdminId: null,
      lastLoginAt: null,
      passwordUpdatedAt: new Date()
    },
    create: {
      email: bootstrapEmail,
      name: env.ADMIN_BOOTSTRAP_NAME,
      passwordHash,
      role: "super_admin",
      isActive: true,
      passwordUpdatedAt: new Date()
    }
  });

  const publishedDraws = createPublishedDrawFixtures();

  for (const draw of publishedDraws) {
    const rows = createRowsFromGroups(draw.prizeGroups);
    const grouped = groupPrizeRows(rows);

    if (!hasCompletePrizeGroups(grouped)) {
      throw new Error(`Published seed draw is incomplete: ${draw.drawCode}`);
    }

    await prisma.lotteryDraw.create({
      data: {
        drawDate: draw.drawDate,
        drawCode: draw.drawCode,
        status: "published",
        publishedAt: draw.publishedAt,
        createdByAdminId: bootstrapAdmin.id,
        updatedByAdminId: bootstrapAdmin.id,
        results: {
          create: rows.map((row) => ({
            prizeType: row.prizeType,
            prizeIndex: row.prizeIndex,
            number: row.number
          }))
        },
        groupReleases: {
          create: draw.prizeGroups.map((prizeGroup) => ({
            prizeType: prizeGroup.type,
            isReleased: true,
            releasedAt: draw.publishedAt,
            releasedByAdminId: bootstrapAdmin.id
          }))
        }
      }
    });
  }

  const draftRows = createRowsFromGroups(draftDrawGroups);

  await prisma.lotteryDraw.create({
    data: {
      drawDate: new Date("2026-04-16T00:00:00.000Z"),
      drawCode: "2026-04-16-draft",
      status: "draft",
      publishedAt: null,
      createdByAdminId: bootstrapAdmin.id,
      updatedByAdminId: bootstrapAdmin.id,
      results: {
        create: draftRows.map((row) => ({
          prizeType: row.prizeType,
          prizeIndex: row.prizeIndex,
          number: row.number
        }))
      },
      groupReleases: {
        create: draftDrawGroups.map((prizeGroup) => ({
          prizeType: prizeGroup.type,
          isReleased: prizeGroup.isReleased ?? false,
          releasedAt: null,
          releasedByAdminId: null
        }))
      }
    }
  });

  for (const topic of blogTopics) {
    const translations = buildBlogTranslations(topic);

    await prisma.blogPost.create({
      data: {
        slug: topic.slug,
        bannerImageUrl: topic.bannerImageUrl,
        status: topic.status,
        publishedAt: topic.publishedAt ? new Date(topic.publishedAt) : null,
        createdByAdminId: bootstrapAdmin.id,
        updatedByAdminId: bootstrapAdmin.id,
        translations: {
          create: translations.map((translation, index) => ({
            locale: supportedLocales[index],
            title: translation.title,
            body: translation.body,
            excerpt: translation.excerpt,
            seoTitle: translation.seoTitle,
            seoDescription: translation.seoDescription
          }))
        }
      }
    });
  }
}

if (import.meta.url === new URL(process.argv[1], "file:").href) {
  seed()
    .then(async () => {
      await prisma.$disconnect();
    })
    .catch(async (error) => {
      console.error("Seed failed", error);
      await prisma.$disconnect();
      process.exit(1);
    });
}
