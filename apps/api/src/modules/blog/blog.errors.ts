export type BlogErrorCode =
  | "INVALID_BLOG_LOCALE"
  | "INVALID_BLOG_QUERY"
  | "INVALID_BLOG_SLUG"
  | "BLOG_NOT_FOUND"
  | "BLOG_DATA_INVALID"
  | "INTERNAL_ERROR";

export interface BlogErrorResponse {
  code: BlogErrorCode;
  message: string;
}

export class BlogApiError extends Error {
  readonly code: BlogErrorCode;
  readonly statusCode: number;

  constructor(statusCode: number, code: BlogErrorCode, message: string) {
    super(message);
    this.name = "BlogApiError";
    this.statusCode = statusCode;
    this.code = code;
  }
}

export function invalidBlogLocaleError(): BlogApiError {
  return new BlogApiError(400, "INVALID_BLOG_LOCALE", "locale must be one of: en, th, my");
}

export function invalidBlogQueryError(): BlogApiError {
  return new BlogApiError(400, "INVALID_BLOG_QUERY", "Query parameters are invalid");
}

export function invalidBlogSlugError(): BlogApiError {
  return new BlogApiError(400, "INVALID_BLOG_SLUG", "slug is required");
}

export function blogNotFoundError(): BlogApiError {
  return new BlogApiError(404, "BLOG_NOT_FOUND", "Blog post was not found");
}

export function blogDataInvalidError(): BlogApiError {
  return new BlogApiError(500, "BLOG_DATA_INVALID", "Published blog data is incomplete or invalid");
}

export function isBlogApiError(error: unknown): error is BlogApiError {
  return error instanceof BlogApiError;
}

export function toBlogErrorResponse(error: unknown): { statusCode: number; body: BlogErrorResponse } {
  if (isBlogApiError(error)) {
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
