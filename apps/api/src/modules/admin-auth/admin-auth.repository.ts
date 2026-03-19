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

export interface AdminAuthRepository {
  findAdminByEmail(email: string): Promise<AdminRepositoryRecord | null>;
  findAdminById(adminId: string): Promise<AdminRepositoryRecord | null>;
  recordLogin(adminId: string, loggedInAt: Date): Promise<void>;
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

  async recordLogin(adminId: string, loggedInAt: Date) {
    await prisma.$transaction([
      prisma.admin.update({
        where: { id: adminId },
        data: {
          lastLoginAt: loggedInAt
        }
      }),
      prisma.adminAuditLog.create({
        data: {
          adminId,
          action: "login_admin",
          entityType: "admin",
          entityId: adminId,
          afterData: {
            loggedInAt: loggedInAt.toISOString()
          }
        }
      })
    ]);
  }
};
