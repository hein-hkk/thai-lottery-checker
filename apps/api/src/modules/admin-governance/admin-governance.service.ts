import { ZodError } from "zod";
import {
  adminInvitationAcceptRequestSchema,
  adminInvitationCreateRequestSchema,
  adminInvitationRevokeRequestSchema,
  adminPasswordResetConfirmRequestSchema,
  adminPasswordResetRequestSchema,
  adminUpdateRequestSchema
} from "@thai-lottery-checker/schemas";
import type {
  AdminInvitationAcceptResponse,
  AdminInvitationCreateResponse,
  AdminInvitationRevokeResponse,
  AdminListResponse,
  AdminPasswordResetConfirmResponse,
  AdminPasswordResetRequestResponse,
  AdminPermission,
  AdminRole,
  AdminUpdateResponse,
  AuthenticatedAdmin
} from "@thai-lottery-checker/types";
import { getApiEnv } from "../../config/env.js";
import { createOpaqueToken, hashOpaqueToken, hashPassword } from "../admin-auth/admin-auth.crypto.js";
import { requireSuperAdmin } from "../admin-auth/admin-auth.service.js";
import {
  activeInvitationExistsError,
  adminAlreadyExistsError,
  adminNotFoundError,
  invalidGovernanceRequestError,
  invitationRevokeNotAllowedError,
  invitationTokenInvalidError,
  lastSuperAdminProtectedError,
  passwordResetTokenInvalidError
} from "./admin-governance.errors.js";
import { mapAdminListResponse, mapAdminUpdateResponse } from "./admin-governance.mapper.js";
import {
  prismaAdminGovernanceRepository,
  type AdminGovernanceAdminRecord,
  type AdminGovernanceRepository
} from "./admin-governance.repository.js";
import { prisma } from "../../db/client.js";

const INVITATION_ENTITY_TYPE = "admin_invitation";
const PASSWORD_RESET_ENTITY_TYPE = "admin_password_reset";

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function sanitizePermissions(role: AdminRole, permissions: readonly AdminPermission[]): AdminPermission[] {
  return role === "editor" ? Array.from(new Set(permissions)) : [];
}

function shouldExposeManualLinks(): boolean {
  return process.env.NODE_ENV !== "production";
}

function getAppUrl(): string {
  const env = getApiEnv();
  return env.APP_URL ?? env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
}

function getInvitationPermissions(permissionsJson: unknown): AdminPermission[] {
  if (!Array.isArray(permissionsJson)) {
    return [];
  }

  return permissionsJson.filter((value): value is AdminPermission => value === "manage_results" || value === "manage_blogs");
}

async function createAuditLog(input: {
  adminId: string;
  action: string;
  entityType: string;
  entityId: string;
  beforeData?: unknown;
  afterData?: unknown;
}): Promise<void> {
  const beforeData = input.beforeData === undefined ? undefined : JSON.parse(JSON.stringify(input.beforeData));
  const afterData = input.afterData === undefined ? undefined : JSON.parse(JSON.stringify(input.afterData));

  await prisma.adminAuditLog.create({
    data: {
      adminId: input.adminId,
      action: input.action,
      entityType: input.entityType,
      entityId: input.entityId,
      beforeData,
      afterData
    }
  });
}

export interface AdminGovernanceService {
  createInvitation(actor: AuthenticatedAdmin, input: unknown): Promise<AdminInvitationCreateResponse>;
  acceptInvitation(input: unknown): Promise<AdminInvitationAcceptResponse>;
  revokeInvitation(actor: AuthenticatedAdmin, input: unknown): Promise<AdminInvitationRevokeResponse>;
  requestPasswordReset(input: unknown): Promise<AdminPasswordResetRequestResponse>;
  confirmPasswordReset(input: unknown): Promise<AdminPasswordResetConfirmResponse>;
  listAdmins(actor: AuthenticatedAdmin): Promise<AdminListResponse>;
  updateAdmin(actor: AuthenticatedAdmin, adminId: string, input: unknown): Promise<AdminUpdateResponse>;
}

export function createAdminGovernanceService(
  repository: AdminGovernanceRepository = prismaAdminGovernanceRepository
): AdminGovernanceService {
  return {
    async createInvitation(actor, input) {
      requireSuperAdmin(actor);

      let parsed;
      try {
        parsed = adminInvitationCreateRequestSchema.parse(input);
      } catch (error) {
        if (error instanceof ZodError) {
          throw invalidGovernanceRequestError("Invitation request is invalid");
        }

        throw error;
      }

      const email = normalizeEmail(parsed.email);
      const existingAdmin = await repository.findAdminByEmail(email);

      if (existingAdmin) {
        throw adminAlreadyExistsError();
      }

      const activeInvitation = await repository.findActiveInvitationByEmail(email, new Date());

      if (activeInvitation) {
        throw activeInvitationExistsError();
      }

      const permissions = sanitizePermissions(parsed.role, parsed.permissions);
      const token = createOpaqueToken();
      const tokenHash = hashOpaqueToken(token, getApiEnv().ADMIN_SESSION_SECRET);
      const expiresAt = new Date(Date.now() + getApiEnv().ADMIN_INVITATION_EXPIRY_HOURS * 60 * 60 * 1000);
      const invitation = await repository.createInvitation({
        email,
        role: parsed.role,
        permissions,
        tokenHash,
        expiresAt,
        invitedByAdminId: actor.id
      });

      await createAuditLog({
        adminId: actor.id,
        action: "invite_admin",
        entityType: INVITATION_ENTITY_TYPE,
        entityId: invitation.id,
        afterData: {
          email,
          role: parsed.role,
          permissions,
          expiresAt: expiresAt.toISOString()
        }
      });

      return {
        invitationId: invitation.id,
        email,
        role: parsed.role,
        permissions,
        expiresAt: expiresAt.toISOString(),
        ...(shouldExposeManualLinks()
          ? { inviteUrl: `${getAppUrl()}/admin/invitations/accept?token=${encodeURIComponent(token)}` }
          : {})
      };
    },

    async acceptInvitation(input) {
      let parsed;
      try {
        parsed = adminInvitationAcceptRequestSchema.parse(input);
      } catch (error) {
        if (error instanceof ZodError) {
          throw invalidGovernanceRequestError("Invitation acceptance request is invalid");
        }

        throw error;
      }

      const tokenHash = hashOpaqueToken(parsed.token, getApiEnv().ADMIN_SESSION_SECRET);
      const invitation = await repository.findInvitationByTokenHash(tokenHash);
      const now = new Date();

      if (!invitation || invitation.acceptedAt || invitation.revokedAt || invitation.expiresAt <= now) {
        throw invitationTokenInvalidError();
      }

      const existingAdmin = await repository.findAdminByEmail(invitation.email);

      if (existingAdmin) {
        throw adminAlreadyExistsError();
      }

      const permissions = sanitizePermissions(invitation.role, getInvitationPermissions(invitation.permissionsJson));
      const passwordHash = await hashPassword(parsed.password);

      await repository.acceptInvitation({
        invitationId: invitation.id,
        email: invitation.email,
        name: parsed.name.trim(),
        passwordHash,
        passwordUpdatedAt: now,
        invitedByAdminId: invitation.invitedByAdminId,
        role: invitation.role,
        permissions,
        acceptedAt: now
      });

      const createdAdmin = await repository.findAdminByEmail(invitation.email);

      if (!createdAdmin) {
        throw adminNotFoundError();
      }

      await createAuditLog({
        adminId: createdAdmin.id,
        action: "accept_admin_invitation",
        entityType: INVITATION_ENTITY_TYPE,
        entityId: invitation.id,
        afterData: {
          adminId: createdAdmin.id,
          email: createdAdmin.email,
          role: createdAdmin.role,
          permissions
        }
      });

      return { success: true };
    },

    async revokeInvitation(actor, input) {
      requireSuperAdmin(actor);

      let parsed;
      try {
        parsed = adminInvitationRevokeRequestSchema.parse(input);
      } catch (error) {
        if (error instanceof ZodError) {
          throw invalidGovernanceRequestError("Invitation revoke request is invalid");
        }

        throw error;
      }

      const invitation = await prisma.adminInvitation.findUnique({
        where: { id: parsed.invitationId }
      });

      if (!invitation || invitation.acceptedAt || invitation.revokedAt) {
        throw invitationRevokeNotAllowedError();
      }

      const revokedAt = new Date();
      await repository.revokeInvitation(invitation.id, revokedAt);

      await createAuditLog({
        adminId: actor.id,
        action: "revoke_admin_invitation",
        entityType: INVITATION_ENTITY_TYPE,
        entityId: invitation.id,
        beforeData: {
          email: invitation.email,
          role: invitation.role
        },
        afterData: {
          revokedAt: revokedAt.toISOString()
        }
      });

      return { success: true };
    },

    async requestPasswordReset(input) {
      let parsed;
      try {
        parsed = adminPasswordResetRequestSchema.parse(input);
      } catch (error) {
        if (error instanceof ZodError) {
          throw invalidGovernanceRequestError("Password reset request is invalid");
        }

        throw error;
      }

      const email = normalizeEmail(parsed.email);
      const admin = await repository.findAdminByEmail(email);

      if (!admin || !admin.isActive || admin.deactivatedAt) {
        return { success: true };
      }

      const token = createOpaqueToken();
      const tokenHash = hashOpaqueToken(token, getApiEnv().ADMIN_SESSION_SECRET);
      const expiresAt = new Date(Date.now() + getApiEnv().ADMIN_PASSWORD_RESET_EXPIRY_HOURS * 60 * 60 * 1000);

      await repository.createPasswordReset({
        adminId: admin.id,
        tokenHash,
        expiresAt
      });

      await createAuditLog({
        adminId: admin.id,
        action: "request_admin_password_reset",
        entityType: PASSWORD_RESET_ENTITY_TYPE,
        entityId: admin.id,
        afterData: {
          expiresAt: expiresAt.toISOString()
        }
      });

      return {
        success: true,
        ...(shouldExposeManualLinks()
          ? { resetUrl: `${getAppUrl()}/admin/reset-password/confirm?token=${encodeURIComponent(token)}` }
          : {})
      };
    },

    async confirmPasswordReset(input) {
      let parsed;
      try {
        parsed = adminPasswordResetConfirmRequestSchema.parse(input);
      } catch (error) {
        if (error instanceof ZodError) {
          throw invalidGovernanceRequestError("Password reset confirmation request is invalid");
        }

        throw error;
      }

      const tokenHash = hashOpaqueToken(parsed.token, getApiEnv().ADMIN_SESSION_SECRET);
      const reset = await repository.findPasswordResetByTokenHash(tokenHash);
      const now = new Date();

      if (!reset || reset.usedAt || reset.expiresAt <= now || !reset.admin.isActive) {
        throw passwordResetTokenInvalidError();
      }

      const passwordHash = await hashPassword(parsed.password);
      await repository.confirmPasswordReset({
        resetId: reset.id,
        adminId: reset.adminId,
        passwordHash,
        passwordUpdatedAt: now,
        usedAt: now
      });

      await createAuditLog({
        adminId: reset.adminId,
        action: "reset_admin_password",
        entityType: PASSWORD_RESET_ENTITY_TYPE,
        entityId: reset.id,
        afterData: {
          resetAt: now.toISOString()
        }
      });

      return { success: true };
    },

    async listAdmins(actor) {
      requireSuperAdmin(actor);
      const admins = await repository.listAdmins();
      return mapAdminListResponse(admins);
    },

    async updateAdmin(actor, adminId, input) {
      requireSuperAdmin(actor);

      let parsed;
      try {
        parsed = adminUpdateRequestSchema.parse(input);
      } catch (error) {
        if (error instanceof ZodError) {
          throw invalidGovernanceRequestError("Admin update request is invalid");
        }

        throw error;
      }

      const existingAdmin = await repository.findAdminById(adminId);

      if (!existingAdmin) {
        throw adminNotFoundError();
      }

      const nextRole = parsed.role ?? existingAdmin.role;
      const nextIsActive = parsed.isActive ?? existingAdmin.isActive;
      const nextPermissions =
        parsed.permissions !== undefined
          ? sanitizePermissions(nextRole, parsed.permissions)
          : sanitizePermissions(nextRole, existingAdmin.permissions.map((permission) => permission.permission));

      await ensureSuperAdminProtection(actor, existingAdmin, nextRole, nextIsActive, repository);

      const updatedAdmin = await repository.updateAdmin({
        adminId,
        role: nextRole,
        isActive: nextIsActive,
        deactivatedAt: nextIsActive ? null : new Date(),
        permissions: nextPermissions
      });

      await createAuditLog({
        adminId: actor.id,
        action:
          existingAdmin.isActive !== nextIsActive
            ? nextIsActive
              ? "reactivate_admin"
              : "deactivate_admin"
            : "update_admin",
        entityType: "admin",
        entityId: existingAdmin.id,
        beforeData: serializeAdminForAudit(existingAdmin),
        afterData: serializeAdminForAudit(updatedAdmin)
      });

      return mapAdminUpdateResponse(updatedAdmin);
    }
  };
}

async function ensureSuperAdminProtection(
  actor: AuthenticatedAdmin,
  targetAdmin: AdminGovernanceAdminRecord,
  nextRole: AdminRole,
  nextIsActive: boolean,
  repository: AdminGovernanceRepository
): Promise<void> {
  const isCurrentlyProtectedSuperAdmin = targetAdmin.role === "super_admin" && targetAdmin.isActive && !targetAdmin.deactivatedAt;
  const wouldLoseSuperAdminAccess = nextRole !== "super_admin" || !nextIsActive;

  if (!isCurrentlyProtectedSuperAdmin || !wouldLoseSuperAdminAccess) {
    return;
  }

  const remainingActiveSuperAdmins = await repository.countActiveSuperAdmins(targetAdmin.id);

  if (remainingActiveSuperAdmins === 0) {
    throw lastSuperAdminProtectedError();
  }

  if (actor.id === targetAdmin.id) {
    throw lastSuperAdminProtectedError();
  }
}

function serializeAdminForAudit(admin: AdminGovernanceAdminRecord): Record<string, unknown> {
  return {
    email: admin.email,
    name: admin.name,
    role: admin.role,
    isActive: admin.isActive,
    permissions: admin.permissions.map((permission) => permission.permission)
  };
}
