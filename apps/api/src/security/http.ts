import { randomUUID } from "node:crypto";
import type { NextFunction, Request, RequestHandler, Response } from "express";
import { getApiEnv } from "../config/env.js";

type RateLimitEntry = {
  count: number;
  resetAt: number;
};

type RateLimitKeySelector = {
  name: string;
  resolve(request: Request): string | null | undefined;
};

type RateLimitOptions = {
  bucket: string;
  windowMs: number;
  maxRequests: number;
  keySelectors: RateLimitKeySelector[];
};

const rateLimitStores = new Map<string, Map<string, RateLimitEntry>>();
const securityHeaders = {
  "Content-Security-Policy": "default-src 'none'; frame-ancestors 'none'; base-uri 'none'",
  "Cross-Origin-Opener-Policy": "same-origin",
  "Cross-Origin-Resource-Policy": "same-site",
  "Permissions-Policy": "accelerometer=(), camera=(), geolocation=(), gyroscope=(), magnetometer=(), microphone=(), payment=(), usb=()",
  "Referrer-Policy": "no-referrer",
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY"
} as const;
const unsafeMethods = new Set(["POST", "PUT", "PATCH", "DELETE"]);

export function shouldSkipSecurityLog(method: string, path: string): boolean {
  return method === "OPTIONS" && path.startsWith("/api/v1/admin");
}

export function getSafeLoggedPath(path: string): string {
  const [safePath] = path.split("?");
  return safePath || path;
}

function getResponseLocals(response: Response): { securityOutcome?: string } {
  return response.locals as { securityOutcome?: string };
}

function getAllowedOrigins(): string[] {
  const env = getApiEnv();
  return Array.from(
    new Set([env.APP_URL, env.NEXT_PUBLIC_APP_URL].filter((value): value is string => Boolean(value)))
  );
}

function getBodyString(request: Request, key: string): string | null {
  const value = request.body && typeof request.body === "object" ? (request.body as Record<string, unknown>)[key] : null;
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : null;
}

function getRequestIp(request: Request): string {
  return request.clientIp ?? request.ip ?? "unknown";
}

function isSensitiveRequest(request: Request): boolean {
  return request.path.startsWith("/api/v1/admin") || request.path === "/health";
}

function deriveSecurityOutcome(request: Request, response: Response): string {
  const explicitOutcome = getResponseLocals(response).securityOutcome;

  if (explicitOutcome) {
    return explicitOutcome;
  }

  if (request.path === "/api/v1/admin/auth/login") {
    return response.statusCode < 400 ? "login_succeeded" : "login_failed";
  }

  if (request.path === "/api/v1/admin/auth/logout") {
    return response.statusCode < 400 ? "logout_succeeded" : "logout_failed";
  }

  if (response.statusCode === 429) {
    return "rate_limited";
  }

  if (response.statusCode === 401 || response.statusCode === 403) {
    return "denied";
  }

  return response.statusCode >= 500 ? "error" : "allowed";
}

function logSecurityEvent(level: "info" | "warn" | "error", event: Record<string, unknown>): void {
  const payload = JSON.stringify({
    category: "security",
    timestamp: new Date().toISOString(),
    ...event
  });

  if (level === "warn") {
    console.warn(payload);
    return;
  }

  if (level === "error") {
    console.error(payload);
    return;
  }

  console.info(payload);
}

function toRateLimitKey(selectorName: string, value: string): string {
  return `${selectorName}:${value.trim().toLowerCase()}`;
}

function getRateLimitStore(bucket: string): Map<string, RateLimitEntry> {
  const existing = rateLimitStores.get(bucket);

  if (existing) {
    return existing;
  }

  const store = new Map<string, RateLimitEntry>();
  rateLimitStores.set(bucket, store);
  return store;
}

function cleanupExpiredEntries(store: Map<string, RateLimitEntry>, now: number): void {
  for (const [key, entry] of store.entries()) {
    if (entry.resetAt <= now) {
      store.delete(key);
    }
  }
}

function setSecurityOutcome(response: Response, outcome: string): void {
  getResponseLocals(response).securityOutcome = outcome;
}

export function resetRateLimiters(): void {
  rateLimitStores.clear();
}

export function applyRequestContext(request: Request, response: Response, next: NextFunction): void {
  const requestIdHeader = request.headers["x-request-id"];
  const requestId =
    typeof requestIdHeader === "string" && requestIdHeader.trim().length > 0 ? requestIdHeader.trim() : randomUUID();

  request.requestId = requestId;
  request.clientIp = request.ip ?? "unknown";
  response.setHeader("X-Request-Id", requestId);

  response.on("finish", () => {
    if (!isSensitiveRequest(request)) {
      return;
    }

    if (shouldSkipSecurityLog(request.method, request.path)) {
      return;
    }

    const outcome = deriveSecurityOutcome(request, response);
    const level = response.statusCode >= 500 ? "error" : response.statusCode >= 400 ? "warn" : "info";

    logSecurityEvent(level, {
      requestId,
      adminId: request.currentAdmin?.id ?? null,
      ip: getRequestIp(request),
      method: request.method,
      path: getSafeLoggedPath(request.originalUrl),
      statusCode: response.statusCode,
      outcome
    });
  });

  next();
}

export function applySecurityHeaders(_request: Request, response: Response, next: NextFunction): void {
  Object.entries(securityHeaders).forEach(([name, value]) => {
    response.setHeader(name, value);
  });

  if (process.env.NODE_ENV === "production") {
    response.setHeader("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
  }

  next();
}

export function applyCors(request: Request, response: Response, next: NextFunction): void {
  const allowedOrigins = getAllowedOrigins();
  const requestOrigin = request.headers.origin;

  if (requestOrigin && allowedOrigins.includes(requestOrigin)) {
    response.header("Access-Control-Allow-Origin", requestOrigin);
    response.header("Access-Control-Allow-Credentials", "true");
    response.header("Access-Control-Allow-Headers", "Content-Type, X-Request-Id");
    response.header("Access-Control-Allow-Methods", "GET,POST,PUT,PATCH,DELETE,OPTIONS");
    response.header("Vary", "Origin");
  }

  if (request.method === "OPTIONS") {
    response.status(204).end();
    return;
  }

  next();
}

export function requireAllowedAdminOrigin(request: Request, response: Response, next: NextFunction): void {
  if (!unsafeMethods.has(request.method)) {
    next();
    return;
  }

  const allowedOrigins = getAllowedOrigins();
  const requestOrigin = request.headers.origin;

  if (allowedOrigins.length === 0 || !requestOrigin || !allowedOrigins.includes(requestOrigin)) {
    setSecurityOutcome(response, "origin_rejected");
    response.status(403).json({
      code: "INVALID_ADMIN_ORIGIN",
      message: "Request origin is not allowed"
    });
    return;
  }

  next();
}

export function createRateLimitMiddleware(options: RateLimitOptions): RequestHandler {
  return (request, response, next) => {
    const now = Date.now();
    const store = getRateLimitStore(options.bucket);
    let retryAfterSeconds = 0;

    cleanupExpiredEntries(store, now);

    for (const selector of options.keySelectors) {
      const resolvedValue = selector.resolve(request);

      if (!resolvedValue) {
        continue;
      }

      const key = toRateLimitKey(selector.name, resolvedValue);
      const currentEntry = store.get(key);
      const entry =
        currentEntry && currentEntry.resetAt > now
          ? currentEntry
          : {
              count: 0,
              resetAt: now + options.windowMs
            };

      entry.count += 1;
      store.set(key, entry);

      if (entry.count > options.maxRequests) {
        retryAfterSeconds = Math.max(retryAfterSeconds, Math.ceil((entry.resetAt - now) / 1000));
      }
    }

    if (retryAfterSeconds > 0) {
      setSecurityOutcome(response, "rate_limited");
      response.setHeader("Retry-After", String(retryAfterSeconds));
      response.status(429).json({
        code: "RATE_LIMITED",
        message: "Too many requests, please try again later"
      });
      return;
    }

    next();
  };
}

export function markSecurityOutcome(response: Response, outcome: string): void {
  setSecurityOutcome(response, outcome);
}

export function createAdminLoginRateLimit(): RequestHandler {
  const env = getApiEnv();

  return createRateLimitMiddleware({
    bucket: "admin-login",
    windowMs: env.ADMIN_LOGIN_RATE_LIMIT_WINDOW_MINUTES * 60 * 1000,
    maxRequests: env.ADMIN_LOGIN_RATE_LIMIT_MAX_ATTEMPTS,
    keySelectors: [
      {
        name: "ip",
        resolve: (request) => getRequestIp(request)
      },
      {
        name: "email",
        resolve: (request) => getBodyString(request, "email")
      }
    ]
  });
}

export function createPasswordResetRequestRateLimit(): RequestHandler {
  const env = getApiEnv();

  return createRateLimitMiddleware({
    bucket: "admin-password-reset-request",
    windowMs: env.ADMIN_PASSWORD_RESET_RATE_LIMIT_WINDOW_MINUTES * 60 * 1000,
    maxRequests: env.ADMIN_PASSWORD_RESET_RATE_LIMIT_MAX_ATTEMPTS,
    keySelectors: [
      {
        name: "ip",
        resolve: (request) => getRequestIp(request)
      },
      {
        name: "email",
        resolve: (request) => getBodyString(request, "email")
      }
    ]
  });
}

export function createPasswordResetConfirmRateLimit(): RequestHandler {
  const env = getApiEnv();

  return createRateLimitMiddleware({
    bucket: "admin-password-reset-confirm",
    windowMs: env.ADMIN_PASSWORD_RESET_RATE_LIMIT_WINDOW_MINUTES * 60 * 1000,
    maxRequests: env.ADMIN_PASSWORD_RESET_RATE_LIMIT_MAX_ATTEMPTS,
    keySelectors: [
      {
        name: "ip",
        resolve: (request) => getRequestIp(request)
      },
      {
        name: "token",
        resolve: (request) => getBodyString(request, "token")
      }
    ]
  });
}

export function createInvitationAcceptRateLimit(): RequestHandler {
  const env = getApiEnv();

  return createRateLimitMiddleware({
    bucket: "admin-invitation-accept",
    windowMs: env.ADMIN_INVITATION_ACCEPT_RATE_LIMIT_WINDOW_MINUTES * 60 * 1000,
    maxRequests: env.ADMIN_INVITATION_ACCEPT_RATE_LIMIT_MAX_ATTEMPTS,
    keySelectors: [
      {
        name: "ip",
        resolve: (request) => getRequestIp(request)
      },
      {
        name: "token",
        resolve: (request) => getBodyString(request, "token")
      }
    ]
  });
}

export function createAdminWriteRateLimit(): RequestHandler {
  const env = getApiEnv();

  return createRateLimitMiddleware({
    bucket: "admin-write",
    windowMs: env.ADMIN_WRITE_RATE_LIMIT_WINDOW_MINUTES * 60 * 1000,
    maxRequests: env.ADMIN_WRITE_RATE_LIMIT_MAX_REQUESTS,
    keySelectors: [
      {
        name: "ip",
        resolve: (request) => getRequestIp(request)
      },
      {
        name: "admin",
        resolve: (request) => request.currentAdmin?.id
      }
    ]
  });
}

export function createPublicReadRateLimit(): RequestHandler {
  const env = getApiEnv();

  return createRateLimitMiddleware({
    bucket: "public-read",
    windowMs: env.PUBLIC_READ_RATE_LIMIT_WINDOW_MINUTES * 60 * 1000,
    maxRequests: env.PUBLIC_READ_RATE_LIMIT_MAX_REQUESTS,
    keySelectors: [
      {
        name: "ip",
        resolve: (request) => getRequestIp(request)
      }
    ]
  });
}

export function createCheckerCheckRateLimit(): RequestHandler {
  const env = getApiEnv();

  return createRateLimitMiddleware({
    bucket: "checker-check",
    windowMs: env.CHECKER_CHECK_RATE_LIMIT_WINDOW_MINUTES * 60 * 1000,
    maxRequests: env.CHECKER_CHECK_RATE_LIMIT_MAX_REQUESTS,
    keySelectors: [
      {
        name: "ip",
        resolve: (request) => getRequestIp(request)
      }
    ]
  });
}
