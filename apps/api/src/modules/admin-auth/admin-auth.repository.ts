import type { AdminPermission, AdminRole } from "@thai-lottery-checker/types";
import { prisma } from "../../db/client.js";

export interface AdminRepositoryRecord {
  id: string;
  email: string;
  name: string | null;
  passwordHash: string;
  role: AdminRole;
  isActive: boolean;
  passwordUpdatedAt: Date | null;
  deactivatedAt: Date | null;
  permissions: Array<{ permission: AdminPermission }>;
}

export interface AdminSessionRecord {
  id: string;
  adminId: string;
  expiresAt: Date;
  revokedAt: Date | null;
}

export interface AdminAuthRepository {
  findAdminByEmail(email: string): Promise<AdminRepositoryRecord | null>;
  findAdminById(adminId: string): Promise<AdminRepositoryRecord | null>;
  rotateLoginSession(adminId: string, loggedInAt: Date, expiresAt: Date): Promise<AdminSessionRecord>;
  findSessionById(sessionId: string): Promise<AdminSessionRecord | null>;
  revokeSession(sessionId: string, revokedAt: Date, reason: string): Promise<void>;
  revokeSessionsForAdmin(adminId: string, revokedAt: Date, reason: string): Promise<void>;
}

function adminSelect() {
  return {
    id: true,
    email: true,
    name: true,
    passwordHash: true,
    role: true,
    isActive: true,
    passwordUpdatedAt: true,
    deactivatedAt: true,
    permissions: {
      select: {
        permission: true
      }
    }
  } as const;
}

export const prismaAdminAuthRepository: AdminAuthRepository = {
  async findAdminByEmail(email: string) {
    return prisma.admin.findUnique({
      where: { email },
      select: adminSelect()
    });
  },

  async findAdminById(adminId: string) {
    return prisma.admin.findUnique({
      where: { id: adminId },
      select: adminSelect()
    });
  },

  async rotateLoginSession(adminId: string, loggedInAt: Date, expiresAt: Date) {
    return prisma.$transaction(async (tx) => {
      await tx.admin.update({
        where: { id: adminId },
        data: {
          lastLoginAt: loggedInAt
        }
      });

      await tx.adminAuditLog.create({
        data: {
          adminId,
          action: "login_admin",
          entityType: "admin",
          entityId: adminId,
          afterData: {
            loggedInAt: loggedInAt.toISOString()
          }
        }
      });

      await tx.adminSession.updateMany({
        where: {
          adminId,
          revokedAt: null
        },
        data: {
          revokedAt: loggedInAt,
          revokeReason: "login_rotated"
        }
      });

      return tx.adminSession.create({
        data: {
          adminId,
          expiresAt
        },
        select: {
          id: true,
          adminId: true,
          expiresAt: true,
          revokedAt: true
        }
      });
    });
  },

  async findSessionById(sessionId: string) {
    return prisma.adminSession.findUnique({
      where: { id: sessionId },
      select: {
        id: true,
        adminId: true,
        expiresAt: true,
        revokedAt: true
      }
    });
  },

  async revokeSession(sessionId: string, revokedAt: Date, reason: string) {
    await prisma.adminSession.updateMany({
      where: {
        id: sessionId,
        revokedAt: null
      },
      data: {
        revokedAt,
        revokeReason: reason
      }
    });
  },

  async revokeSessionsForAdmin(adminId: string, revokedAt: Date, reason: string) {
    await prisma.adminSession.updateMany({
      where: {
        adminId,
        revokedAt: null
      },
      data: {
        revokedAt,
        revokeReason: reason
      }
    });
  }
};
