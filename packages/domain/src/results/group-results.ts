import type { GroupableLotteryResult, PrizeGroup } from "@thai-lottery-checker/types";
import { canonicalPrizeOrder } from "./prize-metadata.js";

export function groupPrizeRows(rows: readonly GroupableLotteryResult[]): PrizeGroup[] {
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
      numbers
    };
  });
}
