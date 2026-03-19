# Slice 2 Plan — Admin Platform Foundation & Result Management

## Summary

Implement Slice 2 as the production-ready admin platform foundation for the final product, limited to secure admin access, admin governance basics, and lottery result management. Keep the existing architecture and boundaries unchanged: Next.js web app with protected admin routes, Express API backend, PostgreSQL via Prisma as source of truth, and a cache-invalidation seam for publish/correction with full Redis wiring deferred to the performance-hardening slice.

Recommended auth choice for this slice: use an HTTP-only secure cookie carrying the admin session token. The backend remains the source of truth by resolving the current admin on each protected request and re-checking `is_active`, role, permissions, and password/session validity against PostgreSQL. This avoids adding a separate auth service or session table in Slice 2.

## Key Changes

### 1. Admin auth and session foundation

- Add admin auth endpoints:
  - `POST /api/v1/admin/auth/login`
  - `POST /api/v1/admin/auth/logout`
  - `GET /api/v1/admin/auth/me`
- Login flow:
  - normalize/lowercase email
  - verify password hash
  - reject inactive/deactivated admins
  - set HTTP-only secure cookie session
  - update `last_login_at`
  - audit `login_admin`
- Logout flow:
  - clear auth cookie
  - audit logout only if the team wants it; otherwise keep logout out of audit scope for v1
- `auth/me` flow:
  - resolve current admin from cookie
  - return admin identity, role, effective permissions, and minimal profile fields needed for UI gating
- Backend auth guard:
  - resolve session on every protected admin request
  - reject missing/invalid session
  - reject inactive/deactivated admin even if session still exists
  - treat `super_admin` as full access
  - treat `editor` as permission-scoped

### 2. Invitation onboarding, password reset, and admin governance

- Add invitation endpoints:
  - `POST /api/v1/admin/invitations`
  - `POST /api/v1/admin/invitations/accept`
  - `POST /api/v1/admin/invitations/revoke`
- Invitation behavior:
  - only `super_admin` can create/revoke invitations
  - create a secure random token, store only `token_hash`
  - save target role and invitation-time permissions in `permissions_json`
  - return the invite link in response for MVP/manual sharing
  - accept flow creates the admin account, sets password, writes permission rows, marks `accepted_at`
  - reject expired, revoked, or previously accepted invitations
- Add password reset endpoints:
  - `POST /api/v1/admin/password-resets/request`
  - `POST /api/v1/admin/password-resets/confirm`
- Password reset behavior:
  - request flow creates secure token, stores only `token_hash`, returns reset link in MVP/dev
  - confirm flow verifies token, updates password hash, sets `password_updated_at`, marks `used_at`
  - reject expired or already-used reset tokens
- Add admin management endpoints:
  - `GET /api/v1/admin/admins`
  - `PATCH /api/v1/admin/admins/:id`
- Admin management behavior:
  - super admin can view admins, update role, update editor permissions, activate/deactivate accounts
  - deactivation sets `is_active = false` and `deactivated_at`
  - reactivation sets `is_active = true` and clears `deactivated_at`
  - permission rows exist only for editors; `super_admin` has no explicit permission rows
- Recommended constraint:
  - block deactivation of the last active `super_admin` to avoid locking the system
- Recommended constraint:
  - do not allow an admin to remove their own last `super_admin` access in Slice 2

### 3. Authorization model and backend enforcement

- Define the effective authorization model exactly as:
  - roles: `super_admin`, `editor`
  - permissions: `manage_results`, `manage_blogs`
- Slice 2 only needs working enforcement for:
  - `super_admin` full access
  - `editor + manage_results` for result management
  - `super_admin` only for admin governance endpoints and admin-management UI
- Implement reusable backend guards:
  - `requireAdminAuth`
  - `requireSuperAdmin`
  - `requireAdminPermission(permission)`
- UI behavior:
  - hide unauthorized navigation/actions
  - never rely on UI alone; backend must enforce every protected request
- Return effective permissions from `auth/me` so the web app can render navigation and pages safely

### 4. Result management APIs, domain rules, and audit behavior

- Add/admin-complete result endpoints:
  - `GET /api/v1/admin/results`
  - `GET /api/v1/admin/results/:id`
  - `POST /api/v1/admin/results`
  - `PATCH /api/v1/admin/results/:id`
  - `POST /api/v1/admin/results/:id/publish`
  - `PATCH /api/v1/admin/results/:id/correct`
- Required authorization:
  - `super_admin` allowed
  - `editor` requires `manage_results`
- Result create/edit behavior:
  - create draft draw with canonical result rows
  - edit draft draw and prize rows
  - keep lottery numbers as strings
  - validate canonical prize counts and digit lengths before publish
- Publish behavior:
  - allowed only for result-complete draft draw
  - set `status = published`
  - set `published_at` only if currently null
  - update `updated_at` / `updated_by_admin_id`
  - write `publish_result` audit log with meaningful after snapshot
  - call the result cache-invalidation abstraction after successful commit
- Correction behavior:
  - operate only on already-published draw
  - update published draw in place
  - never reset or overwrite original `published_at`
  - update `updated_at` / `updated_by_admin_id`
  - write `correct_result` audit log with before/after snapshots
  - call the result cache-invalidation abstraction after successful commit
- Public-read compatibility:
  - public APIs must continue to return only `status = published`
  - checker and later slices continue to consume published data only

### 5. Admin web UI

- Build protected admin area in Next.js with route gating based on `auth/me`
- Pages required for Slice 2:
  - `/admin/login`
  - `/admin/invitations/accept`
  - `/admin/reset-password/request`
  - `/admin/reset-password/confirm`
  - `/admin`
  - `/admin/admins`
  - `/admin/results`
  - `/admin/results/new`
  - `/admin/results/[id]`
- Admin layout responsibilities:
  - fetch current session
  - redirect unauthenticated users to login
  - render navigation conditionally by effective permissions
- Admin management page:
  - list admins
  - invite admin
  - edit role/permissions
  - activate/deactivate admin
  - show generated invite link after creation
- Result list page:
  - show draw date, status, publish timestamp, updated timestamp
  - allow create/edit/publish/correct actions based on permission
- Result editor page:
  - allow editing canonical prize groups
  - validate prize counts and digit lengths before submit/publish
  - clearly distinguish draft edit vs published correction mode
- Recommendation:
  - keep the admin home page minimal in Slice 2, acting mainly as navigation/status rather than introducing dashboard analytics early

### 6. Shared contracts, data flow, and package touchpoints

- Add admin-related shared types/schemas for:
  - admin session payload
  - admin role and permission enums
  - invitation create/accept requests and responses
  - password reset request/confirm requests and responses
  - admin update request
  - admin result create/update/publish/correct payloads
- Keep result-domain validation in shared/domain packages where already used:
  - prize digit rules
  - canonical prize count completeness
  - number-as-string invariants
- Backend data flow:
  - controller validates request
  - service applies authz guard + business rules
  - repository persists changes in PostgreSQL
  - audit log written in same logical operation as the state change
  - publish/correct operations call a cache-invalidation abstraction after successful commit
- Recommended endpoint response shapes:
  - invitation create returns invitation metadata plus manual-share URL
  - password reset request returns a reset URL only in development/MVP mode
  - `auth/me` returns current admin plus effective permissions array

## Public APIs / Interfaces

- Admin auth:
  - `POST /api/v1/admin/auth/login`
  - `POST /api/v1/admin/auth/logout`
  - `GET /api/v1/admin/auth/me`
- Invitations:
  - `POST /api/v1/admin/invitations`
  - `POST /api/v1/admin/invitations/accept`
  - `POST /api/v1/admin/invitations/revoke`
- Password resets:
  - `POST /api/v1/admin/password-resets/request`
  - `POST /api/v1/admin/password-resets/confirm`
- Admin management:
  - `GET /api/v1/admin/admins`
  - `PATCH /api/v1/admin/admins/:id`
- Result management:
  - `GET /api/v1/admin/results`
  - `GET /api/v1/admin/results/:id`
  - `POST /api/v1/admin/results`
  - `PATCH /api/v1/admin/results/:id`
  - `POST /api/v1/admin/results/:id/publish`
  - `PATCH /api/v1/admin/results/:id/correct`

## Test Plan

- Authentication
  - valid admin can log in and access protected admin routes
  - invalid password is rejected
  - inactive/deactivated admin cannot log in
  - logout clears session and blocks further protected access
  - `auth/me` returns correct role and effective permissions
- Invitation flow
  - super admin can create invitation for editor with selected permissions
  - invitation returns manual-share link in MVP/dev mode
  - expired/revoked/accepted invitation cannot be reused
  - accepted invitation creates admin row plus expected permission rows
- Password reset
  - request creates hashed token and returns link in MVP/dev mode
  - expired/used token is rejected
  - confirm updates password and `password_updated_at`
- Authorization
  - `super_admin` can access admin governance and result management
  - editor with `manage_results` can create/edit/publish/correct results
  - editor without `manage_results` is blocked from result endpoints
  - editor with only `manage_blogs` cannot access Slice 2 result actions
  - backend blocks unauthorized requests even if UI attempts them
- Result workflow
  - draft result can be created and edited
  - publish requires canonical prize completeness and valid digit lengths
  - first publish sets `published_at`
  - correction updates published data in place without changing `published_at`
  - publish and correction call the cache-invalidation abstraction without breaking if Redis is not yet wired
  - public APIs continue to hide drafts
- Audit logging
  - login, invite, revoke invitation, accept invitation, deactivate/reactivate admin, request/reset password, create/update/publish/correct result all create expected audit entries
  - correction audit entries include before/after snapshots

## Recommendations

- Keep Slice 2 focused on admin platform + result workflows only. Do not add blog CRUD UI now; just keep `manage_blogs` wired into enums, types, and permission plumbing so Slice 5 can reuse the foundation directly.
- Treat admin-management actions as `super_admin`-only in Slice 2 even though the general model is role + permissions. This keeps governance simpler and safer for the first production-ready admin slice.
- Use a compact, reusable permission-checking utility early. Slice 5 and Slice 9 will reuse the same authz surface instead of inventing new guards later.
- Return generated invitation/reset links only behind environment-gated MVP/dev behavior so production can later switch to email delivery without changing domain contracts.

## Assumptions

- Admin session implementation uses an HTTP-only secure cookie and backend-side current-admin resolution; no dedicated admin session table is introduced in Slice 2.
- Logout clears the session cookie; no cross-device session management is included in Slice 2.
- Invitation acceptance creates the admin record directly rather than creating a pre-user account first.
- Result list API for admin can include both draft and published draws; public APIs remain published-only.
- Blog permissions and navigation can exist in the auth model now, but full blog-management workflows remain Slice 5.
- Dashboard analytics UI remains Slice 9; Slice 2 may expose only a minimal admin landing page, not a real metrics dashboard.
