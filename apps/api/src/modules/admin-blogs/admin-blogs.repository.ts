import type { AdminBlogStatusFilter, PublishStatus, SupportedLocale } from "@thai-lottery-checker/types";
import type { BlogBodyBlockSchema } from "@thai-lottery-checker/schemas";
import { prisma } from "../../db/client.js";
import type { Prisma } from "../../generated/prisma/client.js";

type BlogBodyInput = BlogBodyBlockSchema[];

export interface AdminBlogRepositoryTranslation {
  locale: SupportedLocale;
  title: string;
  body: unknown;
  excerpt: string | null;
  seoTitle: string | null;
  seoDescription: string | null;
  updatedAt: Date;
}

export interface AdminBlogRepositoryListTranslation {
  locale: SupportedLocale;
  title: string;
}

export interface AdminBlogRepositoryPost {
  id: string;
  slug: string;
  bannerImageUrl: string | null;
  status: PublishStatus;
  publishedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  updatedByAdminId: string;
  translations: AdminBlogRepositoryTranslation[];
}

export interface AdminBlogRepositoryListPost {
  id: string;
  slug: string;
  status: PublishStatus;
  publishedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  translations: AdminBlogRepositoryListTranslation[];
}

export interface CreateAdminBlogInput {
  slug: string;
  adminId: string;
}

export interface UpdateAdminBlogMetadataInput {
  blogId: string;
  slug: string;
  adminId: string;
}

export interface UpdateAdminBlogBannerImageInput {
  blogId: string;
  bannerImageUrl: string | null;
  adminId: string;
}

export interface UpsertAdminBlogTranslationInput {
  blogId: string;
  locale: SupportedLocale;
  title: string;
  body: BlogBodyInput;
  excerpt: string | null;
  seoTitle: string | null;
  seoDescription: string | null;
  adminId: string;
}

export interface AdminBlogListPayload {
  items: AdminBlogRepositoryListPost[];
  total: number;
}

export interface AdminBlogsRepository {
  listAdminBlogs(status: AdminBlogStatusFilter, page: number, limit: number): Promise<AdminBlogListPayload>;
  findBlogById(blogId: string): Promise<AdminBlogRepositoryPost | null>;
  findBlogBySlug(slug: string): Promise<Pick<AdminBlogRepositoryPost, "id"> | null>;
  createDraftBlog(input: CreateAdminBlogInput): Promise<AdminBlogRepositoryPost>;
  updateBlogMetadata(input: UpdateAdminBlogMetadataInput): Promise<AdminBlogRepositoryPost>;
  updateBlogBannerImage(input: UpdateAdminBlogBannerImageInput): Promise<AdminBlogRepositoryPost>;
  upsertBlogTranslation(input: UpsertAdminBlogTranslationInput): Promise<AdminBlogRepositoryPost>;
  publishBlog(blogId: string, adminId: string, publishedAt: Date): Promise<AdminBlogRepositoryPost>;
  unpublishBlog(blogId: string, adminId: string): Promise<AdminBlogRepositoryPost>;
}

function listPostSelect(): Prisma.BlogPostSelect {
  return {
    id: true,
    slug: true,
    status: true,
    publishedAt: true,
    createdAt: true,
    updatedAt: true,
    translations: {
      orderBy: [{ locale: "asc" }],
      select: {
        locale: true,
        title: true
      }
    }
  };
}

function postSelect(): Prisma.BlogPostSelect {
  return {
    id: true,
    slug: true,
    bannerImageUrl: true,
    status: true,
    publishedAt: true,
    createdAt: true,
    updatedAt: true,
    updatedByAdminId: true,
    translations: {
      orderBy: [{ locale: "asc" }],
      select: {
        locale: true,
        title: true,
        body: true,
        excerpt: true,
        seoTitle: true,
        seoDescription: true,
        updatedAt: true
      }
    }
  };
}

async function findBlogWithTranslations(blogId: string): Promise<AdminBlogRepositoryPost> {
  return prisma.blogPost.findUniqueOrThrow({
    where: { id: blogId },
    select: postSelect()
  });
}

export const prismaAdminBlogsRepository: AdminBlogsRepository = {
  async listAdminBlogs(status, page, limit) {
    const skip = (page - 1) * limit;
    const where = status === "all" ? undefined : { status };
    const [items, total] = await prisma.$transaction([
      prisma.blogPost.findMany({
        where,
        orderBy: [{ updatedAt: "desc" }, { id: "desc" }],
        skip,
        take: limit,
        select: listPostSelect()
      }),
      prisma.blogPost.count({
        where
      })
    ]);

    return {
      items,
      total
    };
  },

  async findBlogById(blogId) {
    return prisma.blogPost.findUnique({
      where: { id: blogId },
      select: postSelect()
    });
  },

  async findBlogBySlug(slug) {
    return prisma.blogPost.findUnique({
      where: { slug },
      select: {
        id: true
      }
    });
  },

  async createDraftBlog(input) {
    const created = await prisma.blogPost.create({
      data: {
        slug: input.slug,
        status: "draft",
        publishedAt: null,
        createdByAdminId: input.adminId,
        updatedByAdminId: input.adminId
      },
      select: {
        id: true
      }
    });

    return findBlogWithTranslations(created.id);
  },

  async updateBlogMetadata(input) {
    await prisma.blogPost.update({
      where: { id: input.blogId },
      data: {
        slug: input.slug,
        updatedByAdminId: input.adminId
      }
    });

    return findBlogWithTranslations(input.blogId);
  },

  async updateBlogBannerImage(input) {
    await prisma.blogPost.update({
      where: { id: input.blogId },
      data: {
        bannerImageUrl: input.bannerImageUrl,
        updatedByAdminId: input.adminId
      }
    });

    return findBlogWithTranslations(input.blogId);
  },

  async upsertBlogTranslation(input) {
    await prisma.$transaction(async (tx) => {
      await tx.blogPostTranslation.upsert({
        where: {
          blogPostId_locale: {
            blogPostId: input.blogId,
            locale: input.locale
          }
        },
        update: {
          title: input.title,
          body: input.body,
          excerpt: input.excerpt,
          seoTitle: input.seoTitle,
          seoDescription: input.seoDescription
        },
        create: {
          blogPostId: input.blogId,
          locale: input.locale,
          title: input.title,
          body: input.body,
          excerpt: input.excerpt,
          seoTitle: input.seoTitle,
          seoDescription: input.seoDescription
        }
      });

      await tx.blogPost.update({
        where: { id: input.blogId },
        data: {
          updatedByAdminId: input.adminId
        }
      });
    });

    return findBlogWithTranslations(input.blogId);
  },

  async publishBlog(blogId, adminId, publishedAt) {
    await prisma.blogPost.update({
      where: { id: blogId },
      data: {
        status: "published",
        publishedAt,
        updatedByAdminId: adminId
      }
    });

    return findBlogWithTranslations(blogId);
  },

  async unpublishBlog(blogId, adminId) {
    await prisma.blogPost.update({
      where: { id: blogId },
      data: {
        status: "draft",
        publishedAt: null,
        updatedByAdminId: adminId
      }
    });

    return findBlogWithTranslations(blogId);
  }
};
