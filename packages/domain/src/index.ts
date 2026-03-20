import type { SupportedLocale } from "@thai-lottery-checker/types";

export interface LocaleDescriptor {
  code: SupportedLocale;
  label: string;
}

export type {
  GroupableLotteryResult,
  PrizeGroup,
  PrizeGroupInput,
  PrizeTypeMetadata
} from "@thai-lottery-checker/types";
export {
  canonicalPrizeOrder,
  prizeTypeMetadataByType,
  prizeTypeMetadataList
} from "./results/prize-metadata.js";
export {
  assertValidPrizeNumber,
  getExpectedPrizeCount,
  getPrizeDigitLength,
  isPrizeNumberValid
} from "./results/validate-prize.js";
export {
  getExpectedPrizeCountMap,
  getPrizeDigitLengthMap,
  hasCompletePrizeGroups
} from "./results/check-draw-completeness.js";
export { groupPrizeRows } from "./results/group-results.js";
