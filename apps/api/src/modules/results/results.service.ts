import { ZodError } from "zod";
import type { ResultDetailResponse, ResultHistoryResponse } from "@thai-lottery-checker/types";
import { drawDateParamSchema, historyQuerySchema } from "@thai-lottery-checker/schemas";
import { groupPrizeRows, hasCompletePrizeGroups } from "@thai-lottery-checker/domain";
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
import type { ResultRepositoryDraw, ResultRepositoryRow, ResultsRepository } from "./results.repository.js";
import { prismaResultsRepository } from "./results.repository.js";

function ensureCompletePublishedDraw(rows: readonly ResultRepositoryRow[]): void {
  const prizeGroups = groupPrizeRows(rows);

  if (!hasCompletePrizeGroups(prizeGroups)) {
    throw resultDataInvalidError();
  }
}

function extractHistorySummary(rows: readonly ResultRepositoryRow[]): { firstPrize: string; lastTwo: string } {
  const firstPrize = rows.find((row) => row.prizeType === "FIRST_PRIZE")?.number;
  const lastTwo = rows.find((row) => row.prizeType === "LAST_TWO")?.number;

  if (!firstPrize || !lastTwo) {
    throw resultDataInvalidError();
  }

  return {
    firstPrize,
    lastTwo
  };
}

export interface ResultsService {
  getLatestResults(): Promise<ResultDetailResponse>;
  getResultsByDrawDate(drawDate: string): Promise<ResultDetailResponse>;
  getResultsHistory(query: unknown): Promise<ResultHistoryResponse>;
}

export function createResultsService(repository: ResultsRepository = prismaResultsRepository): ResultsService {
  return {
    async getLatestResults() {
      const draw = await repository.findLatestPublishedDraw();

      if (!draw) {
        throw resultNotFoundError();
      }

      return getDetailResponse(draw, repository);
    },

    async getResultsByDrawDate(drawDate: string) {
      const parsed = parseDrawDate(drawDate);
      const draw = await repository.findPublishedDrawByDate(parsed);

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
  const rows = await repository.findResultsByDrawId(draw.id);
  ensureCompletePublishedDraw(rows);
  return mapResultDetailResponse(draw, rows);
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
