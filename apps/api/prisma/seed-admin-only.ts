import { getApiEnv } from "../src/config/env.js";
import { prisma } from "../src/db/client.js";
import { hashPassword } from "../src/modules/admin-auth/admin-auth.crypto.js";

export async function seedAdminOnly(): Promise<void> {
  const env = getApiEnv();
  const passwordHash = await hashPassword(env.ADMIN_BOOTSTRAP_PASSWORD);
  const bootstrapEmail = env.ADMIN_BOOTSTRAP_EMAIL.toLowerCase();
  const passwordUpdatedAt = new Date();

  await prisma.$transaction(async (tx) => {
    await tx.blogPostTranslation.deleteMany();
    await tx.blogPost.deleteMany();
    await tx.adminAuditLog.deleteMany();
    await tx.adminPasswordReset.deleteMany();
    await tx.adminInvitation.deleteMany();
    await tx.adminPermissionGrant.deleteMany();
    await tx.lotteryResultGroupRelease.deleteMany();
    await tx.lotteryResult.deleteMany();
    await tx.lotteryDraw.deleteMany();
    await tx.admin.deleteMany({
      where: {
        email: {
          not: bootstrapEmail
        }
      }
    });

    await tx.admin.upsert({
      where: { email: bootstrapEmail },
      update: {
        name: env.ADMIN_BOOTSTRAP_NAME,
        passwordHash,
        role: "super_admin",
        isActive: true,
        deactivatedAt: null,
        invitedByAdminId: null,
        lastLoginAt: null,
        passwordUpdatedAt
      },
      create: {
        email: bootstrapEmail,
        name: env.ADMIN_BOOTSTRAP_NAME,
        passwordHash,
        role: "super_admin",
        isActive: true,
        passwordUpdatedAt
      }
    });
  });
}

if (import.meta.url === new URL(process.argv[1], "file:").href) {
  seedAdminOnly()
    .then(async () => {
      await prisma.$disconnect();
    })
    .catch(async (error) => {
      console.error("Admin-only seed failed", error);
      await prisma.$disconnect();
      process.exit(1);
    });
}
