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

- Next.js
- TypeScript

Responsibilities:

- Display latest lottery results
- Display historical results
- Provide number checking interface
- Display blog content
- Provide SEO optimized pages
- Support multilingual routing

Example routes:
- `/results`
- `/results/{drawDate}`
- `/check`
- `/blog`
- `/blog/{slug}`
- `/en`
- `/th`
- `/my`
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
- Result data entry
- Result publishing
- Blog management
- View platform analytics

Admin routes example:

- `/admin/login`
- `/admin/results`
- `/admin/blogs`
- `/admin/dashboard`

---

# 5. Backend Architecture

## 5.1 Backend Technology

- Node.js
- Express
- TypeScript

The backend exposes **REST API endpoints** used by:

- Web application
- Mobile application
- Admin dashboard

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
- `POST /api/v1/checker/check`

### Controllers

Handle HTTP requests and responses.

### Services

Contain business logic such as:

- result matching
- number checking
- result publishing

### Repositories

Handle database queries.

---

# 6. Core Backend Services

## 6.1 Results Service

Responsibilities:

- Retrieve latest results
- Retrieve historical results
- Retrieve result details
- Publish results
- Trigger cache invalidation

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
- Result management
- Blog management
- Audit logging
- Dashboard metrics

---

# 7. Data Architecture

## 7.1 Primary Database

Technology:

- PostgreSQL

PostgreSQL is the **canonical source of truth** for all system data.

Key entities:

- Lottery draws
- Lottery results
- Blog posts
- Blog translations
- Users
- Saved tickets
- Notification preferences
- Admin users

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