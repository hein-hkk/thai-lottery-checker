import type { Request, Response } from "express";
import { markSecurityOutcome } from "../../security/http.js";
import { clearAdminSessionCookie, parseCookies, setAdminSessionCookie } from "./admin-auth.cookies.js";
import { ADMIN_SESSION_COOKIE_NAME } from "./admin-auth.constants.js";
import { toAdminAuthErrorResponse } from "./admin-auth.errors.js";
import { mapAdminAuthResponse } from "./admin-auth.mapper.js";
import { createAdminAuthService } from "./admin-auth.service.js";

const adminAuthService = createAdminAuthService();

export async function loginAdmin(request: Request, response: Response): Promise<void> {
  try {
    const result = await adminAuthService.login(request.body);
    markSecurityOutcome(response, "login_succeeded");
    setAdminSessionCookie(response, result.sessionToken);
    response.status(200).json(result.response);
  } catch (error) {
    markSecurityOutcome(response, "login_failed");
    const { statusCode, body } = toAdminAuthErrorResponse(error);
    response.status(statusCode).json(body);
  }
}

export async function logoutAdmin(request: Request, response: Response): Promise<void> {
  const cookies = parseCookies(request.headers.cookie);
  await adminAuthService.logout(cookies[ADMIN_SESSION_COOKIE_NAME]);
  markSecurityOutcome(response, "logout_succeeded");
  clearAdminSessionCookie(response);
  response.status(200).json({ success: true });
}

export async function getCurrentAdmin(request: Request, response: Response): Promise<void> {
  try {
    if (!request.currentAdmin) {
      throw new Error("currentAdmin was not resolved");
    }

    response.status(200).json(mapAdminAuthResponse(request.currentAdmin));
  } catch (error) {
    const { statusCode, body } = toAdminAuthErrorResponse(error);
    response.status(statusCode).json(body);
  }
}
