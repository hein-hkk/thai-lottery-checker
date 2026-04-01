import {
  blogDetailResponseSchema,
  blogListResponseSchema
} from "@thai-lottery-checker/schemas";
import type {
  BlogDetailResponse,
  BlogListResponse,
  SupportedLocale
} from "@thai-lottery-checker/types";
import { getPublicEnv } from "../config/env";

export class BlogApiError extends Error {
  readonly status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = "BlogApiError";
    this.status = status;
  }
}

async function fetchBlogJson(pathname: string): Promise<Response> {
  return fetch(`${getPublicEnv().apiBaseUrl}${pathname}`, {
    cache: "no-store"
  });
}

export async function getBlogList(locale: SupportedLocale, page: number): Promise<BlogListResponse> {
  const response = await fetchBlogJson(`/api/v1/blogs?locale=${locale}&page=${page}`);

  if (!response.ok) {
    throw new BlogApiError(response.status, "Failed to load blog list");
  }

  return blogListResponseSchema.parse(await response.json());
}

export async function getBlogDetail(slug: string, locale: SupportedLocale): Promise<BlogDetailResponse | null> {
  const response = await fetchBlogJson(`/api/v1/blogs/${slug}?locale=${locale}`);

  if (response.status === 404) {
    return null;
  }

  if (!response.ok) {
    throw new BlogApiError(response.status, "Failed to load blog detail");
  }

  return blogDetailResponseSchema.parse(await response.json());
}
