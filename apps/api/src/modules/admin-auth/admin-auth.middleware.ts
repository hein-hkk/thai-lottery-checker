import type { NextFunction, Request, Response } from "express";
import { markSecurityOutcome } from "../../security/http.js";
import { createAdminAuthService } from "./admin-auth.service.js";
import { parseCookies } from "./admin-auth.cookies.js";
import { ADMIN_SESSION_COOKIE_NAME } from "./admin-auth.constants.js";
import { toAdminAuthErrorResponse } from "./admin-auth.errors.js";

const adminAuthService = createAdminAuthService();

export async function requireAdminAuth(request: Request, response: Response, next: NextFunction): Promise<void> {
  try {
    const cookies = parseCookies(request.headers.cookie);
    const { currentAdmin, sessionId } = await adminAuthService.getCurrentAdminFromSession(cookies[ADMIN_SESSION_COOKIE_NAME]);
    request.currentAdmin = currentAdmin;
    request.currentAdminSessionId = sessionId;
    next();
  } catch (error) {
    markSecurityOutcome(response, "admin_auth_failed");
    const { statusCode, body } = toAdminAuthErrorResponse(error);
    response.status(statusCode).json(body);
  }
}
