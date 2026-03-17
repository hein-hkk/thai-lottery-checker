import type { PrizeType } from "@thai-lottery-checker/types";
import { prisma } from "../../db/client.js";

export interface ResultRepositoryDraw {
  id: string;
  drawDate: Date;
  drawCode: string | null;
  publishedAt: Date | null;
}

export interface ResultRepositoryRow {
  drawId: string;
  prizeType: PrizeType;
  prizeIndex: number;
  number: string;
}

export interface ResultHistoryRepositoryPayload {
  draws: ResultRepositoryDraw[];
  total: number;
  summaryRows: ResultRepositoryRow[];
}

export interface ResultsRepository {
  findLatestPublishedDraw(): Promise<ResultRepositoryDraw | null>;
  findPublishedDrawByDate(drawDate: string): Promise<ResultRepositoryDraw | null>;
  findPublishedDrawHistory(page: number, limit: number): Promise<ResultHistoryRepositoryPayload>;
  findResultsByDrawId(drawId: string): Promise<ResultRepositoryRow[]>;
}

function toDrawDate(date: string): Date {
  return new Date(`${date}T00:00:00.000Z`);
}

export const prismaResultsRepository: ResultsRepository = {
  async findLatestPublishedDraw() {
    return prisma.lotteryDraw.findFirst({
      where: { status: "published" },
      orderBy: [{ drawDate: "desc" }],
      select: {
        id: true,
        drawDate: true,
        drawCode: true,
        publishedAt: true
      }
    });
  },

  async findPublishedDrawByDate(drawDate: string) {
    return prisma.lotteryDraw.findFirst({
      where: {
        drawDate: toDrawDate(drawDate),
        status: "published"
      },
      select: {
        id: true,
        drawDate: true,
        drawCode: true,
        publishedAt: true
      }
    });
  },

  async findPublishedDrawHistory(page: number, limit: number) {
    const skip = (page - 1) * limit;
    const [draws, total] = await prisma.$transaction([
      prisma.lotteryDraw.findMany({
        where: { status: "published" },
        orderBy: [{ drawDate: "desc" }],
        skip,
        take: limit,
        select: {
          id: true,
          drawDate: true,
          drawCode: true,
          publishedAt: true
        }
      }),
      prisma.lotteryDraw.count({
        where: { status: "published" }
      })
    ]);

    const drawIds = draws.map((draw) => draw.id);
    const summaryRows =
      drawIds.length === 0
        ? []
        : await prisma.lotteryResult.findMany({
            where: {
              drawId: { in: drawIds },
              prizeType: { in: ["FIRST_PRIZE", "LAST_TWO"] }
            },
            orderBy: [{ prizeIndex: "asc" }],
            select: {
              drawId: true,
              prizeType: true,
              prizeIndex: true,
              number: true
            }
          });

    return {
      draws,
      total,
      summaryRows
    };
  },

  async findResultsByDrawId(drawId: string) {
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
  }
};
