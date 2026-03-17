export type SupportedLocale = "en" | "th" | "my";

export interface ServiceStatus {
  name: string;
  status: "up" | "down";
}

export const prizeTypes = [
  "FIRST_PRIZE",
  "NEAR_FIRST_PRIZE",
  "SECOND_PRIZE",
  "THIRD_PRIZE",
  "FOURTH_PRIZE",
  "FIFTH_PRIZE",
  "FRONT_THREE",
  "LAST_THREE",
  "LAST_TWO"
] as const;

export type PrizeType = (typeof prizeTypes)[number];

export interface PrizeGroup {
  type: PrizeType;
  numbers: string[];
}

export interface PrizeTypeMetadata {
  type: PrizeType;
  digitLength: number;
  expectedCount: number;
  order: number;
  labelKey: string;
}

export interface GroupableLotteryResult {
  prizeType: PrizeType;
  prizeIndex: number;
  number: string;
}

export interface ResultDetailResponse {
  drawDate: string;
  drawCode: string | null;
  publishedAt: string;
  prizeGroups: PrizeGroup[];
}

export interface ResultHistoryItem {
  drawDate: string;
  drawCode: string | null;
  firstPrize: string;
  lastTwo: string;
}

export interface ResultHistoryResponse {
  items: ResultHistoryItem[];
  page: number;
  limit: number;
  total: number;
}
