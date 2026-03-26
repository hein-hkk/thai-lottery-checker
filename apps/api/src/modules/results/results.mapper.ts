import { formatIsoTimestamp } from "@thai-lottery-checker/utils";
import type { PrizeGroup, ResultDetailResponse, ResultHistoryItem } from "@thai-lottery-checker/types";
import type { ResultRepositoryDraw } from "./results.repository.js";

function formatDrawDate(drawDate: Date): string {
  return [
    drawDate.getUTCFullYear(),
    String(drawDate.getUTCMonth() + 1).padStart(2, "0"),
    String(drawDate.getUTCDate()).padStart(2, "0")
  ].join("-");
}

export function mapResultDetailResponse(draw: ResultRepositoryDraw, prizeGroups: readonly PrizeGroup[]): ResultDetailResponse {
  return {
    drawDate: formatDrawDate(draw.drawDate),
    drawCode: draw.drawCode,
    publishedAt: draw.publishedAt ? formatIsoTimestamp(draw.publishedAt) : null,
    prizeGroups: [...prizeGroups]
  };
}

export function mapResultHistoryItem(
  draw: ResultRepositoryDraw,
  summary: { firstPrize: string; frontThree: string[]; lastThree: string[]; lastTwo: string }
): ResultHistoryItem {
  return {
    drawDate: formatDrawDate(draw.drawDate),
    drawCode: draw.drawCode,
    firstPrize: summary.firstPrize,
    frontThree: summary.frontThree,
    lastThree: summary.lastThree,
    lastTwo: summary.lastTwo
  };
}
