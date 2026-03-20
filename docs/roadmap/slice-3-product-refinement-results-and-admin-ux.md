# Slice 3 Plan — Product Refinement (Results + Admin UX)

## Summary

Implement Slice 3 as a refinement slice that improves the public results experience and the admin governance/result-management UX before expanding into the number checker and blog feature areas.

This slice does not introduce a new draw lifecycle status. It keeps the existing `draft` and `published` lifecycle and adds staged public visibility at the prize-group level for draw-day behavior.

## Key Changes

### 1. Prize-group staged release model

- Keep `lottery_draws.status` limited to `draft` and `published`
- Add a new `lottery_result_group_releases` table keyed by `draw_id + prize_type`
- Allow a draft draw to expose released prize groups publicly before final publish
- Keep unreleased prize groups hidden behind placeholder presentation
- Preserve canonical prize-group ordering, row counts, and number-as-string rules

### 2. Draw-day latest-selection behavior

- Use `Asia/Bangkok` as the business timezone for draw-day matching
- `GET /api/v1/results/latest` should prefer the current draw-day draft when it has at least one released preview group
- If no eligible staged draw exists, fall back to the latest published draw
- Preview eligibility for the latest hero is based on released values from:
  - `FIRST_PRIZE`
  - `FRONT_THREE`
  - `LAST_THREE`
  - `LAST_TWO`

### 3. Public route and page refinement

- Replace the current locale landing placeholder at `/{locale}/` with a real landing page
- Landing page includes:
  - latest hero preview
  - published-only history list
- Blog teasers are intentionally deferred to the later blog slice even though the longer-term landing vision includes them
- Keep `/{locale}/results` as a stable bookmarkable latest-results page
- Allow `/{locale}/results` to render a partially released current draw
- Keep `/{locale}/results/{drawDate}` as the draw detail route for both published draws and partially released draft draws

### 4. Public API refinement

- Keep the existing public endpoint structure:
  - `GET /api/v1/results/latest`
  - `GET /api/v1/results`
  - `GET /api/v1/results/:drawDate`
- Keep `GET /api/v1/results` as a published-only history list
- Extend latest/detail response contracts to support placeholder-aware prize groups for unreleased values
- Keep canonical prize order unchanged in public payloads

### 5. Admin result workflow refinement

- Add the ability to release one prize group at a time before final publish
- Add the ability to unrelease a prize group before final publish
- Allow editing an already released prize group before final publish
- Keep final publish blocked until the draw is canonically complete and valid
- Keep post-publish correction immediate in place without reverting to draft
- Keep all staged-release, publish, and correction actions auditable

### 6. Admin governance UX refinement

- Keep the activation/reactivation behavior introduced in Slice 2
- Refine the admin-management list to segment the displayed accounts by:
  - `Activated Admin` as default
  - `Deactivated Admin`
  - `All`
- Treat this as a display and filtering refinement only, not as a role or permission model change

### 7. Cache invalidation expectations

- Releasing a result group invalidates dependent latest/detail caches
- Unreleasing a result group invalidates dependent latest/detail caches
- Editing a released group invalidates dependent latest/detail caches
- Final publish invalidates latest, detail, and history caches
- Post-publish correction invalidates latest, detail, and history caches

## Public APIs / Interfaces

- Existing public results endpoints remain in place:
  - `GET /api/v1/results/latest`
  - `GET /api/v1/results`
  - `GET /api/v1/results/:drawDate`
- New admin result actions are expected for:
  - release result group
  - unrelease result group
- Shared result DTOs and schemas must represent per-prize-group visibility state without introducing a new draw status

## Test Plan

- Domain tests
  - staged group visibility follows release state
  - Bangkok-time draw-day selection prefers eligible staged draws
  - final publish requires complete and valid canonical result data
- Public API tests
  - latest endpoint falls back correctly when no staged draw is eligible
  - history endpoint remains published-only
  - draw detail returns placeholder-ready groups for unreleased values
- Admin workflow tests
  - release, unrelease, and edit-before-publish behave correctly
  - post-publish correction updates in place and remains auditable
- Public web tests
  - landing page renders latest hero plus published-only history
  - latest page can show a partially released current draw
  - detail page supports both published and partially released draws
- Admin web tests
  - admin list defaults to activated accounts
  - deactivated and all-account views behave correctly

## Assumptions

- This slice documents and implements the agreed staged-release refinement without yet delivering blog teasers on the landing page.
- The longer-term landing-page vision can add blog teasers later in the blog-reading slice without changing the staged-release model defined here.
- Number checker work remains the next slice after this refinement is complete.
