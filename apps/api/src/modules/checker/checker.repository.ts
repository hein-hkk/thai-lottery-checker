import type { PublishStatus, PrizeType } from "@thai-lottery-checker/types";
import { prisma } from "../../db/client.js";

export interface CheckerRepositoryDraw {
  id: string;
  drawDate: Date;
  drawCode: string | null;
  status: PublishStatus;
  publishedAt: Date | null;
}

export interface CheckerRepositoryRow {
  drawId: string;
  prizeType: PrizeType;
  prizeIndex: number;
  number: string;
}

export interface CheckerRepositoryGroupRelease {
  prizeType: PrizeType;
  isReleased: boolean;
}

export interface CheckerRepository {
  findLatestPublicDraw(drawDate: string): Promise<CheckerRepositoryDraw | null>;
  findLatestPublishedDraw(): Promise<CheckerRepositoryDraw | null>;
  findPublicDrawByDate(drawDate: string, bangkokToday: string): Promise<CheckerRepositoryDraw | null>;
  findCheckerDrawOptions(bangkokToday: string): Promise<CheckerRepositoryDraw[]>;
  findResultsByDrawId(drawId: string): Promise<CheckerRepositoryRow[]>;
  findGroupReleasesByDrawId(drawId: string): Promise<CheckerRepositoryGroupRelease[]>;
}

function toDrawDate(date: string): Date {
  return new Date(`${date}T00:00:00.000Z`);
}

export const prismaCheckerRepository: CheckerRepository = {
  async findLatestPublicDraw(drawDate) {
    return prisma.lotteryDraw.findFirst({
      where: {
        status: "draft",
        drawDate: toDrawDate(drawDate)
      },
      orderBy: [{ drawDate: "desc" }],
      select: {
        id: true,
        drawDate: true,
        drawCode: true,
        status: true,
        publishedAt: true
      }
    });
  },

  async findLatestPublishedDraw() {
    return prisma.lotteryDraw.findFirst({
      where: { status: "published" },
      orderBy: [{ drawDate: "desc" }],
      select: {
        id: true,
        drawDate: true,
        drawCode: true,
        status: true,
        publishedAt: true
      }
    });
  },

  async findPublicDrawByDate(drawDate, bangkokToday) {
    return prisma.lotteryDraw.findFirst({
      where: {
        drawDate: toDrawDate(drawDate),
        OR: [
          { status: "published" },
          {
            status: "draft",
            drawDate: toDrawDate(bangkokToday)
          }
        ]
      },
      select: {
        id: true,
        drawDate: true,
        drawCode: true,
        status: true,
        publishedAt: true
      }
    });
  },

  async findCheckerDrawOptions(bangkokToday) {
    return prisma.lotteryDraw.findMany({
      where: {
        OR: [
          { status: "published" },
          {
            status: "draft",
            drawDate: toDrawDate(bangkokToday)
          }
        ]
      },
      orderBy: [{ drawDate: "desc" }],
      select: {
        id: true,
        drawDate: true,
        drawCode: true,
        status: true,
        publishedAt: true
      }
    });
  },

  async findResultsByDrawId(drawId) {
    return prisma.lotteryResult.findMany({
      where: { drawId },
      orderBy: [{ prizeIndex: "asc" }],
      select: {
        drawId: true,
        prizeType: true,
        prizeIndex: true,
        number: true
      }
    });
  },

  async findGroupReleasesByDrawId(drawId) {
    return prisma.lotteryResultGroupRelease.findMany({
      where: { drawId },
      select: {
        prizeType: true,
        isReleased: true
      }
    });
  }
};
