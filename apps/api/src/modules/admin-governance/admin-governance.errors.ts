export interface AdminGovernanceApiError extends Error {
  code: string;
  statusCode: number;
}

function createAdminGovernanceError(statusCode: number, code: string, message: string): AdminGovernanceApiError {
  const error = new Error(message) as AdminGovernanceApiError;
  error.name = "AdminGovernanceApiError";
  error.code = code;
  error.statusCode = statusCode;
  return error;
}

export function invalidGovernanceRequestError(message = "Request is invalid"): AdminGovernanceApiError {
  return createAdminGovernanceError(400, "INVALID_ADMIN_GOVERNANCE_REQUEST", message);
}

export function adminAlreadyExistsError(): AdminGovernanceApiError {
  return createAdminGovernanceError(409, "ADMIN_ALREADY_EXISTS", "An admin account with this email already exists");
}

export function activeInvitationExistsError(): AdminGovernanceApiError {
  return createAdminGovernanceError(409, "ACTIVE_ADMIN_INVITATION_EXISTS", "An active invitation already exists for this email");
}

export function invitationTokenInvalidError(): AdminGovernanceApiError {
  return createAdminGovernanceError(400, "INVALID_ADMIN_INVITATION", "Invitation token is invalid or can no longer be used");
}

export function invitationRevokeNotAllowedError(): AdminGovernanceApiError {
  return createAdminGovernanceError(400, "INVITATION_REVOKE_NOT_ALLOWED", "Invitation cannot be revoked");
}

export function passwordResetTokenInvalidError(): AdminGovernanceApiError {
  return createAdminGovernanceError(400, "INVALID_ADMIN_PASSWORD_RESET", "Password reset token is invalid or can no longer be used");
}

export function emailDeliveryUnavailableError(): AdminGovernanceApiError {
  return createAdminGovernanceError(503, "ADMIN_EMAIL_DELIVERY_UNAVAILABLE", "Admin email delivery is not configured");
}

export function emailDeliveryFailedError(): AdminGovernanceApiError {
  return createAdminGovernanceError(503, "ADMIN_EMAIL_DELIVERY_FAILED", "Failed to deliver admin email");
}

export function adminNotFoundError(): AdminGovernanceApiError {
  return createAdminGovernanceError(404, "ADMIN_NOT_FOUND", "Admin was not found");
}

export function lastSuperAdminProtectedError(): AdminGovernanceApiError {
  return createAdminGovernanceError(400, "LAST_SUPER_ADMIN_PROTECTED", "The last active super admin cannot be deactivated or demoted");
}

export function toAdminGovernanceErrorResponse(
  error: unknown
): { statusCode: number; body: { code: string; message: string } } {
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
      code: "ADMIN_GOVERNANCE_INTERNAL_ERROR",
      message: "An unexpected admin governance error occurred"
    }
  };
}
