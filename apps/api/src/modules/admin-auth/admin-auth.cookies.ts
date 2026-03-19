import type { Response } from "express";
import { ADMIN_SESSION_COOKIE_NAME } from "./admin-auth.constants.js";

function isSecureCookie(): boolean {
  return process.env.NODE_ENV === "production";
}

export function setAdminSessionCookie(response: Response, sessionToken: string): void {
  response.cookie(ADMIN_SESSION_COOKIE_NAME, sessionToken, {
    httpOnly: true,
    sameSite: "lax",
    secure: isSecureCookie(),
    path: "/"
  });
}

export function clearAdminSessionCookie(response: Response): void {
  response.clearCookie(ADMIN_SESSION_COOKIE_NAME, {
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
