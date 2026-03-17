import assert from "node:assert/strict";
import { createServer, type Server } from "node:http";
import { after, before, describe, it } from "node:test";
import { createApp } from "../src/app.js";
import { seed } from "../prisma/seed.ts";
import { createResultsService } from "../src/modules/results/results.service.js";
import type { ResultsRepository } from "../src/modules/results/results.repository.js";
import { type ResultsApiError } from "../src/modules/results/results.errors.js";
import { prisma } from "../src/db/client.js";

let server: Server;
let baseUrl: string;

async function startServer(): Promise<string> {
  const app = createApp();
  server = createServer(app);

  await new Promise<void>((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", () => {
      resolve();
    });
  });

  const address = server.address();

  if (!address || typeof address === "string") {
    throw new Error("Failed to determine test server address");
  }

  return `http://127.0.0.1:${address.port}`;
}

async function getJson(pathname: string): Promise<{ status: number; body: unknown }> {
  const response = await fetch(`${baseUrl}${pathname}`);
  return {
    status: response.status,
    body: (await response.json()) as unknown
  };
}

describe("results api", () => {
  before(async () => {
    await seed();
    baseUrl = await startServer();
  });

  after(async () => {
    await new Promise<void>((resolve, reject) => {
      server.close((error) => {
        if (error) {
          reject(error);
          return;
        }

        resolve();
      });
    });

    await prisma.$disconnect();
  });

  it("keeps the root and health routes working", async () => {
    const root = await getJson("/");
    const health = await getJson("/health");

    assert.equal(root.status, 200);
    assert.deepEqual(root.body, {
      name: "thai-lottery-checker-api",
      status: "up"
    });

    assert.equal(health.status, 200);
    assert.equal((health.body as { status: string }).status === "ok" || (health.body as { status: string }).status === "degraded", true);
  });

  it("returns the latest published draw with grouped prize data in canonical order", async () => {
    const { status, body } = await getJson("/api/v1/results/latest");
    const payload = body as {
      drawDate: string;
      drawCode: string | null;
      publishedAt: string;
      prizeGroups: Array<{ type: string; numbers: string[] }>;
    };

    assert.equal(status, 200);
    assert.equal(payload.drawDate, "2026-03-01");
    assert.equal(payload.drawCode, "2026-03-01");
    assert.equal(payload.prizeGroups.length, 9);
    assert.equal(payload.prizeGroups[0]?.type, "FIRST_PRIZE");
    assert.deepEqual(payload.prizeGroups[0]?.numbers, ["820866"]);
    assert.equal(payload.prizeGroups[8]?.type, "LAST_TWO");
    assert.deepEqual(payload.prizeGroups[8]?.numbers, ["06"]);
  });

  it("returns paginated published history in reverse chronological order", async () => {
    const { status, body } = await getJson("/api/v1/results?page=1&limit=1");
    const payload = body as {
      items: Array<{ drawDate: string; firstPrize: string; lastTwo: string }>;
      page: number;
      limit: number;
      total: number;
    };

    assert.equal(status, 200);
    assert.equal(payload.page, 1);
    assert.equal(payload.limit, 1);
    assert.equal(payload.total, 2);
    assert.equal(payload.items.length, 1);
    assert.deepEqual(payload.items[0], {
      drawDate: "2026-03-01",
      drawCode: "2026-03-01",
      firstPrize: "820866",
      lastTwo: "06"
    });
  });

  it("returns detail for a published draw and hides the draft draw", async () => {
    const published = await getJson("/api/v1/results/2026-02-16");
    const draft = await getJson("/api/v1/results/2026-03-16");

    assert.equal(published.status, 200);
    assert.equal((published.body as { drawDate: string }).drawDate, "2026-02-16");

    assert.equal(draft.status, 404);
    assert.deepEqual(draft.body, {
      code: "RESULT_NOT_FOUND",
      message: "Result draw was not found"
    });
  });

  it("returns structured 400 and 404 errors", async () => {
    const invalidDate = await getJson("/api/v1/results/not-a-date");
    const invalidQuery = await getJson("/api/v1/results?page=0&limit=200");
    const unknownDraw = await getJson("/api/v1/results/2026-01-01");

    assert.equal(invalidDate.status, 400);
    assert.deepEqual(invalidDate.body, {
      code: "INVALID_DRAW_DATE",
      message: "drawDate must use YYYY-MM-DD format"
    });

    assert.equal(invalidQuery.status, 400);
    assert.deepEqual(invalidQuery.body, {
      code: "INVALID_QUERY",
      message: "Query parameters are invalid"
    });

    assert.equal(unknownDraw.status, 404);
    assert.deepEqual(unknownDraw.body, {
      code: "RESULT_NOT_FOUND",
      message: "Result draw was not found"
    });
  });

  it("fails fast when published draw data is incomplete", async () => {
    const service = createResultsService({
      async findLatestPublishedDraw() {
        return {
          id: "draw-1",
          drawDate: new Date("2026-03-01T00:00:00.000Z"),
          drawCode: "2026-03-01",
          publishedAt: new Date("2026-03-01T09:30:00.000Z")
        };
      },
      async findPublishedDrawByDate() {
        return null;
      },
      async findPublishedDrawHistory() {
        return {
          draws: [],
          total: 0,
          summaryRows: []
        };
      },
      async findResultsByDrawId() {
        return [{ drawId: "draw-1", prizeType: "FIRST_PRIZE", prizeIndex: 0, number: "820866" }];
      }
    } satisfies ResultsRepository);

    await assert.rejects(
      () => service.getLatestResults(),
      (error: unknown) =>
        error instanceof Error &&
        (error as ResultsApiError).code === "RESULT_DATA_INVALID" &&
        error.message === "Published result data is incomplete or invalid"
    );
  });
});
