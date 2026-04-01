import type { SupportedLocale } from "@thai-lottery-checker/types";
import { prisma } from "../../db/client.js";

export interface BlogRepositoryListItem {
  slug: string;
  bannerImageUrl: string | null;
  publishedAt: Date;
  translation: {
    title: string;
    excerpt: string | null;
  };
}

export interface BlogRepositoryListPayload {
  items: BlogRepositoryListItem[];
  total: number;
}

export interface BlogRepositoryDetail {
  slug: string;
  bannerImageUrl: string | null;
  publishedAt: Date;
  translation: {
    locale: SupportedLocale;
    title: string;
    body: unknown;
    excerpt: string | null;
    seoTitle: string | null;
    seoDescription: string | null;
  };
}

export interface BlogRepository {
  findPublishedBlogsByLocale(locale: SupportedLocale, page: number, limit: number): Promise<BlogRepositoryListPayload>;
  findPublishedBlogBySlug(slug: string, locale: SupportedLocale): Promise<BlogRepositoryDetail | null>;
}

export const prismaBlogRepository: BlogRepository = {
  async findPublishedBlogsByLocale(locale, page, limit) {
    const skip = (page - 1) * limit;
    const [posts, total] = await prisma.$transaction([
      prisma.blogPost.findMany({
        where: {
          status: "published",
          publishedAt: { not: null },
          translations: {
            some: { locale }
          }
        },
        orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
        skip,
        take: limit,
        select: {
          slug: true,
          bannerImageUrl: true,
          publishedAt: true,
          translations: {
            where: { locale },
            take: 1,
            select: {
              title: true,
              excerpt: true
            }
          }
        }
      }),
      prisma.blogPost.count({
        where: {
          status: "published",
          publishedAt: { not: null },
          translations: {
            some: { locale }
          }
        }
      })
    ]);

    return {
      items: posts.flatMap((post) => {
        const translation = post.translations[0];

        if (!post.publishedAt || !translation) {
          return [];
        }

        return {
          slug: post.slug,
          bannerImageUrl: post.bannerImageUrl,
          publishedAt: post.publishedAt,
          translation
        };
      }),
      total
    };
  },

  async findPublishedBlogBySlug(slug, locale) {
    const post = await prisma.blogPost.findFirst({
      where: {
        slug,
        status: "published",
        publishedAt: { not: null },
        translations: {
          some: { locale }
        }
      },
      select: {
        slug: true,
        bannerImageUrl: true,
        publishedAt: true,
        translations: {
          where: { locale },
          take: 1,
          select: {
            locale: true,
            title: true,
            body: true,
            excerpt: true,
            seoTitle: true,
            seoDescription: true
          }
        }
      }
    });

    const translation = post?.translations[0];

    if (!post?.publishedAt || !translation) {
      return null;
    }

    return {
      slug: post.slug,
      bannerImageUrl: post.bannerImageUrl,
      publishedAt: post.publishedAt,
      translation: {
        locale: translation.locale,
        title: translation.title,
        body: translation.body,
        excerpt: translation.excerpt,
        seoTitle: translation.seoTitle,
        seoDescription: translation.seoDescription
      }
    };
  }
};
