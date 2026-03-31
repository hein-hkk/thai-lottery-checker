import type {
  CheckerMatch,
  CheckerMatchKind,
  PrizeGroup,
  PrizeType
} from "@thai-lottery-checker/types";
import { canonicalPrizeOrder, prizeTypeMetadataByType } from "./prize-metadata.js";

const exactMatchPrizeTypes: PrizeType[] = [
  "FIRST_PRIZE",
  "NEAR_FIRST_PRIZE",
  "SECOND_PRIZE",
  "THIRD_PRIZE",
  "FOURTH_PRIZE",
  "FIFTH_PRIZE"
];

export interface TicketCheckEvaluation {
  checkedPrizeTypes: PrizeType[];
  uncheckedPrizeTypes: PrizeType[];
  matches: CheckerMatch[];
  totalWinningAmount: number;
  isWinner: boolean;
}

export function evaluateTicketAgainstPrizeGroups(ticketNumber: string, prizeGroups: readonly PrizeGroup[]): TicketCheckEvaluation {
  const groupByType = new Map(prizeGroups.map((group) => [group.type, group]));
  const checkedPrizeTypes: PrizeType[] = [];
  const uncheckedPrizeTypes: PrizeType[] = [];
  const matches: CheckerMatch[] = [];

  for (const prizeType of canonicalPrizeOrder) {
    const prizeGroup = groupByType.get(prizeType);

    if (!prizeGroup?.isReleased) {
      uncheckedPrizeTypes.push(prizeType);
      continue;
    }

    checkedPrizeTypes.push(prizeType);

    for (const matchedNumber of getMatchedNumbers(prizeType, ticketNumber, prizeGroup.numbers)) {
      matches.push({
        prizeType,
        prizeAmount: prizeTypeMetadataByType[prizeType].prizeAmount,
        matchedNumber,
        matchKind: getMatchKind(prizeType)
      });
    }
  }

  const totalWinningAmount = matches.reduce((sum, match) => sum + match.prizeAmount, 0);

  return {
    checkedPrizeTypes,
    uncheckedPrizeTypes,
    matches,
    totalWinningAmount,
    isWinner: matches.length > 0
  };
}

function getMatchedNumbers(prizeType: PrizeType, ticketNumber: string, prizeNumbers: readonly string[]): string[] {
  if (exactMatchPrizeTypes.includes(prizeType)) {
    return prizeNumbers.filter((number) => number === ticketNumber);
  }

  if (prizeType === "FRONT_THREE") {
    const prefix = ticketNumber.slice(0, 3);
    return prizeNumbers.filter((number) => number === prefix);
  }

  if (prizeType === "LAST_THREE") {
    const suffix = ticketNumber.slice(-3);
    return prizeNumbers.filter((number) => number === suffix);
  }

  const suffix = ticketNumber.slice(-2);
  return prizeNumbers.filter((number) => number === suffix);
}

function getMatchKind(prizeType: PrizeType): CheckerMatchKind {
  switch (prizeType) {
    case "FRONT_THREE":
      return "front3";
    case "LAST_THREE":
      return "last3";
    case "LAST_TWO":
      return "last2";
    default:
      return "exact";
  }
}
