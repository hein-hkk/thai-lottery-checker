import { assertValidPrizeNumber, canonicalPrizeOrder, hasCompletePrizeGroups } from "@thai-lottery-checker/domain";
import type { GroupableLotteryResult, PrizeGroupInput, PrizeType } from "@thai-lottery-checker/types";
import { adminResultDataInvalidError } from "./admin-results.errors.js";

export interface NormalizedAdminResultInput {
  prizeGroups: PrizeGroupInput[];
  rows: GroupableLotteryResult[];
}

export function normalizePrizeGroups(
  prizeGroups: readonly PrizeGroupInput[],
  options?: { requireComplete?: boolean }
): NormalizedAdminResultInput {
  const seenPrizeTypes = new Set<PrizeType>();
  const groupedByType = new Map<PrizeType, PrizeGroupInput>();

  for (const prizeGroup of prizeGroups) {
    if (seenPrizeTypes.has(prizeGroup.type)) {
      throw adminResultDataInvalidError(`Duplicate prize group type: ${prizeGroup.type}`);
    }

    seenPrizeTypes.add(prizeGroup.type);

    for (const number of prizeGroup.numbers) {
      try {
        assertValidPrizeNumber(prizeGroup.type, number);
      } catch {
        throw adminResultDataInvalidError(`Invalid prize number for ${prizeGroup.type}: ${number}`);
      }
    }

    groupedByType.set(prizeGroup.type, {
      type: prizeGroup.type,
      numbers: [...prizeGroup.numbers]
    });
  }

  const normalizedPrizeGroups = canonicalPrizeOrder
    .map((prizeType) => groupedByType.get(prizeType))
    .filter((prizeGroup): prizeGroup is PrizeGroupInput => prizeGroup !== undefined);

  if (options?.requireComplete && !hasCompletePrizeGroups(normalizedPrizeGroups)) {
    throw adminResultDataInvalidError("Result prize groups are incomplete or invalid for publish/correction");
  }

  const rows = normalizedPrizeGroups.flatMap((prizeGroup) =>
    prizeGroup.numbers.map((number, prizeIndex) => ({
      prizeType: prizeGroup.type,
      prizeIndex,
      number
    }))
  );

  return {
    prizeGroups: normalizedPrizeGroups,
    rows
  };
}
