import type { Response } from "express";
import { getApiEnv } from "../../config/env.js";
import { ADMIN_SESSION_COOKIE_NAME } from "./admin-auth.constants.js";

function isSecureCookie(): boolean {
  return process.env.NODE_ENV === "production";
}

function getSessionMaxAgeMs(): number {
  return getApiEnv().ADMIN_SESSION_TTL_HOURS * 60 * 60 * 1000;
}

function getSessionCookieDomain(): string | undefined {
  return getApiEnv().ADMIN_SESSION_COOKIE_DOMAIN;
}

export function setAdminSessionCookie(response: Response, sessionToken: string): void {
  response.cookie(ADMIN_SESSION_COOKIE_NAME, sessionToken, {
    domain: getSessionCookieDomain(),
    httpOnly: true,
    maxAge: getSessionMaxAgeMs(),
    sameSite: "lax",
    secure: isSecureCookie(),
    path: "/"
  });
}

export function clearAdminSessionCookie(response: Response): void {
  response.clearCookie(ADMIN_SESSION_COOKIE_NAME, {
    domain: getSessionCookieDomain(),
    httpOnly: true,
    sameSite: "lax",
    secure: isSecureCookie(),
    path: "/"
  });
}

export function parseCookies(cookieHeader: string | undefined): Record<string, string> {
  if (!cookieHeader) {
    return {};
  }

  return cookieHeader.split(";").reduce<Record<string, string>>((cookies, chunk) => {
    const [rawName, ...rawValue] = chunk.trim().split("=");

    if (!rawName || rawValue.length === 0) {
      return cookies;
    }

    cookies[rawName] = decodeURIComponent(rawValue.join("="));
    return cookies;
  }, {});
}
