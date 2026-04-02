export interface AdminBlogsApiError extends Error {
  code: string;
  statusCode: number;
}

function createAdminBlogsError(statusCode: number, code: string, message: string): AdminBlogsApiError {
  const error = new Error(message) as AdminBlogsApiError;
  error.name = "AdminBlogsApiError";
  error.code = code;
  error.statusCode = statusCode;
  return error;
}

export function invalidAdminBlogRequestError(message = "Admin blog request is invalid"): AdminBlogsApiError {
  return createAdminBlogsError(400, "INVALID_ADMIN_BLOG_REQUEST", message);
}

export function adminBlogNotFoundError(): AdminBlogsApiError {
  return createAdminBlogsError(404, "ADMIN_BLOG_NOT_FOUND", "Admin blog post was not found");
}

export function adminBlogDuplicateSlugError(): AdminBlogsApiError {
  return createAdminBlogsError(409, "ADMIN_BLOG_DUPLICATE_SLUG", "A blog post already exists for this slug");
}

export function adminBlogInvalidStateError(message: string): AdminBlogsApiError {
  return createAdminBlogsError(400, "ADMIN_BLOG_INVALID_STATE", message);
}

export function adminBlogDataInvalidError(message: string): AdminBlogsApiError {
  return createAdminBlogsError(400, "ADMIN_BLOG_DATA_INVALID", message);
}

export function toAdminBlogsErrorResponse(error: unknown): { statusCode: number; body: { code: string; message: string } } {
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
      code: "ADMIN_BLOGS_INTERNAL_ERROR",
      message: "An unexpected admin blogs error occurred"
    }
  };
}
