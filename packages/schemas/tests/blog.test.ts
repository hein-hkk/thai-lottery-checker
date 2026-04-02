import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  adminBlogDetailResponseSchema,
  adminBlogListQuerySchema,
  adminBlogListResponseSchema,
  adminBlogMetadataRequestSchema,
  adminBlogTranslationUpsertRequestSchema,
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

  it("validates admin list query and response payloads", () => {
    assert.deepEqual(adminBlogListQuerySchema.parse({}), { status: "all" });
    assert.deepEqual(adminBlogListQuerySchema.parse({ status: "draft" }), { status: "draft" });
    assert.throws(() => adminBlogListQuerySchema.parse({ status: "archived" }));

    assert.ok(
      adminBlogListResponseSchema.parse({
        items: [
          {
            id: "2a83b7d2-7c1d-41b9-9a9e-a8f7c68eb6f2",
            slug: "how-to-check-thai-lottery",
            displayTitle: "How to Check Thai Lottery Results",
            status: "published",
            publishedAt: "2026-03-31T08:00:00.000Z",
            updatedAt: "2026-03-31T08:00:00.000Z",
            createdAt: "2026-03-30T08:00:00.000Z",
            availableLocales: ["en", "th", "my"]
          }
        ]
      })
    );
  });

  it("validates admin metadata and translation requests", () => {
    assert.deepEqual(adminBlogMetadataRequestSchema.parse({ slug: "  thai-lottery-tips  " }), {
      slug: "thai-lottery-tips"
    });
    assert.deepEqual(
      adminBlogTranslationUpsertRequestSchema.parse({
        title: "  Thai lottery basics  ",
        body: [{ type: "paragraph", text: "Read the official results carefully." }],
        excerpt: "  Quick intro  ",
        seoTitle: null,
        seoDescription: "  Learn the basics  "
      }),
      {
        title: "Thai lottery basics",
        body: [{ type: "paragraph", text: "Read the official results carefully." }],
        excerpt: "Quick intro",
        seoTitle: null,
        seoDescription: "Learn the basics"
      }
    );
    assert.throws(() => adminBlogMetadataRequestSchema.parse({ slug: " ", bannerImageUrl: "not-a-url" }));
  });

  it("validates admin detail response payloads with stable locale slots", () => {
    assert.ok(
      adminBlogDetailResponseSchema.parse({
        post: {
          id: "2a83b7d2-7c1d-41b9-9a9e-a8f7c68eb6f2",
          slug: "how-to-check-thai-lottery",
          bannerImageUrl: "https://example.com/blog/how-to-check-thai-lottery.jpg",
          status: "draft",
          publishedAt: null,
          createdAt: "2026-03-30T08:00:00.000Z",
          updatedAt: "2026-03-31T08:00:00.000Z",
          availableLocales: ["en"],
          translations: [
            {
              locale: "en",
              title: "How to Check Thai Lottery Results",
              body: [{ type: "paragraph", text: "Thai lottery is..." }],
              excerpt: "A simple guide",
              seoTitle: "How to Check Thai Lottery Results",
              seoDescription: "Learn how to check results",
              updatedAt: "2026-03-31T08:00:00.000Z"
            },
            {
              locale: "th",
              title: "",
              body: [],
              excerpt: null,
              seoTitle: null,
              seoDescription: null,
              updatedAt: null
            },
            {
              locale: "my",
              title: "",
              body: [],
              excerpt: null,
              seoTitle: null,
              seoDescription: null,
              updatedAt: null
            }
          ],
          publishReadiness: {
            isPublishable: true,
            issues: []
          }
        }
      })
    );
  });
});
