# Blog Banner Storage

## Purpose

This document describes the optional object-storage setup used for managed blog banner uploads.

The current implementation supports S3-compatible storage for admin blog banners while keeping PostgreSQL as the canonical application data store.

## Required Environment Variables

Set these in `.env` to enable managed uploads:

- `BLOG_BANNER_STORAGE_REGION`
- `BLOG_BANNER_STORAGE_BUCKET`
- `BLOG_BANNER_STORAGE_ACCESS_KEY_ID`
- `BLOG_BANNER_STORAGE_SECRET_ACCESS_KEY`
- `BLOG_BANNER_STORAGE_PUBLIC_BASE_URL`

These remain optional or have sensible defaults:

- `BLOG_BANNER_STORAGE_ENDPOINT`
- `BLOG_BANNER_STORAGE_PREFIX=blog-banners`
- `BLOG_BANNER_STORAGE_PRESIGN_EXPIRES_SECONDS=600`
- `BLOG_BANNER_STORAGE_FORCE_PATH_STYLE=false`

AWS S3 defaults:

- leave `BLOG_BANNER_STORAGE_ENDPOINT` blank
- keep `BLOG_BANNER_STORAGE_FORCE_PATH_STYLE=false`
- set `BLOG_BANNER_STORAGE_PUBLIC_BASE_URL` to the public object base URL for the bucket and prefix

If the required variables are missing, the API still boots, but the admin banner upload endpoints return `503 Service Unavailable`.

## Bucket Setup Checklist

1. Create an S3 bucket in the target region.
2. Choose a public base URL that matches how uploaded objects will be served.
3. Allow public `GET` access for the managed banner prefix, typically `blog-banners/*`.
4. Configure bucket CORS to allow browser `POST` uploads from the admin app origin.
5. Create an IAM principal for the API with scoped permissions to manage banner objects.

## Public-Read Expectation

The application persists a public `banner_image_url` for rendering on public blog cards and detail pages.

That means uploaded objects under the managed prefix must be publicly readable, for example:

```text
arn:aws:s3:::your-bucket/blog-banners/*
```

Public read does not grant arbitrary upload permission.
Uploads still require a valid server-issued presigned POST.

## CORS Requirements

Browser uploads post directly to object storage, so the bucket must allow `POST` from the admin origin.

Minimum CORS expectations:

- allowed method: `POST`
- allowed headers: the form upload headers used by the browser
- allowed origins: your local admin origin and production admin/web origin
- exposed headers may include `ETag` if desired

If CORS is missing or incorrect, upload initialization may succeed but the browser upload to S3 will fail.

## IAM Permissions

The API-side storage credentials need permission to:

- create uploaded objects
- read object metadata for completion verification
- delete managed objects during replace/remove cleanup

In AWS S3 terms, that typically means:

- `s3:PutObject`
- `s3:GetObject`
- `s3:DeleteObject`

Scope permissions to the managed banner prefix rather than the entire bucket when possible.

## Upload Flow

The implementation uses a 3-step direct-upload flow:

1. `POST /api/v1/admin/blogs/:id/banner/upload-init`
   - validates file metadata
   - issues a presigned POST
2. Browser uploads the file directly to object storage
3. `POST /api/v1/admin/blogs/:id/banner/complete`
   - verifies the object exists
   - saves the public URL to `blog_posts.banner_image_url`

Banner removal uses:

- `DELETE /api/v1/admin/blogs/:id/banner`

Object keys follow:

```text
blog-banners/{blogId}/{timestamp}-{uuid}.{ext}
```

Only these image types are allowed:

- `image/jpeg`
- `image/png`
- `image/webp`

Maximum upload size:

- `5 MB`

## Storage Model

- object storage holds media bytes only
- PostgreSQL remains the source of truth for blog records
- `banner_image_url` is the persisted application reference
- cleanup of replaced or removed managed banners is best effort and should not roll back a successful blog update

Legacy external banner URLs remain valid for display, but they are not treated as managed objects and are not deleted by cleanup logic.

## Common Failure Modes

### API boot fails on malformed env

If a storage variable contains an invalid value, the API env parser may reject startup.
For AWS S3, an empty `BLOG_BANNER_STORAGE_ENDPOINT` is valid and should be left blank rather than filled with placeholder text.

### Upload endpoints return `503`

This means storage is not configured.
Check that all required `BLOG_BANNER_STORAGE_*` values are present.

### Browser upload fails with CORS errors

This usually means the bucket CORS rules do not allow `POST` from the current admin origin.

### Upload succeeds but the image does not render publicly

This usually means:

- the bucket object is not publicly readable
- the configured `BLOG_BANNER_STORAGE_PUBLIC_BASE_URL` does not match the actual serving URL

### Completion fails after upload

This usually means:

- the object key does not belong to the expected blog prefix
- the object was not actually written to storage
- the upload expired and the browser POST never completed successfully

## Security Notes

- never commit storage credentials to the repository
- use a dedicated IAM principal instead of root credentials
- rotate credentials immediately if they are exposed
- keep presigned upload expiry short
