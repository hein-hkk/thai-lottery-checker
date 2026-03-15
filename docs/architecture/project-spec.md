# Thai Lottery Checker — Project Specification

## 1. Overview

Thai Lottery Checker is a multilingual digital product ecosystem for Thai lottery result discovery, number checking, and lottery-related content. The system consists of:

- A **public website** for result browsing, number checking, and SEO-focused blogs
- A **mobile application** for the same core experience plus saved tickets, notes, and reminder notifications
- A shared **admin system** for result entry, blog publishing, and business reporting

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
- **Operational safety**: manual result entry must support draft, publish, correction, and audit logging

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

- Lottery result entry and publication
- Blog creation and publishing
- Business metrics and platform oversight

## 4. Core Features

### Public website

- Latest Thai lottery results
- Historical draw results
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
- Manual entry of official lottery result numbers
- Draft and publish workflow
- Blog CRUD with banner image support
- Basic dashboard metrics for website and mobile usage
- Audit logging for sensitive changes

## 5. MVP Scope

### Website MVP

- Latest result page
- Result history page
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
- Create and edit lottery results
- Publish lottery results
- Create and edit blogs
- Publish blogs
- View summary metrics

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
- Keep admin separated logically inside the web app
- Handle API process shutdown gracefully on `SIGINT` and `SIGTERM`, including clean HTTP server closure and Prisma disconnect

## 8. Core System Components

### Results service

Responsible for:

- latest result retrieval
- draw history retrieval
- draw detail retrieval
- publish and correction workflows
- Redis cache invalidation triggers

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
- manual result entry
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

#### `admin_audit_logs`
Tracks sensitive admin actions such as result creation, updates, publication, and blog publishing.

#### `lottery_draws`
Represents a draw event by date and publish status.

#### `lottery_results`
Stores the actual prize numbers associated with a draw.

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
- One `blog_post` has many `blog_post_translations`
- One `user` has many `saved_tickets`
- One `user` has many `user_devices`
- One `user` has one `notification_preferences`
- One `admin` has many `admin_audit_logs`

### Key enums

- `Locale`: `en`, `th`, `my`
- `PublishStatus`: `draft`, `published`
- `PrizeType`: `FIRST_PRIZE`, `FRONT_THREE`, `LAST_THREE`, `LAST_TWO`
- `AdminRole`: `super_admin`, `editor`
- `AuthProvider`: `email`, `google`, `apple`
- `NotificationType`: `buy_reminder`, `draw_reminder`, `check_reminder`

## 10. API Design Summary

### Public endpoints

- `GET /api/v1/results/latest`
- `GET /api/v1/results`
- `GET /api/v1/results/:drawDate`
- `POST /api/v1/checker/check`
- `GET /api/v1/blogs`
- `GET /api/v1/blogs/:slug`

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
- Result publish and correction workflows must invalidate dependent cache keys
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
- Result data is validated before publish
- Publish sets public visibility
- Corrections trigger cache invalidation and fresh reads

### Blog workflow

- Admin creates blog metadata and translations
- Blog remains `draft` until explicitly published
- At least one valid translation is required for publishing

### Validation rules

- Ticket numbers and prize numbers are stored as strings
- Numeric strings must preserve leading zeros
- Prize lengths must match prize type requirements
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
Website MVP: results, history, checker, blogs, SEO, ad placement zones.

### Phase 3
Mobile MVP: results, checker, blogs, saved tickets, notes, notifications.

### Phase 4
Redis-backed draw-day hardening: cache hottest read paths, invalidation, fallback behavior, load testing.

### Phase 5
Admin analytics and monetization optimization.

### Phase 6
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
