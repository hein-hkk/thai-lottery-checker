export type CheckerErrorCode =
  | "INVALID_DRAW_DATE"
  | "INVALID_TICKET_NUMBER"
  | "CHECKER_DRAW_NOT_FOUND"
  | "CHECKER_DATA_INVALID"
  | "INTERNAL_ERROR";

export interface CheckerErrorResponse {
  code: CheckerErrorCode;
  message: string;
}

export class CheckerApiError extends Error {
  readonly code: CheckerErrorCode;
  readonly statusCode: number;

  constructor(statusCode: number, code: CheckerErrorCode, message: string) {
    super(message);
    this.name = "CheckerApiError";
    this.statusCode = statusCode;
    this.code = code;
  }
}

export function invalidCheckerDrawDateError(): CheckerApiError {
  return new CheckerApiError(400, "INVALID_DRAW_DATE", "drawDate must use YYYY-MM-DD format");
}

export function invalidTicketNumberError(): CheckerApiError {
  return new CheckerApiError(400, "INVALID_TICKET_NUMBER", "ticketNumber must use exactly 6 digits");
}

export function checkerDrawNotFoundError(): CheckerApiError {
  return new CheckerApiError(404, "CHECKER_DRAW_NOT_FOUND", "Checker draw was not found");
}

export function checkerDataInvalidError(): CheckerApiError {
  return new CheckerApiError(500, "CHECKER_DATA_INVALID", "Checker draw data is incomplete or invalid");
}

export function isCheckerApiError(error: unknown): error is CheckerApiError {
  return error instanceof CheckerApiError;
}

export function toCheckerErrorResponse(error: unknown): { statusCode: number; body: CheckerErrorResponse } {
  if (isCheckerApiError(error)) {
    return {
      statusCode: error.statusCode,
      body: {
        code: error.code,
        message: error.message
      }
    };
  }

  return {
    statusCode: 500,
    body: {
      code: "INTERNAL_ERROR",
      message: "An unexpected error occurred"
    }
  };
}
