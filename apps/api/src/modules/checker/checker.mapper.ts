import type {
  CheckerCheckResponse,
  CheckerDrawOption,
  CheckerDrawOptionsResponse,
  CheckerStatus
} from "@thai-lottery-checker/types";
import type { TicketCheckEvaluation } from "@thai-lottery-checker/domain";
import type { CheckerRepositoryDraw } from "./checker.repository.js";

function formatDrawDate(drawDate: Date): string {
  return [
    drawDate.getUTCFullYear(),
    String(drawDate.getUTCMonth() + 1).padStart(2, "0"),
    String(drawDate.getUTCDate()).padStart(2, "0")
  ].join("-");
}

export function mapCheckerDrawOption(draw: CheckerRepositoryDraw): CheckerDrawOption {
  return {
    drawDate: formatDrawDate(draw.drawDate),
    drawCode: draw.drawCode,
    drawStatus: draw.status
  };
}

export function mapCheckerDrawOptionsResponse(draws: readonly CheckerRepositoryDraw[]): CheckerDrawOptionsResponse {
  return {
    items: draws.map(mapCheckerDrawOption)
  };
}

export function mapCheckerCheckResponse(
  draw: CheckerRepositoryDraw,
  ticketNumber: string,
  evaluation: TicketCheckEvaluation,
  checkStatus: CheckerStatus
): CheckerCheckResponse {
  return {
    ticketNumber,
    drawDate: formatDrawDate(draw.drawDate),
    drawCode: draw.drawCode,
    drawStatus: draw.status,
    checkStatus,
    isWinner: evaluation.isWinner,
    matches: evaluation.matches,
    totalWinningAmount: evaluation.totalWinningAmount,
    checkedPrizeTypes: evaluation.checkedPrizeTypes,
    uncheckedPrizeTypes: evaluation.uncheckedPrizeTypes
  };
}
