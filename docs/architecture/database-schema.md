# Thai Lottery Checker — Database Schema

## 1. Overview

This document describes the database schema for the open-source Thai Lottery Checker system.

The database is designed to support:

- public lottery result browsing
- public number checking
- multilingual blog content
- admin authentication and governance
- admin-managed result entry, release, publish, and correction workflows
- admin-managed blog workflows

Primary database:

- PostgreSQL

Design principles:

- PostgreSQL is the source of truth
- multilingual content is supported from the initial OSS release
- admin actions are auditable
- ticket and prize numbers are stored as strings to preserve leading zeros
- optional infrastructure such as object storage or caching must not change canonical data ownership

## 2. Core Enums

### 2.1 Locale

Supported languages:

- `en`
- `th`
- `my`

### 2.2 PublishStatus

Used for result and blog publishing workflow:

- `draft`
- `published`

### 2.3 PrizeType

Supported lottery prize groups for the canonical Thai Government Lottery public result structure:

- `FIRST_PRIZE`
- `NEAR_FIRST_PRIZE`
- `SECOND_PRIZE`
- `THIRD_PRIZE`
- `FOURTH_PRIZE`
- `FIFTH_PRIZE`
- `FRONT_THREE`
- `LAST_THREE`
- `LAST_TWO`

### 2.4 AdminRole

Admin roles:

- `super_admin`
- `editor`

### 2.5 AdminPermission

Admin permissions:

- `manage_results`
- `manage_blogs`

## 3. Tables

### 3.1 `admins`

Stores admin accounts for dashboard access.

Fields:

- `id` UUID, primary key
- `email` VARCHAR, unique, not null
- `name` VARCHAR, null
- `password_hash` TEXT, not null
- `role` ENUM(AdminRole), not null, default `editor`
- `is_active` BOOLEAN, not null, default `true`
- `password_updated_at` TIMESTAMPTZ, null
- `deactivated_at` TIMESTAMPTZ, null
- `last_login_at` TIMESTAMPTZ, null
- `invited_by_admin_id` UUID, foreign key to `admins.id`, null
- `created_at` TIMESTAMPTZ, not null
- `updated_at` TIMESTAMPTZ, not null

Notes:

- used only for internal dashboard access
- bootstrap `super_admin` access may be created through seed data or environment-driven setup
- `editor` capabilities are scoped through `admin_permissions`
- email should be normalized to lowercase at the application layer

### 3.2 `admin_permissions`

Stores explicit permissions for scoped admin accounts.

Fields:

- `id` UUID, primary key
- `admin_id` UUID, foreign key to `admins.id`, not null
- `permission` ENUM(AdminPermission), not null
- `created_at` TIMESTAMPTZ, not null

Constraints:

- unique composite constraint on `(admin_id, permission)`

Notes:

- `super_admin` does not require explicit permission rows
- `manage_results` authorizes result workflows
- `manage_blogs` authorizes blog workflows

### 3.3 `admin_invitations`

Stores invitation records for admin onboarding.

Fields:

- `id` UUID, primary key
- `email` VARCHAR, not null
- `role` ENUM(AdminRole), not null
- `token_hash` TEXT, not null
- `permissions_json` JSONB, null
- `expires_at` TIMESTAMPTZ, not null
- `accepted_at` TIMESTAMPTZ, null
- `revoked_at` TIMESTAMPTZ, null
- `invited_by_admin_id` UUID, foreign key to `admins.id`, not null
- `created_at` TIMESTAMPTZ, not null
- `updated_at` TIMESTAMPTZ, not null

Notes:

- invitation tokens are stored hashed, not as plaintext
- invitation links are single-use and expiring
- development flows may return the invitation link for manual sharing
- accepting an invitation creates the admin account and any required permission rows

### 3.4 `admin_password_resets`

Stores password reset requests for admin accounts.

Fields:

- `id` UUID, primary key
- `admin_id` UUID, foreign key to `admins.id`, not null
- `token_hash` TEXT, not null
- `expires_at` TIMESTAMPTZ, not null
- `used_at` TIMESTAMPTZ, null
- `created_at` TIMESTAMPTZ, not null

Notes:

- reset tokens are stored hashed
- reset tokens are single-use and expiring
- development flows may expose reset-link output before any email delivery integration exists

### 3.5 `admin_audit_logs`

Tracks sensitive admin operations for traceability.

Fields:

- `id` UUID, primary key
- `admin_id` UUID, foreign key to `admins.id`, not null
- `action` VARCHAR, not null
- `entity_type` VARCHAR, not null
- `entity_id` UUID, not null
- `before_data` JSONB, null
- `after_data` JSONB, null
- `created_at` TIMESTAMPTZ, not null

Example actions:

- `login_admin`
- `invite_admin`
- `revoke_admin_invitation`
- `accept_admin_invitation`
- `deactivate_admin`
- `reactivate_admin`
- `request_admin_password_reset`
- `reset_admin_password`
- `create_result`
- `update_result`
- `release_result_group`
- `unrelease_result_group`
- `update_released_result_group`
- `publish_result`
- `correct_result`
- `create_blog`
- `update_blog`
- `publish_blog`
- `unpublish_blog`

Notes:

- especially important because lottery results are manually entered
- before and after snapshots support correction review and governance traceability

### 3.6 `lottery_draws`

Represents one lottery draw event.

Fields:

- `id` UUID, primary key
- `draw_date` DATE, unique, not null
- `draw_code` VARCHAR, null
- `status` ENUM(PublishStatus), not null, default `draft`
- `published_at` TIMESTAMPTZ, null
- `created_by_admin_id` UUID, foreign key to `admins.id`, not null
- `updated_by_admin_id` UUID, foreign key to `admins.id`, not null
- `created_at` TIMESTAMPTZ, not null
- `updated_at` TIMESTAMPTZ, not null

Notes:

- one row represents one draw date
- `status` remains limited to `draft` and `published`
- published draws are fully visible publicly
- staged public visibility before final publish is controlled at the prize-group level, not with a third draw status
- `published_at` is set on first publish and keeps the original publish timestamp
- later corrections update the published draw in place and remain auditable through `admin_audit_logs`

### 3.7 `lottery_results`

Stores prize numbers belonging to a draw.

Fields:

- `id` UUID, primary key
- `draw_id` UUID, foreign key to `lottery_draws.id`, not null
- `prize_type` ENUM(PrizeType), not null
- `prize_index` INTEGER, not null, default `0`
- `number` VARCHAR, not null
- `created_at` TIMESTAMPTZ, not null
- `updated_at` TIMESTAMPTZ, not null

Notes:

- one row represents exactly one winning number for one draw
- `prize_index` is zero-based and defines stable order within a prize type
- `number` is stored as a string to preserve leading zeros
- `number` must contain digits only, with no separators or spaces

Constraints:

- unique composite constraint on `(draw_id, prize_type, prize_index)`

Canonical prize-group rules:

| Prize type | Expected rows per draw | Digit length |
| --- | ---: | ---: |
| `FIRST_PRIZE` | 1 | 6 |
| `NEAR_FIRST_PRIZE` | 2 | 6 |
| `SECOND_PRIZE` | 5 | 6 |
| `THIRD_PRIZE` | 10 | 6 |
| `FOURTH_PRIZE` | 50 | 6 |
| `FIFTH_PRIZE` | 100 | 6 |
| `FRONT_THREE` | 2 | 3 |
| `LAST_THREE` | 2 | 3 |
| `LAST_TWO` | 1 | 2 |

Canonical display order:

1. `FIRST_PRIZE`
2. `NEAR_FIRST_PRIZE`
3. `SECOND_PRIZE`
4. `THIRD_PRIZE`
5. `FOURTH_PRIZE`
6. `FIFTH_PRIZE`
7. `FRONT_THREE`
8. `LAST_THREE`
9. `LAST_TWO`

Draw completeness rule:

- a draw is result-complete only when every canonical prize group exists with the expected row counts
- draft draws may be incomplete
- published draws should be treated as complete

### 3.8 `lottery_result_group_releases`

Stores public release state for each prize group within a draw.

Fields:

- `id` UUID, primary key
- `draw_id` UUID, foreign key to `lottery_draws.id`, not null
- `prize_type` ENUM(PrizeType), not null
- `is_released` BOOLEAN, not null, default `false`
- `released_at` TIMESTAMPTZ, null
- `released_by_admin_id` UUID, foreign key to `admins.id`, null
- `created_at` TIMESTAMPTZ, not null
- `updated_at` TIMESTAMPTZ, not null

Constraints:

- unique composite constraint on `(draw_id, prize_type)`

Notes:

- controls staged public visibility for latest and detail result experiences
- does not change the draw lifecycle
- a draft draw may have released prize groups visible publicly
- unreleased prize groups render as placeholders in public latest and detail payloads
- history remains published-only

### 3.9 `blog_posts`

Stores blog post metadata.

Fields:

- `id` UUID, primary key
- `slug` VARCHAR, unique, not null
- `banner_image_url` TEXT, null
- `status` ENUM(PublishStatus), not null, default `draft`
- `published_at` TIMESTAMPTZ, null
- `created_by_admin_id` UUID, foreign key to `admins.id`, not null
- `updated_by_admin_id` UUID, foreign key to `admins.id`, not null
- `created_at` TIMESTAMPTZ, not null
- `updated_at` TIMESTAMPTZ, not null

Notes:

- the base blog record is language-independent
- `banner_image_url` stores the public banner reference used by public and admin rendering
- managed banner uploads may back that URL with object storage, but PostgreSQL remains the canonical source of truth for the application record
- object storage is supporting infrastructure for media bytes, not canonical content storage

### 3.10 `blog_post_translations`

Stores multilingual blog content.

Fields:

- `id` UUID, primary key
- `blog_post_id` UUID, foreign key to `blog_posts.id`, not null
- `locale` ENUM(Locale), not null
- `title` VARCHAR, not null
- `body` JSONB, not null
- `excerpt` TEXT, null
- `seo_title` VARCHAR, null
- `seo_description` TEXT, null
- `created_at` TIMESTAMPTZ, not null
- `updated_at` TIMESTAMPTZ, not null

Notes:

- one blog post can have multiple translations
- `body` stores structured paragraph-block content

Example `body`:

```json
[
  { "type": "paragraph", "text": "Thai lottery is..." },
  { "type": "paragraph", "text": "The draw happens..." }
]
```

Constraints:

- unique composite constraint on `(blog_post_id, locale)`

## 4. Relationships

Main relationships:

- one `admin` has many `admin_permissions`
- one `admin` has many `admin_invitations`
- one `admin` has many `admin_password_resets`
- one `admin` has many `admin_audit_logs`
- one `lottery_draw` has many `lottery_results`
- one `lottery_draw` has many `lottery_result_group_releases`
- one `blog_post` has many `blog_post_translations`

## 5. Index Recommendations

### `admins`

- unique index on `email`

### `admin_permissions`

- index on `admin_id`
- unique composite index on `(admin_id, permission)`

### `admin_invitations`

- index on `email`
- index on `invited_by_admin_id`
- unique index on `token_hash`
- index on `expires_at`

### `admin_password_resets`

- index on `admin_id`
- unique index on `token_hash`
- index on `expires_at`

### `lottery_draws`

- unique index on `draw_date`
- index on `status`
- index on `published_at`

### `lottery_results`

- index on `draw_id`
- composite index on `(draw_id, prize_type)`
- unique composite index on `(draw_id, prize_type, prize_index)`

### `lottery_result_group_releases`

- index on `draw_id`
- composite index on `(draw_id, is_released)`
- unique composite index on `(draw_id, prize_type)`

### `blog_posts`

- unique index on `slug`
- index on `status`
- index on `published_at`

### `blog_post_translations`

- unique composite index on `(blog_post_id, locale)`
- index on `locale`

## 6. Validation Rules

### Lottery results

- `draw_date` must be valid
- result rows must match the expected digit length for their `prize_type`
- result numbers must contain digits only
- result numbers must preserve leading zeros
- public history exposes only published draws
- public latest and detail may expose draft draws only when prize-group release state allows it

### Prize digit rules

- `FIRST_PRIZE` -> 6 digits
- `NEAR_FIRST_PRIZE` -> 6 digits
- `SECOND_PRIZE` -> 6 digits
- `THIRD_PRIZE` -> 6 digits
- `FOURTH_PRIZE` -> 6 digits
- `FIFTH_PRIZE` -> 6 digits
- `FRONT_THREE` -> 3 digits
- `LAST_THREE` -> 3 digits
- `LAST_TWO` -> 2 digits

### Prize count rules per draw

- `FIRST_PRIZE` -> exactly 1 row
- `NEAR_FIRST_PRIZE` -> exactly 2 rows
- `SECOND_PRIZE` -> exactly 5 rows
- `THIRD_PRIZE` -> exactly 10 rows
- `FOURTH_PRIZE` -> exactly 50 rows
- `FIFTH_PRIZE` -> exactly 100 rows
- `FRONT_THREE` -> exactly 2 rows
- `LAST_THREE` -> exactly 2 rows
- `LAST_TWO` -> exactly 1 row

### Blog content

- `slug` must be unique
- `title` is required per translation
- `body` must contain at least one paragraph
- `locale` must be one of the supported locales
- `banner_image_url`, if provided, must be a valid URL

## 7. Publish Workflow Considerations

### Lottery results

Before publish:

- the draw must exist
- all canonical prize groups must exist
- every result row must satisfy the prize-type digit length rule

Before final publish, staged release may occur:

- the draw may remain `draft`
- individual prize groups may be released or unreleased
- released groups can be shown publicly in latest and detail experiences
- unreleased groups remain placeholder-only publicly

After publish:

- draw status becomes `published`
- `published_at` is set
- the draw must not revert to `draft`
- corrections update the published draw in place

### Blog posts

Before publish:

- the blog post must exist
- at least one translation must exist
- at least one translation must include a title and a valid paragraph body

After publish:

- blog status becomes `published`
- `published_at` is set

## 8. Future Extension Possibilities

The OSS schema can be extended later for private or future work such as:

- richer blog editing capabilities
- OCR-based ticket scanning
- more advanced result types
- personalization or user-specific features

These are not part of the current open-source schema scope.
