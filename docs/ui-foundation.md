# UI Foundation

## 1. Purpose

This document defines the UI design foundation for the Thai Lottery Checker project.

It is the source of truth for public and admin UI decisions across:

- visual language
- design tokens
- typography
- spacing and layout
- component rules
- interaction states
- accessibility and localization requirements
- Tailwind CSS implementation guidance

This foundation exists to ensure:

- consistent visual design across public and admin interfaces
- alignment with product goals: trustworthy, official, simple
- compatibility with Tailwind CSS implementation
- support for light and dark mode from day one
- readiness for multilingual UI in English, Thai, and Burmese/Myanmar

Existing brand name and logo are assumed to be final. This document references the brand direction but does not redefine branding assets.

## 2. Product Tone and Design Principles

### 2.1 Product Tone

The product should feel:

- trustworthy
- official
- calm
- clear
- efficient

The interface should take cues from financial dashboards, government service portals, and operational admin tools rather than marketing sites.

### 2.2 Core Principles

1. Clarity over decoration
   - Prioritize readability, scanability, and understanding.
   - Remove visual noise before adding visual styling.
2. Trust-first design
   - UI should feel stable, predictable, and controlled.
   - Avoid flashy effects that weaken perceived credibility.
3. Typography-driven hierarchy
   - Content, especially dates, statuses, and winning numbers, defines the layout.
   - Visual hierarchy should come primarily from type scale, spacing, and grouping.
4. Consistency across surfaces
   - Public and admin share one design system.
   - Density differs by context; the system does not.
5. Fast and responsive
   - Motion is subtle and short.
   - Interactive feedback is immediate and easy to interpret.
6. Data-first presentation
   - Results, prize labels, dates, and statuses must remain the center of attention.
   - Decorative treatments must never compete with result data.

## 3. Design Language

### 3.1 Style Definition

Calm Official Utility UI

### 3.2 Characteristics

- clean layout
- soft layered surfaces without visual effects
- border-first separation
- restrained accent usage
- strong text hierarchy
- deliberate whitespace
- predictable component behavior

### 3.3 Explicitly Avoided Styles

The product should not use:

- gradients as a primary surface treatment
- glassmorphism or backdrop blur
- heavy shadows
- floating cards without structural borders
- decorative accent color overuse

### 3.4 Migration Note

The current implementation still includes gradients, blur, and shadow-heavy surfaces in:

- [apps/web/app/globals.css](/Users/hkk/Documents/Playground/thai-lottery-checker/apps/web/app/globals.css)
- [apps/web/src/components/results/results-shell.tsx](/Users/hkk/Documents/Playground/thai-lottery-checker/apps/web/src/components/results/results-shell.tsx)
- [apps/web/app/admin/(protected)/layout.tsx](/Users/hkk/Documents/Playground/thai-lottery-checker/apps/web/app/admin/(protected)/layout.tsx)

This foundation supersedes that visual direction. Future Slice 3 UI refinement should move those surfaces to border-first, low-effect styling that follows the tokens and component rules below.

## 4. Color System and Design Tokens

### 4.1 Token Principles

- Use semantic tokens, not raw hex values, in components.
- Keep light and dark themes aligned by token meaning.
- Ensure sufficient contrast in both themes.
- Reserve accent colors for targeted emphasis, not large UI areas.

### 4.2 Light Theme Tokens

```css
:root {
  /* Background */
  --bg-primary: #ffffff;
  --bg-secondary: #f8fafc;
  --bg-muted: #f1f5f9;
  --bg-elevated: #ffffff;

  /* Surface */
  --surface-primary: #ffffff;
  --surface-secondary: #f8fafc;

  /* Text */
  --text-primary: #0f172a;
  --text-secondary: #475569;
  --text-muted: #94a3b8;
  --text-inverse: #ffffff;

  /* Border */
  --border-default: #e2e8f0;
  --border-strong: #cbd5e1;

  /* Brand */
  --color-primary: #223c79;
  --color-primary-hover: #1a2f5c;
  --color-primary-soft: #e9eef8;

  /* Accent */
  --color-accent: #ec1f28;
  --color-accent-soft: #fde8ea;

  /* States */
  --color-success: #15803d;
  --color-warning: #b45309;
  --color-info: #0369a1;
  --color-danger: #b91c1c;

  /* Utility */
  --focus-ring: #3b82f6;
  --overlay: rgba(15, 23, 42, 0.48);
}
```

### 4.3 Dark Theme Tokens

```css
.dark {
  /* Background */
  --bg-primary: #0b1220;
  --bg-secondary: #111827;
  --bg-muted: #1f2937;
  --bg-elevated: #111827;

  /* Surface */
  --surface-primary: #111827;
  --surface-secondary: #1f2937;

  /* Text */
  --text-primary: #e5e7eb;
  --text-secondary: #9ca3af;
  --text-muted: #6b7280;
  --text-inverse: #0b1220;

  /* Border */
  --border-default: #374151;
  --border-strong: #4b5563;

  /* Brand */
  --color-primary: #4c6fe0;
  --color-primary-hover: #6b86ea;
  --color-primary-soft: rgba(76, 111, 224, 0.16);

  /* Accent */
  --color-accent: #ff5a63;
  --color-accent-soft: rgba(255, 90, 99, 0.14);

  /* States */
  --color-success: #22c55e;
  --color-warning: #f59e0b;
  --color-info: #38bdf8;
  --color-danger: #f87171;

  /* Utility */
  --focus-ring: #60a5fa;
  --overlay: rgba(2, 6, 23, 0.64);
}
```

### 4.4 Token Usage Rules

- `bg-*` tokens define page and app-shell backgrounds.
- `surface-*` tokens define cards, panels, form areas, and tables.
- `text-*` tokens define all typography roles.
- `border-*` tokens define structural separation and emphasis.
- `color-primary` is the main action color.
- `color-accent` is reserved for specific emphasis and should remain minimal.
- status colors must always be paired with text, iconography, labels, or accessible metadata

### 4.5 Tailwind Mapping Guidance

- Tokens should be defined in the global CSS theme layer.
- Tailwind utilities should map to semantic tokens rather than raw color literals.
- Components should consume semantic utility classes only.
- One-off arbitrary color values should be treated as temporary migration code and removed during refinement.
- New components should not introduce custom local color systems.

## 5. Typography System

### 5.1 Font Roles

- UI and headings: sans-serif stack
- numbers and result values: monospace stack with tabular alignment support

### 5.2 Approved Fallback Expectations

Recommended UI stack:

```css
"Noto Sans Thai", "Noto Sans Myanmar", "Inter", "Segoe UI", sans-serif
```

Recommended numeric stack:

```css
"Roboto Mono", "SFMono-Regular", "SF Mono", "Menlo", monospace
```

The final selected font files may change later, but each role must use one approved stack consistently across the product.

### 5.3 Typography Rules

- Lottery numbers must use monospace.
- Result numbers should use tabular alignment where supported.
- Avoid mixing multiple font families in a single component unless one role is body text and the other is result numbers.
- Use typography, spacing, and borders before color for hierarchy.

### 5.4 Named Text Styles

| Style | Usage | Weight | Size | Line Height |
| --- | --- | --- | --- | --- |
| `display-title` | page title, result date headline | 600 | 32-40px | 1.2 |
| `section-title` | section headers, panel titles | 600 | 24-28px | 1.25 |
| `label-strong` | labels, badges, table headers | 600 | 12-14px | 1.4 |
| `body-default` | standard UI copy | 400-500 | 14-16px | 1.5 |
| `body-secondary` | helper text, metadata | 400 | 13-14px | 1.5 |
| `number-large` | winning number display | 600-700 | 24-36px | 1.2 |
| `number-compact` | smaller number chips, table values | 600 | 14-16px | 1.3 |

### 5.5 Number Styling

This is a critical UI rule.

- winning numbers must be visually prominent
- monospace is required
- spacing between digits must be consistent
- contrast must remain high in both themes
- decorative outlines, glow, or oversized pills are not allowed

## 6. Spacing, Layout, and Responsive System

### 6.1 Spacing Scale

Use a consistent base spacing scale:

- 4
- 8
- 12
- 16
- 24
- 32
- 48

### 6.2 Layout Rules

- max content width: 1200px
- horizontal page padding: 16px on small screens, 24px on medium, 32px on large
- section spacing: 24px to 48px
- card and panel padding: 16px to 24px
- maintain consistent vertical rhythm between titles, metadata, data blocks, and actions

### 6.3 Density Rules

- public UI: medium density with slightly more breathing room
- admin UI: medium density with slightly more compact controls and tables

Density may change by surface, but token definitions, typography roles, and interaction rules stay shared.

### 6.4 Responsive System

The system is mobile-first.

Recommended breakpoints for implementation:

- `sm`: 640px
- `md`: 768px
- `lg`: 1024px
- `xl`: 1280px

Responsive requirements:

- number layouts must collapse cleanly without clipping or overflow
- tables must support horizontal overflow, stacked presentation, or column prioritization on narrow screens
- cards must preserve content hierarchy before preserving symmetry
- navigation must remain usable without forcing a single-line layout

## 7. Surface, Elevation, Shape, and Motion

### 7.1 Border-first Surface Design

Primary separation should come from:

- borders
- spacing
- background tone shifts
- section grouping

Avoid relying on shadow depth to explain hierarchy.

### 7.2 Surface Rules

Use:

- `border-default` for standard structure
- `border-strong` for emphasis or active grouping
- `surface-primary` for primary cards and panels
- `surface-secondary` for secondary sections or muted containers

Avoid:

- heavy drop shadows
- frosted/glass effects
- unbounded floating cards

### 7.3 Radius Scale

Use a shared radius scale:

- card: 16px
- input: 12px
- pill/badge: 9999px
- modal/dialog: 20px

Do not mix many unrelated radius values in the same view.

### 7.4 Border Defaults

- standard border width: 1px
- emphasized border width: 1px, with stronger token color before increasing thickness
- use 2px borders only for focus treatments or rare high-emphasis states

### 7.5 Motion

Motion is functional, subtle, and short.

- duration-fast: 150ms
- duration-standard: 200ms
- easing: standard ease-out for hover/focus transitions

Allowed motion:

- color/background transitions
- opacity transitions
- subtle position changes when needed for menus or overlays

Avoid:

- bounce effects
- large entrance animations
- decorative motion unrelated to user intent

## 8. Interaction States

All interactive components must support:

- default
- hover
- focus-visible
- active
- disabled
- loading

Rules:

- focus must be clearly visible and use `focus-ring`
- disabled state must remain legible and clearly non-interactive
- loading state should preserve layout and label meaning where possible
- active state should communicate confirmation, not just darker color

## 9. Iconography

Icons are functional, not decorative.

Rules:

- use icons only when they improve affordance, scanning, or comprehension
- keep icon styling simple and consistent with the calm utility UI direction
- prefer a single icon system across the product
- prefer outline icons over decorative or mixed icon styles
- icons should inherit surrounding text color unless a semantic state requires otherwise
- do not add icons by default to every button, nav item, or data row

Approved use cases:

- dropdown chevrons
- locale flag icons
- theme toggle icons
- compact status indicators
- future feedback or status affordances when they improve clarity

Avoid:

- decorative icons used only to fill space
- mixing multiple unrelated icon styles
- oversized icons that compete with typography or lottery numbers
- emoji glyphs as stand-ins for product icons when SVG or other real assets are available

## 10. Accessibility

This system targets WCAG AA as the baseline.

Minimum requirements:

- text and critical UI controls must meet AA contrast targets
- every interactive element must have a visible keyboard focus state
- status and validation must not rely on color alone
- motion must be reduced or removed for non-essential transitions when reduced-motion is requested
- touch targets should remain practical on mobile
- headings and labels must preserve semantic meaning in markup

## 11. Localization and Multilingual Rules

This product must support English, Thai, and Burmese/Myanmar content.

Rules:

- no fixed-width text containers for UI labels
- allow text wrapping where needed
- do not rely on uppercase transformations for meaning
- Thai and Burmese text must render correctly without style assumptions based on Latin scripts
- line-height for multilingual UI text should be slightly more generous than tight Latin-only layouts
- buttons, tabs, and nav items must tolerate longer translated labels without truncation by default
- do not rely on text length for layout alignment
- when locale is represented visually, use consistent SVG flag assets rather than emoji glyphs

## 12. Content and Data Presentation

### 11.1 Dates and Time

- dates and times must be formatted in a locale-aware way
- data should remain understandable when rendered in English, Thai, or Burmese/Myanmar
- admin timestamps may be denser than public-facing date presentation, but still need clear formatting

### 11.2 Lottery Numbers

- always use monospace
- use tabular-aligned presentation where possible
- preserve exact digit count
- keep number grouping visually consistent across prize groups
- public result pages may use bordered chip layouts instead of tables when they improve scanability without weakening hierarchy
- first prize may receive one stronger emphasis tier than supporting prize groups, using primary-border and primary-soft surfaces rather than loud full-fill treatments

### 11.3 Placeholders

- unreleased result placeholders must preserve digit length
- placeholders must preserve expected count or row count
- placeholder presentation should communicate “not released yet”, not “missing data”

### 11.4 Status Language

Status labels should use clear semantic wording consistently.

Examples:

- `Published`
- `Draft`
- `Released`
- `Pending`
- `Disabled`
- `Active`

Avoid vague labels such as:

- `Live`
- `Ready`
- `Done`

unless the backend workflow formally defines them.

Compact icon-only status indicators are acceptable only when:

- the meaning remains available through accessible naming, tooltip, or title text
- the icon shape is distinct enough to separate states without relying only on color
- the status is secondary to the primary content, such as prize numbers in result cards

## 13. Core Components

### 12.1 Global Header

Contains:

- full logo wordmark
- language switcher
- theme toggle
- navigation

Rules:

- sticky at top of page
- bottom border required
- consistent container width with page content
- full logo remains visible on all screen sizes
- desktop keeps inline navigation visible
- mobile must not force cramped inline navigation
- mobile uses a left drawer for navigation
- mobile keeps locale switcher visible in the top bar
- mobile moves theme toggle into the drawer
- mobile top bar must reserve matched left and right control widths so the logo stays visually centered
- dropdown chevrons and theme icons are acceptable because they improve control affordance
- locale switcher uses flag plus text on desktop and compact flag-only presentation on mobile
- locale flags should use real SVG assets for visual consistency
- detailed header and drawer behavior is owned by [docs/menu-component.md](/Users/hkk/Documents/Playground/thai-lottery-checker/docs/menu-component.md), not by this foundation doc

### 12.2 Result Card

Contains:

- draw date
- draw code if available
- publication or release status
- prize groups

Rules:

- use `surface-primary`
- use `border-default`
- maintain clear title-to-data hierarchy
- placeholders must appear structurally intentional, not visually broken
- the result detail page established the current reference public-results layout
- the latest results page and the home latest-results preview now reuse that same approved pattern
- the history list uses a separate compact preview pattern because it is a browse/index surface rather than the primary checking surface
- future public result surfaces should reuse this approved pattern unless there is a strong page-specific reason not to

### 12.3 Prize Group Block

Contains:

- prize group title
- release or pending badge
- number list or placeholder block

Rules:

- preserve canonical prize ordering
- preserve predictable spacing between title, status, and values
- number layout may use grid or wrap, but alignment must remain clean
- released and pending states must not rely on color alone
- text badges are preferred by default, but compact icon-only badges are acceptable when status is visually secondary and accessible naming is preserved
- approved public result-display patterns now include:
  - summary prize cards for first prize, front three, last three, and last two
  - grouped prize cards for near first prize and second prize
  - dense chip-grid sections for third, fourth, and fifth prize
  - latest-summary preview blocks on the home page that reuse the same summary header, metadata row, and top prize-card treatment as the latest results page
  - compact history-list rows that use a date badge, a flatter preview layout, full-row click behavior, and a subtle arrow affordance
  - bottom-only secondary page action for related navigation, such as `View history`, when a page needs one supporting action without competing with the result content
  - single primary preview action for home latest-results surfaces, such as `Browse latest results`, when the section is acting as an entry point rather than a full page

### 12.4 Number Display

Rules:

- large monospace text
- center-aligned or grid-aligned depending on context
- tabular alignment preferred
- no decorative glow, gradients, or oversized ornamental chips
- summary number chips should remain bold and prominent across breakpoints, with narrow-screen adjustments used only to prevent overflow
- front three and last three should preserve paired side-by-side presentation on desktop
- history-list previews may intentionally reduce visible prize groups on small mobile to preserve scanability, while tablet and desktop can expose the fuller summary

### 12.5 Input Checker

Contains:

- labeled input
- primary CTA
- validation or result feedback

Rules:

- validation state must be clear before and after submission
- CTA must remain visually primary
- feedback should be immediate but not visually aggressive
- helper text and error text must be distinct

### 12.6 Admin Table

Rules:

- clear column labels
- readable row density
- stable alignment for dates, statuses, and actions
- action placement should remain predictable
- narrow screens must use a defined overflow or stacked behavior instead of clipped content

### 12.7 Forms

Rules:

- consistent input height
- visible labels
- helper text and error text use stable spacing
- required treatment should be consistent across all form fields
- disabled and loading states must be visually distinct and accessible

### 12.8 Feedback Components

Use:

- toast notifications for transient success or neutral system feedback
- inline messages for actionable errors or warnings tied to a form or section
- status badges for persistent state

Do not use toast notifications for critical blocking failures that need immediate local action context.

## 14. Public vs Admin UI

| Aspect | Public | Admin |
| --- | --- | --- |
| Layout | slightly spacious | slightly compact |
| Focus | readability | efficiency |
| Interaction | minimal and calm | functional and direct |
| Primary patterns | cards and result blocks | tables, forms, management panels |

Both surfaces must reuse the same token and component system. Density is the primary variation, not visual language.

## 15. Dark Mode Strategy

- dark mode is implemented via the `.dark` class
- do not invert colors automatically
- use defined semantic tokens only
- test contrast for numbers, key labels, and states
- dark mode should preserve the same border-first hierarchy as light mode

## 16. Implementation Guidance

### 15.1 Tailwind Usage

- define shared tokens in the global theme layer
- expose semantic utilities and consume those in components
- avoid raw hex usage in JSX and component-local styling
- avoid arbitrary gradients, blur, and shadow values unless temporarily preserving old UI during migration

### 16.2 Icon Usage

- prefer a single icon system across the app
- import only the icons actually used
- treat icons as small reusable UI primitives, not illustration assets
- keep icon adoption narrow unless the design system is intentionally expanded

### 16.3 Component Authoring

- build shared primitives before duplicating per-screen styles
- use the same structural classes for public and admin when behavior is shared
- prefer semantic class naming through utility composition rather than visually descriptive one-off patterns

### 16.4 Migration Priorities

When refining the current UI, address these first:

1. replace gradient and blur-heavy shell treatments
2. reduce oversized shadows to border-first surfaces
3. normalize number display and status badge patterns
4. align admin and public spacing, typography, and interaction states to this foundation

## 17. Do / Don't

### Do

- use consistent spacing
- emphasize numbers clearly
- maintain strong contrast
- keep UI predictable
- use semantic tokens
- keep status wording explicit
- design mobile-first
- use icons only when they improve affordance or scanning

### Don't

- use gradients as a core surface style
- use glassmorphism or backdrop blur
- overuse red or accent color
- add unnecessary animation
- mix inconsistent radius, spacing, or type systems
- hardcode raw hex values directly in components
- add icons just to make the UI busier
