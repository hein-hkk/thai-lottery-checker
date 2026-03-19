export interface AdminAuthApiError extends Error {
  code: string;
  statusCode: number;
}

function createAdminAuthError(statusCode: number, code: string, message: string): AdminAuthApiError {
  const error = new Error(message) as AdminAuthApiError;
  error.name = "AdminAuthApiError";
  error.code = code;
  error.statusCode = statusCode;
  return error;
}

export function invalidAdminCredentialsError(): AdminAuthApiError {
  return createAdminAuthError(401, "INVALID_ADMIN_CREDENTIALS", "Email or password is incorrect");
}

export function adminUnauthorizedError(): AdminAuthApiError {
  return createAdminAuthError(401, "ADMIN_UNAUTHORIZED", "Admin authentication is required");
}

export function adminForbiddenError(): AdminAuthApiError {
  return createAdminAuthError(403, "ADMIN_FORBIDDEN", "Admin does not have permission to perform this action");
}

export function invalidAdminLoginRequestError(): AdminAuthApiError {
  return createAdminAuthError(400, "INVALID_ADMIN_LOGIN_REQUEST", "Login request is invalid");
}

export function toAdminAuthErrorResponse(error: unknown): { statusCode: number; body: { code: string; message: string } } {
  if (
    error instanceof Error &&
    "statusCode" in error &&
    typeof (error as { statusCode?: unknown }).statusCode === "number" &&
    "code" in error &&
    typeof (error as { code?: unknown }).code === "string"
  ) {
    return {
      statusCode: (error as { statusCode: number }).statusCode,
      body: {
        code: (error as { code: string }).code,
        message: error.message
      }
    };
  }

  return {
    statusCode: 500,
    body: {
      code: "ADMIN_AUTH_INTERNAL_ERROR",
      message: "An unexpected admin authentication error occurred"
    }
  };
}
