export type ResultsErrorCode =
  | "INVALID_DRAW_DATE"
  | "INVALID_QUERY"
  | "RESULT_NOT_FOUND"
  | "RESULT_DATA_INVALID"
  | "INTERNAL_ERROR";

export interface ResultsErrorResponse {
  code: ResultsErrorCode;
  message: string;
}

export class ResultsApiError extends Error {
  readonly code: ResultsErrorCode;
  readonly statusCode: number;

  constructor(statusCode: number, code: ResultsErrorCode, message: string) {
    super(message);
    this.name = "ResultsApiError";
    this.statusCode = statusCode;
    this.code = code;
  }
}

export function invalidDrawDateError(): ResultsApiError {
  return new ResultsApiError(400, "INVALID_DRAW_DATE", "drawDate must use YYYY-MM-DD format");
}

export function invalidQueryError(): ResultsApiError {
  return new ResultsApiError(400, "INVALID_QUERY", "Query parameters are invalid");
}

export function resultNotFoundError(): ResultsApiError {
  return new ResultsApiError(404, "RESULT_NOT_FOUND", "Result draw was not found");
}

export function resultDataInvalidError(): ResultsApiError {
  return new ResultsApiError(500, "RESULT_DATA_INVALID", "Published result data is incomplete or invalid");
}

export function isResultsApiError(error: unknown): error is ResultsApiError {
  return error instanceof ResultsApiError;
}

export function toResultsErrorResponse(error: unknown): { statusCode: number; body: ResultsErrorResponse } {
  if (isResultsApiError(error)) {
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
