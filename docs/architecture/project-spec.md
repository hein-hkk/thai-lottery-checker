# Thai Lottery Checker — Project Specification

## 1. Overview

Thai Lottery Checker is a multilingual digital product ecosystem for Thai lottery result discovery, number checking, and lottery-related content. The system consists of:

- A **public website** for result browsing, number checking, and SEO-focused blogs
- A **mobile application** for the same core experience plus saved tickets, notes, and reminder notifications
- A shared **admin system** for result operations, blog operations, business reporting, and secure admin access and governance

The product is designed as a real-world monetization-focused platform, with primary audience acquisition aimed at **Myanmar users**, followed by **Thai users**, while keeping **English** available for broader global reach.

Supported languages:

- English (`en`)
- Thai (`th`)
- Myanmar (`my`)

## 2. Product Goals

### Primary goals

- Provide a fast and reliable way for users to view Thai lottery results
- Allow users to quickly check whether their ticket numbers match draw results
- Deliver multilingual lottery information and blog content
- Build repeat usage through mobile saved tickets and reminder notifications
- Monetize primarily through ads, supported by SEO, repeat traffic, and result-day engagement

### Product principles

- **Accuracy**: result data must be trustworthy and easy to correct when needed
- **Speed**: result pages and checker flows must remain responsive during draw-day spikes
- **Simplicity**: users should be able to check numbers with minimal friction
- **Localization**: Thai, Myanmar, and English experiences are first-class from the beginning
- **Operational safety**: admin access must support authenticated entry, controlled onboarding and recovery, draft/publish/correction workflows, and audit logging for sensitive actions

## 3. Target Users

### Anonymous public users

Users who want to:

- See latest and historical results
- Check their ticket numbers
- Read blog posts and lottery-related information
- Switch language freely

### Mobile registered users

Users who want additional convenience features:

- Save ticket numbers
- Add notes for where physical tickets are kept
- Receive reminders and push notifications
- Return around recurring draw cycles

### Admin users

Internal operators who manage:

- Lottery result management and publication
- Blog management responsibilities
- Platform oversight and business metrics

## 4. Core Features

### Public website

- Locale landing page as the primary public discovery surface
- Dedicated bookmarkable latest-results page for users who want the newest official result directly
- Historical draw archive as a secondary browsing surface
- Number checking flow
- Blog list and blog detail pages
- Multilingual routing and content presentation
- SEO-friendly structure for organic growth
- Ad placement areas for monetization

### Mobile app

- Latest results and history
- Number checking
- Blog reading
- Optional account-based saved tickets
- Ticket notes
- Push reminders for:
  - buying lottery tickets
  - draw opening time
  - checking results after release
- Lightweight local caching for convenience

### Admin panel

- Admin authentication
- Invitation-based admin onboarding
- Password reset and account recovery flow
- Admin user management by `super_admin`
- Role and permission-based access control
- Manual entry of official lottery result numbers
- Draft, publish, and correction workflow for results
- Blog management capabilities as part of the final admin platform
- Dashboard metrics as part of the final admin platform
- Audit logging for sensitive changes

The admin area is implemented inside the same Next.js web application under protected `/admin` routes and uses the shared backend API.

## 5. MVP Scope

### Website MVP

- Locale landing page with latest-result preview and history entry point
- Latest result page as a dedicated bookmarkable surface
- Result history page as a secondary full archive surface
- Result detail page by draw date
- Number checker page
- Blog list and blog detail pages
- English / Thai / Myanmar support
- SEO-ready public pages

### Mobile MVP

- Latest results
- Result history
- Number checker
- Saved tickets
- Ticket notes
- Notification preferences and reminders
- Optional user accounts

### Admin MVP

- Admin login
- Invitation-based admin onboarding
- Password reset flow
- Admin management basics for `super_admin`
- Role and permission-based admin access baseline
- Create and edit lottery results
- Publish lottery results
- Correct published lottery results
- Audit logging foundation for admin governance and result changes
- Invitation and password reset links may be returned or displayed for manual sharing in MVP or development flows

## 6. Recommended Technology Stack

### Frontend

- **Next.js 16** for the public website and protected admin area
- **Tailwind CSS 4** as the baseline styling system for the web app
- **React Native + Expo** for the mobile app

### Backend

- **Express + TypeScript** for the shared API layer
- **REST API** for v1 service contracts

### Data and infrastructure

- **PostgreSQL** as the primary source of truth
- **Managed Redis** for result-data caching on hot read paths
- **Cloud object storage** for blog banners and media uploads
- **Prisma 7** for PostgreSQL client generation and migrations
- **Monorepo** for web, mobile, API, and shared packages

### Shared tooling

- **TypeScript** across the stack
- **Zod** for validation schemas
- Shared packages for:
  - types
  - schemas
  - domain logic
  - i18n
  - utilities

## 7. High-Level Architecture

```text
Users
 ├─ Website (Next.js)
 ├─ Mobile App (React Native + Expo)
 └─ Admin (protected area in Next.js)

Frontend clients
 └─ Express API
      ├─ Auth service
      ├─ Results service
      ├─ Number checker service
      ├─ Blog service
      ├─ Saved ticket service
      ├─ Notification service
      ├─ Admin service
      ├─ Analytics service
      ├─ PostgreSQL
      ├─ Redis
      └─ Object storage
```

### Architectural direction

- Use **one shared backend** for website, mobile, and admin
- Keep **PostgreSQL** as canonical storage
- Use **Redis only for hot result reads and cache invalidation workflows**
- Avoid early microservices; keep a modular monolith structure
- Keep admin separated logically inside the web app as a protected area in Next.js
- Enforce admin authorization through the shared backend
- Handle API process shutdown gracefully on `SIGINT` and `SIGTERM`, including clean HTTP server closure and Prisma disconnect

## 8. Core System Components

### Results service

Responsible for:

- latest result retrieval
- draw history retrieval
- draw detail retrieval
- staged prize-group visibility for draft draws
- publish and correction workflows
- cache invalidation triggers for release/unrelease/publish/correction, with Redis-backed execution added in the performance-hardening slice

### Number checker service

Responsible for:

- validating ticket number input
- matching ticket numbers against published results
- returning prize match details
- optionally using cached reference data for performance

### Blog service

Responsible for:

- multilingual blog listing and detail retrieval
- blog creation and editing
- publish/unpublish workflows

### Ticket service

Responsible for:

- saved ticket CRUD
- ticket note management
- user ticket listing

### Notification service

Responsible for:

- device token registration
- reminder preference storage
- scheduled notification delivery

### Admin service

Responsible for:

- admin authentication
- invitation and onboarding support
- password recovery support
- permission-aware admin governance
- manual result entry
- prize-group staged release controls
- result publishing and correction
- blog management
- dashboard summaries
- audit logs

### Analytics service

Responsible for:

- page views
- checker submissions
- blog views
- saved ticket usage
- notification engagement
- business-oriented dashboard metrics

## 9. Database Schema Summary

### Main tables

#### `admins`
Stores admin accounts used for dashboard access.

#### `admin_permissions`
Stores scoped permissions for admin accounts.

#### `admin_invitations`
Stores invitation records for admin onboarding.

#### `admin_password_resets`
Stores password reset requests for admin accounts.

#### `admin_audit_logs`
Tracks sensitive admin actions such as onboarding, governance, result creation, updates, publication, correction, and blog publishing.

#### `lottery_draws`
Represents a draw event by date and publish status.

#### `lottery_results`
Stores one winning number per row for a draw, using `PrizeType` and `prize_index` to group and order canonical Thai Government Lottery prize results.

#### `lottery_result_group_releases`
Stores prize-group public release state for a draw without changing the draw lifecycle status.

#### `blog_posts`
Stores blog post metadata such as slug, banner, and publish state.

#### `blog_post_translations`
Stores translated blog content by locale.

#### `users`
Stores mobile user accounts for saved-ticket and notification features.

#### `user_devices`
Stores device tokens for push notifications.

#### `saved_tickets`
Stores user ticket numbers, draw dates, and notes.

#### `notification_preferences`
Stores per-user reminder settings.

#### `analytics_events`
Stores product analytics events for business reporting.

### Core relationships

- One `lottery_draw` has many `lottery_results`
- One `lottery_draw` has many `lottery_result_group_releases`
- One `blog_post` has many `blog_post_translations`
- One `user` has many `saved_tickets`
- One `user` has many `user_devices`
- One `user` has one `notification_preferences`
- One `admin` has many `admin_permissions`
- One `admin` has many `admin_invitations`
- One `admin` has many `admin_password_resets`
- One `admin` has many `admin_audit_logs`

### Key enums

- `Locale`: `en`, `th`, `my`
- `PublishStatus`: `draft`, `published`
- `PrizeType`: `FIRST_PRIZE`, `NEAR_FIRST_PRIZE`, `SECOND_PRIZE`, `THIRD_PRIZE`, `FOURTH_PRIZE`, `FIFTH_PRIZE`, `FRONT_THREE`, `LAST_THREE`, `LAST_TWO`
- `AdminRole`: `super_admin`, `editor`
- `AdminPermission`: `manage_results`, `manage_blogs`
- `AuthProvider`: `email`, `google`, `apple`
- `NotificationType`: `buy_reminder`, `draw_reminder`, `check_reminder`

### Admin platform summary

- Slice 2 establishes the production-ready admin platform foundation for the final product
- Bootstrap `super_admin` access may be created through seed data or environment setup
- Admin onboarding is invitation-based
- MVP and development flows may return or display invitation and password reset links for manual sharing before real email delivery is added
- `super_admin` has full access
- `editor` access is scoped through `manage_results` and `manage_blogs`
- Editors with `manage_results` may create, edit, publish, and correct results
- Slice 3 refines result operations with prize-group release and unrelease before final publish
- Correction history is handled through audit logs rather than a dedicated version-history UI in MVP

### Lottery result model summary

- `lottery_draws` and `lottery_results` remain the core result-domain tables
- `lottery_result_group_releases` stores staged public release state per draw and prize group
- Each `lottery_result` row stores one winning number as a string so leading zeros are preserved
- Canonical expected prize-group counts per draw are:
  - `FIRST_PRIZE`: 1
  - `NEAR_FIRST_PRIZE`: 2
  - `SECOND_PRIZE`: 5
  - `THIRD_PRIZE`: 10
  - `FOURTH_PRIZE`: 50
  - `FIFTH_PRIZE`: 100
  - `FRONT_THREE`: 2
  - `LAST_THREE`: 2
  - `LAST_TWO`: 1
- Canonical digit lengths are:
  - six digits for `FIRST_PRIZE`, `NEAR_FIRST_PRIZE`, `SECOND_PRIZE`, `THIRD_PRIZE`, `FOURTH_PRIZE`, and `FIFTH_PRIZE`
  - three digits for `FRONT_THREE` and `LAST_THREE`
  - two digits for `LAST_TWO`
- Public result payloads should expose grouped prize data in canonical order while preserving number strings exactly as stored
- Public latest/detail payloads may include unreleased prize groups as placeholders before final publish
- Draw lifecycle remains `draft` and `published`; staged release is not a third draw status

## 10. API Design Summary

### Public endpoints

- `GET /api/v1/results/latest`
- `GET /api/v1/results`
- `GET /api/v1/results/:drawDate`
- `POST /api/v1/checker/check`
- `GET /api/v1/blogs`
- `GET /api/v1/blogs/:slug`

### Public result browsing contract

The public result browsing APIs remain:

- `GET /api/v1/results/latest`
- `GET /api/v1/results`
- `GET /api/v1/results/:drawDate`

These endpoints support Slice 1 public browsing for:

- latest result browsing
- result history
- result detail by draw date
- published-only visibility in the initial Slice 1 behavior
- multilingual-ready UI labels

Slice 1 result browsing is read-only. Slice 3 later refines latest/detail behavior with staged prize-group visibility while keeping history published-only.

### Latest / detail response shape

Detailed result responses should support grouped prize data using canonical prize order:

1. `FIRST_PRIZE`
2. `NEAR_FIRST_PRIZE`
3. `SECOND_PRIZE`
4. `THIRD_PRIZE`
5. `FOURTH_PRIZE`
6. `FIFTH_PRIZE`
7. `FRONT_THREE`
8. `LAST_THREE`
9. `LAST_TWO`

Example published latest or detail response:

```json
{
  "drawDate": "2026-03-01",
  "drawCode": "2026-03-01",
  "publishedAt": "2026-03-01T09:30:00.000Z",
  "prizeGroups": [
    { "type": "FIRST_PRIZE", "numbers": ["820866"] },
    { "type": "NEAR_FIRST_PRIZE", "numbers": ["820865", "820867"] },
    { "type": "SECOND_PRIZE", "numbers": ["328032", "716735", "320227", "000001", "999999"] },
    { "type": "THIRD_PRIZE", "numbers": ["123456", "234567", "345678", "456789", "567890", "678901", "789012", "890123", "901234", "012345"] },
    { "type": "FOURTH_PRIZE", "numbers": ["..."] },
    { "type": "FIFTH_PRIZE", "numbers": ["..."] },
    { "type": "FRONT_THREE", "numbers": ["068", "837"] },
    { "type": "LAST_THREE", "numbers": ["054", "479"] },
    { "type": "LAST_TWO", "numbers": ["06"] }
  ]
}
```

### History response shape

History responses remain summarized rather than returning full grouped detail for every row.

Example history item:

```json
{
  "drawDate": "2026-03-01",
  "firstPrize": "820866",
  "lastTwo": "06"
}
```

### Staged latest/detail behavior

- `GET /api/v1/results/latest` prefers a current Bangkok-time draw-day draft immediately; if no Bangkok-today draft exists, it falls back to the latest published draw
- `GET /api/v1/results` remains published-only history
- `GET /api/v1/results/:drawDate` may return either a fully published draw or the Bangkok-today draft, including placeholder-only state before the first group release
- Unreleased prize groups in latest/detail responses must be represented as placeholders while preserving canonical prize-group order
- `/{locale}/results` remains bookmarkable and can render the current draw-day draft, including placeholder-only state before the first group release
- `/{locale}/` becomes the public landing page with latest hero preview plus published-history entry points
- `/{locale}/results/history` remains available as the full archive route but is treated as a secondary navigation destination
- landing and latest-result pages should use trust-focused localized page titles/descriptions while keeping primary navigation labels short

### Authenticated user endpoints

- `POST /api/v1/auth/register`
- `POST /api/v1/auth/login`
- `GET /api/v1/auth/me`
- `GET /api/v1/me/tickets`
- `POST /api/v1/me/tickets`
- `PATCH /api/v1/me/tickets/:id`
- `DELETE /api/v1/me/tickets/:id`
- `GET /api/v1/me/notification-preferences`
- `PATCH /api/v1/me/notification-preferences`
- `POST /api/v1/me/devices`

### Admin endpoints

- `POST /api/v1/admin/auth/login`
- `GET /api/v1/admin/results`
- `POST /api/v1/admin/results`
- `PATCH /api/v1/admin/results/:drawId`
- `POST /api/v1/admin/results/:drawId/publish`
- `GET /api/v1/admin/blogs`
- `POST /api/v1/admin/blogs`
- `PATCH /api/v1/admin/blogs/:id`
- `POST /api/v1/admin/blogs/:id/publish`
- `GET /api/v1/admin/dashboard/summary`

## 11. Redis Caching Strategy

### Purpose

Redis is used to protect the system during lottery draw-day traffic spikes, especially for result-heavy read paths.

### Cache targets

- latest draw result payload
- draw detail payloads
- recent draw history summaries
- optional checker reference data if it becomes read-heavy

### Cache rules

- Redis is **not** the source of truth
- PostgreSQL remains canonical
- Result release, unrelease, publish, and correction workflows must invalidate dependent cache keys
- Cache misses must safely fall back to PostgreSQL
- Redis outages must degrade gracefully without breaking correctness

### Example key groups

- `results:latest:{locale}`
- `results:draw:{drawDate}:{locale}`
- `results:history:{locale}:page:{n}`
- `checker:draw:{drawDate}:reference`

## 12. Localization Strategy

Localization is first-class from initial release.

### Locales

- English
- Thai
- Myanmar

### Content approach

- Static UI text stored in shared locale files
- Blog content stored in translation tables
- Result numbers remain unchanged across locales
- Labels, navigation, and explanatory text are localized

### Web routing approach

- `/en/...`
- `/th/...`
- `/my/...`

This supports both SEO and audience-specific user journeys.

## 13. Operational Rules

### Result workflow

- Admin creates result data in `draft`
- Admin may release or unrelease prize groups before final publish
- Latest/detail public reads may expose released groups from a draft draw while unreleased groups stay placeholder-only
- Result data is validated before final publish
- Final publish marks the draw as complete official public state
- Corrections trigger cache invalidation and fresh reads

### Blog workflow

- Admin creates blog metadata and translations
- Blog remains `draft` until explicitly published
- At least one valid translation is required for publishing

### Validation rules

- Ticket numbers and prize numbers are stored as strings
- Numeric strings must preserve leading zeros
- Prize lengths must match prize type requirements
- Public history must read only published draws
- Public latest/detail may expose partially released draft draws using staged prize-group visibility
- Blog locale values must match supported locales

## 14. Non-Functional Requirements

- Fast response times for result and checker flows
- Reliable manual-entry workflows with correction support
- Scalability for draw-day traffic spikes
- SEO-friendly public website structure
- Mobile notification support for retention
- Basic observability and analytics from early stages

## 15. Roadmap Summary

### Phase 0
Product foundation, market setup, localization policy, ad strategy, content guidelines.

### Phase 1
Monorepo setup, shared packages, core data models, admin auth, audit logging, event tracking.

### Phase 2
Foundation public results plus admin result operations.

### Phase 3
Product refinement for staged result release, landing-page flow, and admin UX improvements.

### Phase 4
Number checker.

### Phase 5
Blog public reading.

### Phase 6
Admin blog management.

### Phase 7
Mobile MVP: results, checker, blogs, saved tickets, notes, notifications.

### Phase 8
Redis-backed draw-day hardening: cache hottest read paths, invalidation, fallback behavior, load testing.

### Phase 9
Admin analytics and monetization optimization.

### Phase 10
Operational maturity, editorial workflow growth, observability, and future monetization review.

## 16. Success Criteria

The MVP is successful when:

- Users can reliably view latest and historical Thai lottery results
- Users can quickly check ticket numbers across supported languages
- Mobile users can save tickets, attach notes, and receive reminders
- Admins can safely enter, publish, and correct results
- Blog content supports organic discovery and monetization goals
- The system remains stable during draw-day traffic spikes
- Redis improves hot-path performance without compromising correctness
