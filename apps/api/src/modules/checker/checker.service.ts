import { ZodError } from "zod";
import { checkerCheckRequestSchema } from "@thai-lottery-checker/schemas";
import {
  evaluateTicketAgainstPrizeGroups,
  getExpectedPrizeCount,
  getPrizeDigitLength,
  groupPrizeRows,
  hasCompletePrizeGroups
} from "@thai-lottery-checker/domain";
import type {
  CheckerCheckResponse,
  CheckerDrawOptionsResponse,
  CheckerStatus
} from "@thai-lottery-checker/types";
import {
  checkerDataInvalidError,
  checkerDrawNotFoundError,
  invalidCheckerDrawDateError,
  invalidTicketNumberError
} from "./checker.errors.js";
import {
  mapCheckerCheckResponse,
  mapCheckerDrawOptionsResponse
} from "./checker.mapper.js";
import type { CheckerRepository, CheckerRepositoryGroupRelease, CheckerRepositoryRow } from "./checker.repository.js";
import { prismaCheckerRepository } from "./checker.repository.js";

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

function ensureCompletePublishedDraw(rows: readonly CheckerRepositoryRow[]): void {
  const prizeGroups = groupPrizeRows(rows);

  if (!hasCompletePrizeGroups(prizeGroups)) {
    throw checkerDataInvalidError();
  }
}

function ensureReleasedPrizeGroupsAreValid(
  rows: readonly CheckerRepositoryRow[],
  releases: readonly CheckerRepositoryGroupRelease[]
): void {
  const releaseStateMap = new Map(releases.map((release) => [release.prizeType, release.isReleased]));
  const grouped = groupPrizeRows(rows, Object.fromEntries(releaseStateMap.entries()));

  for (const prizeGroup of grouped) {
    if (!prizeGroup.isReleased) {
      continue;
    }

    if (prizeGroup.numbers.length !== getExpectedPrizeCount(prizeGroup.type)) {
      throw checkerDataInvalidError();
    }

    if (prizeGroup.numbers.some((number) => number.length !== getPrizeDigitLength(prizeGroup.type))) {
      throw checkerDataInvalidError();
    }
  }
}

export interface CheckerService {
  getCheckerDrawOptions(): Promise<CheckerDrawOptionsResponse>;
  checkTicket(input: unknown): Promise<CheckerCheckResponse>;
}

export function createCheckerService(repository: CheckerRepository = prismaCheckerRepository): CheckerService {
  return {
    async getCheckerDrawOptions() {
      const draws = await repository.findCheckerDrawOptions(getBangkokToday());
      return mapCheckerDrawOptionsResponse(draws);
    },

    async checkTicket(input) {
      const parsed = parseCheckRequest(input);
      const bangkokToday = getBangkokToday();
      const draw = parsed.drawDate
        ? await repository.findPublicDrawByDate(parsed.drawDate, bangkokToday)
        : (await repository.findLatestPublicDraw(bangkokToday)) ?? (await repository.findLatestPublishedDraw());

      if (!draw) {
        throw checkerDrawNotFoundError();
      }

      const [rows, releases] = await Promise.all([
        repository.findResultsByDrawId(draw.id),
        repository.findGroupReleasesByDrawId(draw.id)
      ]);

      let checkStatus: CheckerStatus = "complete";
      let prizeGroups;

      if (draw.status === "published") {
        ensureCompletePublishedDraw(rows);
        prizeGroups = groupPrizeRows(rows);
      } else {
        ensureReleasedPrizeGroupsAreValid(rows, releases);
        prizeGroups = groupPrizeRows(
          rows,
          Object.fromEntries(releases.map((release) => [release.prizeType, release.isReleased]))
        );
        checkStatus = "partial";
      }

      const evaluation = evaluateTicketAgainstPrizeGroups(parsed.ticketNumber, prizeGroups);

      return mapCheckerCheckResponse(draw, parsed.ticketNumber, evaluation, checkStatus);
    }
  };
}

function parseCheckRequest(input: unknown): { ticketNumber: string; drawDate?: string } {
  try {
    return checkerCheckRequestSchema.parse(input);
  } catch (error) {
    if (error instanceof ZodError) {
      const drawDateIssue = error.issues.find((issue) => issue.path[0] === "drawDate");
      throw drawDateIssue ? invalidCheckerDrawDateError() : invalidTicketNumberError();
    }

    throw error;
  }
}
