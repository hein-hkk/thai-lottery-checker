import type { PrizeType, PrizeTypeMetadata } from "@thai-lottery-checker/types";

export const canonicalPrizeOrder: PrizeType[] = [
  "FIRST_PRIZE",
  "NEAR_FIRST_PRIZE",
  "SECOND_PRIZE",
  "THIRD_PRIZE",
  "FOURTH_PRIZE",
  "FIFTH_PRIZE",
  "FRONT_THREE",
  "LAST_THREE",
  "LAST_TWO"
];

export const prizeTypeMetadataList: PrizeTypeMetadata[] = [
  { type: "FIRST_PRIZE", digitLength: 6, expectedCount: 1, order: 0, labelKey: "results.prize.first" },
  { type: "NEAR_FIRST_PRIZE", digitLength: 6, expectedCount: 2, order: 1, labelKey: "results.prize.nearFirst" },
  { type: "SECOND_PRIZE", digitLength: 6, expectedCount: 5, order: 2, labelKey: "results.prize.second" },
  { type: "THIRD_PRIZE", digitLength: 6, expectedCount: 10, order: 3, labelKey: "results.prize.third" },
  { type: "FOURTH_PRIZE", digitLength: 6, expectedCount: 50, order: 4, labelKey: "results.prize.fourth" },
  { type: "FIFTH_PRIZE", digitLength: 6, expectedCount: 100, order: 5, labelKey: "results.prize.fifth" },
  { type: "FRONT_THREE", digitLength: 3, expectedCount: 2, order: 6, labelKey: "results.prize.frontThree" },
  { type: "LAST_THREE", digitLength: 3, expectedCount: 2, order: 7, labelKey: "results.prize.lastThree" },
  { type: "LAST_TWO", digitLength: 2, expectedCount: 1, order: 8, labelKey: "results.prize.lastTwo" }
];

export const prizeTypeMetadataByType: Record<PrizeType, PrizeTypeMetadata> = prizeTypeMetadataList.reduce(
  (accumulator, metadata) => {
    accumulator[metadata.type] = metadata;
    return accumulator;
  },
  {} as Record<PrizeType, PrizeTypeMetadata>
);
