# Thai Lottery Checker — System Architecture

## 1. Overview

This document describes the system architecture of the open-source Thai Lottery Checker platform.

The current repository is designed as a multilingual full-stack system consisting of:

- a public web client
- a planned public-only mobile client
- a backend API
- a protected admin dashboard inside the web app
- a PostgreSQL database
- shared monorepo packages

The backend follows a modular monolith architecture so the repository stays straightforward to operate while still supporting draw-day traffic spikes and future public mobile reuse.

## 2. Architecture Goals

### Scalability

Support traffic spikes during Thai lottery draw announcements without changing the core architecture shape.

### Performance

Keep public result pages and checker flows responsive.

### Reliability

Preserve result accuracy and stable operational behavior.

### Maintainability

Use modular backend services and shared packages to simplify development across the monorepo.

### Multilingual support

Provide consistent experiences for English, Thai, and Myanmar users.

## 3. High-Level System Architecture

```text
Users
├─ Public Web Client (Next.js)
├─ Planned Public Mobile Client
└─ Admin Dashboard (protected routes in Next.js)

Clients communicate with:
└─ Backend API (Express + TypeScript)
    ├─ Results Service
    ├─ Checker Service
    ├─ Blog Service
    ├─ Admin Service
    └─ PostgreSQL

Shared Monorepo Packages
├─ packages/types
├─ packages/schemas
├─ packages/domain
├─ packages/i18n
└─ packages/utils
```

### System Layers

1. Client layer
2. API layer
3. Service layer
4. Data layer
5. Shared contract and domain layer

## 4. Client Applications

### 4.1 Public Website

Technology:

- Next.js 16
- TypeScript
- Tailwind CSS 4

Responsibilities:

- render the locale landing page at `/{locale}`
- display latest lottery results
- display published historical results
- display home-page blog teasers below the history preview when localized published posts are available
- render result detail pages by draw date
- provide the embedded public number-checking flow
- display blog list and blog detail content
- support multilingual routing
- render a complete public shell with shared header, main content, and utility footer on public routes
- present refined trust-focused public copy on landing, latest-results, checker, and blog entry surfaces
- generate route metadata and canonical URLs for landing, latest results, result detail, blog list, and blog detail routes

Example routes:

- `/{locale}`
- `/{locale}/results`
- `/{locale}/results/history`
- `/{locale}/results/{drawDate}`
- `/{locale}/blog`
- `/{locale}/blog/{slug}`

### 4.2 Web Application Scope

The Next.js application contains both:

- public user-facing pages
- a protected admin area under `/admin`

Admin routes use the same backend API as the public website and the planned public mobile client.

Implemented admin UI surfaces include:

- admin login
- invitation acceptance
- password reset request and confirmation
- admin management
- result operations
- blog operations

### 4.3 Planned Mobile Application

The OSS roadmap includes a public-only mobile client, but the repository does not yet contain an `apps/mobile` workspace.

Planned responsibilities:

- display latest lottery results
- display published history
- display result detail
- provide public number checking
- display blog content
- support language switching

This mobile client is intentionally read-only for anonymous public usage.
Accounts, saved tickets, notifications, and device registration are outside OSS scope.

## 5. Backend Architecture

### 5.1 Backend Technology

- Node.js
- Express
- TypeScript
- Prisma 7

The backend exposes REST API endpoints used by:

- the public web application
- the planned public mobile application
- the admin dashboard

The API bootstrap handles graceful shutdown on `SIGINT` and `SIGTERM` by closing the HTTP server cleanly and disconnecting Prisma before exit.

### 5.2 Backend Layers

The backend follows a layered structure:

- routes
- controllers
- services
- repositories
- database access

Example public routes:

- `GET /api/v1/results/latest`
- `GET /api/v1/results`
- `GET /api/v1/results/:drawDate`
- `GET /api/v1/checker/draws`
- `POST /api/v1/checker/check`
- `GET /api/v1/blogs`
- `GET /api/v1/blogs/:slug`

Example admin route groups:

- `/api/v1/admin/auth`
- `/api/v1/admin/results`
- `/api/v1/admin/blogs`
- `/api/v1/admin/admins`

### 5.3 Number Checker Flow

The public checker is implemented as an embedded web capability rather than a standalone page.

Web flow:

- public pages render an embedded checker beside key result content
- the checker defaults to the current page context or latest public draw
- valid draw options are loaded from the backend
- submit navigates to the draw detail page for the selected draw
- the draw detail page uses URL query params to open a checker-result overlay

Canonical checker-result URL pattern:

- `/{locale}/results/{drawDate}?checker=1&ticket=123456`

Backend behavior:

- `GET /api/v1/checker/draws` returns valid public checker draw options
- `POST /api/v1/checker/check` validates a 6-digit ticket number and checks it against one public draw
- if `drawDate` is omitted, the checker uses the same latest-public draw rule as result pages
- published draws return a `complete` checker result
- public drafts may return a `partial` checker result based on released prize groups only

### 5.4 Admin Authentication and Authorization

The backend is the source of truth for admin authentication and authorization.

Responsibilities include:

- admin login handling
- current-admin session resolution
- server-enforced admin session expiry and revocation
- invitation creation and acceptance
- password reset request and token consumption
- admin creation and deactivation flows
- permission assignment and enforcement

Authorization model:

- `super_admin` has full access
- `editor` access is limited by assigned permissions
- current repository permissions are `manage_results` and `manage_blogs`
- the UI may hide unauthorized actions, but the backend must enforce security on every protected request

Current security controls in the API:

- signed HTTP-only admin session cookie
- database-backed admin session records with explicit expiry
- session rotation on login
- logout revocation and password-reset revocation of active sessions
- exact-origin validation for admin `POST`, `PUT`, `PATCH`, and `DELETE` requests
- rate limiting on login, invitation acceptance, password-reset flows, and authenticated admin writes
- structured security logging with request IDs and resolved admin identity when available
- production startup validation that rejects development-default admin secrets

## 6. Core Backend Services

### 6.1 Results Service

Responsibilities:

- retrieve latest results
- retrieve historical results
- retrieve result details
- resolve staged prize-group visibility for public latest and detail reads
- apply `Asia/Bangkok` draw-day latest-selection rules
- publish results
- release and unrelease prize groups before final publish
- correct published results in place

Result workflow:

- results are created and edited in `draft`
- prize groups can be released or unreleased before final publish
- publishing changes the draw to `published`
- public history APIs serve only `published` draws
- public latest and detail APIs may serve a partially released current draw
- corrections modify published data in place while remaining auditable

### 6.2 Checker Service

Responsibilities:

- validate ticket numbers
- compare numbers with official results
- determine prize matches
- return match details and partial-state behavior when only some prize groups are public

### 6.3 Blog Service

Responsibilities:

- retrieve published blog posts
- retrieve localized blog detail content
- manage blog metadata and translations through admin workflows
- issue blog banner upload initialization/completion flows through optional object storage
- publish and unpublish blog posts

### 6.4 Admin Service

Responsibilities:

- admin authentication
- admin session issuance, rotation, expiry checks, and revocation
- invitation-based onboarding
- password reset and recovery
- permission-aware admin governance
- admin management
- result-management authorization
- blog-management authorization
- audit logging

## 7. Data Architecture

### 7.1 Primary Database

Technology:

- PostgreSQL
- Prisma 7 client and migration tooling

PostgreSQL is the canonical source of truth for system data.

Key entities:

- lottery draws
- lottery results
- lottery result group releases
- blog posts
- blog translations
- admin users
- admin sessions
- admin permissions
- admin invitations
- admin password resets
- admin audit logs

Critical admin actions are recorded in `admin_audit_logs` to support traceability and operational safety.
Active and revoked dashboard sessions are tracked in `admin_sessions` so expiry and logout behavior are enforced server-side instead of relying on browser cookie lifetime alone.

### 7.2 Optional Infrastructure

The current OSS architecture does not require Redis or any other cache layer.
If later performance hardening adds caching, PostgreSQL must remain the source of truth and the system must continue functioning when the cache is unavailable.

Object storage for blog banners is supported by the current implementation but remains optional infrastructure.
When it is configured, admins can upload blog banners through short-lived presigned POST forms while PostgreSQL still stores the public `banner_image_url` reference as canonical application data.
When it is not configured, the API and web app still run normally and the admin banner upload endpoints fail fast with `503`.

## 8. Monorepo Structure

Current repository structure:

- `apps/web`
- `apps/api`
- `packages/types`
- `packages/schemas`
- `packages/domain`
- `packages/i18n`
- `packages/utils`

Planned addition:

- `apps/mobile` for the public-only Mobile MVP

Benefits:

- shared code between public clients and admin-supporting backend contracts
- shared domain logic for results and checking
- unified dependency management
- consistent localization and validation behavior

## 9. Localization Architecture

Localization is implemented at multiple levels.

### UI localization

Shared locale message sets cover public and admin-facing text where implemented.

### Content localization

Blog content is stored with explicit locale identifiers in the database.

### Routing localization

Public routes are locale-prefixed, for example:

- `/en/results`
- `/th/results`
- `/my/results`

### Locale-safe rendering

Locale-facing public date formatting must be deterministic across SSR and hydration.

This is especially important for Burmese/Myanmar output, where server and browser `Intl` implementations may produce different text for the same date unless formatting is normalized through shared rendering logic.

## 10. Deployment Architecture

Typical deployment environment:

Frontend:

- Vercel or a similar Next.js-capable platform

Backend:

- Node.js server deployment on a container or managed host

Database:

- managed PostgreSQL

Optional infrastructure:

- object storage for blog banner uploads
- cache layer for hot read paths if later required

Production deployment expectations:

- the API is served behind HTTPS
- a reverse proxy or load balancer forwards client IP information
- `APP_URL` and/or `NEXT_PUBLIC_APP_URL` are set to the deployed HTTPS origin
- `API_TRUST_PROXY` is configured to match the proxy chain so request IPs and secure-cookie behavior are correct
- production secrets are injected from a secret manager rather than committed files
- database backups and restore procedures are operated outside the application runtime

## 11. Draw-Day Performance Strategy

Lottery draw announcements can create large traffic spikes.

Current strategy:

- keep the architecture small and modular
- optimize database queries for latest, detail, history, and checker flows
- preserve clean separation between public reads and admin writes
- leave room for optional caching later without making it required infrastructure

## 12. Architecture Principles

The system architecture follows these principles:

- modular backend design
- single shared API backend
- database as the source of truth
- optional infrastructure only when justified by implementation
- multilingual support from day one
- admin security and auditability as core OSS concerns
