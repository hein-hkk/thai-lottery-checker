# Slice 8 Delivery — Web Refinement and Production Readiness

## Summary

Slice 8 hardened the shipped OSS web product for production readiness by refining public copy, completing route metadata coverage, stabilizing multilingual rendering, adding a shared public footer, and expanding seeded verification data.

This slice delivers:

- public copy refinement across landing, results, checker, and blog surfaces
- route-level metadata and canonical URLs for core public result routes
- deterministic localized date rendering that avoids hydration drift in Myanmar locale
- a shared utility footer on public routes
- graceful public fallback states when optional home-page data is unavailable
- controlled admin access behavior when session checks cannot reach the API
- admin governance UI polish for role selection controls
- larger seeded result/blog content for realistic manual and automated verification
- API security hardening for production deployment

## Delivered Scope

### Public copy and navigation refinement

- refine public-facing English, Thai, and Myanmar copy where needed
- keep primary navigation concise and utility-oriented
- preserve `Blog` as the English primary public nav label in the current shipped state
- improve trust-focused titles and descriptions on public result and blog entry surfaces
- update the English landing latest-results section to:
  - title `Check the Latest Thai Lottery Results`
  - description `View official results and check your ticket instantly.`
  - CTA `View full latest results`
- update the embedded checker to:
  - title `Check Your Ticket`
  - CTA `Check Ticket`
- update the landing blog teaser section to:
  - description `Learn how Thai lottery works and how to check results`
  - CTA `View more`
- update the English blog list hero to:
  - title `Thai Lottery Guides & Tips`
  - description `Learn how Thai lottery results work, how to check your ticket, and what each prize means.`

### Public metadata coverage

- add explicit metadata generation for:
  - `/{locale}`
  - `/{locale}/results`
  - `/{locale}/results/{drawDate}`
- keep existing blog metadata generation for:
  - `/{locale}/blog`
  - `/{locale}/blog/{slug}`
- ensure canonical URLs are emitted for those routes

### Localization and hydration stability

- replace locale-sensitive public date rendering that could differ between SSR and client hydration
- centralize deterministic public date formatting logic
- resolve the Myanmar locale hydration mismatch caused by differing server/client date output

### Public shell completion

- add a shared public footer across public routes only
- keep admin layouts unchanged
- use a restrained utility footer with:
  - copyright
  - links to Home, Latest results, and Blog
- mobile footer behavior:
  - centered content
  - nav links above copyright
- desktop footer behavior:
  - split row with legal copy left and links right

### Public fallback states

- keep the home page robust when API-backed data is unavailable
- show localized unavailable states for latest results, history, and the home blog teaser list
- keep empty blog teaser results hidden so the landing page does not show a redundant empty section when there are simply no localized published posts

### Admin access fallback

- avoid broken server-render states when the admin API is offline
- treat unreachable current-session checks as no resolved admin session so protected admin routes redirect to `/admin/login`
- show a clear admin-service unavailable message if login submission cannot reach the API

### API security hardening

- replace browser-session-only admin logout behavior with database-backed session revocation
- add explicit admin session expiry checks instead of relying only on cookie lifetime
- rotate prior admin sessions on login and revoke active sessions after password reset
- validate trusted `Origin` on admin `POST`, `PUT`, `PATCH`, and `DELETE` requests because admin auth is cookie-based
- add rate limits for admin login, invitation acceptance, password-reset flows, and authenticated admin writes
- add stronger HTTP security headers plus production HSTS behavior
- add request IDs and structured security logging for sensitive routes
- fail production startup if admin secrets or bootstrap credentials still use development defaults

### Admin governance UI polish

- replace native admin role select popups with custom anchored role menus on:
  - the create-invitation form
  - existing admin account role controls
- align admin role selection with the public language-switcher interaction pattern:
  - button trigger
  - anchored popover
  - chevron affordance
  - checkmark for the selected role
- preserve the existing role and permission behavior:
  - `editor` keeps configurable permissions
  - `super_admin` clears editor permissions
  - existing admin updates still persist through the admin governance API

### Seed realism and verification support

- expand development seed data to cover:
  - 32 published draws
  - 1 draft draw
  - 27 published multilingual blog posts
  - 3 draft multilingual blog posts
- support history pagination, blog pagination, detail verification, and admin workflow testing with realistic volume

## Interfaces Added Or Changed

### Web metadata behavior

- added shared public results metadata generation for landing, latest results, and result detail routes
- no API or schema changes were required

### Public UI shell behavior

- `PublicPageShell` now includes a shared footer on public routes
- footer copy is localized through shared i18n messages
- home blog teasers can render the localized blog-list unavailable message when the teaser request fails

### Admin governance UI behavior

- admin role selection now uses a custom menu component instead of native select popups so cross-browser rendering matches the shared interaction style
- admin session probing now fails closed to the login screen when the API is unreachable

### Rendering behavior

- public date formatting now relies on shared deterministic locale formatting instead of mixed SSR/client `Intl` output for critical user-facing strings

### API interfaces and config behavior

- add environment configuration for:
  - trusted proxy handling
  - admin session TTL
  - login, reset, invitation, and admin-write rate limits
- add server-side `admin_sessions` persistence so current-session resolution can enforce expiry and revocation against PostgreSQL

## Acceptance Criteria Covered

- supported-language public content is more consistent across core routes
- landing, latest results, and result detail pages no longer inherit the generic app-level metadata
- public routes expose canonical URLs for core SEO surfaces
- Myanmar locale no longer produces hydration mismatch from public date rendering
- public pages render a complete shell with header, content, and footer
- home page remains coherent when latest, history, or blog teaser requests fail independently
- admin routes do not expose a broken render when the API is unavailable
- admin invite and admin-management role selection use the same custom anchored menu pattern
- larger seeded data supports realistic verification across history, blog, checker, and admin flows
- admin sessions now expire and revoke server-side, and risky admin routes are origin-checked and rate-limited

## Verification Covered

Implementation verification included:

- `pnpm db:seed`
- `pnpm db:migrate:deploy`
- `pnpm test`
- `pnpm test:security`
- `pnpm typecheck`
- `pnpm --filter @thai-lottery-checker/web typecheck`

Behavioral checks covered:

- public header, latest, history, blog list, and blog detail flows
- result-page metadata generation and canonical URLs
- public footer visibility and responsive behavior
- API-down public fallback behavior for home latest, history, and blog teaser sections
- API-down admin session and login behavior
- embedded checker navigation and overlay behavior
- Myanmar locale rendering stability
- admin invitation and admin-management role selection controls
- admin result and blog workflows against realistic seeded data
- expired-session, logout-revocation, origin-validation, production-secret, and rate-limit behavior in the API security suite

## Operational Notes

- public footer applies to public routes only and intentionally does not add placeholder legal-policy links
- deterministic locale formatting is especially important for Burmese/Myanmar output
- route metadata now exists across all primary public SEO surfaces, not only blog pages
- admin role menus intentionally avoid native select popup styling because browsers render those popups inconsistently
- the production-readiness work now spans API controls as well as web UX refinement
