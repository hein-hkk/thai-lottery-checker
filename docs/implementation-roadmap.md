# Thai Lottery Checker -- Implementation Slice Roadmap

This roadmap divides the project into **vertical implementation
slices**.\
Each slice delivers a complete user-facing capability including schema,
API, domain logic, and UI when needed.

This approach keeps tasks small enough for AI‑assisted development while
remaining aligned with the modular monolith architecture defined in the
project spec.

------------------------------------------------------------------------

# Slice 0 --- Foundation Skeleton

## Goal

Create the minimum project structure required for all later slices.

## Included

-   Monorepo structure
-   `apps/web`
-   `apps/api`
-   shared packages:
    -   `packages/types`
    -   `packages/schemas`
    -   `packages/domain`
    -   `packages/i18n`
    -   `packages/utils`
-   Database configuration
-   Migration workflow
-   Environment configuration
-   Locale routing scaffold

## Acceptance Criteria

-   Web app runs locally
-   API server runs
-   Database connection works
-   Migrations can run successfully
-   `/en`, `/th`, `/my` routes work

------------------------------------------------------------------------

# Slice 1 --- Results Browsing Core

## Goal

Allow anonymous users to browse lottery results.

## Included

Schema: - `lottery_draws` - `lottery_results`

Public API: - `GET /api/v1/results/latest` - `GET /api/v1/results` -
`GET /api/v1/results/:drawDate`

Web Pages: - Latest results - Result history - Draw detail page

Rules: - Only **published** results are visible - Lottery numbers stored
as **strings** to preserve leading zeros

## Acceptance Criteria

-   Latest results page works
-   History page shows previous draws
-   Draw detail page loads correctly
-   Draft results are hidden from public

------------------------------------------------------------------------

# Slice 2 --- Admin Result Management

## Goal

Allow administrators to create and publish result data.

## Included

Admin features: - Admin login - Create result draft - Edit draft -
Publish result - Correction workflow

Database: - `admins` - `admin_audit_logs`

## Acceptance Criteria

-   Admin can create and edit draft results
-   Admin can publish results
-   Publish action sets `published_at`
-   All actions are recorded in audit logs

------------------------------------------------------------------------

# Slice 3 --- Number Checker

## Goal

Allow users to check ticket numbers against results.

## Included

API: - `POST /api/v1/checker/check`

Features: - Ticket number validation - Prize matching logic - Checker
web page

## Acceptance Criteria

-   Valid numbers can be checked
-   Invalid input returns validation error
-   Correct prize categories returned

------------------------------------------------------------------------

# Slice 4 --- Blog Public Reading

## Goal

Provide SEO-friendly multilingual blog content.

## Included

Database: - `blog_posts` - `blog_post_translations`

API: - Blog list endpoint - Blog detail endpoint

Web: - Blog listing page - Blog detail page

## Acceptance Criteria

-   Users can browse blog posts
-   Blog content loads based on locale
-   Only published posts are visible

------------------------------------------------------------------------

# Slice 5 --- Admin Blog Management

## Goal

Allow admins to manage blog content.

## Included

Admin features: - Create blog post - Edit post - Manage translations -
Publish/unpublish posts

## Acceptance Criteria

-   Admin can create drafts
-   Admin can publish blog posts
-   At least one translation required before publishing

------------------------------------------------------------------------

# Slice 6 --- Mobile Public MVP

## Goal

Provide core public features on mobile.

## Included

Mobile app pages: - Latest results - Result history - Result detail -
Number checker - Blog reading

## Acceptance Criteria

-   Mobile app can load results
-   Mobile checker works
-   Blog pages render correctly

------------------------------------------------------------------------

# Slice 7 --- User Accounts + Saved Tickets

## Goal

Allow users to save lottery tickets.

## Included

Database: - `users` - `saved_tickets`

Features: - User authentication - Save ticket numbers - Edit and delete
tickets - Add ticket notes

## Acceptance Criteria

-   User can register/login
-   Tickets can be saved
-   Notes persist correctly

------------------------------------------------------------------------

# Slice 8 --- Notification Preferences

## Goal

Enable push notifications and reminders.

## Included

Database: - `user_devices` - `notification_preferences`

Features: - Device registration - Notification preference settings -
Reminder scheduling base

## Acceptance Criteria

-   Device tokens can be registered
-   Users can configure preferences
-   Reminder settings stored per user

------------------------------------------------------------------------

# Slice 9 --- Analytics + Admin Dashboard

## Goal

Provide basic analytics for administrators.

## Included

Database: - `analytics_events`

Features: - Event tracking - Admin dashboard summary

Metrics: - Result page views - Checker usage - Blog views

## Acceptance Criteria

-   Analytics events recorded
-   Dashboard displays summary metrics

------------------------------------------------------------------------

# Slice 10 --- Redis Performance Hardening

## Goal

Improve performance for high traffic result queries.

## Included

Caching: - Latest result - Result history - Draw detail

Rules: - Cache invalidated when results are published or corrected -
PostgreSQL remains source of truth - System falls back to DB if Redis
fails

## Acceptance Criteria

-   Cached responses return correct data
-   Cache invalidation works
-   Redis outage does not break API

------------------------------------------------------------------------

# Recommended Execution Order

1.  Slice 0 --- Foundation Skeleton
2.  Slice 1 --- Results Browsing Core
3.  Slice 2 --- Admin Result Management
4.  Slice 3 --- Number Checker
5.  Slice 4 --- Blog Public Reading
6.  Slice 5 --- Admin Blog Management
7.  Slice 6 --- Mobile Public MVP
8.  Slice 7 --- User Accounts + Saved Tickets
9.  Slice 8 --- Notification Preferences
10. Slice 9 --- Analytics + Admin Dashboard
11. Slice 10 --- Redis Performance Hardening

------------------------------------------------------------------------

# Implementation Principle

Each slice should deliver:

-   Database schema changes (if needed)
-   Domain logic
-   API endpoints
-   Web/mobile UI
-   Tests

This ensures every slice results in a **working feature** rather than
incomplete layers.
