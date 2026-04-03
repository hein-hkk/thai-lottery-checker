# Thai Lottery Checker -- Implementation Slice Roadmap

This roadmap divides the OSS project into vertical implementation slices.
Each slice should deliver a complete user-facing capability across schema, API, shared domain logic, and UI when needed.

Slices 0 through 6 describe the implemented OSS baseline currently represented in this repository.
Later slices describe planned public OSS work that has not been implemented yet.

---

# Slice 0 -- Foundation Skeleton

## Goal

Create the minimum project structure required for all later slices.

## Included

- monorepo structure
- `apps/web`
- `apps/api`
- shared packages:
  - `packages/types`
  - `packages/schemas`
  - `packages/domain`
  - `packages/i18n`
  - `packages/utils`
- database configuration
- migration workflow
- environment configuration
- locale routing scaffold

## Acceptance Criteria

- web app runs locally
- API server runs
- database connection works
- migrations can run successfully
- `/en`, `/th`, `/my` routes work

---

# Slice 1 -- Results Browsing Core

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

Web pages:

- latest results
- result history
- draw detail page

Rules:

- public browsing is initially published-only in Slice 1
- lottery numbers are stored as strings to preserve leading zeros
- staged-release behavior is intentionally deferred to Slice 3

## Acceptance Criteria

- latest results page works
- history page shows previous published draws
- draw detail page loads correctly for published draws
- draft results are hidden from public in Slice 1 behavior

---

# Slice 2 -- Admin Platform Foundation and Result Management

## Goal

Establish the secure admin platform foundation and allow administrators to manage result data.

## Included

Admin features:

- admin login, logout, and current session
- invitation-based onboarding
- password reset
- admin management for `super_admin`
- create result draft
- edit draft
- publish result
- correction workflow

Authorization:

- roles: `super_admin`, `editor`
- permissions: `manage_results`, `manage_blogs`
- backend-enforced guards for admin governance and result management

Database:

- `admins`
- `admin_permissions`
- `admin_invitations`
- `admin_password_resets`
- `admin_audit_logs`

## Acceptance Criteria

- seeded `super_admin` can authenticate and access protected admin routes
- invitation onboarding, password reset, and admin management flows work
- admin with `manage_results` can create and edit draft results
- admin can publish and correct results
- first publish sets `published_at`
- sensitive governance and result actions are recorded in audit logs
- public APIs remain published-only until Slice 3 refinement adds staged visibility

---

# Slice 3 -- Product Refinement (Results + Admin UX)

## Goal

Refine the core product experience for public results and admin workflows before expanding into new feature areas.

## Included

Results domain:

- prize-group staged public release for draft draws
- draw lifecycle remains `draft` and `published`
- `lottery_result_group_releases` table for per-draw, per-prize-group visibility
- Bangkok-time draw-day latest-selection rule

Public API behavior updates:

- `GET /api/v1/results/latest` may prefer a Bangkok-today draft immediately, even before the first group release
- `GET /api/v1/results` remains published-only history
- `GET /api/v1/results/:drawDate` may return the Bangkok-today draft, including placeholder-only state before the first group release

Public web:

- replace `/{locale}/` placeholder with a real landing page
- landing page includes latest hero preview and published-only history list
- `/{locale}/results` remains bookmarkable and can render the current draw-day draft
- `/{locale}/results/history` remains available as a secondary archive route
- `/{locale}/results/{drawDate}` supports placeholder rendering for unreleased prize groups
- blog teasers remain deferred until a later OSS slice

Admin UX:

- release one prize group at a time
- unrelease a prize group before final publish
- edit a released prize group before final publish
- keep post-publish correction immediate and auditable
- refine admin-management listing behavior

## Acceptance Criteria

- draw lifecycle still uses only `draft` and `published`
- a Bangkok-today draft becomes public immediately, and placeholder-only state is valid before the first group release
- final publish is blocked until all canonical prize groups are complete and valid
- `/{locale}/` works as the public landing page with latest hero plus published-only history
- `/{locale}/results` can show the current Bangkok-time draw-day draft even before the first group release
- `/{locale}/results/history` stays directly reachable as a secondary archive route
- admins with `manage_results` can release, unrelease, and edit released groups before final publish
- release, unrelease, publish, and correction actions remain auditable

---

# Slice 4 -- Number Checker

## Goal

Allow users to check ticket numbers against results.

## Included

API:

- `GET /api/v1/checker/draws`
- `POST /api/v1/checker/check`

Features:

- ticket number validation
- prize matching logic
- prize-amount and total-winning calculations
- draft-aware partial checker status using released prize groups only
- embedded checker on public pages
- URL-driven checker result overlay on `/{locale}/results/{drawDate}?checker=1&ticket=XXXXXX`

## Acceptance Criteria

- valid numbers can be checked
- invalid input returns validation error
- correct prize categories are returned
- checker returns matched prize amounts plus `totalWinningAmount`
- public Bangkok-today drafts can be checked with `partial` status
- embedded checker can navigate to the selected draw detail page and open the checker overlay
- draw options include only publicly checkable draws

---

# Slice 5 -- Blog Public Reading

## Goal

Provide SEO-friendly multilingual blog content.

## Included

Database:

- `blog_posts`
- `blog_post_translations`

API:

- blog list endpoint
- blog detail endpoint

Web:

- blog listing page
- blog detail page

## Acceptance Criteria

- users can browse blog posts
- blog content loads based on locale
- only published posts are visible

---

# Slice 6 -- Admin Blog Management

## Goal

Allow admins to manage blog content.

## Included

Admin features:

- create blog post
- edit post metadata
- manage translations
- publish and unpublish posts

## Acceptance Criteria

- admin can create drafts
- admin can publish blog posts
- at least one valid translation is required before publishing

---

# Slice 7 -- Blog Banner Uploads and Home-Page Teasers

## Goal

Add the remaining blog content presentation work to the OSS web product before the broader refinement pass.

## Included

Public web:

- add blog teasers to the locale landing page
- refine home-page content presentation so results and blog discovery work together cleanly

Blog operations:

- support blog banner uploads via object storage
- keep `banner_image_url` as the persisted blog banner reference

Architecture:

- treat object storage as an optional new dependency introduced by this slice, not a requirement of earlier slices

## Acceptance Criteria

- `/{locale}` includes blog teasers without regressing the latest-result and history entry-point experience
- admins can attach blog banners through an upload flow backed by object storage
- public blog cards and blog detail pages can render uploaded banner assets
- earlier OSS slices still work without requiring non-blog infrastructure changes

---

# Slice 8 -- Web Refinement and Production Readiness

## Goal

Finish the remaining public-web cleanup, localization refinement, and end-to-end verification work so the OSS website is ready for production use before mobile work begins.

## Included

Localization and content polish:

- refine language translation changes across the public website and admin surfaces where needed
- resolve copy inconsistencies introduced during earlier slices

UI cleanup:

- remove dead styles
- remove unnecessary wrapper containers
- simplify presentation structure where extra layout layers are no longer needed

Readiness and verification:

- test the whole website across public and admin flows
- fix production-readiness issues discovered during the verification pass

## Acceptance Criteria

- supported-language content is consistent across key public pages and implemented admin flows
- dead style rules and unnecessary wrapper containers are removed without visual regressions
- core public and admin user journeys are tested end to end
- the OSS website is in a production-ready state before mobile implementation starts

---

# Slice 9 -- Mobile Public MVP

## Goal

Provide the core public OSS experience on mobile.

## Included

Mobile app surfaces:

- latest results
- result history
- result detail
- number checker
- blog reading
- language switching

Rules:

- mobile is public-only in OSS scope
- mobile consumes the shared backend and shared contracts where appropriate
- no user accounts, saved tickets, notifications, analytics features, or monetization-specific flows are included

## Acceptance Criteria

- mobile app can load latest, history, and detail result data
- mobile checker works against the shared API
- blog list and blog detail render correctly
- locale switching works for supported languages

---

# Recommended Execution Order

1. Slice 0 -- Foundation Skeleton
2. Slice 1 -- Results Browsing Core
3. Slice 2 -- Admin Platform Foundation and Result Management
4. Slice 3 -- Product Refinement (Results + Admin UX)
5. Slice 4 -- Number Checker
6. Slice 5 -- Blog Public Reading
7. Slice 6 -- Admin Blog Management
8. Slice 7 -- Blog Banner Uploads and Home-Page Teasers
9. Slice 8 -- Web Refinement and Production Readiness
10. Slice 9 -- Mobile Public MVP

---

# Implementation Principle

Each slice should deliver:

- database schema changes if needed
- domain logic
- API endpoints
- web or mobile UI as appropriate
- tests

This keeps every slice aligned to a working feature rather than an incomplete technical layer.
