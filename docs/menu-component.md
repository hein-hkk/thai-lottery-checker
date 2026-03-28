# Menu Component

## 1. Purpose

This document defines the shared responsive header and menu component system for the Thai Lottery Checker web app.

It is the source of truth for:

- public header behavior
- admin header behavior
- mobile drawer behavior
- navigation presentation
- logo placement
- locale and theme control placement
- active-state and accessibility rules

This document complements [UI Foundation](./ui-foundation.md).

- `docs/ui-foundation.md` defines the visual design system.
- `docs/menu-component.md` defines the header and menu interaction system.

## 2. Component Scope

The menu component system is shared across:

- public header
- protected admin header

The system owns:

- top bar layout
- desktop navigation layout
- mobile drawer layout and behavior
- logo placement
- menu trigger behavior
- locale control placement
- theme control placement
- active-state treatment

The system does not own:

- page body layout
- public page content blocks
- admin table or form layout
- backend permission logic

## 3. Core Principles

1. One responsive system, two surfaces
   - Public and admin should use the same menu architecture.
   - The only intentional difference is nav data and admin permission filtering.
2. Desktop stays efficient
   - Current desktop inline navigation remains the default pattern.
   - This document does not redesign desktop navigation into dropdowns or mega menus.
3. Mobile becomes app-style
   - Mobile uses a left drawer instead of stacked inline navigation.
   - The top bar should feel like a real application header, not a compressed desktop layout.
4. Global controls stay intentional
   - Locale switching is a high-priority global action and remains visible in the mobile top bar.
   - Theme is global but lower-priority than locale on mobile, so it moves into the drawer.
5. Brand stays stable
   - The full logo remains visible on all screen sizes.
   - The centered mobile logo is a fixed requirement.

## 4. Responsive Behavior

### 4.1 Desktop Header

Desktop behavior applies from the desktop breakpoint upward.

Desktop structure:

- left: full logo
- center or center-left: inline navigation
- right: utility controls

Desktop rules:

- full logo remains visible
- navigation remains inline and always visible
- language switcher uses flag + text label
- theme toggle uses icon + text label
- no drawer is shown
- active route remains visible in the inline nav

### 4.2 Mobile Header

Mobile behavior applies below the desktop breakpoint.

Mobile top bar structure:

- left: hamburger trigger
- center: full logo
- right: language switcher

Mobile rules:

- no inline nav remains visible in the top bar
- language switcher uses flag-only
- theme toggle is removed from the top bar
- top bar must reserve stable left and right control areas so the logo remains visually centered
- the full logo remains visible even on small screens, with tighter size constraints if needed

### 4.3 Middle or Tablet Header

Between the mobile and desktop header layouts, the system may keep the mobile drawer pattern while scaling the full logo closer to desktop sizing.

Rules:

- keep the left drawer trigger and right locale control pattern until the desktop breakpoint
- allow the full logo to grow to a larger size than narrow mobile when horizontal space is available
- preserve equal or visually matched left and right control widths so the centered logo remains optically centered

## 5. Mobile Drawer

### 5.1 Drawer Pattern

The mobile menu is a left overlay drawer.

Rules:

- opens from the left
- sits above page content
- uses a dimmed overlay behind the drawer
- does not push page content horizontally

### 5.2 Close Behavior

The drawer must close on:

- close button tap
- tapping outside the drawer
- tapping a navigation item
- pressing `Esc`

### 5.3 Drawer Content

Public drawer content:

- Home
- Latest results
- theme control below navigation

Admin drawer content:

- Home
- Results when permitted
- Admins when permitted
- theme control below navigation
- compact admin user meta below nav
- logout action below user meta

Locale switcher stays top-bar only on mobile and does not duplicate inside the drawer.

## 6. Global Controls

### 6.1 Language Switcher

Desktop:

- show flag + text label
- remain visible in the right utility area

Mobile:

- show flag-only
- remain visible in the top bar
- must be reachable without opening the drawer

Rules:

- locale switching is treated as a first-class global control
- locale control should not be duplicated in the mobile drawer
- label text may be hidden on mobile, but accessible naming must remain intact
- locale flags should use SVG assets rather than emoji glyphs

### 6.2 Theme Toggle

Desktop:

- icon + text label

Mobile:

- moved into the drawer
- not shown in the top bar

Rules:

- theme state remains global and persistent
- drawer placement is chosen to keep the mobile top bar focused and balanced
- accessible naming must remain explicit even if icon-led presentation is used

## 7. Information Architecture

### 7.1 Public Navigation

Desktop nav items:

- Home
- Latest results

Mobile drawer nav items:

- Home
- Latest results

Rules:

- result history remains a supported public route but is intentionally secondary
- history should be reached through page-level CTAs and direct URL access rather than primary navigation
- the history page should not force an incorrect primary-nav active state

### 7.2 Admin Navigation

Desktop nav items:

- Home
- Results when permitted
- Admins when permitted

Mobile drawer nav items:

- Home
- Results when permitted
- Admins when permitted

Permission filtering rules:

- nav visibility must continue to follow existing permission checks
- the menu system must not redefine permissions

## 8. Shared Component Contract

The implementation should treat public and admin menus as one system with shared primitives.

Recommended shared component responsibilities:

- header shell
- mobile top bar
- menu trigger button
- drawer container
- drawer overlay
- desktop nav list
- mobile nav list
- utility control slot

Recommended nav item shape:

```ts
type MenuNavItem = {
  href: string;
  label: string;
  isVisible?: boolean;
};
```

Recommended menu state responsibilities:

- `isOpen`
- open action
- close action
- close on route selection
- close on outside click
- close on `Esc`

## 9. Active-State Rules

Desktop:

- active route appears in the inline nav
- active treatment must remain visible without relying on color only

Mobile:

- active route appears in the drawer list
- active treatment must remain visible even when the drawer is reopened on the current page

Rules:

- active treatment should use border, background, or iconography in addition to color
- desktop and mobile active treatments should feel related, even if layout differs

## 10. Accessibility Requirements

Menu behavior must satisfy:

- menu trigger has an accessible label
- menu trigger exposes open/closed state
- drawer has an accessible relationship to the trigger
- keyboard users can open and close the drawer reliably
- `Esc` closes the drawer
- focus management is explicit and predictable
- outside tap close works on touch devices
- active states do not rely on color only
- locale and theme controls remain accessible at all breakpoints

Focus recommendation:

- when the drawer opens, focus should move intentionally into the drawer
- when the drawer closes, focus should return to the trigger

## 11. Visual and Layout Rules

Desktop:

- preserve current inline-nav direction
- keep utility controls aligned and compact
- keep logo, nav, and utility zones visually balanced

Mobile:

- logo must remain visually centered
- left and right top-bar areas should use stable reserved width
- drawer width should feel compact and app-like, not full screen by default
- overlay dimming should be noticeable but not heavy

Avoid:

- stacked desktop navigation in mobile top bar
- duplicated locale switchers on mobile
- showing too many controls in the mobile top bar
- drawer layouts that feel like temporary debug UI

## 12. Acceptance Criteria

### 12.1 Desktop Public

- inline nav remains visible
- logo remains full-width brand mark
- language control shows flag + label
- theme toggle shows icon + label

### 12.2 Desktop Admin

- inline nav remains visible
- permission-aware items render correctly
- user meta and logout remain visible

### 12.3 Mobile Public

- left hamburger trigger appears
- logo remains centered
- language control stays visible in the top bar
- no inline nav is shown in the top bar
- drawer opens from the left
- drawer contains public nav and theme control

### 12.4 Mobile Admin

- left hamburger trigger appears
- logo remains centered
- no inline nav is shown in the top bar
- drawer contains permission-aware admin nav
- drawer contains theme control
- drawer contains compact user meta and logout

## 13. Test Plan

Responsive checks:

- narrow mobile
- large mobile
- tablet near desktop transition
- desktop

Functional checks:

- open and close drawer from trigger
- close drawer from outside tap
- close drawer from navigation selection
- close drawer with `Esc`
- active route remains visible in desktop and mobile nav
- language switch remains visible on mobile
- theme control works in desktop and drawer contexts

Admin checks:

- permission-filtered nav items render correctly
- logout remains reachable on mobile
- user meta is readable but compact in the drawer

Accessibility checks:

- keyboard operation works
- focus returns to trigger after close
- mobile controls preserve accessible names
- active states are not color-only

## 14. Assumptions

- full logo remains on all screen sizes
- desktop inline nav is acceptable and should be preserved
- mobile locale switcher stays in the top bar only
- mobile theme control moves into the drawer
- the drawer is a left overlay drawer
- public and admin use the same responsive menu architecture

## 15. Relationship to UI Foundation

After this document is accepted, [`docs/ui-foundation.md`](./ui-foundation.md) should be updated to reference this file as the source of truth for:

- responsive header behavior
- mobile drawer behavior
- locale/theme control placement in header contexts

Until then, this document should be treated as the implementation-grade spec for the menu system.
