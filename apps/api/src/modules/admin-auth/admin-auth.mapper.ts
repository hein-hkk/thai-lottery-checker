import type { AdminAuthResponse, AdminPermission, AdminRole, AuthenticatedAdmin } from "@thai-lottery-checker/types";
import { adminPermissions } from "@thai-lottery-checker/types";
import type { AdminRepositoryRecord } from "./admin-auth.repository.js";

export interface CurrentAdminContext extends AuthenticatedAdmin {
  passwordUpdatedAt: string | null;
  isActive: boolean;
}

function sortPermissions(permissions: readonly AdminPermission[]): AdminPermission[] {
  return [...permissions].sort((left, right) => adminPermissions.indexOf(left) - adminPermissions.indexOf(right));
}

function getEffectivePermissions(role: AdminRole, permissions: readonly AdminPermission[]): AdminPermission[] {
  return role === "super_admin" ? [...adminPermissions] : sortPermissions(permissions);
}

export function mapCurrentAdmin(record: AdminRepositoryRecord): CurrentAdminContext {
  return {
    id: record.id,
    email: record.email,
    name: record.name,
    role: record.role,
    effectivePermissions: getEffectivePermissions(
      record.role,
      record.permissions.map((permission) => permission.permission)
    ),
    passwordUpdatedAt: record.passwordUpdatedAt?.toISOString() ?? null,
    isActive: record.isActive
  };
}

export function mapAdminAuthResponse(admin: CurrentAdminContext): AdminAuthResponse {
  return {
    admin: {
      id: admin.id,
      email: admin.email,
      name: admin.name,
      role: admin.role,
      effectivePermissions: admin.effectivePermissions
    }
  };
}
