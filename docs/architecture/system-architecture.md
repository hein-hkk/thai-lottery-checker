# Thai Lottery Checker — System Architecture

## 1. Overview

This document describes the **system architecture** of the Thai Lottery Checker platform.

The system is designed as a **multilingual digital ecosystem** consisting of:

- Public Website
- Mobile Application
- Backend API
- Admin Dashboard
- Supporting Infrastructure (Database, Cache, Storage)

The architecture follows a **modular monolith backend with shared services** to simplify development while maintaining scalability for draw-day traffic spikes.

---

# 2. Architecture Goals

The architecture is designed to achieve the following goals:

### Scalability
Support traffic spikes during Thai lottery draw announcements.

### Performance
Ensure fast response times for result pages and number checking.

### Reliability
Ensure accurate result data and stable system behavior.

### Maintainability
Use modular services and shared packages to simplify development.

### Multilingual Support
Provide consistent experiences for English, Thai, and Myanmar users.

---

# 3. High-Level System Architecture

```text
Users
├─ Website (Next.js)
├─ Mobile App (React Native + Expo)
└─ Admin Dashboard (Next.js)
```

Clients communicate with 

`Backend API (Express + TypeScript)`

```text
Backend API connects to
├─ PostgreSQL Database
├─ Redis Cache
└─ Object Storage (media files)
```

### System Layers

1. Client Layer
2. API Layer
3. Service Layer
4. Data Layer
5. Infrastructure Layer

---

# 4. Client Applications

## 4.1 Public Website

Technology:

- Next.js 16
- TypeScript
- Tailwind CSS 4

Responsibilities:

- Render the locale landing page at `/{locale}/`
- Display latest lottery results
- Display historical results
- Provide number checking interface
- Display blog content
- Provide SEO optimized pages
- Support multilingual routing
- Use Tailwind CSS 4 as the baseline styling system for public web pages

Example routes:
- `/{locale}`
- `/{locale}/results`
- `/{locale}/results/history`
- `/{locale}/results/{drawDate}`
- `/{locale}/blog`
- `/{locale}/blog/{slug}`
- `/en`
- `/th`
- `/my`
---

## 4.1.1 Web Application Scope

The Next.js web application contains:

- public user-facing pages
- a protected admin area under admin routes such as `/admin`

Admin routes are protected and use the same backend API as the public website and mobile application.

The admin UI includes screens for:

- admin login
- invitation acceptance
- password reset
- admin management
- result operations

---

## 4.2 Mobile Application

Technology:

- React Native
- Expo

Responsibilities:

- Display lottery results
- Provide number checker
- Allow users to save tickets
- Store ticket notes
- Manage notification preferences
- Receive push notifications

Key mobile features:

- Saved tickets
- Reminder notifications
- Lightweight local caching

---

## 4.3 Admin Dashboard

Technology:

- Next.js (protected routes)

Responsibilities:

- Admin authentication
- Invitation acceptance
- Password reset request and confirmation
- Admin management
- Result data entry
- Result publishing and correction
- Blog management
- View platform analytics

Admin routes example:

- `/admin/login`
- `/admin/invitations/accept`
- `/admin/reset-password/request`
- `/admin/reset-password/confirm`
- `/admin/admins`
- `/admin/results`
- `/admin/blogs`
- `/admin/dashboard`

---

# 5. Backend Architecture

## 5.1 Backend Technology

- Node.js
- Express
- TypeScript
- Prisma 7

The backend exposes **REST API endpoints** used by:

- Web application
- Mobile application
- Admin dashboard

The API bootstrap handles graceful shutdown on `SIGINT` and `SIGTERM` by closing the HTTP server cleanly and disconnecting Prisma before exit.

---

## 5.2 Backend Layers

The backend follows a layered structure:
- Routes
- Controllers
- Services
- Repositories
- Database

### Routes

Define API endpoints.

Example:

- `GET /api/v1/results/latest`
- `GET /api/v1/checker/draws`
- `POST /api/v1/checker/check`

### Controllers

Handle HTTP requests and responses.

### Services

Contain business logic such as:

- result matching
- number checking
- result publishing
- admin authentication and authorization
- invitation and password reset handling

### Repositories

Handle database queries.

---

## 5.2.1 Number Checker Flow

The public checker is implemented as an embedded web capability rather than a standalone page.

Web flow:

- public pages render an embedded checker beside key result content
- the checker defaults to the current page context or latest public draw
- valid draw options are loaded lazily from the backend
- submit navigates to the draw detail page for the selected draw
- the draw detail page opens a checker-result overlay using URL query params

Canonical checker-result URL pattern:

- `/{locale}/results/{drawDate}?checker=1&ticket=123456`

Backend behavior:

- `GET /api/v1/checker/draws` returns valid public checker draw options
- `POST /api/v1/checker/check` validates a 6-digit ticket number and checks it against one public draw
- if `drawDate` is omitted, the checker uses the same latest-public draw rule as the result pages
- published draws return a `complete` checker result
- public drafts may return a `partial` checker result based on released prize groups only

---

## 5.3 Admin Authentication and Authorization

The backend is the single source of truth for admin authentication and authorization.

Responsibilities include:

- admin login endpoint handling
- session or token establishment for authenticated admin access
- current-admin session resolution for protected requests
- invitation creation and acceptance
- password reset request and token consumption
- admin creation or invitation flows
- admin activation and deactivation
- admin permission assignment

All admin-sensitive operations are validated and authorized in the backend before any data is changed.

### Authorization model

- `super_admin` has full access
- `editor` access is limited by assigned permissions
- Example permissions include `manage_results` and `manage_blogs`
- Authorization is enforced per request through backend middleware or guards
- The UI should hide unauthorized actions, but the backend must enforce security

### Authentication flow

- Admin submits email and password to the backend
- Backend validates credentials and establishes the authenticated session
- The web app sends authenticated admin requests with the session credentials
- The backend resolves the current admin identity for protected requests
- The same session is reused across admin routes
- A current-session endpoint such as `/admin/auth/me` may be used to load the active admin session

### Invitation flow

- `super_admin` creates an admin invitation
- Backend generates a secure invitation token and stores only its hash
- Backend returns the invitation link for delivery
- In MVP, the invitation link may be shared manually instead of being emailed
- Invited admin accepts the invitation, sets a password, and activates the account
- Email delivery can be added later without changing the core architecture

### Password reset flow

- Admin requests a password reset
- Backend generates a secure reset token and stores only its hash
- In MVP or development, the reset link may be returned directly instead of being emailed
- Admin submits a new password through the reset flow using the token

---

# 6. Core Backend Services

## 6.1 Results Service

Responsibilities:

- Retrieve latest results
- Retrieve historical results
- Retrieve result details
- Resolve staged prize-group visibility for public latest/detail reads
- Apply `Asia/Bangkok` draw-day latest-selection rules
- Publish results
- Release and unrelease prize groups before final publish
- Correct published results in place
- Trigger cache invalidation
- Ensure history remains published-only while latest/detail may expose partially released draft draws

Result workflow:

- Results are created and edited in `draft`
- Prize groups can be released or unreleased before final publish
- Publishing changes the draw to `published`
- Public history APIs serve only `published` draws
- Public latest/detail APIs may serve a partially released current draw
- Corrections modify the published data in place
- Release, unrelease, publish, and correction trigger audit logging and cache invalidation

---

## 6.2 Number Checker Service

Responsibilities:

- Validate ticket numbers
- Compare numbers with official results
- Determine prize matches
- Return match results

---

## 6.3 Blog Service

Responsibilities:

- Retrieve blog posts
- Manage multilingual blog content
- Admin blog creation and publishing

---

## 6.4 Ticket Service

Responsibilities:

- Save ticket numbers
- Update ticket notes
- Delete saved tickets
- Retrieve user tickets

---

## 6.5 Notification Service

Responsibilities:

- Store device tokens
- Manage notification preferences
- Trigger push notifications

Notification types:

- Buy reminder
- Draw reminder
- Result reminder

---

## 6.6 Admin Service

Responsibilities:

- Admin authentication
- Invitation-based onboarding
- Password reset and recovery flows
- Role and permission enforcement support
- Admin management
- Result management
- Blog management
- Audit logging
- Dashboard metrics

Examples of audited actions include:

- admin login
- admin invitation creation
- password reset actions
- result creation
- result update
- result group release
- result group unrelease
- result publish
- result correction

---

# 7. Data Architecture

## 7.1 Primary Database

Technology:

- PostgreSQL
- Prisma 7 client and migration tooling

PostgreSQL is the **canonical source of truth** for all system data.

Key entities:

- Lottery draws
- Lottery results
- Lottery result group releases
- Blog posts
- Blog translations
- Users
- Saved tickets
- Notification preferences
- Admin users
- Admin permissions
- Admin invitations
- Admin password resets
- Admin audit logs

Critical admin actions are recorded in `admin_audit_logs` to support traceability and operational safety.

---

## 7.2 Cache Layer

Technology:

- Redis

Redis is used to improve performance for **high-traffic endpoints**.

Primary cached data:

- Latest results
- Result details
- Result history summaries

Example Redis keys:

- `results:latest:{locale}`
- `results:draw:{drawDate}:{locale}`
- `results:history:{locale}`

Cache invalidation occurs when:

- results are created
- results are updated
- result groups are released
- result groups are unreleased
- results are corrected
- results are published

---

## 7.3 Object Storage

Used for storing:

- Blog banner images
- Media assets

Possible providers:

- AWS S3
- Cloudflare R2
- Similar object storage service

---

# 8. Monorepo Structure

The project will use a **monorepo architecture**.

Example structure:

- `thai-lottery-checker/`

- `apps/`
- `web/`
- `mobile/`
- `api/`

- `packages/`
- `ui/`
- `types/`
- `schemas/`
- `domain/`
- `utils/`
- `i18n/`

- `infrastructure/`
- `docker/`
- `scripts/`

Benefits:

- Shared code between web and mobile
- Shared domain logic
- Easier dependency management
- Unified development workflow

---

# 9. Localization Architecture

Localization is implemented at multiple levels.

### UI Localization

Static translations stored in locale files.

Example:

- `/locales/en.json`
- `/locales/th.json`
- `/locales/my.json`

### Content Localization

Blog content stored with language identifiers.

### Routing Localization

Example URLs:

- `/en/results`
- `/th/results`
- `/my/results`

---

# 10. Notification Architecture

Push notifications are supported in the mobile application.

Process:

1. Device registers notification token
2. Token stored in backend database
3. Backend schedules reminder notifications
4. Notification service sends push messages

Supported reminders:

- Buy ticket reminder
- Draw opening reminder
- Result availability reminder

---

# 11. Analytics and Monitoring

The system tracks events for analytics and monitoring.

Tracked events:

- Page views
- Result page visits
- Number checker usage
- Blog views
- Ticket saves
- Notification interactions

Monitoring includes:

- system health
- response time
- traffic spikes
- error tracking

---

# 12. Deployment Architecture

Typical deployment environment:

Frontend:

- Vercel or similar platform for Next.js

Backend:

- Node.js server deployment (container or managed host)

Database:

- Managed PostgreSQL

Cache:

- Managed Redis

Storage:

- Cloud object storage

---

# 13. Draw-Day Performance Strategy

Lottery draw announcements cause large traffic spikes.

Performance strategy includes:

- Redis caching of result endpoints
- Optimized database queries
- Rate limiting on heavy endpoints
- Monitoring and alerting

This ensures result pages remain responsive during peak demand.

---

# 14. Architecture Principles

The system architecture follows these principles:

- Modular backend design
- Single shared API backend
- Database as the source of truth
- Cache used for performance only
- Multilingual support from day one
- Infrastructure designed for draw-day spikes
