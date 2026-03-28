import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  drawDateParamSchema,
  historyQuerySchema,
  resultDetailResponseSchema,
  resultHistoryResponseSchema
} from "../src/index.js";

describe("result schemas", () => {
  it("validates draw date params using YYYY-MM-DD", () => {
    assert.deepEqual(drawDateParamSchema.parse({ drawDate: "2026-03-01" }), { drawDate: "2026-03-01" });
    assert.throws(() => drawDateParamSchema.parse({ drawDate: "01-03-2026" }));
  });

  it("applies defaults and caps for history query params", () => {
    assert.deepEqual(historyQuerySchema.parse({}), { page: 1, limit: 20 });
    assert.deepEqual(historyQuerySchema.parse({ page: "2", limit: "50" }), { page: 2, limit: 50 });
    assert.throws(() => historyQuerySchema.parse({ limit: "51" }));
  });

  it("validates result detail and history payload shapes", () => {
    assert.ok(
      resultDetailResponseSchema.parse({
        drawDate: "2026-03-01",
        drawCode: "2026-03-01",
        publishedAt: "2026-03-01T09:30:00.000Z",
        prizeGroups: [{ type: "FIRST_PRIZE", numbers: ["820866"] }]
      })
    );

    assert.ok(
      resultHistoryResponseSchema.parse({
        items: [
          {
            drawDate: "2026-03-01",
            drawCode: "2026-03-01",
            firstPrize: "820866",
            frontThree: ["510", "983"],
            lastThree: ["439", "954"],
            lastTwo: "06"
          }
        ],
        page: 1,
        limit: 20,
        total: 2
      })
    );
  });
});
