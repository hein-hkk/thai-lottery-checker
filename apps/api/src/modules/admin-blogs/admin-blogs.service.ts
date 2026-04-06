import { ZodError } from "zod";
import {
  adminBlogBannerCompleteRequestSchema,
  adminBlogBannerUploadInitRequestSchema,
  adminBlogListQuerySchema,
  adminBlogMetadataRequestSchema,
  adminBlogTranslationUpsertRequestSchema,
  blogBodySchema,
  localeSchema
} from "@thai-lottery-checker/schemas";
import type {
  AdminBlogBannerCompleteRequest,
  AdminBlogBannerUploadInitRequest,
  AdminBlogBannerUploadInitResponse,
  AdminBlogBannerUpdateResponse,
  AdminBlogDetailResponse,
  AdminBlogListQuery,
  AdminBlogListResponse,
  AdminBlogMetadataRequest,
  AdminBlogTranslationUpsertRequest,
  AuthenticatedAdmin,
  SupportedLocale
} from "@thai-lottery-checker/types";
import { prisma } from "../../db/client.js";
import { requireAdminPermission } from "../admin-auth/admin-auth.service.js";
import {
  adminBlogBannerUnavailableError,
  adminBlogDataInvalidError,
  adminBlogDuplicateSlugError,
  adminBlogInvalidStateError,
  adminBlogNotFoundError,
  invalidAdminBlogRequestError
} from "./admin-blogs.errors.js";
import { createBlogBannerStorage, type BlogBannerStorage } from "./admin-blog-banner-storage.js";
import { mapAdminBlogDetailResponse, mapAdminBlogListResponse } from "./admin-blogs.mapper.js";
import {
  prismaAdminBlogsRepository,
  type AdminBlogRepositoryPost,
  type AdminBlogsRepository
} from "./admin-blogs.repository.js";

const validTranslationIssue = "A valid translation must include a title and at least one paragraph";
const minimumTranslationIssue = "At least one valid translation is required";

function normalizeOptionalString(value: string | null | undefined): string | null {
  if (value === undefined || value === null) {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length === 0 ? null : trimmed;
}

function isTranslationPublishable(input: AdminBlogTranslationUpsertRequest): boolean {
  return input.title.trim().length > 0 && blogBodySchema.safeParse(input.body).success;
}

function buildAuditSnapshot(post: AdminBlogRepositoryPost) {
  return {
    slug: post.slug,
    bannerImageUrl: post.bannerImageUrl,
    status: post.status,
    publishedAt: post.publishedAt?.toISOString() ?? null,
    translations: post.translations.map((translation) => ({
      locale: translation.locale,
      title: translation.title,
      body: translation.body,
      excerpt: translation.excerpt,
      seoTitle: translation.seoTitle,
      seoDescription: translation.seoDescription
    }))
  };
}

async function createAuditLog(input: {
  adminId: string;
  action: string;
  entityId: string;
  beforeData?: unknown;
  afterData?: unknown;
}): Promise<void> {
  const beforeData = input.beforeData === undefined ? undefined : JSON.parse(JSON.stringify(input.beforeData));
  const afterData = input.afterData === undefined ? undefined : JSON.parse(JSON.stringify(input.afterData));

  await prisma.adminAuditLog.create({
    data: {
      adminId: input.adminId,
      action: input.action,
      entityType: "blog_post",
      entityId: input.entityId,
      beforeData,
      afterData
    }
  });
}

export interface AdminBlogsService {
  listBlogs(actor: AuthenticatedAdmin, query: unknown): Promise<AdminBlogListResponse>;
  getBlogDetail(actor: AuthenticatedAdmin, blogId: string): Promise<AdminBlogDetailResponse>;
  createDraft(actor: AuthenticatedAdmin, input: unknown): Promise<AdminBlogDetailResponse>;
  updateMetadata(actor: AuthenticatedAdmin, blogId: string, input: unknown): Promise<AdminBlogDetailResponse>;
  initBannerUpload(actor: AuthenticatedAdmin, blogId: string, input: unknown): Promise<AdminBlogBannerUploadInitResponse>;
  completeBannerUpload(actor: AuthenticatedAdmin, blogId: string, input: unknown): Promise<AdminBlogBannerUpdateResponse>;
  removeBanner(actor: AuthenticatedAdmin, blogId: string): Promise<AdminBlogBannerUpdateResponse>;
  upsertTranslation(actor: AuthenticatedAdmin, blogId: string, locale: unknown, input: unknown): Promise<AdminBlogDetailResponse>;
  publish(actor: AuthenticatedAdmin, blogId: string): Promise<AdminBlogDetailResponse>;
  unpublish(actor: AuthenticatedAdmin, blogId: string): Promise<AdminBlogDetailResponse>;
}

async function bestEffortDeleteManagedBanner(
  bannerStorage: BlogBannerStorage,
  postId: string,
  objectKey: string | null
): Promise<void> {
  if (!objectKey) {
    return;
  }

  try {
    await bannerStorage.deleteObject(objectKey);
  } catch (error) {
    console.error(`Failed to delete managed banner object for blog post ${postId}`, error);
  }
}

export function createAdminBlogsService(
  repository: AdminBlogsRepository = prismaAdminBlogsRepository,
  bannerStorage: BlogBannerStorage = createBlogBannerStorage()
): AdminBlogsService {
  return {
    async listBlogs(actor, query) {
      requireAdminPermission(actor, "manage_blogs");
      const parsed = parseListQuery(query);
      const posts = await repository.listAdminBlogs(parsed.status ?? "all");
      return mapAdminBlogListResponse(posts);
    },

    async getBlogDetail(actor, blogId) {
      requireAdminPermission(actor, "manage_blogs");
      const post = await repository.findBlogById(blogId);

      if (!post) {
        throw adminBlogNotFoundError();
      }

      return mapAdminBlogDetailResponse(post);
    },

    async createDraft(actor, input) {
      requireAdminPermission(actor, "manage_blogs");
      const parsed = parseMetadataRequest(input);
      const duplicate = await repository.findBlogBySlug(parsed.slug);

      if (duplicate) {
        throw adminBlogDuplicateSlugError();
      }

      const created = await repository.createDraftBlog({
        slug: parsed.slug,
        adminId: actor.id
      });

      await createAuditLog({
        adminId: actor.id,
        action: "create_blog",
        entityId: created.id,
        afterData: buildAuditSnapshot(created)
      });

      return mapAdminBlogDetailResponse(created);
    },

    async updateMetadata(actor, blogId, input) {
      requireAdminPermission(actor, "manage_blogs");
      const existing = await repository.findBlogById(blogId);

      if (!existing) {
        throw adminBlogNotFoundError();
      }

      const parsed = parseMetadataRequest(input);
      const duplicate = await repository.findBlogBySlug(parsed.slug);

      if (duplicate && duplicate.id !== existing.id) {
        throw adminBlogDuplicateSlugError();
      }

      const updated = await repository.updateBlogMetadata({
        blogId: existing.id,
        slug: parsed.slug,
        adminId: actor.id
      });

      await createAuditLog({
        adminId: actor.id,
        action: "update_blog",
        entityId: existing.id,
        beforeData: buildAuditSnapshot(existing),
        afterData: buildAuditSnapshot(updated)
      });

      return mapAdminBlogDetailResponse(updated);
    },

    async initBannerUpload(actor, blogId, input) {
      requireAdminPermission(actor, "manage_blogs");
      const existing = await repository.findBlogById(blogId);

      if (!existing) {
        throw adminBlogNotFoundError();
      }

      if (!bannerStorage.isConfigured()) {
        throw adminBlogBannerUnavailableError();
      }

      const parsed = parseBannerUploadInitRequest(input);
      return bannerStorage.createUpload({
        blogId: existing.id,
        fileName: parsed.fileName,
        contentType: parsed.contentType,
        fileSize: parsed.fileSize
      });
    },

    async completeBannerUpload(actor, blogId, input) {
      requireAdminPermission(actor, "manage_blogs");
      const existing = await repository.findBlogById(blogId);

      if (!existing) {
        throw adminBlogNotFoundError();
      }

      if (!bannerStorage.isConfigured()) {
        throw adminBlogBannerUnavailableError();
      }

      const parsed = parseBannerCompleteRequest(input);

      if (!bannerStorage.isBlogObjectKey(existing.id, parsed.objectKey)) {
        throw adminBlogDataInvalidError("Uploaded banner object key is invalid");
      }

      const objectExists = await bannerStorage.objectExists(parsed.objectKey);

      if (!objectExists) {
        throw adminBlogDataInvalidError("Uploaded banner object was not found");
      }

      const previousManagedObjectKey = bannerStorage.getManagedObjectKeyFromUrl(existing.bannerImageUrl);
      const updated = await repository.updateBlogBannerImage({
        blogId: existing.id,
        bannerImageUrl: bannerStorage.getPublicUrl(parsed.objectKey),
        adminId: actor.id
      });

      await createAuditLog({
        adminId: actor.id,
        action: "update_blog",
        entityId: existing.id,
        beforeData: buildAuditSnapshot(existing),
        afterData: buildAuditSnapshot(updated)
      });

      if (previousManagedObjectKey && previousManagedObjectKey !== parsed.objectKey) {
        await bestEffortDeleteManagedBanner(bannerStorage, existing.id, previousManagedObjectKey);
      }

      return mapAdminBlogDetailResponse(updated);
    },

    async removeBanner(actor, blogId) {
      requireAdminPermission(actor, "manage_blogs");
      const existing = await repository.findBlogById(blogId);

      if (!existing) {
        throw adminBlogNotFoundError();
      }

      if (existing.bannerImageUrl === null) {
        return mapAdminBlogDetailResponse(existing);
      }

      const previousManagedObjectKey = bannerStorage.getManagedObjectKeyFromUrl(existing.bannerImageUrl);
      const updated = await repository.updateBlogBannerImage({
        blogId: existing.id,
        bannerImageUrl: null,
        adminId: actor.id
      });

      await createAuditLog({
        adminId: actor.id,
        action: "update_blog",
        entityId: existing.id,
        beforeData: buildAuditSnapshot(existing),
        afterData: buildAuditSnapshot(updated)
      });

      await bestEffortDeleteManagedBanner(bannerStorage, existing.id, previousManagedObjectKey);

      return mapAdminBlogDetailResponse(updated);
    },

    async upsertTranslation(actor, blogId, locale, input) {
      requireAdminPermission(actor, "manage_blogs");
      const existing = await repository.findBlogById(blogId);

      if (!existing) {
        throw adminBlogNotFoundError();
      }

      const parsedLocale = parseLocale(locale);
      const parsed = parseTranslationRequest(input);
      const updated = await repository.upsertBlogTranslation({
        blogId: existing.id,
        locale: parsedLocale,
        title: parsed.title,
        body: parsed.body,
        excerpt: normalizeOptionalString(parsed.excerpt),
        seoTitle: normalizeOptionalString(parsed.seoTitle),
        seoDescription: normalizeOptionalString(parsed.seoDescription),
        adminId: actor.id
      });

      await createAuditLog({
        adminId: actor.id,
        action: "update_blog",
        entityId: existing.id,
        beforeData: buildAuditSnapshot(existing),
        afterData: buildAuditSnapshot(updated)
      });

      return mapAdminBlogDetailResponse(updated);
    },

    async publish(actor, blogId) {
      requireAdminPermission(actor, "manage_blogs");
      const existing = await repository.findBlogById(blogId);

      if (!existing) {
        throw adminBlogNotFoundError();
      }

      if (existing.status !== "draft") {
        throw adminBlogInvalidStateError("Only draft blog posts can be published");
      }

      const publishableTranslations = existing.translations.filter((translation) =>
        isTranslationPublishable({
          title: translation.title,
          body: blogBodySchema.safeParse(translation.body).success ? blogBodySchema.parse(translation.body) : [],
          excerpt: translation.excerpt,
          seoTitle: translation.seoTitle,
          seoDescription: translation.seoDescription
        })
      );

      if (publishableTranslations.length === 0) {
        throw adminBlogDataInvalidError(`${minimumTranslationIssue}. ${validTranslationIssue}`);
      }

      const publishedAt = existing.publishedAt ?? new Date();
      const published = await repository.publishBlog(existing.id, actor.id, publishedAt);

      await createAuditLog({
        adminId: actor.id,
        action: "publish_blog",
        entityId: existing.id,
        beforeData: buildAuditSnapshot(existing),
        afterData: buildAuditSnapshot(published)
      });

      return mapAdminBlogDetailResponse(published);
    },

    async unpublish(actor, blogId) {
      requireAdminPermission(actor, "manage_blogs");
      const existing = await repository.findBlogById(blogId);

      if (!existing) {
        throw adminBlogNotFoundError();
      }

      if (existing.status !== "published") {
        throw adminBlogInvalidStateError("Only published blog posts can be unpublished");
      }

      const unpublished = await repository.unpublishBlog(existing.id, actor.id);

      await createAuditLog({
        adminId: actor.id,
        action: "unpublish_blog",
        entityId: existing.id,
        beforeData: buildAuditSnapshot(existing),
        afterData: buildAuditSnapshot(unpublished)
      });

      return mapAdminBlogDetailResponse(unpublished);
    }
  };
}

function parseListQuery(input: unknown): AdminBlogListQuery {
  try {
    return adminBlogListQuerySchema.parse(input);
  } catch (error) {
    if (error instanceof ZodError) {
      throw invalidAdminBlogRequestError("Admin blog list query is invalid");
    }

    throw error;
  }
}

function parseMetadataRequest(input: unknown): AdminBlogMetadataRequest {
  try {
    return adminBlogMetadataRequestSchema.parse(input);
  } catch (error) {
    if (error instanceof ZodError) {
      throw invalidAdminBlogRequestError("Admin blog metadata request is invalid");
    }

    throw error;
  }
}

function parseTranslationRequest(input: unknown): AdminBlogTranslationUpsertRequest {
  try {
    return adminBlogTranslationUpsertRequestSchema.parse(input);
  } catch (error) {
    if (error instanceof ZodError) {
      throw invalidAdminBlogRequestError("Admin blog translation request is invalid");
    }

    throw error;
  }
}

function parseBannerUploadInitRequest(input: unknown): AdminBlogBannerUploadInitRequest {
  try {
    return adminBlogBannerUploadInitRequestSchema.parse(input);
  } catch (error) {
    if (error instanceof ZodError) {
      throw invalidAdminBlogRequestError("Admin blog banner upload request is invalid");
    }

    throw error;
  }
}

function parseBannerCompleteRequest(input: unknown): AdminBlogBannerCompleteRequest {
  try {
    return adminBlogBannerCompleteRequestSchema.parse(input);
  } catch (error) {
    if (error instanceof ZodError) {
      throw invalidAdminBlogRequestError("Admin blog banner completion request is invalid");
    }

    throw error;
  }
}

function parseLocale(input: unknown): SupportedLocale {
  try {
    const value = Array.isArray(input) ? input[0] : input;
    return localeSchema.parse(value);
  } catch (error) {
    if (error instanceof ZodError) {
      throw invalidAdminBlogRequestError("Blog locale is invalid");
    }

    throw error;
  }
}
