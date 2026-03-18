import type { PublishStatus, PrizeType } from "@thai-lottery-checker/types";
import { prisma } from "../../db/client.js";

export interface AdminResultRepositoryDraw {
  id: string;
  drawDate: Date;
  drawCode: string | null;
  status: PublishStatus;
  publishedAt: Date | null;
  updatedAt: Date;
  updatedByAdminId: string;
}

export interface AdminResultRepositoryRow {
  drawId: string;
  prizeType: PrizeType;
  prizeIndex: number;
  number: string;
}

export interface CreateAdminResultInput {
  drawDate: Date;
  drawCode: string | null;
  adminId: string;
  rows: AdminResultRepositoryRow[];
}

export interface UpdateAdminResultInput {
  drawId: string;
  drawDate: Date;
  drawCode: string | null;
  adminId: string;
  rows: AdminResultRepositoryRow[];
}

export interface CorrectAdminResultInput {
  drawId: string;
  drawDate: Date;
  drawCode: string | null;
  adminId: string;
  rows: AdminResultRepositoryRow[];
}

export interface AdminResultsRepository {
  listAdminResults(): Promise<AdminResultRepositoryDraw[]>;
  findDrawById(drawId: string): Promise<AdminResultRepositoryDraw | null>;
  findDrawByDate(drawDate: Date): Promise<AdminResultRepositoryDraw | null>;
  findRowsByDrawId(drawId: string): Promise<AdminResultRepositoryRow[]>;
  createDraftResult(input: CreateAdminResultInput): Promise<AdminResultRepositoryDraw>;
  updateDraftResult(input: UpdateAdminResultInput): Promise<AdminResultRepositoryDraw>;
  publishDraftResult(drawId: string, adminId: string, publishedAt: Date): Promise<AdminResultRepositoryDraw>;
  correctPublishedResult(input: CorrectAdminResultInput): Promise<AdminResultRepositoryDraw>;
}

function drawSelect() {
  return {
    id: true,
    drawDate: true,
    drawCode: true,
    status: true,
    publishedAt: true,
    updatedAt: true,
    updatedByAdminId: true
  } as const;
}

export const prismaAdminResultsRepository: AdminResultsRepository = {
  async listAdminResults() {
    return prisma.lotteryDraw.findMany({
      orderBy: [{ drawDate: "desc" }],
      select: drawSelect()
    });
  },

  async findDrawById(drawId) {
    return prisma.lotteryDraw.findUnique({
      where: { id: drawId },
      select: drawSelect()
    });
  },

  async findDrawByDate(drawDate) {
    return prisma.lotteryDraw.findUnique({
      where: { drawDate },
      select: drawSelect()
    });
  },

  async findRowsByDrawId(drawId) {
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

  async createDraftResult(input) {
    return prisma.lotteryDraw.create({
      data: {
        drawDate: input.drawDate,
        drawCode: input.drawCode,
        status: "draft",
        createdByAdminId: input.adminId,
        updatedByAdminId: input.adminId,
        results: {
          createMany: {
            data: input.rows.map((row) => ({
              prizeType: row.prizeType,
              prizeIndex: row.prizeIndex,
              number: row.number
            }))
          }
        }
      },
      select: drawSelect()
    });
  },

  async updateDraftResult(input) {
    return prisma.$transaction(async (tx) => {
      await tx.lotteryResult.deleteMany({
        where: { drawId: input.drawId }
      });

      await tx.lotteryDraw.update({
        where: { id: input.drawId },
        data: {
          drawDate: input.drawDate,
          drawCode: input.drawCode,
          updatedByAdminId: input.adminId
        }
      });

      if (input.rows.length > 0) {
        await tx.lotteryResult.createMany({
          data: input.rows.map((row) => ({
            drawId: input.drawId,
            prizeType: row.prizeType,
            prizeIndex: row.prizeIndex,
            number: row.number
          }))
        });
      }

      return tx.lotteryDraw.findUniqueOrThrow({
        where: { id: input.drawId },
        select: drawSelect()
      });
    });
  },

  async publishDraftResult(drawId, adminId, publishedAt) {
    return prisma.lotteryDraw.update({
      where: { id: drawId },
      data: {
        status: "published",
        publishedAt,
        updatedByAdminId: adminId
      },
      select: drawSelect()
    });
  },

  async correctPublishedResult(input) {
    return prisma.$transaction(async (tx) => {
      await tx.lotteryResult.deleteMany({
        where: { drawId: input.drawId }
      });

      await tx.lotteryDraw.update({
        where: { id: input.drawId },
        data: {
          drawDate: input.drawDate,
          drawCode: input.drawCode,
          updatedByAdminId: input.adminId
        }
      });

      if (input.rows.length > 0) {
        await tx.lotteryResult.createMany({
          data: input.rows.map((row) => ({
            drawId: input.drawId,
            prizeType: row.prizeType,
            prizeIndex: row.prizeIndex,
            number: row.number
          }))
        });
      }

      return tx.lotteryDraw.findUniqueOrThrow({
        where: { id: input.drawId },
        select: drawSelect()
      });
    });
  }
};
