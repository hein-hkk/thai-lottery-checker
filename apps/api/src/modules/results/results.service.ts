import { ZodError } from "zod";
import type { ResultDetailResponse, ResultHistoryResponse } from "@thai-lottery-checker/types";
import { drawDateParamSchema, historyQuerySchema } from "@thai-lottery-checker/schemas";
import {
  getExpectedPrizeCount,
  getPrizeDigitLength,
  groupPrizeRows,
  hasCompletePrizeGroups
} from "@thai-lottery-checker/domain";
import {
  invalidDrawDateError,
  invalidQueryError,
  resultDataInvalidError,
  resultNotFoundError
} from "./results.errors.js";
import {
  mapResultDetailResponse,
  mapResultHistoryItem
} from "./results.mapper.js";
import type {
  ResultRepositoryDraw,
  ResultRepositoryGroupRelease,
  ResultRepositoryRow,
  ResultsRepository
} from "./results.repository.js";
import { prismaResultsRepository } from "./results.repository.js";

const bangkokDateFormatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: "Asia/Bangkok",
  year: "numeric",
  month: "2-digit",
  day: "2-digit"
});

function getBangkokToday(): string {
  const parts = bangkokDateFormatter.formatToParts(new Date());
  const year = parts.find((part) => part.type === "year")?.value;
  const month = parts.find((part) => part.type === "month")?.value;
  const day = parts.find((part) => part.type === "day")?.value;

  if (!year || !month || !day) {
    throw new Error("Failed to resolve Bangkok date");
  }

  return `${year}-${month}-${day}`;
}

function ensureCompletePublishedDraw(rows: readonly ResultRepositoryRow[]): void {
  const prizeGroups = groupPrizeRows(rows);

  if (!hasCompletePrizeGroups(prizeGroups)) {
    throw resultDataInvalidError();
  }
}

function extractHistorySummary(rows: readonly ResultRepositoryRow[]): {
  firstPrize: string;
  frontThree: string[];
  lastThree: string[];
  lastTwo: string;
} {
  const firstPrize = rows.find((row) => row.prizeType === "FIRST_PRIZE")?.number;
  const frontThree = rows.filter((row) => row.prizeType === "FRONT_THREE").map((row) => row.number);
  const lastThree = rows.filter((row) => row.prizeType === "LAST_THREE").map((row) => row.number);
  const lastTwo = rows.find((row) => row.prizeType === "LAST_TWO")?.number;

  if (!firstPrize || !lastTwo || frontThree.length !== 2 || lastThree.length !== 2) {
    throw resultDataInvalidError();
  }

  return {
    firstPrize,
    frontThree,
    lastThree,
    lastTwo
  };
}

function ensureReleasedPrizeGroupsAreValid(rows: readonly ResultRepositoryRow[], releases: readonly ResultRepositoryGroupRelease[]): void {
  const releaseStateMap = new Map(releases.map((release) => [release.prizeType, release.isReleased]));
  const grouped = groupPrizeRows(
    rows,
    Object.fromEntries(releaseStateMap.entries())
  );

  for (const prizeGroup of grouped) {
    if (!prizeGroup.isReleased) {
      continue;
    }

    if (prizeGroup.numbers.length !== getExpectedPrizeCount(prizeGroup.type)) {
      throw resultDataInvalidError();
    }

    if (prizeGroup.numbers.some((number) => number.length !== getPrizeDigitLength(prizeGroup.type))) {
      throw resultDataInvalidError();
    }
  }
}

export interface ResultsService {
  getLatestResults(): Promise<ResultDetailResponse>;
  getResultsByDrawDate(drawDate: string): Promise<ResultDetailResponse>;
  getResultsHistory(query: unknown): Promise<ResultHistoryResponse>;
}

export function createResultsService(repository: ResultsRepository = prismaResultsRepository): ResultsService {
  return {
    async getLatestResults() {
      const bangkokToday = getBangkokToday();
      const draw =
        (await repository.findLatestPublicDraw(bangkokToday)) ??
        (await repository.findLatestPublishedDraw());

      if (!draw) {
        throw resultNotFoundError();
      }

      return getDetailResponse(draw, repository);
    },

    async getResultsByDrawDate(drawDate: string) {
      const parsed = parseDrawDate(drawDate);
      const draw = await repository.findPublicDrawByDate(parsed, getBangkokToday());

      if (!draw) {
        throw resultNotFoundError();
      }

      return getDetailResponse(draw, repository);
    },

    async getResultsHistory(query: unknown) {
      const parsed = parseHistoryQuery(query);
      const history = await repository.findPublishedDrawHistory(parsed.page, parsed.limit);
      const summaryRowsByDrawId = new Map<string, ResultRepositoryRow[]>();

      for (const row of history.summaryRows) {
        const existing = summaryRowsByDrawId.get(row.drawId) ?? [];
        existing.push(row);
        summaryRowsByDrawId.set(row.drawId, existing);
      }

      const items = history.draws.map((draw) => {
        const rows = summaryRowsByDrawId.get(draw.id) ?? [];
        return mapResultHistoryItem(draw, extractHistorySummary(rows));
      });

      return {
        items,
        page: parsed.page,
        limit: parsed.limit,
        total: history.total
      };
    }
  };
}

async function getDetailResponse(draw: ResultRepositoryDraw, repository: ResultsRepository): Promise<ResultDetailResponse> {
  const [rows, releases] = await Promise.all([
    repository.findResultsByDrawId(draw.id),
    repository.findGroupReleasesByDrawId(draw.id)
  ]);

  if (draw.status === "published") {
    ensureCompletePublishedDraw(rows);
    return mapResultDetailResponse(draw, groupPrizeRows(rows));
  }

  ensureReleasedPrizeGroupsAreValid(rows, releases);

  return mapResultDetailResponse(
    draw,
    groupPrizeRows(
      rows,
      Object.fromEntries(releases.map((release) => [release.prizeType, release.isReleased]))
    )
  );
}

function parseDrawDate(drawDate: string): string {
  try {
    return drawDateParamSchema.parse({ drawDate }).drawDate;
  } catch (error) {
    if (error instanceof ZodError) {
      throw invalidDrawDateError();
    }

    throw error;
  }
}

function parseHistoryQuery(query: unknown): { page: number; limit: number } {
  try {
    return historyQuerySchema.parse(query);
  } catch (error) {
    if (error instanceof ZodError) {
      throw invalidQueryError();
    }

    throw error;
  }
}
