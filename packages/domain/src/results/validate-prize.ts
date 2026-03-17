import type { PrizeType } from "@thai-lottery-checker/types";
import { prizeTypeMetadataByType } from "./prize-metadata.js";

const digitsOnlyPattern = /^\d+$/;

export function getPrizeDigitLength(prizeType: PrizeType): number {
  return prizeTypeMetadataByType[prizeType].digitLength;
}

export function getExpectedPrizeCount(prizeType: PrizeType): number {
  return prizeTypeMetadataByType[prizeType].expectedCount;
}

export function isPrizeNumberValid(prizeType: PrizeType, number: string): boolean {
  return digitsOnlyPattern.test(number) && number.length === getPrizeDigitLength(prizeType);
}

export function assertValidPrizeNumber(prizeType: PrizeType, number: string): void {
  if (!isPrizeNumberValid(prizeType, number)) {
    throw new Error(`Invalid prize number for ${prizeType}: ${number}`);
  }
}
