import {
  adminAuthResponseSchema,
  adminInvitationAcceptResponseSchema,
  adminInvitationCreateResponseSchema,
  adminInvitationRevokeResponseSchema,
  adminListResponseSchema,
  adminPasswordResetConfirmResponseSchema,
  adminPasswordResetRequestResponseSchema,
  adminUpdateResponseSchema
} from "@thai-lottery-checker/schemas";
import type {
  AdminAuthResponse,
  AdminInvitationAcceptRequest,
  AdminInvitationCreateRequest,
  AdminInvitationCreateResponse,
  AdminInvitationRevokeRequest,
  AdminListResponse,
  AdminLoginRequest,
  AdminPasswordResetConfirmRequest,
  AdminPasswordResetRequest,
  AdminPasswordResetRequestResponse,
  AdminUpdateRequest,
  AdminUpdateResponse
} from "@thai-lottery-checker/types";
import { getPublicEnv } from "../config/env";

export class AdminApiError extends Error {
  readonly status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = "AdminApiError";
    this.status = status;
  }
}

function getAdminApiUrl(pathname: string): string {
  return `${getPublicEnv().apiBaseUrl}${pathname}`;
}

async function readAdminApiError(response: Response, fallbackMessage: string): Promise<never> {
  let message = fallbackMessage;

  try {
    const payload = (await response.json()) as { message?: string };
    message = payload.message ?? fallbackMessage;
  } catch {
    // Ignore invalid error bodies and fall back to a generic message.
  }

  throw new AdminApiError(response.status, message);
}

export async function getAdminMe(cookieHeader?: string): Promise<AdminAuthResponse | null> {
  const response = await fetch(getAdminApiUrl("/api/v1/admin/auth/me"), {
    method: "GET",
    cache: "no-store",
    headers: cookieHeader ? { cookie: cookieHeader } : undefined
  });

  if (response.status === 401) {
    return null;
  }

  if (!response.ok) {
    throw new AdminApiError(response.status, "Failed to load current admin session");
  }

  return adminAuthResponseSchema.parse(await response.json());
}

export async function loginAdmin(input: AdminLoginRequest): Promise<AdminAuthResponse> {
  const response = await fetch(getAdminApiUrl("/api/v1/admin/auth/login"), {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(input)
  });

  if (!response.ok) {
    return readAdminApiError(response, "Failed to log in");
  }

  return adminAuthResponseSchema.parse(await response.json());
}

export async function logoutAdmin(): Promise<void> {
  const response = await fetch(getAdminApiUrl("/api/v1/admin/auth/logout"), {
    method: "POST",
    credentials: "include"
  });

  if (!response.ok) {
    throw new AdminApiError(response.status, "Failed to log out");
  }
}

export async function createAdminInvitation(input: AdminInvitationCreateRequest): Promise<AdminInvitationCreateResponse> {
  const response = await fetch(getAdminApiUrl("/api/v1/admin/invitations"), {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(input)
  });

  if (!response.ok) {
    return readAdminApiError(response, "Failed to create invitation");
  }

  return adminInvitationCreateResponseSchema.parse(await response.json());
}

export async function acceptAdminInvitation(input: AdminInvitationAcceptRequest): Promise<void> {
  const response = await fetch(getAdminApiUrl("/api/v1/admin/invitations/accept"), {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(input)
  });

  if (!response.ok) {
    return readAdminApiError(response, "Failed to accept invitation");
  }

  adminInvitationAcceptResponseSchema.parse(await response.json());
}

export async function revokeAdminInvitation(input: AdminInvitationRevokeRequest): Promise<void> {
  const response = await fetch(getAdminApiUrl("/api/v1/admin/invitations/revoke"), {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(input)
  });

  if (!response.ok) {
    return readAdminApiError(response, "Failed to revoke invitation");
  }

  adminInvitationRevokeResponseSchema.parse(await response.json());
}

export async function requestAdminPasswordReset(
  input: AdminPasswordResetRequest
): Promise<AdminPasswordResetRequestResponse> {
  const response = await fetch(getAdminApiUrl("/api/v1/admin/password-resets/request"), {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(input)
  });

  if (!response.ok) {
    return readAdminApiError(response, "Failed to request password reset");
  }

  return adminPasswordResetRequestResponseSchema.parse(await response.json());
}

export async function confirmAdminPasswordReset(input: AdminPasswordResetConfirmRequest): Promise<void> {
  const response = await fetch(getAdminApiUrl("/api/v1/admin/password-resets/confirm"), {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(input)
  });

  if (!response.ok) {
    return readAdminApiError(response, "Failed to reset password");
  }

  adminPasswordResetConfirmResponseSchema.parse(await response.json());
}

export async function getAdminList(cookieHeader?: string): Promise<AdminListResponse> {
  const response = await fetch(getAdminApiUrl("/api/v1/admin/admins"), {
    method: "GET",
    cache: "no-store",
    headers: cookieHeader ? { cookie: cookieHeader } : undefined,
    credentials: cookieHeader ? undefined : "include"
  });

  if (!response.ok) {
    return readAdminApiError(response, "Failed to load admin accounts");
  }

  return adminListResponseSchema.parse(await response.json());
}

export async function updateAdminAccount(adminId: string, input: AdminUpdateRequest): Promise<AdminUpdateResponse> {
  const response = await fetch(getAdminApiUrl(`/api/v1/admin/admins/${adminId}`), {
    method: "PATCH",
    credentials: "include",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(input)
  });

  if (!response.ok) {
    return readAdminApiError(response, "Failed to update admin account");
  }

  return adminUpdateResponseSchema.parse(await response.json());
}
