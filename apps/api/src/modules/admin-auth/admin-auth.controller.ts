import type { Request, Response } from "express";
import { clearAdminSessionCookie, setAdminSessionCookie } from "./admin-auth.cookies.js";
import { toAdminAuthErrorResponse } from "./admin-auth.errors.js";
import { mapAdminAuthResponse } from "./admin-auth.mapper.js";
import { createAdminAuthService } from "./admin-auth.service.js";

const adminAuthService = createAdminAuthService();

export async function loginAdmin(request: Request, response: Response): Promise<void> {
  try {
    const result = await adminAuthService.login(request.body);
    setAdminSessionCookie(response, result.sessionToken);
    response.status(200).json(result.response);
  } catch (error) {
    const { statusCode, body } = toAdminAuthErrorResponse(error);
    response.status(statusCode).json(body);
  }
}

export async function logoutAdmin(_request: Request, response: Response): Promise<void> {
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
