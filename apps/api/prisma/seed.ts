import { assertValidPrizeNumber, groupPrizeRows, hasCompletePrizeGroups } from "@thai-lottery-checker/domain";
import type { GroupableLotteryResult, PrizeType } from "@thai-lottery-checker/types";
import { getApiEnv } from "../src/config/env.js";
import { prisma } from "../src/db/client.js";
import { hashPassword } from "../src/modules/admin-auth/admin-auth.crypto.js";

type SeedPrizeGroup = {
  type: PrizeType;
  numbers: string[];
};

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
  { type: "FIRST_PRIZE", numbers: ["300001"] },
  { type: "NEAR_FIRST_PRIZE", numbers: ["300000"] },
  { type: "FRONT_THREE", numbers: ["111"] }
];

const blogParagraphBody = (text: string) => [
  {
    type: "paragraph",
    text
  }
];

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

  const publishedDraws = [
    {
      drawDate: new Date("2026-02-16T00:00:00.000Z"),
      drawCode: "2026-02-16",
      publishedAt: new Date("2026-02-16T09:30:00.000Z"),
      prizeGroups: publishedDrawGroupsTwo
    },
    {
      drawDate: new Date("2026-03-01T00:00:00.000Z"),
      drawCode: "2026-03-01",
      publishedAt: new Date("2026-03-01T09:30:00.000Z"),
      prizeGroups: publishedDrawGroupsOne
    }
  ];

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
      drawDate: new Date("2026-03-16T00:00:00.000Z"),
      drawCode: "2026-03-16-draft",
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
      }
    }
  });

  await prisma.blogPost.create({
    data: {
      slug: "how-to-check-thai-lottery",
      bannerImageUrl: "https://example.com/blog/how-to-check-thai-lottery.jpg",
      status: "published",
      publishedAt: new Date("2026-03-31T08:00:00.000Z"),
      createdByAdminId: bootstrapAdmin.id,
      updatedByAdminId: bootstrapAdmin.id,
      translations: {
        create: [
          {
            locale: "en",
            title: "How to Check Thai Lottery Results",
            body: blogParagraphBody("Learn how to read official Thai lottery results step by step."),
            excerpt: "A simple guide to reading Thai lottery results.",
            seoTitle: "How to Check Thai Lottery Results",
            seoDescription: "Learn how to read and check Thai lottery results."
          },
          {
            locale: "th",
            title: "วิธีตรวจผลสลากกินแบ่งรัฐบาล",
            body: blogParagraphBody("เรียนรู้วิธีอ่านผลสลากกินแบ่งรัฐบาลอย่างเป็นขั้นตอน."),
            excerpt: "คู่มือง่าย ๆ สำหรับการตรวจผลสลากกินแบ่งรัฐบาล",
            seoTitle: "วิธีตรวจผลสลากกินแบ่งรัฐบาล",
            seoDescription: "เรียนรู้วิธีอ่านและตรวจผลสลากกินแบ่งรัฐบาล"
          },
          {
            locale: "my",
            title: "ထိုင်းထီရလဒ် စစ်နည်း",
            body: blogParagraphBody("တရားဝင် ထိုင်းထီရလဒ်ကို အဆင့်လိုက် ဖတ်ရှုစစ်ဆေးနည်းကို လေ့လာပါ။"),
            excerpt: "ထိုင်းထီရလဒ်ကို ဖတ်ရှုစစ်ဆေးရန် လွယ်ကူသော လမ်းညွှန်ချက်",
            seoTitle: "ထိုင်းထီရလဒ် စစ်နည်း",
            seoDescription: "ထိုင်းထီရလဒ်ကို ဖတ်ရှုစစ်ဆေးနည်းကို လေ့လာပါ။"
          }
        ]
      }
    }
  });

  await prisma.blogPost.create({
    data: {
      slug: "thai-lottery-draw-day-tips",
      bannerImageUrl: null,
      status: "published",
      publishedAt: new Date("2026-03-28T08:00:00.000Z"),
      createdByAdminId: bootstrapAdmin.id,
      updatedByAdminId: bootstrapAdmin.id,
      translations: {
        create: [
          {
            locale: "en",
            title: "Thai Lottery Draw Day Tips",
            body: blogParagraphBody("Prepare your ticket numbers and trusted result sources before draw time."),
            excerpt: "Small habits that make draw day easier.",
            seoTitle: null,
            seoDescription: null
          }
        ]
      }
    }
  });

  await prisma.blogPost.create({
    data: {
      slug: "thai-lottery-common-mistakes",
      bannerImageUrl: null,
      status: "draft",
      publishedAt: null,
      createdByAdminId: bootstrapAdmin.id,
      updatedByAdminId: bootstrapAdmin.id,
      translations: {
        create: [
          {
            locale: "th",
            title: "ข้อผิดพลาดที่พบบ่อยในการตรวจหวย",
            body: blogParagraphBody("หลีกเลี่ยงการอ่านหมายเลขสลับตำแหน่งเมื่อเทียบกับผลรางวัล."),
            excerpt: "ข้อควรระวังเมื่อตรวจผลสลากกินแบ่งรัฐบาล",
            seoTitle: null,
            seoDescription: null
          }
        ]
      }
    }
  });
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
