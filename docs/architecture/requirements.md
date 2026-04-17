# Thai Lottery Checker — Requirements Document

## 1. Introduction

### 1.1 Purpose

This document defines the functional and non-functional requirements for the open-source Thai Lottery Checker system.
It is aligned to the current repository implementation through Slice 7 and the planned public-only Mobile MVP that will be added later.

### 1.2 System Overview

Thai Lottery Checker is a multilingual full-stack product consisting of:

- a public web application
- a planned public-only mobile MVP for anonymous read-only use
- a backend API
- an admin dashboard

The platform enables public users to:

- view Thai lottery results
- browse result history
- open result detail pages
- check lottery ticket numbers
- read multilingual blog content
- switch application language

The platform enables admin users to:

- authenticate into the admin dashboard
- manage lottery results with draft, staged release, publish, and correction workflows
- manage blog content
- manage admin access and governance flows already implemented in the repository

### 1.3 Supported Languages

The system must support:

- English (`en`)
- Thai (`th`)
- Myanmar (`my`)

Localization must apply to:

- user interface text
- navigation
- public result pages
- blog content
- admin-facing messages where implemented

## 2. User Roles

### 2.1 Anonymous User

Users accessing the public web application today, and the planned public-only mobile MVP later, without authentication.

Capabilities:

- view latest lottery results
- view historical lottery results
- view result detail by draw date
- check lottery ticket numbers against public results
- read blog list and blog detail content
- switch application language

### 2.2 Admin User

Internal operators responsible for managing the platform.

Capabilities:

- login to the admin dashboard
- maintain authenticated admin sessions
- accept invitations and complete onboarding
- request and complete password reset
- manage admin access when authorized as `super_admin`
- create and update result drafts
- release and unrelease prize groups before final publish
- publish results
- correct published results
- create, edit, publish, and unpublish blog posts
- rely on audit logging for sensitive admin actions

## 3. Functional Requirements

### 3.1 Lottery Results

FR-1: The system must display the latest Thai lottery draw results.

FR-2: The system must allow anonymous users to view historical published lottery results.

FR-3: The system must display detailed results for a specific draw date.

FR-4: Lottery results must support a staged public release model where a current draw may remain in `draft` while released prize groups are visible and unreleased prize groups remain placeholder-only.

FR-5: Admin users must be able to correct previously published results.

FR-6: Result pages must support multilingual labels and UI elements.

FR-7: The landing page at `/{locale}/` must provide a latest-result preview, a published-history preview, and blog teaser discovery for public users when localized published blog posts are available.

FR-8: Public history browsing must remain published-only even when latest and detail pages expose the current draw-day draft.

### 3.2 Number Checker

FR-9: The system must provide a public number-checking capability for 6-digit ticket numbers.

FR-10: The system must compare entered numbers with official results for one selected public draw.

FR-11: The system must validate ticket numbers before checking.

FR-12: The system must return clear match, non-match, or partial-result states based on public result availability.

FR-13: The public checking experience must align with the implemented embedded web flow and draw-detail overlay result pattern.

### 3.3 Blog System

FR-14: Users must be able to view a list of published blog articles.

FR-15: Users must be able to read individual published blog posts.

FR-16: Blog posts must support multiple languages.

FR-17: Admin users must be able to create blog posts.

FR-18: Admin users must be able to edit blog posts and translations.

FR-19: Admin users must be able to publish and unpublish blog posts.

FR-20: Admin users with `manage_blogs` permission must be able to attach, replace, and remove blog banners through a managed upload workflow.

### 3.4 Admin Platform

FR-21: Admin users must authenticate to access the dashboard.

FR-22: Admin authentication must use server-validated sessions with explicit expiry and revocation.

FR-23: The system must support invitation-based admin onboarding.

FR-24: The system must support admin password reset and recovery.

FR-24a: Production invitation and admin password-reset flows must support transactional email delivery without exposing live tokens in API responses.

FR-25: Authorized `super_admin` users must be able to manage admin accounts and permission assignments.

FR-26: Admin users with `manage_results` permission must be able to create, update, release, unrelease, publish, and correct result data.

FR-27: Admin users with `manage_blogs` permission must be able to manage blog metadata and translations.

FR-28: Admin write requests using cookie-based auth must reject untrusted request origins.

FR-29: Sensitive admin actions must be recorded in audit logs.

FR-30: The API must rate limit high-risk admin authentication and mutation flows to reduce brute-force and abuse risk.

## 4. Non-Functional Requirements

### 4.1 Performance

NFR-1: Public result pages and number-checking flows must remain responsive for users.

NFR-2: The system must handle high traffic spikes during Thai lottery draw announcements.

NFR-3: Hot read paths may use optional caching, but correctness must not depend on a cache being present.

### 4.2 Reliability

NFR-4: Lottery results must remain accurate and internally consistent.

NFR-5: System failures must not corrupt canonical stored data.

NFR-6: The system must degrade gracefully if optional infrastructure such as caching or blog-banner object storage is unavailable.

### 4.3 Security

NFR-7: Admin authentication must use secure password storage and secure credential handling.

NFR-8: Access control must restrict admin-only functionality to authorized users.

NFR-9: Sensitive admin flows such as invitations, password resets, and result correction must be auditable.

NFR-10: Production configuration must reject development-default admin secrets and bootstrap credentials.

NFR-11: Admin authentication and security events must be observable through structured logs and request identifiers.

NFR-11a: Production email delivery configuration for admin onboarding and recovery must fail fast when required sender credentials or origin settings are missing.

### 4.4 Maintainability

NFR-12: The system must follow modular architecture principles within the monorepo.

NFR-13: Shared business logic, schemas, and types must be reusable across the web app, API, and planned mobile client.

NFR-14: Logging and audit trails must support debugging, operational review, and correction traceability.

### 4.5 Localization

NFR-15: The system must support multilingual user interfaces and localized public content.

NFR-16: Locale-aware routing must remain consistent across public web routes and the planned mobile client contract.
