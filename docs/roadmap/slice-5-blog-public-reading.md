# Slice 5 Plan — Blog Public Reading

> Historical note: Slice 5 established public blog reading only. Home-page blog teasers and managed banner uploads were added later in Slice 7.

## Summary

Implement the first public blog capability for the Thai Lottery Checker platform.

This slice delivers multilingual public blog reading across the database, shared contracts, public API, and web app. It includes localized blog list and detail pages, public published-only blog endpoints, and baseline SEO metadata for the blog surface.

This slice does not include admin blog authoring or publish-management UI. Those workflows remain in Slice 6.

## Key Changes

### 1. Blog data foundation

- Add `blog_posts` and `blog_post_translations` to the live Prisma schema
- Add the Prisma `Locale` enum used by blog translations
- Keep `slug` global across locales
- Seed:
  - one published post with `en`, `th`, and `my`
  - one published post with only one locale
  - one draft post for future admin workflow coverage

### 2. Shared contracts

- Add shared public blog DTOs in `packages/types`
- Add shared blog schemas in `packages/schemas`
- Keep the public body contract strict and small:
  - paragraph-only blocks
  - no HTML fallback
  - no richer editor blocks yet

### 3. Public blog API

- Add public endpoints:
  - `GET /api/v1/blogs`
  - `GET /api/v1/blogs/:slug`
- Public visibility rules:
  - only `published` posts are visible
  - `publishedAt` must be non-null
  - requested locale translation must exist
  - no locale fallback
- List behavior:
  - locale required
  - paginated
  - newest first by `publishedAt DESC`
- Detail behavior:
  - `404` for missing slug
  - `404` for draft post
  - `404` for missing locale translation

### 4. Public web blog reading

- Add localized routes:
  - `/{locale}/blog`
  - `/{locale}/blog/{slug}`
- Add a web blog API client parallel to the results client
- Render:
  - blog cards on the list page
  - banner image when present
  - localized published date
  - title, excerpt, and paragraph body content
- Keep detail behavior consistent with current public pages:
  - `notFound()` for real `404` cases
  - unavailable state for non-404 API failures

### 5. Public navigation and metadata

- Add `Blog` to the shared public header navigation on desktop and mobile
- Expand public i18n strings to include blog-facing copy
- Add route metadata for:
  - blog list page
  - blog detail page
- Metadata rules:
  - list page uses localized title and description
  - detail page prefers `seoTitle` / `seoDescription`
  - fallback to `title` / `excerpt` when SEO fields are missing
  - canonical URL uses the localized blog route

## Public APIs / Interfaces

- New public API endpoints:
  - `GET /api/v1/blogs?locale={locale}&page={page}&limit={limit}`
  - `GET /api/v1/blogs/:slug?locale={locale}`
- New public web routes:
  - `/{locale}/blog`
  - `/{locale}/blog/{slug}`
- Shared blog body contract:
  - paragraph blocks only

## Test Plan

- Schema and type checks
  - blog types compile
  - blog schemas validate the public DTOs
- Public API tests
  - localized list success
  - localized detail success
  - invalid locale validation
  - draft hidden
  - untranslated post hidden
  - invalid blog body fails fast
- Web verification
  - blog list renders localized posts
  - locale-specific filtering works
  - detail page renders paragraph blocks in order
  - metadata and canonical URLs are generated for list and detail pages
  - public header includes `Blog`

## Assumptions

- Public blog reading is complete for Slice 5.
- Blog body remains paragraph-only until admin authoring defines richer block support.
- No blog teasers, search, tags, categories, related posts, or admin blog UI are included in this slice.
- Slice 6 will build on this foundation for blog draft/edit/publish management.
