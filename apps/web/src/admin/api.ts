import { adminAuthResponseSchema } from "@thai-lottery-checker/schemas";
import type { AdminAuthResponse, AdminLoginRequest } from "@thai-lottery-checker/types";
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
    let message = "Failed to log in";

    try {
      const payload = (await response.json()) as { message?: string };
      message = payload.message ?? message;
    } catch {
      // Ignore invalid error bodies and fall back to a generic message.
    }

    throw new AdminApiError(response.status, message);
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
