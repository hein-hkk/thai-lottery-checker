# Thai Lottery Checker — Database Schema

## 1. Overview

This document describes the database schema for the Thai Lottery Checker system.

The database is designed to support:

- public lottery result browsing
- number checking
- multilingual blog content
- mobile saved tickets and notifications
- admin authentication and result entry
- dashboard summaries and audit logging

Primary database:

- **PostgreSQL**

Design principles:

- PostgreSQL is the **source of truth**
- Redis is used only for caching hot read paths
- multilingual content is supported from the initial release
- admin actions are auditable
- ticket and prize numbers are stored as **strings** to preserve leading zeros

---

# 2. Core Enums

## 2.1 Locale

Supported languages:

- `en`
- `th`
- `my`

---

## 2.2 PublishStatus

Used for result and blog publishing workflow:

- `draft`
- `published`

---

## 2.3 PrizeType

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

---

## 2.4 AdminRole

Admin roles:

- `super_admin`
- `editor`

---

## 2.5 AdminPermission

Admin permissions:

- `manage_results`
- `manage_blogs`

---

## 2.6 AuthProvider

User authentication provider:

- `email`
- `google`
- `apple`

---

## 2.7 DevicePlatform

Mobile device platform:

- `ios`
- `android`

---

# 3. Tables

## 3.1 `admins`

Stores admin accounts for dashboard access.

### Fields

- `id` UUID, primary key
- `email` VARCHAR, unique, not null
- `name` VARCHAR, null
- `password_hash` TEXT, not null
- `role` ENUM(AdminRole), not null, default `editor`
- `is_active` BOOLEAN, not null, default `true`
- `password_updated_at` TIMESTAMPTZ, null
- `deactivated_at` TIMESTAMPTZ, null
- `last_login_at` TIMESTAMPTZ, null
- `invited_by_admin_id` UUID, foreign key → `admins.id`, null
- `created_at` TIMESTAMPTZ, not null
- `updated_at` TIMESTAMPTZ, not null

### Notes

- Used only for internal dashboard access
- Bootstrap `super_admin` access may be created through seed data or environment-driven setup
- `super_admin` is used for full platform administration
- `editor` permissions are scoped through `admin_permissions`
- `is_active` allows disabling admin accounts without deleting them
- `deactivated_at` complements `is_active` for lifecycle tracking
- `invited_by_admin_id` records invitation provenance
- Email should be normalized to lowercase at the application layer

---

## 3.2 `admin_permissions`

Stores explicit permissions for scoped admin accounts.

### Fields

- `id` UUID, primary key
- `admin_id` UUID, foreign key → `admins.id`, not null
- `permission` ENUM(AdminPermission), not null
- `created_at` TIMESTAMPTZ, not null

### Constraints

Unique composite constraint:

- `(admin_id, permission)`

### Notes

- `super_admin` does not require explicit permission rows
- `editor` authorization is based on these rows
- `manage_results` allows result drafting, publishing, and correction workflows
- `manage_blogs` allows blog-management workflows for later slices

---

## 3.3 `admin_invitations`

Stores invitation records for admin onboarding.

### Fields

- `id` UUID, primary key
- `email` VARCHAR, not null
- `role` ENUM(AdminRole), not null
- `token_hash` TEXT, not null
- `permissions_json` JSONB, null
- `expires_at` TIMESTAMPTZ, not null
- `accepted_at` TIMESTAMPTZ, null
- `revoked_at` TIMESTAMPTZ, null
- `invited_by_admin_id` UUID, foreign key → `admins.id`, not null
- `created_at` TIMESTAMPTZ, not null
- `updated_at` TIMESTAMPTZ, not null

### Notes

- Admin onboarding is invitation-based
- Invitation token values must be stored hashed, not as plaintext
- Invitation links are single-use and expiring
- MVP and development flows may return or display the invitation link for manual sharing instead of sending email
- `permissions_json` captures the intended editor permissions at invitation time
- Accepting an invitation creates an admin account plus any required `admin_permissions` rows

---

## 3.4 `admin_password_resets`

Stores password reset requests for admin accounts.

### Fields

- `id` UUID, primary key
- `admin_id` UUID, foreign key → `admins.id`, not null
- `token_hash` TEXT, not null
- `expires_at` TIMESTAMPTZ, not null
- `used_at` TIMESTAMPTZ, null
- `created_at` TIMESTAMPTZ, not null

### Notes

- Password reset token values must be stored hashed, not as plaintext
- Reset tokens are single-use and expiring
- Development flows may expose reset-link output before email delivery is implemented
- Production email delivery can be added later without changing the core schema

---

## 3.5 `admin_audit_logs`

Tracks sensitive admin operations for traceability.

### Fields

- `id` UUID, primary key
- `admin_id` UUID, foreign key → `admins.id`, not null
- `action` VARCHAR, not null
- `entity_type` VARCHAR, not null
- `entity_id` UUID, not null
- `before_data` JSONB, null
- `after_data` JSONB, null
- `created_at` TIMESTAMPTZ, not null

### Example actions

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
- `publish_result`
- `correct_result`
- `create_blog`
- `update_blog`
- `publish_blog`

### Notes

- Important because lottery results are manually entered
- Audit logs are the only required correction-history mechanism in Slice 2
- Before/after snapshots should be used for result corrections and admin governance changes where appropriate
- Helps investigate mistakes and corrections

---

## 3.6 `lottery_draws`

Represents one lottery draw event.

### Fields

- `id` UUID, primary key
- `draw_date` DATE, unique, not null
- `draw_code` VARCHAR, null
- `status` ENUM(PublishStatus), not null, default `draft`
- `published_at` TIMESTAMPTZ, null
- `created_by_admin_id` UUID, foreign key → `admins.id`, not null
- `updated_by_admin_id` UUID, foreign key → `admins.id`, not null
- `created_at` TIMESTAMPTZ, not null
- `updated_at` TIMESTAMPTZ, not null

### Notes

- One row represents one draw date
- `draw_date` must be unique
- Public users should only see rows where `status = published`
- Published draws are visible publicly
- `published_at` should be non-null when `status = published`
- `published_at` is set on first publish and keeps the original publish timestamp
- Later corrections update the published draw in place
- Corrections use `updated_at` plus audit logs and do not overwrite the original meaning of `published_at`
- Result corrections should remain auditable

---

## 3.7 `lottery_results`

Stores prize numbers belonging to a draw.

### Fields

- `id` UUID, primary key
- `draw_id` UUID, foreign key → `lottery_draws.id`, not null
- `prize_type` ENUM(PrizeType), not null
- `prize_index` INTEGER, not null, default `0`
- `number` VARCHAR, not null
- `created_at` TIMESTAMPTZ, not null
- `updated_at` TIMESTAMPTZ, not null

### Notes

- One row represents exactly one winning number for one draw
- `prize_index` is zero-based and defines stable order within a prize type
- `number` is stored as a string to preserve leading zeros
- `number` must contain digits only, with no separators or spaces
- Public APIs and shared result types should return `number` exactly as stored

### Example

For one draw:

- `FIRST_PRIZE`, index `0`, number `123456`
- `NEAR_FIRST_PRIZE`, index `0`, number `012345`
- `NEAR_FIRST_PRIZE`, index `1`, number `987654`
- `SECOND_PRIZE`, index `0`, number `234567`
- `THIRD_PRIZE`, index `0`, number `345678`
- `FOURTH_PRIZE`, index `0`, number `456789`
- `FIFTH_PRIZE`, index `0`, number `567890`
- `FRONT_THREE`, index `0`, number `123`
- `FRONT_THREE`, index `1`, number `045`
- `LAST_THREE`, index `0`, number `111`
- `LAST_THREE`, index `1`, number `222`
- `LAST_TWO`, index `0`, number `89`

### Constraints

Unique composite constraint:

- `(draw_id, prize_type, prize_index)`

### Canonical prize-group rules

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

### Canonical display order

Shared domain helpers, shared types, shared schemas, and public result payloads should use this stable prize-group order:

1. `FIRST_PRIZE`
2. `NEAR_FIRST_PRIZE`
3. `SECOND_PRIZE`
4. `THIRD_PRIZE`
5. `FOURTH_PRIZE`
6. `FIFTH_PRIZE`
7. `FRONT_THREE`
8. `LAST_THREE`
9. `LAST_TWO`

### Draw completeness rule

- A draw is result-complete only when every canonical prize group exists with the expected row counts listed above
- Draft draws may be incomplete
- Published draws should be treated as complete
- Public result visibility should continue to depend on `status = published`

### Public result shape assumption

- Shared result DTOs and validation schemas should represent all canonical prize groups
- Prize numbers must remain strings in API payloads and shared types
- Prize groups should be emitted in canonical display order so web and API consumers can reuse the same shared logic

---

## 3.8 `blog_posts`

Stores blog post metadata.

### Fields

- `id` UUID, primary key
- `slug` VARCHAR, unique, not null
- `banner_image_url` TEXT, null
- `status` ENUM(PublishStatus), not null, default `draft`
- `published_at` TIMESTAMPTZ, null
- `created_by_admin_id` UUID, foreign key → `admins.id`, not null
- `updated_by_admin_id` UUID, foreign key → `admins.id`, not null
- `created_at` TIMESTAMPTZ, not null
- `updated_at` TIMESTAMPTZ, not null

### Notes

- The base blog record is language-independent
- Translated content is stored in `blog_post_translations`

---

## 3.9 `blog_post_translations`

Stores multilingual blog content.

### Fields

- `id` UUID, primary key
- `blog_post_id` UUID, foreign key → `blog_posts.id`, not null
- `locale` ENUM(Locale), not null
- `title` VARCHAR, not null
- `body` JSONB, not null
- `excerpt` TEXT, null
- `seo_title` VARCHAR, null
- `seo_description` TEXT, null
- `created_at` TIMESTAMPTZ, not null
- `updated_at` TIMESTAMPTZ, not null

### Notes

- One blog post can have multiple translations
- `body` uses JSONB so paragraph blocks can be stored cleanly

### Example `body`

```json
[
  { "type": "paragraph", "text": "Thai lottery is..." },
  { "type": "paragraph", "text": "The draw happens..." }
]
```

### Constraints

Unique composite constraint:

- `(blog_post_id, locale)`

---

## 3.10 `users`

Stores mobile user accounts.

### Fields

- `id` UUID, primary key
- `email` VARCHAR, unique, null
- `auth_provider` ENUM(AuthProvider), not null, default `email`
- `password_hash` TEXT, null
- `display_name` VARCHAR, null
- `preferred_locale` ENUM(Locale), null
- `is_active` BOOLEAN, not null, default `true`
- `created_at` TIMESTAMPTZ, not null
- `updated_at` TIMESTAMPTZ, not null

### Notes

- Public website browsing does not require user accounts
- User accounts are mainly for mobile saved-ticket and notification features

---

## 3.11 `user_devices`

Stores device tokens for push notifications.

### Fields

- `id` UUID, primary key
- `user_id` UUID, foreign key → `users.id`, not null
- `platform` ENUM(DevicePlatform), not null
- `device_token` TEXT, unique, not null
- `app_version` VARCHAR, null
- `is_active` BOOLEAN, not null, default `true`
- `last_seen_at` TIMESTAMPTZ, null
- `created_at` TIMESTAMPTZ, not null
- `updated_at` TIMESTAMPTZ, not null

### Notes

- Used for sending push notifications to registered mobile users
- `device_token` should be unique

---

## 3.12 `saved_tickets`

Stores lottery ticket numbers saved by users.

### Fields

- `id` UUID, primary key
- `user_id` UUID, foreign key → `users.id`, not null
- `draw_date` DATE, not null
- `ticket_number` VARCHAR, not null
- `note` TEXT, null
- `created_at` TIMESTAMPTZ, not null
- `updated_at` TIMESTAMPTZ, not null

### Notes

- `ticket_number` must be stored as string
- Users can save notes like:
  - wallet
  - home drawer
  - with friend

### Suggested behavior

- Duplicates may be allowed in MVP because users may keep multiple physical tickets with similar numbers or different notes

---

## 3.13 `notification_preferences`

Stores reminder settings for each user.

### Fields

- `id` UUID, primary key
- `user_id` UUID, foreign key → `users.id`, unique, not null
- `buy_reminder_enabled` BOOLEAN, not null, default `false`
- `draw_reminder_enabled` BOOLEAN, not null, default `false`
- `check_reminder_enabled` BOOLEAN, not null, default `false`
- `buy_reminder_time` TIMESTAMPTZ, null
- `draw_reminder_time` TIMESTAMPTZ, null
- `check_reminder_time` TIMESTAMPTZ, null
- `created_at` TIMESTAMPTZ, not null
- `updated_at` TIMESTAMPTZ, not null

### Notes

- One preference row per user
- Stores whether reminders are enabled and optional reminder timing data

---

## 3.14 `analytics_events`

Stores product analytics and usage events.

### Fields

- `id` UUID, primary key
- `event_name` VARCHAR, not null
- `user_id` UUID, foreign key → `users.id`, null
- `session_id` VARCHAR, null
- `platform` VARCHAR, not null
- `locale` ENUM(Locale), null
- `path` TEXT, null
- `metadata` JSONB, null
- `created_at` TIMESTAMPTZ, not null

### Example events

- `page_view`
- `result_view`
- `checker_submit`
- `blog_view`
- `ticket_saved`
- `notification_open`

### Notes

- Used for dashboard metrics and monetization analysis
- Can support both anonymous and authenticated events

---

# 4. Relationships

## Main relationships

- One `admin` has many `admin_permissions`
- One `admin` has many `admin_invitations`
- One `admin` has many `admin_password_resets`
- One `admin` has many `admin_audit_logs`
- One `lottery_draw` has many `lottery_results`
- One `blog_post` has many `blog_post_translations`
- One `user` has many `user_devices`
- One `user` has many `saved_tickets`
- One `user` has one `notification_preferences`

---

# 5. Index Recommendations

## `admins`
- unique index on `email`

## `admin_permissions`
- index on `admin_id`
- unique composite index on `(admin_id, permission)`

## `admin_invitations`
- index on `email`
- index on `invited_by_admin_id`
- unique index on `token_hash`
- index on `expires_at`

## `admin_password_resets`
- index on `admin_id`
- unique index on `token_hash`
- index on `expires_at`

## `lottery_draws`
- unique index on `draw_date`
- index on `status`
- index on `published_at`

## `lottery_results`
- index on `draw_id`
- composite index on `(draw_id, prize_type)`
- unique composite index on `(draw_id, prize_type, prize_index)`

## `blog_posts`
- unique index on `slug`
- index on `status`
- index on `published_at`

## `blog_post_translations`
- unique composite index on `(blog_post_id, locale)`
- index on `locale`

## `users`
- unique index on `email`

## `user_devices`
- unique index on `device_token`
- index on `user_id`

## `saved_tickets`
- index on `user_id`
- composite index on `(user_id, draw_date)`
- composite index on `(user_id, ticket_number)`

## `notification_preferences`
- unique index on `user_id`

## `analytics_events`
- index on `event_name`
- index on `created_at`
- composite index on `(platform, created_at)`

---

# 6. Validation Rules

## Lottery Results
- `draw_date` must be valid
- result rows must match expected digit length for their `prize_type`
- each draw must preserve uniqueness on `(draw_id, prize_type, prize_index)`
- `prize_index` must be zero-based
- result numbers must contain digits only
- result numbers must preserve leading zeros
- only published draws should be visible publicly

## Prize digit rules
- `FIRST_PRIZE` → 6 digits
- `NEAR_FIRST_PRIZE` → 6 digits
- `SECOND_PRIZE` → 6 digits
- `THIRD_PRIZE` → 6 digits
- `FOURTH_PRIZE` → 6 digits
- `FIFTH_PRIZE` → 6 digits
- `FRONT_THREE` → 3 digits
- `LAST_THREE` → 3 digits
- `LAST_TWO` → 2 digits

## Prize count rules per draw
- `FIRST_PRIZE` → exactly 1 row
- `NEAR_FIRST_PRIZE` → exactly 2 rows
- `SECOND_PRIZE` → exactly 5 rows
- `THIRD_PRIZE` → exactly 10 rows
- `FOURTH_PRIZE` → exactly 50 rows
- `FIFTH_PRIZE` → exactly 100 rows
- `FRONT_THREE` → exactly 2 rows
- `LAST_THREE` → exactly 2 rows
- `LAST_TWO` → exactly 1 row

## Ticket Numbers
- must be numeric strings
- must preserve leading zeros
- should be validated before saving or checking

## Blog Content
- `slug` must be unique
- `title` is required per translation
- `body` must contain at least one paragraph
- `locale` must be one of supported locales

## User Data
- email must be valid when provided
- device token must be unique
- only authenticated users can manage saved tickets and preferences

---

# 7. Publish Workflow Considerations

## Lottery Results
Before publish:
- draw must exist
- all canonical prize groups must exist
- `FIRST_PRIZE` must have exactly 1 number
- `NEAR_FIRST_PRIZE` must have exactly 2 numbers
- `SECOND_PRIZE` must have exactly 5 numbers
- `THIRD_PRIZE` must have exactly 10 numbers
- `FOURTH_PRIZE` must have exactly 50 numbers
- `FIFTH_PRIZE` must have exactly 100 numbers
- `FRONT_THREE` must have exactly 2 numbers
- `LAST_THREE` must have exactly 2 numbers
- `LAST_TWO` must have exactly 1 number
- every result row must satisfy the prize-type digit length rule

After publish:
- draw status becomes published
- `published_at` is set
- related Redis cache keys must be invalidated

## Blog Posts
Before publish:
- blog post must exist
- at least one translation must exist
- translation must include title and body

After publish:
- blog status becomes `published`
- `published_at` is set

---

# 8. Future Extension Possibilities

The schema is designed to support future growth such as:
- richer blog editors
- scheduled publishing
- OCR-based ticket scanning
- more advanced result types
- richer notification scheduling
- deeper analytics dashboards
- user personalization

These are not required for MVP but the schema leaves room for them.
