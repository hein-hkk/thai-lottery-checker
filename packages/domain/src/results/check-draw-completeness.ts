import type { PrizeGroup, PrizeType } from "@thai-lottery-checker/types";
import { canonicalPrizeOrder } from "./prize-metadata.js";
import { getExpectedPrizeCount, getPrizeDigitLength } from "./validate-prize.js";

export function getExpectedPrizeCountMap(): Record<PrizeType, number> {
  return canonicalPrizeOrder.reduce(
    (accumulator, prizeType) => {
      accumulator[prizeType] = getExpectedPrizeCount(prizeType);
      return accumulator;
    },
    {} as Record<PrizeType, number>
  );
}

export function getPrizeDigitLengthMap(): Record<PrizeType, number> {
  return canonicalPrizeOrder.reduce(
    (accumulator, prizeType) => {
      accumulator[prizeType] = getPrizeDigitLength(prizeType);
      return accumulator;
    },
    {} as Record<PrizeType, number>
  );
}

export function hasCompletePrizeGroups(prizeGroups: readonly PrizeGroup[]): boolean {
  const prizeGroupMap = new Map(prizeGroups.map((prizeGroup) => [prizeGroup.type, prizeGroup]));

  return canonicalPrizeOrder.every((prizeType) => {
    const prizeGroup = prizeGroupMap.get(prizeType);

    if (!prizeGroup) {
      return false;
    }

    return prizeGroup.numbers.length === getExpectedPrizeCount(prizeType) &&
      prizeGroup.numbers.every((number) => number.length === getPrizeDigitLength(prizeType));
  });
}
