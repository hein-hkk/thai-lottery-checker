import { blogBodySchema } from "@thai-lottery-checker/schemas";
import type { BlogDetailResponse, BlogListItem, BlogListResponse } from "@thai-lottery-checker/types";
import { formatIsoTimestamp } from "@thai-lottery-checker/utils";
import { blogDataInvalidError } from "./blog.errors.js";
import type { BlogRepositoryDetail, BlogRepositoryListItem } from "./blog.repository.js";

export function mapBlogListItem(item: BlogRepositoryListItem): BlogListItem {
  return {
    slug: item.slug,
    title: item.translation.title,
    excerpt: item.translation.excerpt,
    bannerImageUrl: item.bannerImageUrl,
    publishedAt: formatIsoTimestamp(item.publishedAt)
  };
}

export function mapBlogListResponse(items: readonly BlogRepositoryListItem[], page: number, limit: number, total: number): BlogListResponse {
  return {
    items: items.map(mapBlogListItem),
    page,
    limit,
    total
  };
}

export function mapBlogDetailResponse(post: BlogRepositoryDetail): BlogDetailResponse {
  const body = blogBodySchema.safeParse(post.translation.body);

  if (!body.success) {
    throw blogDataInvalidError();
  }

  return {
    slug: post.slug,
    bannerImageUrl: post.bannerImageUrl,
    publishedAt: formatIsoTimestamp(post.publishedAt),
    translation: {
      locale: post.translation.locale,
      title: post.translation.title,
      body: body.data,
      excerpt: post.translation.excerpt,
      seoTitle: post.translation.seoTitle,
      seoDescription: post.translation.seoDescription
    }
  };
}
