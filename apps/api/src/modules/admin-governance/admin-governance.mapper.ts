import type {
  AdminListItem,
  AdminPermission,
  AdminRole,
  AdminUpdateResponse,
  AdminListResponse
} from "@thai-lottery-checker/types";
import { adminPermissions } from "@thai-lottery-checker/types";
import type { AdminGovernanceAdminRecord } from "./admin-governance.repository.js";

function sortPermissions(permissions: readonly AdminPermission[]): AdminPermission[] {
  return [...permissions].sort((left, right) => adminPermissions.indexOf(left) - adminPermissions.indexOf(right));
}

export function mapAdminListItem(record: AdminGovernanceAdminRecord): AdminListItem {
  const permissionList = record.role === "super_admin" ? [...adminPermissions] : record.permissions.map((item) => item.permission);

  return {
    id: record.id,
    email: record.email,
    name: record.name,
    role: record.role as AdminRole,
    isActive: record.isActive,
    deactivatedAt: record.deactivatedAt?.toISOString() ?? null,
    lastLoginAt: record.lastLoginAt?.toISOString() ?? null,
    createdAt: record.createdAt.toISOString(),
    permissions: sortPermissions(permissionList)
  };
}

export function mapAdminListResponse(records: readonly AdminGovernanceAdminRecord[]): AdminListResponse {
  return {
    items: records.map(mapAdminListItem)
  };
}

export function mapAdminUpdateResponse(record: AdminGovernanceAdminRecord): AdminUpdateResponse {
  return {
    admin: mapAdminListItem(record)
  };
}
