import {
  adminAuthResponseSchema,
  adminBlogDetailResponseSchema,
  adminBlogListResponseSchema,
  adminBlogPublishResponseSchema,
  adminBlogUnpublishResponseSchema,
  adminInvitationAcceptResponseSchema,
  adminInvitationCreateResponseSchema,
  adminInvitationRevokeResponseSchema,
  adminListResponseSchema,
  adminPasswordResetConfirmResponseSchema,
  adminPasswordResetRequestResponseSchema,
  adminResultDetailResponseSchema,
  adminResultListResponseSchema,
  adminResultPublishResponseSchema,
  adminUpdateResponseSchema
} from "@thai-lottery-checker/schemas";
import type {
  AdminAuthResponse,
  AdminBlogDetailResponse,
  AdminBlogListResponse,
  AdminBlogMetadataRequest,
  AdminBlogPublishResponse,
  AdminBlogStatusFilter,
  AdminBlogTranslationUpsertRequest,
  AdminBlogUnpublishResponse,
  AdminInvitationAcceptRequest,
  AdminInvitationCreateRequest,
  AdminInvitationCreateResponse,
  AdminInvitationRevokeRequest,
  AdminListResponse,
  AdminLoginRequest,
  AdminPasswordResetConfirmRequest,
  AdminPasswordResetRequest,
  AdminPasswordResetRequestResponse,
  AdminResultDetailResponse,
  AdminResultListResponse,
  AdminResultPublishResponse,
  AdminResultWriteRequest,
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

export async function getAdminResults(cookieHeader?: string): Promise<AdminResultListResponse> {
  const response = await fetch(getAdminApiUrl("/api/v1/admin/results"), {
    method: "GET",
    cache: "no-store",
    headers: cookieHeader ? { cookie: cookieHeader } : undefined,
    credentials: cookieHeader ? undefined : "include"
  });

  if (!response.ok) {
    return readAdminApiError(response, "Failed to load admin results");
  }

  return adminResultListResponseSchema.parse(await response.json());
}

export async function getAdminResultDetail(drawId: string, cookieHeader?: string): Promise<AdminResultDetailResponse> {
  const response = await fetch(getAdminApiUrl(`/api/v1/admin/results/${drawId}`), {
    method: "GET",
    cache: "no-store",
    headers: cookieHeader ? { cookie: cookieHeader } : undefined,
    credentials: cookieHeader ? undefined : "include"
  });

  if (!response.ok) {
    return readAdminApiError(response, "Failed to load admin result");
  }

  return adminResultDetailResponseSchema.parse(await response.json());
}

export async function createAdminResult(input: AdminResultWriteRequest): Promise<AdminResultDetailResponse> {
  const response = await fetch(getAdminApiUrl("/api/v1/admin/results"), {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(input)
  });

  if (!response.ok) {
    return readAdminApiError(response, "Failed to create result");
  }

  return adminResultDetailResponseSchema.parse(await response.json());
}

export async function updateAdminResult(drawId: string, input: AdminResultWriteRequest): Promise<AdminResultDetailResponse> {
  const response = await fetch(getAdminApiUrl(`/api/v1/admin/results/${drawId}`), {
    method: "PATCH",
    credentials: "include",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(input)
  });

  if (!response.ok) {
    return readAdminApiError(response, "Failed to update result");
  }

  return adminResultDetailResponseSchema.parse(await response.json());
}

export async function publishAdminResult(drawId: string): Promise<AdminResultPublishResponse> {
  const response = await fetch(getAdminApiUrl(`/api/v1/admin/results/${drawId}/publish`), {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({})
  });

  if (!response.ok) {
    return readAdminApiError(response, "Failed to publish result");
  }

  return adminResultPublishResponseSchema.parse(await response.json());
}

export async function releaseAdminResultGroup(drawId: string, prizeType: string): Promise<AdminResultDetailResponse> {
  const response = await fetch(getAdminApiUrl(`/api/v1/admin/results/${drawId}/prize-groups/${prizeType}/release`), {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({})
  });

  if (!response.ok) {
    return readAdminApiError(response, "Failed to release result group");
  }

  return adminResultDetailResponseSchema.parse(await response.json());
}

export async function unreleaseAdminResultGroup(drawId: string, prizeType: string): Promise<AdminResultDetailResponse> {
  const response = await fetch(getAdminApiUrl(`/api/v1/admin/results/${drawId}/prize-groups/${prizeType}/unrelease`), {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({})
  });

  if (!response.ok) {
    return readAdminApiError(response, "Failed to unrelease result group");
  }

  return adminResultDetailResponseSchema.parse(await response.json());
}

export async function correctAdminResult(drawId: string, input: AdminResultWriteRequest): Promise<AdminResultDetailResponse> {
  const response = await fetch(getAdminApiUrl(`/api/v1/admin/results/${drawId}/correct`), {
    method: "PATCH",
    credentials: "include",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(input)
  });

  if (!response.ok) {
    return readAdminApiError(response, "Failed to correct result");
  }

  return adminResultDetailResponseSchema.parse(await response.json());
}

export async function getAdminBlogs(status: AdminBlogStatusFilter = "all", cookieHeader?: string): Promise<AdminBlogListResponse> {
  const search = new URLSearchParams({ status });
  const response = await fetch(getAdminApiUrl(`/api/v1/admin/blogs?${search.toString()}`), {
    method: "GET",
    cache: "no-store",
    headers: cookieHeader ? { cookie: cookieHeader } : undefined,
    credentials: cookieHeader ? undefined : "include"
  });

  if (!response.ok) {
    return readAdminApiError(response, "Failed to load admin blogs");
  }

  return adminBlogListResponseSchema.parse(await response.json());
}

export async function getAdminBlogDetail(blogId: string, cookieHeader?: string): Promise<AdminBlogDetailResponse> {
  const response = await fetch(getAdminApiUrl(`/api/v1/admin/blogs/${blogId}`), {
    method: "GET",
    cache: "no-store",
    headers: cookieHeader ? { cookie: cookieHeader } : undefined,
    credentials: cookieHeader ? undefined : "include"
  });

  if (!response.ok) {
    return readAdminApiError(response, "Failed to load admin blog");
  }

  return adminBlogDetailResponseSchema.parse(await response.json());
}

export async function createAdminBlog(input: AdminBlogMetadataRequest): Promise<AdminBlogDetailResponse> {
  const response = await fetch(getAdminApiUrl("/api/v1/admin/blogs"), {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(input)
  });

  if (!response.ok) {
    return readAdminApiError(response, "Failed to create blog");
  }

  return adminBlogDetailResponseSchema.parse(await response.json());
}

export async function updateAdminBlogMetadata(blogId: string, input: AdminBlogMetadataRequest): Promise<AdminBlogDetailResponse> {
  const response = await fetch(getAdminApiUrl(`/api/v1/admin/blogs/${blogId}`), {
    method: "PATCH",
    credentials: "include",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(input)
  });

  if (!response.ok) {
    return readAdminApiError(response, "Failed to update blog metadata");
  }

  return adminBlogDetailResponseSchema.parse(await response.json());
}

export async function upsertAdminBlogTranslation(
  blogId: string,
  locale: string,
  input: AdminBlogTranslationUpsertRequest
): Promise<AdminBlogDetailResponse> {
  const response = await fetch(getAdminApiUrl(`/api/v1/admin/blogs/${blogId}/translations/${locale}`), {
    method: "PUT",
    credentials: "include",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(input)
  });

  if (!response.ok) {
    return readAdminApiError(response, "Failed to save blog translation");
  }

  return adminBlogDetailResponseSchema.parse(await response.json());
}

export async function publishAdminBlog(blogId: string): Promise<AdminBlogPublishResponse> {
  const response = await fetch(getAdminApiUrl(`/api/v1/admin/blogs/${blogId}/publish`), {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({})
  });

  if (!response.ok) {
    return readAdminApiError(response, "Failed to publish blog");
  }

  return adminBlogPublishResponseSchema.parse(await response.json());
}

export async function unpublishAdminBlog(blogId: string): Promise<AdminBlogUnpublishResponse> {
  const response = await fetch(getAdminApiUrl(`/api/v1/admin/blogs/${blogId}/unpublish`), {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({})
  });

  if (!response.ok) {
    return readAdminApiError(response, "Failed to unpublish blog");
  }

  return adminBlogUnpublishResponseSchema.parse(await response.json());
}
