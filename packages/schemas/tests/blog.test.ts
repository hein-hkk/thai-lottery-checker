import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  blogBodySchema,
  blogDetailResponseSchema,
  blogListQuerySchema,
  blogListResponseSchema,
  blogParagraphBlockSchema
} from "../src/index.js";

describe("blog schemas", () => {
  it("validates paragraph blocks and rejects unsupported shapes", () => {
    assert.deepEqual(blogParagraphBlockSchema.parse({ type: "paragraph", text: "Thai lottery explainer" }), {
      type: "paragraph",
      text: "Thai lottery explainer"
    });

    assert.ok(blogBodySchema.parse([{ type: "paragraph", text: "Step one" }]));
    assert.throws(() => blogParagraphBlockSchema.parse({ type: "heading", text: "Nope" }));
    assert.throws(() => blogBodySchema.parse([]));
  });

  it("applies defaults and caps for list query params", () => {
    assert.deepEqual(blogListQuerySchema.parse({ locale: "en" }), { locale: "en", page: 1, limit: 12 });
    assert.deepEqual(blogListQuerySchema.parse({ locale: "th", page: "2", limit: "50" }), {
      locale: "th",
      page: 2,
      limit: 50
    });
    assert.throws(() => blogListQuerySchema.parse({ locale: "jp" }));
    assert.throws(() => blogListQuerySchema.parse({ locale: "my", limit: "51" }));
  });

  it("validates public list response payloads", () => {
    assert.ok(
      blogListResponseSchema.parse({
        items: [
          {
            slug: "how-to-check-thai-lottery",
            title: "How to Check Thai Lottery Results",
            excerpt: "A simple guide to reading Thai lottery results.",
            bannerImageUrl: "https://example.com/blog/how-to-check-thai-lottery.jpg",
            publishedAt: "2026-03-31T08:00:00.000Z"
          }
        ],
        page: 1,
        limit: 12,
        total: 1
      })
    );
  });

  it("validates public detail response payloads", () => {
    assert.ok(
      blogDetailResponseSchema.parse({
        slug: "how-to-check-thai-lottery",
        bannerImageUrl: "https://example.com/blog/how-to-check-thai-lottery.jpg",
        publishedAt: "2026-03-31T08:00:00.000Z",
        translation: {
          locale: "en",
          title: "How to Check Thai Lottery Results",
          body: [{ type: "paragraph", text: "Thai lottery is..." }],
          excerpt: "A simple guide to reading Thai lottery results.",
          seoTitle: "How to Check Thai Lottery Results",
          seoDescription: "Learn how to read and check Thai lottery results."
        }
      })
    );
  });
});
