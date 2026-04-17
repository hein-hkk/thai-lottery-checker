import { blogBodySchema } from "@thai-lottery-checker/schemas";
import type {
  AdminBlogDetailResponse,
  AdminBlogListItem,
  AdminBlogListResponse,
  AdminBlogPublishReadiness,
  BlogBodyBlock,
  SupportedLocale
} from "@thai-lottery-checker/types";
import { formatIsoTimestamp } from "@thai-lottery-checker/utils";
import type {
  AdminBlogRepositoryListPost,
  AdminBlogRepositoryPost,
  AdminBlogRepositoryTranslation
} from "./admin-blogs.repository.js";

const localePriority: SupportedLocale[] = ["en", "th", "my"];

function getAvailableLocales(post: AdminBlogRepositoryListPost | AdminBlogRepositoryPost): SupportedLocale[] {
  return localePriority.filter((locale) => post.translations.some((translation) => translation.locale === locale));
}

function getDisplayTitle(post: AdminBlogRepositoryListPost | AdminBlogRepositoryPost): string {
  for (const locale of localePriority) {
    const translation = post.translations.find((item) => item.locale === locale);
    const title = translation?.title.trim();

    if (title) {
      return title;
    }
  }

  return post.slug;
}

function parseBody(body: unknown): BlogBodyBlock[] {
  const parsed = blogBodySchema.safeParse(body);
  return parsed.success ? parsed.data : [];
}

function isTranslationValid(translation: AdminBlogRepositoryTranslation): boolean {
  return translation.title.trim().length > 0 && parseBody(translation.body).length > 0;
}

function buildPublishReadiness(post: AdminBlogRepositoryPost): AdminBlogPublishReadiness {
  const issues: string[] = [];

  if (post.slug.trim().length === 0) {
    issues.push("Slug is required");
  }

  const hasValidTranslation = post.translations.some(isTranslationValid);

  if (!hasValidTranslation) {
    issues.push("At least one valid translation is required");
    issues.push("A valid translation must include a title and at least one paragraph");
  }

  return {
    isPublishable: issues.length === 0,
    issues
  };
}

export function mapAdminBlogListItem(post: AdminBlogRepositoryListPost): AdminBlogListItem {
  return {
    id: post.id,
    slug: post.slug,
    displayTitle: getDisplayTitle(post),
    status: post.status,
    publishedAt: post.publishedAt ? formatIsoTimestamp(post.publishedAt) : null,
    updatedAt: formatIsoTimestamp(post.updatedAt),
    createdAt: formatIsoTimestamp(post.createdAt),
    availableLocales: getAvailableLocales(post)
  };
}

export function mapAdminBlogListResponse(
  posts: readonly AdminBlogRepositoryListPost[],
  page: number,
  limit: number,
  total: number
): AdminBlogListResponse {
  return {
    items: posts.map(mapAdminBlogListItem),
    page,
    limit,
    total
  };
}

export function mapAdminBlogDetailResponse(post: AdminBlogRepositoryPost): AdminBlogDetailResponse {
  const translationsByLocale = new Map(post.translations.map((translation) => [translation.locale, translation]));

  return {
    post: {
      id: post.id,
      slug: post.slug,
      bannerImageUrl: post.bannerImageUrl,
      status: post.status,
      publishedAt: post.publishedAt ? formatIsoTimestamp(post.publishedAt) : null,
      createdAt: formatIsoTimestamp(post.createdAt),
      updatedAt: formatIsoTimestamp(post.updatedAt),
      availableLocales: getAvailableLocales(post),
      translations: localePriority.map((locale) => {
        const translation = translationsByLocale.get(locale);

        return {
          locale,
          title: translation?.title ?? "",
          body: translation ? parseBody(translation.body) : [],
          excerpt: translation?.excerpt ?? null,
          seoTitle: translation?.seoTitle ?? null,
          seoDescription: translation?.seoDescription ?? null,
          updatedAt: translation ? formatIsoTimestamp(translation.updatedAt) : null
        };
      }),
      publishReadiness: buildPublishReadiness(post)
    }
  };
}
