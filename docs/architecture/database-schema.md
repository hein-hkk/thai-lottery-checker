# Thai Lottery Checker — Database Schema

## 1. Overview

This document describes the database schema for the Thai Lottery Checker system.

The database is designed to support:

- public lottery result browsing
- number checking
- multilingual blog content
- mobile saved tickets and notifications
- admin result entry and publishing
- analytics and audit logging

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

Supported lottery prize groups for MVP:

- `FIRST_PRIZE`
- `FRONT_THREE`
- `LAST_THREE`
- `LAST_TWO`

---

## 2.4 AdminRole

Admin roles:

- `super_admin`
- `editor`

---

## 2.5 AuthProvider

User authentication provider:

- `email`
- `google`
- `apple`

---

## 2.6 DevicePlatform

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
- `password_hash` TEXT, not null
- `role` ENUM(AdminRole), not null, default `editor`
- `is_active` BOOLEAN, not null, default `true`
- `last_login_at` TIMESTAMPTZ, null
- `created_at` TIMESTAMPTZ, not null
- `updated_at` TIMESTAMPTZ, not null

### Notes

- Used only for internal dashboard access
- `is_active` allows disabling admin accounts without deleting them

---

## 3.2 `admin_audit_logs`

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

- `create_result`
- `update_result`
- `publish_result`
- `create_blog`
- `update_blog`
- `publish_blog`

### Notes

- Important because lottery results are manually entered
- Helps investigate mistakes and corrections

---

## 3.3 `lottery_draws`

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
- Public users should only see rows where `status = published`

---

## 3.4 `lottery_results`

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

- `number` is stored as a string to preserve leading zeros
- `prize_index` supports prize groups with multiple numbers

### Example

For one draw:

- `FIRST_PRIZE`, index `0`, number `123456`
- `FRONT_THREE`, index `0`, number `123`
- `FRONT_THREE`, index `1`, number `456`
- `LAST_THREE`, index `0`, number `111`
- `LAST_THREE`, index `1`, number `222`
- `LAST_TWO`, index `0`, number `89`

### Constraints

Unique composite constraint:

- `(draw_id, prize_type, prize_index)`

---

## 3.5 `blog_posts`

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

## 3.6 `blog_post_translations`

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

## 3.7 `users`

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

## 3.8 `user_devices`

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

## 3.9 `saved_tickets`

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

## 3.10 `notification_preferences`

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

## 3.11 `analytics_events`

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
- result rows must match expected digit length
- only published draws should be visible publicly

## Prize digit rules
- `FIRST_PRIZE` → 6 digits
- `FRONT_THREE` → 3 digits
- `LAST_THREE` → 3 digits
- `LAST_TWO` → 2 digits

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
- first prize must exist
- front three must have exactly 2 numbers
- last three must have exactly 2 numbers
- last two must have exactly 1 number

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
