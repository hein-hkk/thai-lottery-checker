import { z, ZodError } from "zod";
import { adminResultListQuerySchema, adminResultWriteRequestSchema, prizeTypeSchema } from "@thai-lottery-checker/schemas";
import type {
  AdminResultDetailResponse,
  AdminResultListQuery,
  AdminResultListResponse,
  AdminResultPublishResponse,
  AdminResultWriteRequest,
  AuthenticatedAdmin,
  GroupableLotteryResult,
  PrizeType
} from "@thai-lottery-checker/types";
import { getExpectedPrizeCount, getPrizeDigitLength } from "@thai-lottery-checker/domain";
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
  type AdminResultRepositoryGroupRelease,
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
  listResults(actor: AuthenticatedAdmin, query: unknown): Promise<AdminResultListResponse>;
  getResultDetail(actor: AuthenticatedAdmin, drawId: string): Promise<AdminResultDetailResponse>;
  createDraft(actor: AuthenticatedAdmin, input: unknown): Promise<AdminResultDetailResponse>;
  updateDraft(actor: AuthenticatedAdmin, drawId: string, input: unknown): Promise<AdminResultDetailResponse>;
  releaseGroup(actor: AuthenticatedAdmin, drawId: string, prizeType: string): Promise<AdminResultDetailResponse>;
  unreleaseGroup(actor: AuthenticatedAdmin, drawId: string, prizeType: string): Promise<AdminResultDetailResponse>;
  publishDraft(actor: AuthenticatedAdmin, drawId: string): Promise<AdminResultPublishResponse>;
  correctPublished(actor: AuthenticatedAdmin, drawId: string, input: unknown): Promise<AdminResultDetailResponse>;
}

export function createAdminResultsService(
  repository: AdminResultsRepository = prismaAdminResultsRepository,
  cache: AdminResultsCache = noopAdminResultsCache
): AdminResultsService {
  return {
    async listResults(actor, query) {
      requireAdminPermission(actor, "manage_results");
      const parsed = parseListQuery(query);
      const payload = await repository.listAdminResults(parsed.page, parsed.limit);
      return mapAdminResultListResponse(payload.items, parsed.page, parsed.limit, payload.total);
    },

    async getResultDetail(actor, drawId) {
      requireAdminPermission(actor, "manage_results");
      const parsedDrawId = parseUuidParam(drawId, "Result id");
      const draw = await repository.findDrawById(parsedDrawId);

      if (!draw) {
        throw adminResultNotFoundError();
      }

      const [rows, releases] = await Promise.all([
        repository.findRowsByDrawId(draw.id),
        repository.findGroupReleasesByDrawId(draw.id)
      ]);
      return mapAdminResultDetailResponse(draw, rows, releases);
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
      const [rows, releases] = await Promise.all([
        repository.findRowsByDrawId(draw.id),
        repository.findGroupReleasesByDrawId(draw.id)
      ]);

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

      return mapAdminResultDetailResponse(draw, rows, releases);
    },

    async updateDraft(actor, drawId, input) {
      requireAdminPermission(actor, "manage_results");
      const parsedDrawId = parseUuidParam(drawId, "Result id");
      const existingDraw = await repository.findDrawById(parsedDrawId);

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

      const [beforeRows, releaseStates] = await Promise.all([
        repository.findRowsByDrawId(existingDraw.id),
        repository.findGroupReleasesByDrawId(existingDraw.id)
      ]);
      const normalized = normalizePrizeGroups(parsed.prizeGroups);
      ensureReleasedGroupsRemainValid(normalized.prizeGroups, releaseStates);
      const updatedDraw = await repository.updateDraftResult({
        drawId: existingDraw.id,
        drawDate,
        drawCode: normalizeDrawCode(parsed.drawCode),
        adminId: actor.id,
        rows: normalized.rows.map((row) => ({ ...row, drawId: existingDraw.id }))
      });
      const [updatedRows, updatedReleases] = await Promise.all([
        repository.findRowsByDrawId(existingDraw.id),
        repository.findGroupReleasesByDrawId(existingDraw.id)
      ]);

      await createAuditLog({
        adminId: actor.id,
        action: didReleasedGroupChange(beforeRows, normalized.rows, releaseStates) ? "update_released_result_group" : "update_result",
        entityId: existingDraw.id,
        beforeData: mapAuditSnapshot(existingDraw, beforeRows),
        afterData: mapAuditSnapshot(updatedDraw, updatedRows)
      });

      return mapAdminResultDetailResponse(updatedDraw, updatedRows, updatedReleases);
    },

    async releaseGroup(actor, drawId, prizeType) {
      requireAdminPermission(actor, "manage_results");
      const parsedDrawId = parseUuidParam(drawId, "Result id");
      const existingDraw = await repository.findDrawById(parsedDrawId);

      if (!existingDraw) {
        throw adminResultNotFoundError();
      }

      if (existingDraw.status !== "draft") {
        throw adminResultInvalidStateError("Only draft result groups can be released");
      }

      const parsedPrizeType = parsePrizeType(prizeType);
      const [rows, beforeReleases] = await Promise.all([
        repository.findRowsByDrawId(existingDraw.id),
        repository.findGroupReleasesByDrawId(existingDraw.id)
      ]);

      ensurePrizeGroupCanBeReleased(mapRowsToPrizeGroups(rows), parsedPrizeType);

      await repository.setGroupRelease(existingDraw.id, parsedPrizeType, true, actor.id, new Date());
      const [afterDraw, afterReleases] = await Promise.all([
        repository.findDrawById(existingDraw.id),
        repository.findGroupReleasesByDrawId(existingDraw.id)
      ]);

      if (!afterDraw) {
        throw adminResultNotFoundError();
      }

      await createAuditLog({
        adminId: actor.id,
        action: "release_result_group",
        entityId: existingDraw.id,
        beforeData: {
          prizeType: parsedPrizeType,
          releases: mapReleaseAudit(beforeReleases)
        },
        afterData: {
          prizeType: parsedPrizeType,
          releases: mapReleaseAudit(afterReleases)
        }
      });

      await cache.invalidateResultCaches();

      return mapAdminResultDetailResponse(afterDraw, rows, afterReleases);
    },

    async unreleaseGroup(actor, drawId, prizeType) {
      requireAdminPermission(actor, "manage_results");
      const parsedDrawId = parseUuidParam(drawId, "Result id");
      const existingDraw = await repository.findDrawById(parsedDrawId);

      if (!existingDraw) {
        throw adminResultNotFoundError();
      }

      if (existingDraw.status !== "draft") {
        throw adminResultInvalidStateError("Only draft result groups can be unreleased");
      }

      const parsedPrizeType = parsePrizeType(prizeType);
      const [rows, beforeReleases] = await Promise.all([
        repository.findRowsByDrawId(existingDraw.id),
        repository.findGroupReleasesByDrawId(existingDraw.id)
      ]);

      await repository.setGroupRelease(existingDraw.id, parsedPrizeType, false, actor.id, null);
      const [afterDraw, afterReleases] = await Promise.all([
        repository.findDrawById(existingDraw.id),
        repository.findGroupReleasesByDrawId(existingDraw.id)
      ]);

      if (!afterDraw) {
        throw adminResultNotFoundError();
      }

      await createAuditLog({
        adminId: actor.id,
        action: "unrelease_result_group",
        entityId: existingDraw.id,
        beforeData: {
          prizeType: parsedPrizeType,
          releases: mapReleaseAudit(beforeReleases)
        },
        afterData: {
          prizeType: parsedPrizeType,
          releases: mapReleaseAudit(afterReleases)
        }
      });

      await cache.invalidateResultCaches();

      return mapAdminResultDetailResponse(afterDraw, rows, afterReleases);
    },

    async publishDraft(actor, drawId) {
      requireAdminPermission(actor, "manage_results");
      const parsedDrawId = parseUuidParam(drawId, "Result id");
      const existingDraw = await repository.findDrawById(parsedDrawId);

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
      const [publishedRows, publishedReleases] = await Promise.all([
        repository.findRowsByDrawId(existingDraw.id),
        repository.findGroupReleasesByDrawId(existingDraw.id)
      ]);

      await createAuditLog({
        adminId: actor.id,
        action: "publish_result",
        entityId: existingDraw.id,
        afterData: mapAuditSnapshot(publishedDraw, publishedRows)
      });

      await cache.invalidateResultCaches();

      return mapAdminResultDetailResponse(publishedDraw, publishedRows, publishedReleases);
    },

    async correctPublished(actor, drawId, input) {
      requireAdminPermission(actor, "manage_results");
      const parsedDrawId = parseUuidParam(drawId, "Result id");
      const existingDraw = await repository.findDrawById(parsedDrawId);

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
      const [correctedRows, correctedReleases] = await Promise.all([
        repository.findRowsByDrawId(existingDraw.id),
        repository.findGroupReleasesByDrawId(existingDraw.id)
      ]);

      await createAuditLog({
        adminId: actor.id,
        action: "correct_result",
        entityId: existingDraw.id,
        beforeData: mapAuditSnapshot(existingDraw, beforeRows),
        afterData: mapAuditSnapshot(correctedDraw, correctedRows)
      });

      await cache.invalidateResultCaches();

      return mapAdminResultDetailResponse(correctedDraw, correctedRows, correctedReleases);
    }
  };
}

function parseListQuery(input: unknown): Required<AdminResultListQuery> {
  try {
    return adminResultListQuerySchema.parse(input);
  } catch (error) {
    if (error instanceof ZodError) {
      throw invalidAdminResultRequestError("Admin result list query is invalid");
    }

    throw error;
  }
}

function parseUuidParam(input: string, label: string): string {
  try {
    return z.string().uuid().parse(input);
  } catch (error) {
    if (error instanceof ZodError) {
      throw invalidAdminResultRequestError(`${label} is invalid`);
    }

    throw error;
  }
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

function parsePrizeType(input: string): PrizeType {
  try {
    return prizeTypeSchema.parse(input);
  } catch (error) {
    if (error instanceof ZodError) {
      throw invalidAdminResultRequestError("Prize type is invalid");
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

function ensurePrizeGroupCanBeReleased(
  prizeGroups: ReturnType<typeof mapRowsToPrizeGroups>,
  prizeType: PrizeType
): void {
  const prizeGroup = prizeGroups.find((group) => group.type === prizeType);

  if (!prizeGroup) {
    throw adminResultDataInvalidError("Prize group is incomplete or invalid for staged release");
  }

  if (prizeGroup.numbers.length !== getExpectedPrizeCount(prizeType)) {
    throw adminResultDataInvalidError("Prize group is incomplete or invalid for staged release");
  }

  if (prizeGroup.numbers.some((number) => number.length !== getPrizeDigitLength(prizeType))) {
    throw adminResultDataInvalidError("Prize group is incomplete or invalid for staged release");
  }
}

function ensureReleasedGroupsRemainValid(
  prizeGroups: ReturnType<typeof mapRowsToPrizeGroups>,
  releases: readonly AdminResultRepositoryGroupRelease[]
): void {
  for (const release of releases) {
    if (!release.isReleased) {
      continue;
    }

    ensurePrizeGroupCanBeReleased(prizeGroups, release.prizeType);
  }
}

function didReleasedGroupChange(
  beforeRows: readonly GroupableLotteryResult[],
  afterRows: readonly GroupableLotteryResult[],
  releases: readonly AdminResultRepositoryGroupRelease[]
): boolean {
  const releasedPrizeTypes = new Set(releases.filter((release) => release.isReleased).map((release) => release.prizeType));

  if (releasedPrizeTypes.size === 0) {
    return false;
  }

  const filterRows = (rows: readonly GroupableLotteryResult[]) =>
    rows
      .filter((row) => releasedPrizeTypes.has(row.prizeType))
      .map((row) => `${row.prizeType}:${row.prizeIndex}:${row.number}`)
      .sort();

  return JSON.stringify(filterRows(beforeRows)) !== JSON.stringify(filterRows(afterRows));
}

function mapReleaseAudit(releases: readonly AdminResultRepositoryGroupRelease[]) {
  return releases.map((release) => ({
    prizeType: release.prizeType,
    isReleased: release.isReleased,
    releasedAt: release.releasedAt?.toISOString() ?? null,
    releasedByAdminId: release.releasedByAdminId
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
