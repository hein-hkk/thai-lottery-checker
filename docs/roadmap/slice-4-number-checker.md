# Slice 4 Plan — Number Checker

## Summary

Implement Slice 4 as the public number-checking capability for the web product. The checker should reuse the canonical result model, support Bangkok-today public drafts, return prize amounts plus total winnings, and use the draw detail page as the destination for checker-result presentation.

This slice adds no new draw lifecycle state. It reuses the existing `draft` and `published` model together with Slice 3 prize-group release visibility.

## Key Changes

### 1. Shared checker domain and contracts

- Add shared checker request/response types and schemas
- Add shared checker draw-option contracts for valid draw selection
- Add pure checker matching logic in the domain package
- Keep ticket input limited to one 6-digit number
- Keep lottery numbers as strings to preserve leading zeros

### 2. Prize matching behavior

- Match exact 6-digit prizes against:
  - `FIRST_PRIZE`
  - `NEAR_FIRST_PRIZE`
  - `SECOND_PRIZE`
  - `THIRD_PRIZE`
  - `FOURTH_PRIZE`
  - `FIFTH_PRIZE`
- Match derived suffix/prefix prizes against:
  - `FRONT_THREE`
  - `LAST_THREE`
  - `LAST_TWO`
- Return all matched prize groups for one ticket
- Return per-match `prizeAmount`
- Return summed `totalWinningAmount`

### 3. Public checker API

- Add:
  - `GET /api/v1/checker/draws`
  - `POST /api/v1/checker/check`
- `GET /api/v1/checker/draws` returns valid public checker draw options only
- Draw options include:
  - published draws
  - Bangkok-today draft when it is publicly visible
- `POST /api/v1/checker/check` accepts:
  - `ticketNumber`
  - optional `drawDate`
- If `drawDate` is omitted, use the same latest-public selection rule as the result pages

### 4. Draft-aware checker status

- A published draw returns `checkStatus = complete`
- A public draft with unreleased prize groups returns `checkStatus = partial`
- Partial checks:
  - match only released prize groups
  - must not treat unreleased prize groups as losses
  - return both `checkedPrizeTypes` and `uncheckedPrizeTypes`

### 5. Public web checker UX

- Use an embedded checker on public pages rather than a standalone `/{locale}/check` page
- Embedded checker appears alongside key public result surfaces
- Draw-date selection uses valid draw options only, lazy-loads options on demand, and renders as an anchored custom dropdown instead of a free native calendar/select popup
- Checker submit navigates to:
  - `/{locale}/results/{drawDate}?checker=1&ticket=XXXXXX`
- The draw detail page remains the canonical checker-result destination
- Checker result appears in an overlay on top of the draw detail page
- The overlay focuses on:
  - ticket number
  - draw status
  - partial/complete summary
  - total winning amount
  - matches
  - compact prize-group coverage summary
  - collapsed prize-group details when users want deeper visibility into checked and unchecked groups
- unchecked prize groups in the detail disclosure should be visually quieter than checked prize groups
- Official draw numbers remain visible in the page behind the overlay

## Public APIs / Interfaces

- `GET /api/v1/checker/draws`
- `POST /api/v1/checker/check`
- Checker response includes:
  - `ticketNumber`
  - `drawDate`
  - `drawCode`
  - `drawStatus`
  - `checkStatus`
  - `isWinner`
  - `matches`
  - `totalWinningAmount`
  - `checkedPrizeTypes`
  - `uncheckedPrizeTypes`
- Each match includes:
  - `prizeType`
  - `prizeAmount`
  - `matchedNumber`
  - `matchKind`

## Test Plan

- Domain tests
  - exact 6-digit matching works for all full-number prize groups
  - front 3 / last 3 / last 2 matching works
  - multiple simultaneous matches sum correctly into `totalWinningAmount`
  - unreleased prize groups are excluded from partial matching
- API tests
  - omitted `drawDate` resolves to the latest public draw
  - published draw checks return `complete`
  - public draft checks return `partial`
  - invalid ticket numbers return validation errors
  - invalid draw dates return validation errors
  - unknown or non-public draws return not found
  - checker draw options include valid public draws in newest-first order
- Public web tests
  - embedded checker defaults to the contextual draw date
  - draw options are loaded lazily
  - submit navigates to the draw detail page with checker query params
  - checker overlay opens for win, no-win, and partial results
  - closing the overlay removes checker query params while keeping the user on the draw detail page

## Assumptions

- This slice documents the implemented embedded-checker plus detail-overlay flow, not a standalone checker page.
- Prize amounts are fixed canonical metadata attached to prize types in shared domain data.
- The draw detail page URL with checker query params is the intended canonical/shareable checker-result state.
