import { ZodError } from "zod";
import { blogListQuerySchema, blogSlugParamSchema, localeSchema } from "@thai-lottery-checker/schemas";
import type { BlogDetailResponse, BlogListResponse, SupportedLocale } from "@thai-lottery-checker/types";
import {
  blogDataInvalidError,
  blogNotFoundError,
  invalidBlogLocaleError,
  invalidBlogQueryError,
  invalidBlogSlugError
} from "./blog.errors.js";
import { mapBlogDetailResponse, mapBlogListResponse } from "./blog.mapper.js";
import type { BlogRepository } from "./blog.repository.js";
import { prismaBlogRepository } from "./blog.repository.js";

export interface BlogService {
  getPublicBlogs(query: unknown): Promise<BlogListResponse>;
  getPublicBlogBySlug(slug: string, locale: unknown): Promise<BlogDetailResponse>;
}

export function createBlogService(repository: BlogRepository = prismaBlogRepository): BlogService {
  return {
    async getPublicBlogs(query) {
      const parsed = parseListQuery(query);
      const payload = await repository.findPublishedBlogsByLocale(parsed.locale, parsed.page, parsed.limit);

      if (payload.items.some((item) => !item.publishedAt || !item.translation.title)) {
        throw blogDataInvalidError();
      }

      return mapBlogListResponse(payload.items, parsed.page, parsed.limit, payload.total);
    },

    async getPublicBlogBySlug(slug, locale) {
      const parsedSlug = parseSlug(slug);
      const parsedLocale = parseLocale(locale);
      const post = await repository.findPublishedBlogBySlug(parsedSlug, parsedLocale);

      if (!post) {
        throw blogNotFoundError();
      }

      return mapBlogDetailResponse(post);
    }
  };
}

function parseListQuery(query: unknown): { locale: SupportedLocale; page: number; limit: number } {
  try {
    return blogListQuerySchema.parse(query);
  } catch (error) {
    if (error instanceof ZodError) {
      const localeIssue = error.issues.find((issue) => issue.path[0] === "locale");
      throw localeIssue ? invalidBlogLocaleError() : invalidBlogQueryError();
    }

    throw error;
  }
}

function parseSlug(slug: string): string {
  try {
    return blogSlugParamSchema.parse({ slug }).slug;
  } catch (error) {
    if (error instanceof ZodError) {
      throw invalidBlogSlugError();
    }

    throw error;
  }
}

function parseLocale(locale: unknown): SupportedLocale {
  try {
    const value = Array.isArray(locale) ? locale[0] : locale;
    return localeSchema.parse(value);
  } catch (error) {
    if (error instanceof ZodError) {
      throw invalidBlogLocaleError();
    }

    throw error;
  }
}
