import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  canonicalPrizeOrder,
  evaluateTicketAgainstPrizeGroups,
  getExpectedPrizeCount,
  getPrizeDigitLength,
  groupPrizeRows,
  hasCompletePrizeGroups,
  isPrizeNumberValid,
  prizeTypeMetadataList
} from "../src/index.js";

describe("result domain metadata", () => {
  it("matches the canonical prize order from the docs", () => {
    assert.deepEqual(canonicalPrizeOrder, [
      "FIRST_PRIZE",
      "NEAR_FIRST_PRIZE",
      "SECOND_PRIZE",
      "THIRD_PRIZE",
      "FOURTH_PRIZE",
      "FIFTH_PRIZE",
      "FRONT_THREE",
      "LAST_THREE",
      "LAST_TWO"
    ]);
    assert.equal(prizeTypeMetadataList.length, 9);
    assert.equal(getExpectedPrizeCount("FIFTH_PRIZE"), 100);
    assert.equal(getPrizeDigitLength("LAST_TWO"), 2);
    assert.ok(prizeTypeMetadataList.every((metadata) => Number.isInteger(metadata.prizeAmount)));
    assert.equal(prizeTypeMetadataList[0]?.prizeAmount, 6000000);
    assert.equal(prizeTypeMetadataList[6]?.prizeAmount, 4000);
    assert.equal(prizeTypeMetadataList[8]?.prizeAmount, 2000);
  });

  it("groups rows in canonical order and preserves leading zeros", () => {
    const grouped = groupPrizeRows([
      { prizeType: "LAST_TWO", prizeIndex: 0, number: "06" },
      { prizeType: "FRONT_THREE", prizeIndex: 1, number: "045" },
      { prizeType: "FIRST_PRIZE", prizeIndex: 0, number: "012345" },
      { prizeType: "FRONT_THREE", prizeIndex: 0, number: "068" }
    ]);

    assert.deepEqual(grouped[0], { type: "FIRST_PRIZE", numbers: ["012345"], isReleased: true });
    assert.deepEqual(grouped[6], { type: "FRONT_THREE", numbers: ["068", "045"], isReleased: true });
    assert.deepEqual(grouped[8], { type: "LAST_TWO", numbers: ["06"], isReleased: true });
  });

  it("can override release state while keeping canonical groups", () => {
    const grouped = groupPrizeRows(
      [{ prizeType: "FIRST_PRIZE", prizeIndex: 0, number: "012345" }],
      { FIRST_PRIZE: false, LAST_TWO: false }
    );

    assert.deepEqual(grouped[0], { type: "FIRST_PRIZE", numbers: ["012345"], isReleased: false });
    assert.deepEqual(grouped[8], { type: "LAST_TWO", numbers: [], isReleased: false });
  });

  it("distinguishes complete prize groups from incomplete drafts", () => {
    const completeGroups = groupPrizeRows([
      { prizeType: "FIRST_PRIZE", prizeIndex: 0, number: "123456" },
      { prizeType: "NEAR_FIRST_PRIZE", prizeIndex: 0, number: "123455" },
      { prizeType: "NEAR_FIRST_PRIZE", prizeIndex: 1, number: "123457" },
      ...Array.from({ length: 5 }, (_, index) => ({
        prizeType: "SECOND_PRIZE" as const,
        prizeIndex: index,
        number: String(200000 + index)
      })),
      ...Array.from({ length: 10 }, (_, index) => ({
        prizeType: "THIRD_PRIZE" as const,
        prizeIndex: index,
        number: String(300000 + index)
      })),
      ...Array.from({ length: 50 }, (_, index) => ({
        prizeType: "FOURTH_PRIZE" as const,
        prizeIndex: index,
        number: String(400000 + index)
      })),
      ...Array.from({ length: 100 }, (_, index) => ({
        prizeType: "FIFTH_PRIZE" as const,
        prizeIndex: index,
        number: String(500000 + index)
      })),
      { prizeType: "FRONT_THREE", prizeIndex: 0, number: "123" },
      { prizeType: "FRONT_THREE", prizeIndex: 1, number: "456" },
      { prizeType: "LAST_THREE", prizeIndex: 0, number: "789" },
      { prizeType: "LAST_THREE", prizeIndex: 1, number: "012" },
      { prizeType: "LAST_TWO", prizeIndex: 0, number: "34" }
    ]);

    const incompleteGroups = groupPrizeRows([
      { prizeType: "FIRST_PRIZE", prizeIndex: 0, number: "123456" },
      { prizeType: "LAST_TWO", prizeIndex: 0, number: "34" }
    ]);

    assert.equal(hasCompletePrizeGroups(completeGroups), true);
    assert.equal(hasCompletePrizeGroups(incompleteGroups), false);
  });

  it("validates prize numbers against digit-only and length rules", () => {
    assert.equal(isPrizeNumberValid("FIRST_PRIZE", "000001"), true);
    assert.equal(isPrizeNumberValid("LAST_TWO", "06"), true);
    assert.equal(isPrizeNumberValid("LAST_TWO", "6"), false);
    assert.equal(isPrizeNumberValid("FRONT_THREE", "0A6"), false);
  });

  it("matches exact and derived prize groups and totals prize amounts", () => {
    const evaluation = evaluateTicketAgainstPrizeGroups("068506", [
      { type: "FIRST_PRIZE", numbers: ["068506"], isReleased: true },
      { type: "FRONT_THREE", numbers: ["068", "999"], isReleased: true },
      { type: "LAST_THREE", numbers: ["506", "111"], isReleased: true },
      { type: "LAST_TWO", numbers: ["06"], isReleased: true },
      { type: "SECOND_PRIZE", numbers: ["123456"], isReleased: true }
    ]);

    assert.equal(evaluation.isWinner, true);
    assert.deepEqual(
      evaluation.matches.map((match) => ({
        prizeType: match.prizeType,
        prizeAmount: match.prizeAmount,
        matchedNumber: match.matchedNumber,
        matchKind: match.matchKind
      })),
      [
        { prizeType: "FIRST_PRIZE", prizeAmount: 6000000, matchedNumber: "068506", matchKind: "exact" },
        { prizeType: "FRONT_THREE", prizeAmount: 4000, matchedNumber: "068", matchKind: "front3" },
        { prizeType: "LAST_THREE", prizeAmount: 4000, matchedNumber: "506", matchKind: "last3" },
        { prizeType: "LAST_TWO", prizeAmount: 2000, matchedNumber: "06", matchKind: "last2" }
      ]
    );
    assert.equal(evaluation.totalWinningAmount, 6010000);
    assert.deepEqual(evaluation.checkedPrizeTypes, ["FIRST_PRIZE", "SECOND_PRIZE", "FRONT_THREE", "LAST_THREE", "LAST_TWO"]);
    assert.deepEqual(evaluation.uncheckedPrizeTypes, ["NEAR_FIRST_PRIZE", "THIRD_PRIZE", "FOURTH_PRIZE", "FIFTH_PRIZE"]);
  });

  it("ignores unreleased groups so partial checks stay honest", () => {
    const evaluation = evaluateTicketAgainstPrizeGroups("300001", [
      { type: "FIRST_PRIZE", numbers: ["300001"], isReleased: false },
      { type: "LAST_TWO", numbers: ["01"], isReleased: true }
    ]);

    assert.equal(evaluation.isWinner, true);
    assert.deepEqual(evaluation.matches, [
      { prizeType: "LAST_TWO", prizeAmount: 2000, matchedNumber: "01", matchKind: "last2" }
    ]);
    assert.equal(evaluation.totalWinningAmount, 2000);
    assert.deepEqual(evaluation.checkedPrizeTypes, ["LAST_TWO"]);
    assert.equal(evaluation.uncheckedPrizeTypes.includes("FIRST_PRIZE"), true);
  });
});
