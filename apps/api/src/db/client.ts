import { PrismaPg } from "@prisma/adapter-pg";
import { getApiEnv } from "../config/env.js";
import { PrismaClient } from "../generated/prisma/client.js";

const adapter = new PrismaPg({
  connectionString: getApiEnv().DATABASE_URL
});

declare global {
  var __thaiLotteryPrisma__: PrismaClient | undefined;
}

export const prisma =
  globalThis.__thaiLotteryPrisma__ ??
  new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"]
  });

if (process.env.NODE_ENV !== "production") {
  globalThis.__thaiLotteryPrisma__ = prisma;
}

export async function checkDatabaseConnection(): Promise<boolean> {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return true;
  } catch {
    return false;
  }
}

export async function disconnectDatabase(): Promise<void> {
  await prisma.$disconnect();
}
