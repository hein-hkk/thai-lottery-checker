import { formatIsoTimestamp } from "@thai-lottery-checker/utils";
import type { ResultDetailResponse, ResultHistoryItem } from "@thai-lottery-checker/types";
import { groupPrizeRows } from "@thai-lottery-checker/domain";
import type { ResultRepositoryDraw, ResultRepositoryRow } from "./results.repository.js";

function formatDrawDate(drawDate: Date): string {
  return [
    drawDate.getUTCFullYear(),
    String(drawDate.getUTCMonth() + 1).padStart(2, "0"),
    String(drawDate.getUTCDate()).padStart(2, "0")
  ].join("-");
}

export function mapResultDetailResponse(draw: ResultRepositoryDraw, rows: readonly ResultRepositoryRow[]): ResultDetailResponse {
  if (!draw.publishedAt) {
    throw new Error("Published draw is missing publishedAt");
  }

  return {
    drawDate: formatDrawDate(draw.drawDate),
    drawCode: draw.drawCode,
    publishedAt: formatIsoTimestamp(draw.publishedAt),
    prizeGroups: groupPrizeRows(rows)
  };
}

export function mapResultHistoryItem(
  draw: ResultRepositoryDraw,
  summary: { firstPrize: string; lastTwo: string }
): ResultHistoryItem {
  return {
    drawDate: formatDrawDate(draw.drawDate),
    drawCode: draw.drawCode,
    firstPrize: summary.firstPrize,
    lastTwo: summary.lastTwo
  };
}
