import { ZodError } from "zod";
import { adminLoginRequestSchema } from "@thai-lottery-checker/schemas";
import type {
  AdminAuthResponse,
  AdminLoginRequest,
  AdminPermission,
  AdminSessionPayload,
  AuthenticatedAdmin
} from "@thai-lottery-checker/types";
import { getApiEnv } from "../../config/env.js";
import {
  adminForbiddenError,
  adminUnauthorizedError,
  invalidAdminCredentialsError,
  invalidAdminLoginRequestError
} from "./admin-auth.errors.js";
import { mapAdminAuthResponse, mapCurrentAdmin, type CurrentAdminContext } from "./admin-auth.mapper.js";
import { prismaAdminAuthRepository, type AdminAuthRepository } from "./admin-auth.repository.js";
import { signAdminSession, verifyAdminSession, verifyPassword } from "./admin-auth.crypto.js";

export interface LoginResult {
  response: AdminAuthResponse;
  sessionToken: string;
}

export interface ResolvedAdminSession {
  currentAdmin: CurrentAdminContext;
  sessionId: string;
}

export interface AdminAuthService {
  login(input: unknown): Promise<LoginResult>;
  logout(sessionToken: string | null | undefined): Promise<void>;
  getCurrentAdminFromSession(sessionToken: string | null | undefined): Promise<ResolvedAdminSession>;
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function getSessionExpiresAt(from: Date): Date {
  return new Date(from.getTime() + getApiEnv().ADMIN_SESSION_TTL_HOURS * 60 * 60 * 1000);
}

function toSessionPayload(admin: CurrentAdminContext, sessionId: string, expiresAt: Date): AdminSessionPayload {
  return {
    sessionId,
    adminId: admin.id,
    email: admin.email,
    role: admin.role,
    passwordUpdatedAt: admin.passwordUpdatedAt,
    expiresAt: expiresAt.toISOString()
  };
}

function hasPermission(admin: AuthenticatedAdmin, permission: AdminPermission): boolean {
  return admin.role === "super_admin" || admin.effectivePermissions.includes(permission);
}

export function createAdminAuthService(repository: AdminAuthRepository = prismaAdminAuthRepository): AdminAuthService {
  return {
    async login(input: unknown) {
      let credentials: AdminLoginRequest;

      try {
        credentials = adminLoginRequestSchema.parse(input);
      } catch (error) {
        if (error instanceof ZodError) {
          throw invalidAdminLoginRequestError();
        }

        throw error;
      }

      const email = normalizeEmail(credentials.email);
      const admin = await repository.findAdminByEmail(email);

      if (!admin || !admin.isActive || admin.deactivatedAt) {
        throw invalidAdminCredentialsError();
      }

      const passwordMatches = await verifyPassword(credentials.password, admin.passwordHash);

      if (!passwordMatches) {
        throw invalidAdminCredentialsError();
      }

      const loggedInAt = new Date();
      const sessionExpiresAt = getSessionExpiresAt(loggedInAt);
      const session = await repository.rotateLoginSession(admin.id, loggedInAt, sessionExpiresAt);

      const currentAdmin = mapCurrentAdmin({
        ...admin,
        email
      });
      const sessionToken = signAdminSession(
        toSessionPayload(currentAdmin, session.id, session.expiresAt),
        getApiEnv().ADMIN_SESSION_SECRET
      );

      return {
        response: mapAdminAuthResponse(currentAdmin),
        sessionToken
      };
    },

    async logout(sessionToken) {
      if (!sessionToken) {
        return;
      }

      const payload = verifyAdminSession(sessionToken, getApiEnv().ADMIN_SESSION_SECRET);

      if (!payload) {
        return;
      }

      await repository.revokeSession(payload.sessionId, new Date(), "logout");
    },

    async getCurrentAdminFromSession(sessionToken: string | null | undefined) {
      if (!sessionToken) {
        throw adminUnauthorizedError();
      }

      const payload = verifyAdminSession(sessionToken, getApiEnv().ADMIN_SESSION_SECRET);
      const now = new Date();

      if (!payload || new Date(payload.expiresAt) <= now) {
        throw adminUnauthorizedError();
      }

      const session = await repository.findSessionById(payload.sessionId);

      if (
        !session ||
        session.adminId !== payload.adminId ||
        session.revokedAt !== null ||
        session.expiresAt <= now ||
        session.expiresAt.getTime() !== new Date(payload.expiresAt).getTime()
      ) {
        throw adminUnauthorizedError();
      }

      const admin = await repository.findAdminById(payload.adminId);

      if (!admin || !admin.isActive || admin.deactivatedAt) {
        throw adminUnauthorizedError();
      }

      const currentAdmin = mapCurrentAdmin(admin);

      if (currentAdmin.passwordUpdatedAt !== payload.passwordUpdatedAt) {
        throw adminUnauthorizedError();
      }

      return {
        currentAdmin,
        sessionId: session.id
      };
    }
  };
}

export function requireSuperAdmin(admin: AuthenticatedAdmin): void {
  if (admin.role !== "super_admin") {
    throw adminForbiddenError();
  }
}

export function requireAdminPermission(admin: AuthenticatedAdmin, permission: AdminPermission): void {
  if (!hasPermission(admin, permission)) {
    throw adminForbiddenError();
  }
}
