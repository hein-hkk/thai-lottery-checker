# Thai Lottery Checker -- Implementation Slice Roadmap

This roadmap divides the project into **vertical implementation slices**.
Each slice delivers a complete user-facing capability including schema,
API, domain logic, and UI when needed.

This approach keeps tasks small enough for AI-assisted development while
remaining aligned with the modular monolith architecture defined in the
project spec.

------------------------------------------------------------------------

# Slice 0 --- Foundation Skeleton

## Goal

Create the minimum project structure required for all later slices.

## Included

- Monorepo structure
- `apps/web`
- `apps/api`
- shared packages:
  - `packages/types`
  - `packages/schemas`
  - `packages/domain`
  - `packages/i18n`
  - `packages/utils`
- Database configuration
- Migration workflow
- Environment configuration
- Locale routing scaffold

## Acceptance Criteria

- Web app runs locally
- API server runs
- Database connection works
- Migrations can run successfully
- `/en`, `/th`, `/my` routes work

------------------------------------------------------------------------

# Slice 1 --- Results Browsing Core

## Goal

Allow anonymous users to browse published lottery results.

## Included

Schema:
- `lottery_draws`
- `lottery_results`

Public API:
- `GET /api/v1/results/latest`
- `GET /api/v1/results`
- `GET /api/v1/results/:drawDate`

Web Pages:
- Latest results
- Result history
- Draw detail page

Rules:
- Public browsing is initially published-only in Slice 1
- Lottery numbers are stored as **strings** to preserve leading zeros
- Later staged-release behavior is intentionally deferred to Slice 3

## Acceptance Criteria

- Latest results page works
- History page shows previous published draws
- Draw detail page loads correctly for published draws
- Draft results are hidden from public in Slice 1 behavior

------------------------------------------------------------------------

# Slice 2 --- Admin Platform Foundation and Result Management

## Goal

Establish the secure admin platform foundation and allow administrators to manage result data.

## Included

Admin features:
- Admin login/logout/current session
- Invitation-based onboarding
- Password reset
- Admin management for `super_admin`
- Create result draft
- Edit draft
- Publish result
- Correction workflow

Authorization:
- Roles: `super_admin`, `editor`
- Permissions: `manage_results`, `manage_blogs`
- Backend-enforced guards for admin governance and result management

Database:
- `admins`
- `admin_permissions`
- `admin_invitations`
- `admin_password_resets`
- `admin_audit_logs`

## Acceptance Criteria

- Seeded `super_admin` can authenticate and access protected admin routes
- Invitation onboarding, password reset, and admin management flows work
- Admin with `manage_results` can create and edit draft results
- Admin can publish and correct results
- First publish sets `published_at`
- Sensitive governance and result actions are recorded in audit logs
- Public APIs remain published-only until Slice 3 refinement adds staged visibility

------------------------------------------------------------------------

# Slice 3 --- Product Refinement (Results + Admin UX)

## Goal

Refine the core product experience for public results and admin workflows before expanding into new feature areas.

## Included

Results domain:
- Prize-group staged public release for draft draws
- Keep draw lifecycle as `draft` and `published`
- New `lottery_result_group_releases` table for per-draw, per-prize-group visibility
- Bangkok-time draw-day latest-selection rule

Public API behavior updates:
- `GET /api/v1/results/latest` may prefer a current draw-day draft with released preview groups
- `GET /api/v1/results` remains published-only history
- `GET /api/v1/results/:drawDate` may return a partially released draw detail

Public web:
- Replace `/{locale}/` placeholder with a real landing page
- Landing page includes latest hero preview and published-only history list
- `/{locale}/results` remains bookmarkable and can render a partially released latest draw
- `/{locale}/results/{drawDate}` supports placeholder rendering for unreleased prize groups
- Blog teasers remain deferred to the later blog slice

Admin UX:
- Release one prize group at a time
- Unrelease a prize group before final publish
- Edit a released prize group before final publish
- Keep post-publish correction immediate and auditable
- Refine admin-management listing with `Activated Admin`, `Deactivated Admin`, and `All`

UI polish:
- Refine public and admin UI/UX flow and presentation after the behavior changes above are in place

## Acceptance Criteria

- Draw lifecycle still uses only `draft` and `published`
- A draft draw can expose released prize groups publicly while unreleased groups render as placeholders
- Final publish is blocked until all canonical prize groups are complete and valid
- `/{locale}/` works as the public landing page with latest hero plus published-only history
- `/{locale}/results` can show the partially released current draw chosen by Bangkok-time draw-day rules
- Admins with `manage_results` can release, unrelease, and edit released groups before final publish
- Release, unrelease, publish, and correction actions remain auditable and invalidate dependent result caches

------------------------------------------------------------------------

# Slice 4 --- Number Checker

## Goal

Allow users to check ticket numbers against results.

## Included

API:
- `POST /api/v1/checker/check`

Features:
- Ticket number validation
- Prize matching logic
- Checker web page

## Acceptance Criteria

- Valid numbers can be checked
- Invalid input returns validation error
- Correct prize categories returned

------------------------------------------------------------------------

# Slice 5 --- Blog Public Reading

## Goal

Provide SEO-friendly multilingual blog content.

## Included

Database:
- `blog_posts`
- `blog_post_translations`

API:
- Blog list endpoint
- Blog detail endpoint

Web:
- Blog listing page
- Blog detail page

## Acceptance Criteria

- Users can browse blog posts
- Blog content loads based on locale
- Only published posts are visible

------------------------------------------------------------------------

# Slice 6 --- Admin Blog Management

## Goal

Allow admins to manage blog content.

## Included

Admin features:
- Create blog post
- Edit post
- Manage translations
- Publish/unpublish posts

## Acceptance Criteria

- Admin can create drafts
- Admin can publish blog posts
- At least one translation required before publishing

------------------------------------------------------------------------

# Slice 7 --- Mobile Public MVP

## Goal

Provide core public features on mobile.

## Included

Mobile app pages:
- Latest results
- Result history
- Result detail
- Number checker
- Blog reading

## Acceptance Criteria

- Mobile app can load results
- Mobile checker works
- Blog pages render correctly

------------------------------------------------------------------------

# Slice 8 --- User Accounts + Saved Tickets

## Goal

Allow users to save lottery tickets.

## Included

Database:
- `users`
- `saved_tickets`

Features:
- User authentication
- Save ticket numbers
- Edit and delete tickets
- Add ticket notes

## Acceptance Criteria

- User can register/login
- Tickets can be saved
- Notes persist correctly

------------------------------------------------------------------------

# Slice 9 --- Notification Preferences

## Goal

Enable push notifications and reminders.

## Included

Database:
- `user_devices`
- `notification_preferences`

Features:
- Device registration
- Notification preference settings
- Reminder scheduling base

## Acceptance Criteria

- Device tokens can be registered
- Users can configure preferences
- Reminder settings stored per user

------------------------------------------------------------------------

# Slice 10 --- Analytics + Admin Dashboard

## Goal

Provide basic analytics for administrators.

## Included

Database:
- `analytics_events`

Features:
- Event tracking
- Admin dashboard summary

Metrics:
- Result page views
- Checker usage
- Blog views

## Acceptance Criteria

- Analytics events recorded
- Dashboard displays summary metrics

------------------------------------------------------------------------

# Slice 11 --- Redis Performance Hardening

## Goal

Improve performance for high traffic result queries.

## Included

Caching:
- Latest result
- Result history
- Draw detail

Rules:
- Cache invalidated when results are released, unreleased, published, or corrected
- PostgreSQL remains source of truth
- System falls back to DB if Redis fails

## Acceptance Criteria

- Cached responses return correct data
- Cache invalidation works
- Redis outage does not break API

------------------------------------------------------------------------

# Recommended Execution Order

1. Slice 0 --- Foundation Skeleton
2. Slice 1 --- Results Browsing Core
3. Slice 2 --- Admin Platform Foundation and Result Management
4. Slice 3 --- Product Refinement (Results + Admin UX)
5. Slice 4 --- Number Checker
6. Slice 5 --- Blog Public Reading
7. Slice 6 --- Admin Blog Management
8. Slice 7 --- Mobile Public MVP
9. Slice 8 --- User Accounts + Saved Tickets
10. Slice 9 --- Notification Preferences
11. Slice 10 --- Analytics + Admin Dashboard
12. Slice 11 --- Redis Performance Hardening

------------------------------------------------------------------------

# Implementation Principle

Each slice should deliver:

- Database schema changes if needed
- Domain logic
- API endpoints
- Web/mobile UI
- Tests

This ensures every slice results in a **working feature** rather than incomplete layers.
