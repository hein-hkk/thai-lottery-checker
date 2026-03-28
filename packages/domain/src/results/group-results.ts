import type { GroupableLotteryResult, PrizeGroup, PrizeType } from "@thai-lottery-checker/types";
import { canonicalPrizeOrder } from "./prize-metadata.js";

export function groupPrizeRows(
  rows: readonly GroupableLotteryResult[],
  releaseStates?: Partial<Record<PrizeType, boolean>>
): PrizeGroup[] {
  const grouped = new Map<PrizeGroup["type"], GroupableLotteryResult[]>();

  for (const row of rows) {
    const existing = grouped.get(row.prizeType) ?? [];
    existing.push(row);
    grouped.set(row.prizeType, existing);
  }

  return canonicalPrizeOrder.map((prizeType) => {
    const prizeRows = grouped.get(prizeType) ?? [];
    const numbers = [...prizeRows]
      .sort((left, right) => left.prizeIndex - right.prizeIndex)
      .map((row) => row.number);

    return {
      type: prizeType,
      numbers,
      isReleased: releaseStates ? (releaseStates[prizeType] ?? false) : numbers.length > 0
    };
  });
}
