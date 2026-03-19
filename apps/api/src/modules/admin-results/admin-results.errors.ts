export interface AdminResultsApiError extends Error {
  code: string;
  statusCode: number;
}

function createAdminResultsError(statusCode: number, code: string, message: string): AdminResultsApiError {
  const error = new Error(message) as AdminResultsApiError;
  error.name = "AdminResultsApiError";
  error.code = code;
  error.statusCode = statusCode;
  return error;
}

export function invalidAdminResultRequestError(message = "Admin result request is invalid"): AdminResultsApiError {
  return createAdminResultsError(400, "INVALID_ADMIN_RESULT_REQUEST", message);
}

export function adminResultNotFoundError(): AdminResultsApiError {
  return createAdminResultsError(404, "ADMIN_RESULT_NOT_FOUND", "Admin result draw was not found");
}

export function adminResultDuplicateDrawDateError(): AdminResultsApiError {
  return createAdminResultsError(409, "ADMIN_RESULT_DUPLICATE_DRAW_DATE", "A result draw already exists for this draw date");
}

export function adminResultInvalidStateError(message: string): AdminResultsApiError {
  return createAdminResultsError(400, "ADMIN_RESULT_INVALID_STATE", message);
}

export function adminResultDataInvalidError(message: string): AdminResultsApiError {
  return createAdminResultsError(400, "ADMIN_RESULT_DATA_INVALID", message);
}

export function toAdminResultsErrorResponse(error: unknown): { statusCode: number; body: { code: string; message: string } } {
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
      code: "ADMIN_RESULTS_INTERNAL_ERROR",
      message: "An unexpected admin results error occurred"
    }
  };
}
