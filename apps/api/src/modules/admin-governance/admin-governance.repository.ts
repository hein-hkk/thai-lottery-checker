import type { AdminPermission, AdminRole } from "@thai-lottery-checker/types";
import { prisma } from "../../db/client.js";

export interface AdminGovernanceAdminRecord {
  id: string;
  email: string;
  name: string | null;
  role: AdminRole;
  isActive: boolean;
  deactivatedAt: Date | null;
  lastLoginAt: Date | null;
  createdAt: Date;
  passwordUpdatedAt: Date | null;
  invitedByAdminId: string | null;
  permissions: Array<{ permission: AdminPermission }>;
}

export interface AdminInvitationRecord {
  id: string;
  email: string;
  role: AdminRole;
  tokenHash: string;
  permissionsJson: unknown;
  expiresAt: Date;
  acceptedAt: Date | null;
  revokedAt: Date | null;
  invitedByAdminId: string;
  createdAt: Date;
}

export interface AdminPasswordResetRecord {
  id: string;
  adminId: string;
  tokenHash: string;
  expiresAt: Date;
  usedAt: Date | null;
  createdAt: Date;
  admin: {
    id: string;
    email: string;
    isActive: boolean;
  };
}

export interface CreateInvitationInput {
  email: string;
  role: AdminRole;
  permissions: AdminPermission[];
  tokenHash: string;
  expiresAt: Date;
  invitedByAdminId: string;
}

export interface AcceptInvitationInput {
  invitationId: string;
  email: string;
  name: string;
  passwordHash: string;
  passwordUpdatedAt: Date;
  invitedByAdminId: string;
  role: AdminRole;
  permissions: AdminPermission[];
  acceptedAt: Date;
}

export interface CreatePasswordResetInput {
  adminId: string;
  tokenHash: string;
  expiresAt: Date;
}

export interface ConfirmPasswordResetInput {
  resetId: string;
  adminId: string;
  passwordHash: string;
  passwordUpdatedAt: Date;
  usedAt: Date;
}

export interface UpdateAdminInput {
  adminId: string;
  role: AdminRole;
  isActive: boolean;
  deactivatedAt: Date | null;
  permissions: AdminPermission[];
}

export interface AdminGovernanceRepository {
  findAdminByEmail(email: string): Promise<AdminGovernanceAdminRecord | null>;
  findAdminById(adminId: string): Promise<AdminGovernanceAdminRecord | null>;
  countActiveSuperAdmins(excludeAdminId?: string): Promise<number>;
  findActiveInvitationByEmail(email: string, now: Date): Promise<AdminInvitationRecord | null>;
  findInvitationByTokenHash(tokenHash: string): Promise<AdminInvitationRecord | null>;
  createInvitation(input: CreateInvitationInput): Promise<AdminInvitationRecord>;
  revokeInvitation(invitationId: string, revokedAt: Date): Promise<void>;
  listAdmins(): Promise<AdminGovernanceAdminRecord[]>;
  acceptInvitation(input: AcceptInvitationInput): Promise<void>;
  createPasswordReset(input: CreatePasswordResetInput): Promise<void>;
  findPasswordResetByTokenHash(tokenHash: string): Promise<AdminPasswordResetRecord | null>;
  confirmPasswordReset(input: ConfirmPasswordResetInput): Promise<void>;
  updateAdmin(input: UpdateAdminInput): Promise<AdminGovernanceAdminRecord>;
}

function adminSelect() {
  return {
    id: true,
    email: true,
    name: true,
    role: true,
    isActive: true,
    deactivatedAt: true,
    lastLoginAt: true,
    createdAt: true,
    passwordUpdatedAt: true,
    invitedByAdminId: true,
    permissions: {
      select: {
        permission: true
      }
    }
  } as const;
}

export const prismaAdminGovernanceRepository: AdminGovernanceRepository = {
  async findAdminByEmail(email) {
    return prisma.admin.findUnique({
      where: { email },
      select: adminSelect()
    });
  },

  async findAdminById(adminId) {
    return prisma.admin.findUnique({
      where: { id: adminId },
      select: adminSelect()
    });
  },

  async countActiveSuperAdmins(excludeAdminId) {
    return prisma.admin.count({
      where: {
        role: "super_admin",
        isActive: true,
        deactivatedAt: null,
        ...(excludeAdminId ? { id: { not: excludeAdminId } } : {})
      }
    });
  },

  async findActiveInvitationByEmail(email, now) {
    return prisma.adminInvitation.findFirst({
      where: {
        email,
        acceptedAt: null,
        revokedAt: null,
        expiresAt: { gt: now }
      }
    });
  },

  async findInvitationByTokenHash(tokenHash) {
    return prisma.adminInvitation.findFirst({
      where: { tokenHash }
    });
  },

  async createInvitation(input) {
    return prisma.adminInvitation.create({
      data: {
        email: input.email,
        role: input.role,
        tokenHash: input.tokenHash,
        permissionsJson: input.permissions,
        expiresAt: input.expiresAt,
        invitedByAdminId: input.invitedByAdminId
      }
    });
  },

  async revokeInvitation(invitationId, revokedAt) {
    await prisma.adminInvitation.update({
      where: { id: invitationId },
      data: { revokedAt }
    });
  },

  async listAdmins() {
    return prisma.admin.findMany({
      orderBy: [{ createdAt: "desc" }],
      select: adminSelect()
    });
  },

  async acceptInvitation(input) {
    await prisma.$transaction(async (tx) => {
      const admin = await tx.admin.create({
        data: {
          email: input.email,
          name: input.name,
          passwordHash: input.passwordHash,
          passwordUpdatedAt: input.passwordUpdatedAt,
          role: input.role,
          isActive: true,
          invitedByAdminId: input.invitedByAdminId
        }
      });

      if (input.role === "editor" && input.permissions.length > 0) {
        await tx.adminPermissionGrant.createMany({
          data: input.permissions.map((permission) => ({
            adminId: admin.id,
            permission
          }))
        });
      }

      await tx.adminInvitation.update({
        where: { id: input.invitationId },
        data: { acceptedAt: input.acceptedAt }
      });
    });
  },

  async createPasswordReset(input) {
    await prisma.adminPasswordReset.create({
      data: {
        adminId: input.adminId,
        tokenHash: input.tokenHash,
        expiresAt: input.expiresAt
      }
    });
  },

  async findPasswordResetByTokenHash(tokenHash) {
    return prisma.adminPasswordReset.findFirst({
      where: { tokenHash },
      include: {
        admin: {
          select: {
            id: true,
            email: true,
            isActive: true
          }
        }
      }
    });
  },

  async confirmPasswordReset(input) {
    await prisma.$transaction([
      prisma.admin.update({
        where: { id: input.adminId },
        data: {
          passwordHash: input.passwordHash,
          passwordUpdatedAt: input.passwordUpdatedAt
        }
      }),
      prisma.adminPasswordReset.update({
        where: { id: input.resetId },
        data: { usedAt: input.usedAt }
      })
    ]);
  },

  async updateAdmin(input) {
    return prisma.$transaction(async (tx) => {
      await tx.admin.update({
        where: { id: input.adminId },
        data: {
          role: input.role,
          isActive: input.isActive,
          deactivatedAt: input.deactivatedAt
        }
      });

      await tx.adminPermissionGrant.deleteMany({
        where: { adminId: input.adminId }
      });

      if (input.role === "editor" && input.permissions.length > 0) {
        await tx.adminPermissionGrant.createMany({
          data: input.permissions.map((permission) => ({
            adminId: input.adminId,
            permission
          }))
        });
      }

      return tx.admin.findUniqueOrThrow({
        where: { id: input.adminId },
        select: adminSelect()
      });
    });
  }
};
