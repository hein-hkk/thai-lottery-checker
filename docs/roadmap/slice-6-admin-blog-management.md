# Slice 6 Plan — Admin Blog Management

> Historical note: this plan originally modeled banner handling as manual `bannerImageUrl` entry. Slice 7 superseded that flow with dedicated banner upload endpoints and admin UI backed by optional object storage.

## Summary

Complete the blog feature by adding the protected admin workflow for blog operations on top of Slice 5 public reading.

This slice delivers:

- admin blog list/detail/create/edit routes and pages
- metadata editing plus per-locale translation editing
- publish and unpublish actions
- `manage_blogs` permission enforcement
- audit logging for blog operations
- strict alignment with the existing public blog contract

Chosen defaults for this slice:

- slug edits remain allowed even after publish
- unpublish sets `status = draft` and clears `publishedAt`
- admin blog list supports status filtering only
- admin list display title uses a preferred-locale fallback, not slug-only and not a full per-locale title map

## Key Changes

### 1. Admin backend

- Add an admin blog module parallel to `admin-results`:
  - routes
  - controller
  - service
  - repository
  - mapper
  - errors
- Add endpoints:
  - `GET /api/v1/admin/blogs`
  - `GET /api/v1/admin/blogs/:id`
  - `POST /api/v1/admin/blogs`
  - `PATCH /api/v1/admin/blogs/:id`
  - `PUT /api/v1/admin/blogs/:id/translations/:locale`
  - `POST /api/v1/admin/blogs/:id/publish`
  - `POST /api/v1/admin/blogs/:id/unpublish`
- Require admin auth and enforce `manage_blogs` on every endpoint through the shared backend permission pattern.

### 2. Admin data rules

- `blog_posts.slug` stays global and unique.
- Slug edits are allowed in both draft and published states.
- New posts always start as:
  - `status = draft`
  - `publishedAt = null`
- Publish requires at least one valid translation:
  - non-empty trimmed `title`
  - paragraph-only `body`
  - at least one non-empty paragraph
- Unpublish behavior is fixed as:
  - set `status = draft`
  - clear `publishedAt`
  - immediately remove the post from Slice 5 public APIs and pages
- Public blog behavior from Slice 5 remains unchanged:
  - published only
  - locale-specific translation required
  - no locale fallback

### 3. Admin list/detail contract

- Admin list returns a compact operational list with:
  - `id`
  - `slug`
  - `displayTitle`
  - `status`
  - `publishedAt`
  - `updatedAt`
  - `createdAt`
  - `availableLocales`
- `displayTitle` uses preferred locale fallback with fixed priority:
  - `en`
  - `th`
  - `my`
  - fallback to `slug` if no translation title exists
- Admin list query supports only:
  - `status=draft|published|all`
  - default `all`
  - sort by `updatedAt DESC`
- Admin detail returns:
  - metadata fields
  - translations as an array, not a keyed object
  - `publishReadiness`
- `publishReadiness` stays stable and user-facing:
  - `isPublishable: boolean`
  - `issues: string[]`

### 4. Validation and shared contracts

- Extend `packages/types` and `packages/schemas` with admin blog contracts.
- Add request/response types and schemas for:
  - admin blog list query/response
  - admin blog detail response
  - create blog request
  - update blog metadata request
  - translation upsert request
  - publish/unpublish responses
- Reuse the Slice 5 paragraph-body schema for translation content.
- Metadata validation:
  - `slug` required, trimmed, unique
  - at Slice 6 planning time, `bannerImageUrl` was modeled as optional URL metadata; Slice 7 replaced that with slug-only metadata writes plus managed banner upload endpoints
- Translation validation:
  - locale must be `en|th|my`
  - `title` required and trimmed for publishable state
  - `body` paragraph-only and non-empty for publishable state
  - `excerpt`, `seoTitle`, `seoDescription` optional

### 5. Audit logging

- Required actions:
  - `create_blog`
  - `update_blog`
  - `publish_blog`
  - `unpublish_blog`
- Use `entityType = "blog_post"` for blog audit rows.
- Log before/after snapshots for:
  - metadata changes
  - translation changes
  - publish
  - unpublish
- Translation updates can use `update_blog`; a separate `update_blog_translation` action is not required for MVP.

### 6. Admin web

- Extend protected admin navigation to include `Blogs` for admins who have `manage_blogs`.
- Add protected routes:
  - `/admin/blogs`
  - `/admin/blogs/new`
  - `/admin/blogs/:id`
- Follow the existing admin page pattern:
  - server route validates session and permission, then loads initial data
  - client component handles form state and mutations
- `/admin/blogs` page:
  - status filter only
  - table with display title, slug, status, locales, updated/published timestamps
  - create button
- `/admin/blogs/new` page:
  - minimum metadata form only:
    - slug
  - banner upload remains unavailable until the draft exists; Slice 7 later implemented uploads on the detail page after draft creation
  - on success, redirect to `/admin/blogs/:id`
- `/admin/blogs/:id` page:
  - metadata section
  - translation tabs for `en`, `th`, `my`
  - publish readiness panel
  - publish/unpublish action bar
- Translation editor stays intentionally small:
  - fields for title, excerpt, SEO title, SEO description
  - paragraph list editor
  - add paragraph
  - remove paragraph
  - no drag/drop and no rich editor

## Public APIs / Interfaces

- New admin API endpoints:
  - `GET /api/v1/admin/blogs`
  - `GET /api/v1/admin/blogs/:id`
  - `POST /api/v1/admin/blogs`
  - `PATCH /api/v1/admin/blogs/:id`
  - `PUT /api/v1/admin/blogs/:id/translations/:locale`
  - `POST /api/v1/admin/blogs/:id/publish`
  - `POST /api/v1/admin/blogs/:id/unpublish`
- New protected admin web routes:
  - `/admin/blogs`
  - `/admin/blogs/new`
  - `/admin/blogs/:id`
- New shared admin blog DTOs and schemas for list, detail, metadata update, translation upsert, publish, and unpublish.

## Test Plan

- Shared schema/type checks
  - admin blog request/response schemas validate correctly
  - translation body remains paragraph-only
- API/service/repository tests
  - `manage_blogs` required on every admin blog endpoint
  - super admin access works
  - create draft works and sets draft defaults
  - duplicate slug is rejected
  - metadata update works
  - translation upsert creates and updates correctly
  - publish succeeds with one valid translation
  - publish fails with no valid translation
  - unpublish resets visibility and clears `publishedAt`
  - public blog endpoints stop returning the post after unpublish
  - audit rows are written for create/update/publish/unpublish
- Admin web verification
  - `Blogs` nav item appears only when permitted
  - `/admin/blogs` list renders and filters by status
  - create flow redirects from `/admin/blogs/new` to detail page
  - edit page saves metadata and translations
  - publish readiness messaging updates correctly
  - publish and unpublish actions show feedback and refresh page state

## Assumptions

- No schema expansion is planned unless implementation reveals a concrete blocker.
- Search is intentionally excluded from `/admin/blogs` in MVP.
- Translation ordering in admin detail follows fixed locale order: `en`, `th`, `my`.
- Admin UI remains English-first and non-localized unless later admin work explicitly changes that.
- This slice finalizes the MVP blog feature without adding CMS-style revision history, categories, tags, media library, scheduled publishing, or editorial workflow.
