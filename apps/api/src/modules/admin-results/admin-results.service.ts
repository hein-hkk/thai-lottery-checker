import { ZodError } from "zod";
import { adminResultWriteRequestSchema } from "@thai-lottery-checker/schemas";
import type {
  AdminResultDetailResponse,
  AdminResultListResponse,
  AdminResultPublishResponse,
  AdminResultWriteRequest,
  AuthenticatedAdmin,
  GroupableLotteryResult
} from "@thai-lottery-checker/types";
import { requireAdminPermission } from "../admin-auth/admin-auth.service.js";
import { noopAdminResultsCache, type AdminResultsCache } from "./admin-results.cache.js";
import {
  adminResultDataInvalidError,
  adminResultDuplicateDrawDateError,
  adminResultInvalidStateError,
  adminResultNotFoundError,
  invalidAdminResultRequestError
} from "./admin-results.errors.js";
import { mapAdminResultDetailResponse, mapAdminResultListResponse } from "./admin-results.mapper.js";
import { normalizePrizeGroups } from "./admin-results.normalize.js";
import {
  prismaAdminResultsRepository,
  type AdminResultRepositoryDraw,
  type AdminResultsRepository
} from "./admin-results.repository.js";
import { prisma } from "../../db/client.js";

function toDrawDate(value: string): Date {
  return new Date(`${value}T00:00:00.000Z`);
}

function normalizeDrawCode(value: string | null | undefined): string | null {
  if (value === undefined) {
    return null;
  }

  return value === null ? null : value.trim();
}

function rowsToAudit(rows: readonly GroupableLotteryResult[]): Array<Record<string, unknown>> {
  return rows.map((row) => ({
    prizeType: row.prizeType,
    prizeIndex: row.prizeIndex,
    number: row.number
  }));
}

async function createAuditLog(input: {
  adminId: string;
  action: string;
  entityId: string;
  beforeData?: unknown;
  afterData?: unknown;
}): Promise<void> {
  const beforeData = input.beforeData === undefined ? undefined : JSON.parse(JSON.stringify(input.beforeData));
  const afterData = input.afterData === undefined ? undefined : JSON.parse(JSON.stringify(input.afterData));

  await prisma.adminAuditLog.create({
    data: {
      adminId: input.adminId,
      action: input.action,
      entityType: "lottery_draw",
      entityId: input.entityId,
      beforeData,
      afterData
    }
  });
}

export interface AdminResultsService {
  listResults(actor: AuthenticatedAdmin): Promise<AdminResultListResponse>;
  getResultDetail(actor: AuthenticatedAdmin, drawId: string): Promise<AdminResultDetailResponse>;
  createDraft(actor: AuthenticatedAdmin, input: unknown): Promise<AdminResultDetailResponse>;
  updateDraft(actor: AuthenticatedAdmin, drawId: string, input: unknown): Promise<AdminResultDetailResponse>;
  publishDraft(actor: AuthenticatedAdmin, drawId: string): Promise<AdminResultPublishResponse>;
  correctPublished(actor: AuthenticatedAdmin, drawId: string, input: unknown): Promise<AdminResultDetailResponse>;
}

export function createAdminResultsService(
  repository: AdminResultsRepository = prismaAdminResultsRepository,
  cache: AdminResultsCache = noopAdminResultsCache
): AdminResultsService {
  return {
    async listResults(actor) {
      requireAdminPermission(actor, "manage_results");
      const draws = await repository.listAdminResults();
      return mapAdminResultListResponse(draws);
    },

    async getResultDetail(actor, drawId) {
      requireAdminPermission(actor, "manage_results");
      const draw = await repository.findDrawById(drawId);

      if (!draw) {
        throw adminResultNotFoundError();
      }

      const rows = await repository.findRowsByDrawId(draw.id);
      return mapAdminResultDetailResponse(draw, rows);
    },

    async createDraft(actor, input) {
      requireAdminPermission(actor, "manage_results");
      const parsed = parseWriteRequest(input);
      const drawDate = toDrawDate(parsed.drawDate);

      if (await repository.findDrawByDate(drawDate)) {
        throw adminResultDuplicateDrawDateError();
      }

      const normalized = normalizePrizeGroups(parsed.prizeGroups);
      const draw = await repository.createDraftResult({
        drawDate,
        drawCode: normalizeDrawCode(parsed.drawCode),
        adminId: actor.id,
        rows: normalized.rows.map((row) => ({ ...row, drawId: "" }))
      });
      const rows = await repository.findRowsByDrawId(draw.id);

      await createAuditLog({
        adminId: actor.id,
        action: "create_result",
        entityId: draw.id,
        afterData: {
          drawDate: parsed.drawDate,
          drawCode: normalizeDrawCode(parsed.drawCode),
          status: "draft",
          prizeGroups: normalized.prizeGroups,
          rows: rowsToAudit(normalized.rows)
        }
      });

      return mapAdminResultDetailResponse(draw, rows);
    },

    async updateDraft(actor, drawId, input) {
      requireAdminPermission(actor, "manage_results");
      const existingDraw = await repository.findDrawById(drawId);

      if (!existingDraw) {
        throw adminResultNotFoundError();
      }

      if (existingDraw.status !== "draft") {
        throw adminResultInvalidStateError("Only draft results can be updated");
      }

      const parsed = parseWriteRequest(input);
      const drawDate = toDrawDate(parsed.drawDate);
      const duplicateByDate = await repository.findDrawByDate(drawDate);

      if (duplicateByDate && duplicateByDate.id !== existingDraw.id) {
        throw adminResultDuplicateDrawDateError();
      }

      const beforeRows = await repository.findRowsByDrawId(existingDraw.id);
      const normalized = normalizePrizeGroups(parsed.prizeGroups);
      const updatedDraw = await repository.updateDraftResult({
        drawId: existingDraw.id,
        drawDate,
        drawCode: normalizeDrawCode(parsed.drawCode),
        adminId: actor.id,
        rows: normalized.rows.map((row) => ({ ...row, drawId: existingDraw.id }))
      });
      const updatedRows = await repository.findRowsByDrawId(existingDraw.id);

      await createAuditLog({
        adminId: actor.id,
        action: "update_result",
        entityId: existingDraw.id,
        beforeData: mapAuditSnapshot(existingDraw, beforeRows),
        afterData: mapAuditSnapshot(updatedDraw, updatedRows)
      });

      return mapAdminResultDetailResponse(updatedDraw, updatedRows);
    },

    async publishDraft(actor, drawId) {
      requireAdminPermission(actor, "manage_results");
      const existingDraw = await repository.findDrawById(drawId);

      if (!existingDraw) {
        throw adminResultNotFoundError();
      }

      if (existingDraw.status !== "draft") {
        throw adminResultInvalidStateError("Only draft results can be published");
      }

      const rows = await repository.findRowsByDrawId(existingDraw.id);
      const normalized = normalizePrizeGroups(
        mapRowsToPrizeGroups(rows),
        { requireComplete: true }
      );

      if (normalized.rows.length === 0) {
        throw adminResultDataInvalidError("Result prize groups are incomplete or invalid for publish/correction");
      }

      const publishedAt = existingDraw.publishedAt ?? new Date();
      const publishedDraw = await repository.publishDraftResult(existingDraw.id, actor.id, publishedAt);
      const publishedRows = await repository.findRowsByDrawId(existingDraw.id);

      await createAuditLog({
        adminId: actor.id,
        action: "publish_result",
        entityId: existingDraw.id,
        afterData: mapAuditSnapshot(publishedDraw, publishedRows)
      });

      await cache.invalidateResultCaches();

      return mapAdminResultDetailResponse(publishedDraw, publishedRows);
    },

    async correctPublished(actor, drawId, input) {
      requireAdminPermission(actor, "manage_results");
      const existingDraw = await repository.findDrawById(drawId);

      if (!existingDraw) {
        throw adminResultNotFoundError();
      }

      if (existingDraw.status !== "published") {
        throw adminResultInvalidStateError("Only published results can be corrected");
      }

      const parsed = parseWriteRequest(input);
      const drawDate = toDrawDate(parsed.drawDate);
      const duplicateByDate = await repository.findDrawByDate(drawDate);

      if (duplicateByDate && duplicateByDate.id !== existingDraw.id) {
        throw adminResultDuplicateDrawDateError();
      }

      const beforeRows = await repository.findRowsByDrawId(existingDraw.id);
      const normalized = normalizePrizeGroups(parsed.prizeGroups, { requireComplete: true });
      const correctedDraw = await repository.correctPublishedResult({
        drawId: existingDraw.id,
        drawDate,
        drawCode: normalizeDrawCode(parsed.drawCode),
        adminId: actor.id,
        rows: normalized.rows.map((row) => ({ ...row, drawId: existingDraw.id }))
      });
      const correctedRows = await repository.findRowsByDrawId(existingDraw.id);

      await createAuditLog({
        adminId: actor.id,
        action: "correct_result",
        entityId: existingDraw.id,
        beforeData: mapAuditSnapshot(existingDraw, beforeRows),
        afterData: mapAuditSnapshot(correctedDraw, correctedRows)
      });

      await cache.invalidateResultCaches();

      return mapAdminResultDetailResponse(correctedDraw, correctedRows);
    }
  };
}

function parseWriteRequest(input: unknown): AdminResultWriteRequest {
  try {
    return adminResultWriteRequestSchema.parse(input);
  } catch (error) {
    if (error instanceof ZodError) {
      throw invalidAdminResultRequestError("Admin result request is invalid");
    }

    throw error;
  }
}

function mapRowsToPrizeGroups(rows: readonly GroupableLotteryResult[]) {
  const groups = new Map<string, string[]>();

  for (const row of rows) {
    const existing = groups.get(row.prizeType) ?? [];
    existing[row.prizeIndex] = row.number;
    groups.set(row.prizeType, existing);
  }

  return [...groups.entries()].map(([type, numbers]) => ({
    type: type as GroupableLotteryResult["prizeType"],
    numbers
  }));
}

function mapAuditSnapshot(draw: AdminResultRepositoryDraw, rows: readonly GroupableLotteryResult[]) {
  return {
    drawDate: draw.drawDate.toISOString(),
    drawCode: draw.drawCode,
    status: draw.status,
    publishedAt: draw.publishedAt?.toISOString() ?? null,
    rows: rowsToAudit(rows)
  };
}
