# Thai Lottery Checker — Project Specification

## 1. Overview

Thai Lottery Checker is an open-source multilingual full-stack system for Thai lottery result discovery, number checking, and lottery-related blog reading.
The repository currently ships:

- a public web application in Next.js
- a protected admin system inside the same Next.js app
- a shared Express API
- shared monorepo packages for types, schemas, domain logic, i18n, and utilities

The open-source product definition also includes a planned public-only Mobile MVP, but no mobile workspace is implemented in the repository yet.

Supported languages:

- English (`en`)
- Thai (`th`)
- Myanmar (`my`)

## 2. Product Goals

### Primary goals

- provide a fast and reliable way to view Thai lottery results
- allow public users to quickly check whether a ticket number matches one draw
- publish multilingual public blog content
- give administrators safe operational tools for result and blog management
- keep the OSS platform cleanly separated from future private business extensions

### Product principles

- Accuracy: official result data must be trustworthy and easy to correct
- Speed: public result and checker flows must stay usable during draw-day traffic spikes
- Simplicity: public users should reach results and number checking with minimal friction
- Localization: English, Thai, and Myanmar are first-class locales
- Operational safety: admin access must support authenticated entry, onboarding, recovery, permissions, and audit logging
- Scope discipline: the OSS repository should document only public product scope and implemented infrastructure

## 3. Target Users

### Anonymous public users

Users who want to:

- see latest results
- browse published result history
- open result detail pages
- check a lottery number against public results
- read blog posts
- switch language freely

### Admin users

Internal operators who manage:

- admin authentication and governance
- lottery result workflows
- blog workflows
- auditability for sensitive changes

## 4. Core Features

### Public web application

- locale landing page at `/{locale}` with latest-result preview, history preview, and blog teaser discovery
- dedicated latest-results page at `/{locale}/results`
- published history page at `/{locale}/results/history`
- result detail page by draw date at `/{locale}/results/{drawDate}`
- embedded number checker that navigates to the draw-detail overlay state
- blog list and blog detail pages
- multilingual routing and localized public content
- refined public copy for landing, latest-results, checker, and blog entry surfaces
- route metadata and canonical URLs for landing, latest results, result detail, blog list, and blog detail pages
- shared public footer on public-facing routes

### Admin system

- admin authentication
- server-validated admin session expiry and revocation
- invitation-based onboarding
- password reset and recovery
- admin management for authorized `super_admin` users
- result draft, staged release, publish, and correction workflows
- blog draft, managed banner upload, translation, publish, and unpublish workflows
- audit logging for sensitive admin actions

The admin area is implemented inside the same Next.js application under protected `/admin` routes and uses the shared backend API.

### Planned Mobile MVP

The OSS product roadmap includes a public-only mobile client that will consume the shared backend and shared contracts.
That client is planned to support:

- latest results
- result history
- result detail
- number checking
- blog reading
- language switching

The mobile MVP is intentionally public-only.
It does not include accounts, saved tickets, notifications, or other private business features.

## 5. Implemented OSS Baseline

The current repository implementation aligns with the following shipped baseline:

- locale landing page with latest preview and history entry point
- home-page blog teaser section under the published-history preview
- latest-result page
- history page
- result detail page
- staged public visibility for current draw-day drafts
- embedded checker plus draw-detail result overlay flow
- blog list and blog detail pages
- refined public copy across landing, latest-results, checker, and blog entry surfaces
- route-level metadata for landing, latest results, result detail, blog list, and blog detail pages
- shared public footer on public routes
- deterministic localized public date rendering across SSR and hydration, including Myanmar locale handling
- admin login and server-validated session handling
- invitation acceptance
- password reset request and confirmation
- transactional email delivery for invitation and password-reset links in production
- admin management for `super_admin`
- result management with draft, publish, release, unrelease, and correction behavior
- blog management with slug metadata, managed banner uploads, translations, publish, and unpublish behavior
- audit logging for admin governance, result workflows, and blog workflows
- trusted-origin enforcement and rate limiting for sensitive admin API routes
- production env validation for admin secrets and bootstrap credentials
- production env validation for transactional email delivery configuration

## 6. Recommended Technology Stack

### Frontend

- Next.js 16 for the public website and protected admin area
- Tailwind CSS 4 as the baseline styling system for the web app

### Backend

- Express + TypeScript for the shared API layer
- REST API contracts for public and admin workflows

### Data and repository structure

- PostgreSQL as the primary source of truth
- Prisma 7 for client generation and migrations
- monorepo structure for applications and shared packages
- shared packages for:
  - types
  - schemas
  - domain logic
  - i18n
  - utilities

### Optional infrastructure in the current baseline

- optional object storage for managed blog banner uploads
- optional cache layer only if later performance work requires it

## 7. High-Level Architecture

```text
Public users
 ├─ Web app (Next.js)
 └─ Planned mobile app (public-only)

Admin users
 └─ Protected /admin area in the Next.js app

Frontend clients
 └─ Express API
      ├─ Results service
      ├─ Checker service
      ├─ Blog service
      ├─ Admin service
      └─ PostgreSQL

Shared monorepo packages
 ├─ types
 ├─ schemas
 ├─ domain
 ├─ i18n
 └─ utils
```

### Architectural direction

- use one shared backend for web, planned mobile, and admin
- keep PostgreSQL as canonical storage
- keep admin logically separated inside the web app under protected routes
- reuse shared packages for cross-surface contracts and business logic
- keep optional infrastructure such as object storage or caching non-blocking so the core product still works when that infrastructure is absent
- handle API process shutdown gracefully on `SIGINT` and `SIGTERM`

## 8. Core System Components

### Results service

Responsible for:

- latest result retrieval
- draw history retrieval
- draw detail retrieval
- staged prize-group visibility for current draft draws
- publish and correction workflows

### Number checker service

Responsible for:

- validating ticket number input
- matching ticket numbers against public results
- returning prize match details
- exposing the public draw options used by the checker flow

### Blog service

Responsible for:

- multilingual blog listing and detail retrieval
- blog metadata and translation management for admins
- managed blog banner uploads through optional object storage
- publish and unpublish workflows

### Admin service

Responsible for:

- admin authentication
- admin session issuance, expiry checks, rotation, and revocation
- invitation and onboarding support
- password recovery support
- permission-aware admin governance
- result-management authorization
- blog-management authorization
- audit logging

## 9. Future Private Extensions

The following areas are intentionally excluded from the OSS scope and may exist later as private extensions:

- user accounts
- saved tickets
- ticket notes
- device registration
- notifications and reminders
- analytics features or product dashboards
- monetization-specific capabilities

These are not part of the public open-source product definition and should not appear as required OSS functionality.
