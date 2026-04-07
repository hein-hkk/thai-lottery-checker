# Slice 7 Plan — Blog Banner Uploads and Home-Page Teasers

## Summary

Slice 7 completes the remaining blog presentation gap in the shipped OSS web product.

This slice delivers:

- managed blog banner uploads in admin backed by optional S3-compatible object storage
- home-page blog teasers below the published-history preview on `/{locale}`
- slug-only admin metadata writes, with banner state handled through dedicated upload/remove endpoints

## Delivered Scope

### Admin blog banner uploads

- replace manual banner URL entry in the admin UI with managed uploads
- keep `blog_posts.banner_image_url` as the persisted public banner reference
- use direct browser-to-object-storage upload through a server-issued presigned POST
- allow upload only after a draft blog post already exists
- support banner replacement and removal
- best-effort delete previously managed banner objects after replace/remove succeeds in the database

### Home-page blog teasers

- add a blog teaser section below the result-history preview on `/{locale}`
- keep the landing page results-first:
  - latest-result preview
  - published-history preview
  - blog teasers
- show the 3 newest published posts for the active locale
- hide the entire teaser section when blog data is empty or unavailable

## Final Decisions

- direct browser-to-S3 upload uses presigned POST; the API does not proxy file bytes
- `banner_image_url` remains the stored application reference in PostgreSQL
- object storage is optional infrastructure and must not block the rest of the product when absent
- home-page blog teasers are localized, published-only, and newest-first
- teaser cards use image-first compact cards with full-card click behavior
- the home teaser section is omitted instead of showing a degraded error or empty state

## Interfaces Added Or Changed

### Admin API

- `POST /api/v1/admin/blogs/:id/banner/upload-init`
- `POST /api/v1/admin/blogs/:id/banner/complete`
- `DELETE /api/v1/admin/blogs/:id/banner`

Behavior:

- every banner endpoint requires admin auth and `manage_blogs`
- upload init validates file name, content type, and max size
- complete verifies the uploaded object exists and belongs to the target blog prefix before persisting `bannerImageUrl`
- remove clears `bannerImageUrl` and best-effort deletes the previous managed object when applicable
- if banner storage is not configured, upload init and complete return `503 Service Unavailable`

### Shared contracts

- `AdminBlogMetadataRequest` is now slug-only
- added banner-upload request and response contracts:
  - `AdminBlogBannerUploadInitRequest`
  - `AdminBlogBannerUploadInitResponse`
  - `AdminBlogBannerCompleteRequest`
  - `AdminBlogBannerUpdateResponse`

### Web behavior

- `apps/web` can request blog list data with a configurable `limit`
- the home page requests `limit=3` for localized teaser content
- teaser cards link to `/{locale}/blog/{slug}`
- the section CTA links to `/{locale}/blog`

## Storage And Upload Model

Managed banner objects use this key pattern:

```text
blog-banners/{blogId}/{timestamp}-{uuid}.{ext}
```

Allowed content types:

- `image/jpeg`
- `image/png`
- `image/webp`

Max file size:

- `5 MB`

Storage flow:

1. Admin browser requests upload initialization from the API.
2. API generates a short-lived presigned POST using server-side storage credentials.
3. Browser uploads the file directly to object storage.
4. Browser calls the completion endpoint with the returned object key.
5. API verifies the object exists, persists the public URL to `banner_image_url`, and returns the updated post.

## Acceptance Criteria Covered

- `/{locale}` renders blog teasers below the published-history preview without displacing result-primary content
- home-page teasers show at most 3 newest localized published posts
- teaser cards keep full-card click behavior and align CTA placement across rows
- admin blog detail supports upload, replace, and remove banner actions
- public blog cards and detail pages continue to render `bannerImageUrl`
- legacy external `bannerImageUrl` values remain readable
- replacing or removing a managed banner attempts best-effort cleanup of the previous object
- the rest of the application still works when banner storage is not configured

## Verification Covered

Implementation verification included:

- `pnpm build:packages`
- `pnpm --filter @thai-lottery-checker/api typecheck`
- `pnpm --filter @thai-lottery-checker/web typecheck`
- `pnpm test`

Behavioral checks covered:

- banner upload contracts validate allowed MIME types and size limits
- banner completion rejects missing or invalid object keys
- upload endpoints require `manage_blogs`
- home-page teaser rendering hides cleanly when blog data is unavailable
- public blog list and detail pages continue to display banner images using the persisted URL

## Operational Notes

Required storage env vars for managed uploads:

- `BLOG_BANNER_STORAGE_REGION`
- `BLOG_BANNER_STORAGE_BUCKET`
- `BLOG_BANNER_STORAGE_ACCESS_KEY_ID`
- `BLOG_BANNER_STORAGE_SECRET_ACCESS_KEY`
- `BLOG_BANNER_STORAGE_PUBLIC_BASE_URL`

Common optional or defaulted env vars:

- `BLOG_BANNER_STORAGE_ENDPOINT`
- `BLOG_BANNER_STORAGE_PREFIX`
- `BLOG_BANNER_STORAGE_PRESIGN_EXPIRES_SECONDS`
- `BLOG_BANNER_STORAGE_FORCE_PATH_STYLE`

Operational expectations:

- for AWS S3, `BLOG_BANNER_STORAGE_ENDPOINT` can remain blank
- bucket CORS must allow browser `POST` uploads from the admin app origin
- uploaded banner objects must be publicly readable at the configured public base URL
- when storage env vars are absent, the API still boots and banner upload endpoints respond with `503`

See [blog-banner-storage.md](/Users/hkk/Documents/Playground/thai-lottery-checker/docs/architecture/blog-banner-storage.md) for setup details.
