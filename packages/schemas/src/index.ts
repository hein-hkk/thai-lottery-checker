import { z } from "zod";

export const localeSchema = z.enum(["en", "th", "my"]);
export const adminRoleSchema = z.enum(["super_admin", "editor"]);
export const adminPermissionSchema = z.enum(["manage_results", "manage_blogs"]);
export const publishStatusSchema = z.enum(["draft", "published"]);
export const checkerStatusSchema = z.enum(["complete", "partial"]);
export const checkerMatchKindSchema = z.enum(["exact", "front3", "last3", "last2"]);

export type LocaleSchema = z.infer<typeof localeSchema>;

const drawDatePattern = /^\d{4}-\d{2}-\d{2}$/;
const prizeTypes = [
  "FIRST_PRIZE",
  "NEAR_FIRST_PRIZE",
  "SECOND_PRIZE",
  "THIRD_PRIZE",
  "FOURTH_PRIZE",
  "FIFTH_PRIZE",
  "FRONT_THREE",
  "LAST_THREE",
  "LAST_TWO"
] as const;

export const prizeTypeSchema = z.enum(prizeTypes);

export const adminSessionPayloadSchema = z.object({
  adminId: z.string().uuid(),
  email: z.string().email(),
  role: adminRoleSchema,
  passwordUpdatedAt: z.string().datetime({ offset: true }).nullable()
});

export const authenticatedAdminSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  name: z.string().nullable(),
  role: adminRoleSchema,
  effectivePermissions: z.array(adminPermissionSchema)
});

export const adminLoginRequestSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(1)
});

export const adminAuthResponseSchema = z.object({
  admin: authenticatedAdminSchema
});

export const adminInvitationCreateRequestSchema = z.object({
  email: z.string().trim().email(),
  role: adminRoleSchema,
  permissions: z.array(adminPermissionSchema).default([])
});

export const adminInvitationCreateResponseSchema = z.object({
  invitationId: z.string().uuid(),
  email: z.string().email(),
  role: adminRoleSchema,
  permissions: z.array(adminPermissionSchema),
  expiresAt: z.string().datetime({ offset: true }),
  inviteUrl: z.string().url().optional()
});

export const adminInvitationAcceptRequestSchema = z.object({
  token: z.string().min(1),
  name: z.string().trim().min(1),
  password: z.string().min(8)
});

export const adminInvitationAcceptResponseSchema = z.object({
  success: z.literal(true)
});

export const adminInvitationRevokeRequestSchema = z.object({
  invitationId: z.string().uuid()
});

export const adminInvitationRevokeResponseSchema = z.object({
  success: z.literal(true)
});

export const adminPasswordResetRequestSchema = z.object({
  email: z.string().trim().email()
});

export const adminPasswordResetRequestResponseSchema = z.object({
  success: z.literal(true),
  resetUrl: z.string().url().optional()
});

export const adminPasswordResetConfirmRequestSchema = z.object({
  token: z.string().min(1),
  password: z.string().min(8)
});

export const adminPasswordResetConfirmResponseSchema = z.object({
  success: z.literal(true)
});

export const adminListItemSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  name: z.string().nullable(),
  role: adminRoleSchema,
  isActive: z.boolean(),
  deactivatedAt: z.string().datetime({ offset: true }).nullable(),
  lastLoginAt: z.string().datetime({ offset: true }).nullable(),
  createdAt: z.string().datetime({ offset: true }),
  permissions: z.array(adminPermissionSchema)
});

export const adminListResponseSchema = z.object({
  items: z.array(adminListItemSchema)
});

export const adminUpdateRequestSchema = z
  .object({
    role: adminRoleSchema.optional(),
    permissions: z.array(adminPermissionSchema).optional(),
    isActive: z.boolean().optional()
  })
  .refine((payload) => Object.keys(payload).length > 0, {
    message: "At least one field must be updated"
  });

export const adminUpdateResponseSchema = z.object({
  admin: adminListItemSchema
});

export const drawDateParamSchema = z.object({
  drawDate: z.string().regex(drawDatePattern, "drawDate must use YYYY-MM-DD format")
});

export const historyQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20)
});

export const checkerCheckRequestSchema = z.object({
  ticketNumber: z.string().regex(/^\d{6}$/, "ticketNumber must use exactly 6 digits"),
  drawDate: z.string().regex(drawDatePattern, "drawDate must use YYYY-MM-DD format").optional()
});

export const prizeGroupSchema = z.object({
  type: prizeTypeSchema,
  numbers: z.array(z.string()),
  isReleased: z.boolean()
});

export const prizeGroupInputSchema = z.object({
  type: prizeTypeSchema,
  numbers: z.array(z.string())
});

export const resultDetailResponseSchema = z.object({
  drawDate: z.string().regex(drawDatePattern),
  drawCode: z.string().nullable(),
  publishedAt: z.string().datetime({ offset: true }).nullable(),
  prizeGroups: z.array(prizeGroupSchema)
});

export const resultHistoryItemSchema = z.object({
  drawDate: z.string().regex(drawDatePattern),
  drawCode: z.string().nullable(),
  firstPrize: z.string(),
  frontThree: z.array(z.string()).optional().default([]),
  lastThree: z.array(z.string()).optional().default([]),
  lastTwo: z.string()
});

export const resultHistoryResponseSchema = z.object({
  items: z.array(resultHistoryItemSchema),
  page: z.number().int().min(1),
  limit: z.number().int().min(1).max(50),
  total: z.number().int().min(0)
});

export const checkerDrawOptionSchema = z.object({
  drawDate: z.string().regex(drawDatePattern),
  drawCode: z.string().nullable(),
  drawStatus: publishStatusSchema
});

export const checkerDrawOptionsResponseSchema = z.object({
  items: z.array(checkerDrawOptionSchema)
});

export const blogParagraphBlockSchema = z.object({
  type: z.literal("paragraph"),
  text: z.string().trim().min(1)
});

export const blogBodyBlockSchema = blogParagraphBlockSchema;

export const blogBodySchema = z.array(blogBodyBlockSchema).min(1);

export const blogListQuerySchema = z.object({
  locale: localeSchema,
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(12)
});

export const blogSlugParamSchema = z.object({
  slug: z.string().trim().min(1)
});

export const blogListItemSchema = z.object({
  slug: z.string().min(1),
  title: z.string().min(1),
  excerpt: z.string().nullable(),
  bannerImageUrl: z.string().url().nullable(),
  publishedAt: z.string().datetime({ offset: true })
});

export const blogListResponseSchema = z.object({
  items: z.array(blogListItemSchema),
  page: z.number().int().min(1),
  limit: z.number().int().min(1).max(50),
  total: z.number().int().min(0)
});

export const blogTranslationSchema = z.object({
  locale: localeSchema,
  title: z.string().min(1),
  body: blogBodySchema,
  excerpt: z.string().nullable(),
  seoTitle: z.string().nullable(),
  seoDescription: z.string().nullable()
});

export const blogDetailResponseSchema = z.object({
  slug: z.string().min(1),
  bannerImageUrl: z.string().url().nullable(),
  publishedAt: z.string().datetime({ offset: true }),
  translation: blogTranslationSchema
});

export const adminBlogStatusFilterSchema = z.enum(["draft", "published", "all"]);

export const adminBlogListQuerySchema = z.object({
  status: adminBlogStatusFilterSchema.default("all"),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(5)
});

export const adminBlogListItemSchema = z.object({
  id: z.string().uuid(),
  slug: z.string().min(1),
  displayTitle: z.string().min(1),
  status: publishStatusSchema,
  publishedAt: z.string().datetime({ offset: true }).nullable(),
  updatedAt: z.string().datetime({ offset: true }),
  createdAt: z.string().datetime({ offset: true }),
  availableLocales: z.array(localeSchema)
});

export const adminBlogListResponseSchema = z.object({
  items: z.array(adminBlogListItemSchema),
  page: z.number().int().min(1),
  limit: z.number().int().min(1).max(50),
  total: z.number().int().min(0)
});

export const adminBlogTranslationDraftSchema = z.object({
  locale: localeSchema,
  title: z.string(),
  body: z.array(blogBodyBlockSchema),
  excerpt: z.string().nullable(),
  seoTitle: z.string().nullable(),
  seoDescription: z.string().nullable(),
  updatedAt: z.string().datetime({ offset: true }).nullable()
});

export const adminBlogPublishReadinessSchema = z.object({
  isPublishable: z.boolean(),
  issues: z.array(z.string())
});

export const adminBlogDetailSchema = z.object({
  id: z.string().uuid(),
  slug: z.string().min(1),
  bannerImageUrl: z.string().url().nullable(),
  status: publishStatusSchema,
  publishedAt: z.string().datetime({ offset: true }).nullable(),
  createdAt: z.string().datetime({ offset: true }),
  updatedAt: z.string().datetime({ offset: true }),
  availableLocales: z.array(localeSchema),
  translations: z.array(adminBlogTranslationDraftSchema).length(3),
  publishReadiness: adminBlogPublishReadinessSchema
});

export const adminBlogDetailResponseSchema = z.object({
  post: adminBlogDetailSchema
});

export const adminBlogMetadataRequestSchema = z.object({
  slug: z.string().trim().min(1)
});

export const adminBlogTranslationUpsertRequestSchema = z.object({
  title: z.string().trim(),
  body: z.array(blogBodyBlockSchema),
  excerpt: z.string().trim().nullable().optional(),
  seoTitle: z.string().trim().nullable().optional(),
  seoDescription: z.string().trim().nullable().optional()
});

export const adminBlogPublishResponseSchema = z.object({
  post: adminBlogDetailSchema
});

export const adminBlogUnpublishResponseSchema = z.object({
  post: adminBlogDetailSchema
});

export const adminBlogBannerUploadContentTypeSchema = z.enum(["image/jpeg", "image/png", "image/webp"]);

export const adminBlogBannerUploadInitRequestSchema = z.object({
  fileName: z.string().trim().min(1),
  contentType: adminBlogBannerUploadContentTypeSchema,
  fileSize: z.coerce.number().int().positive().max(5 * 1024 * 1024)
});

export const adminBlogBannerUploadInitResponseSchema = z.object({
  uploadUrl: z.string().url(),
  fields: z.record(z.string()),
  objectKey: z.string().min(1),
  publicUrl: z.string().url(),
  expiresAt: z.string().datetime({ offset: true })
});

export const adminBlogBannerCompleteRequestSchema = z.object({
  objectKey: z.string().trim().min(1)
});

export const adminBlogBannerUpdateResponseSchema = z.object({
  post: adminBlogDetailSchema
});

export const checkerMatchSchema = z.object({
  prizeType: prizeTypeSchema,
  prizeAmount: z.number().int().nonnegative(),
  matchedNumber: z.string(),
  matchKind: checkerMatchKindSchema
});

export const checkerCheckResponseSchema = z.object({
  ticketNumber: z.string().regex(/^\d{6}$/),
  drawDate: z.string().regex(drawDatePattern),
  drawCode: z.string().nullable(),
  drawStatus: publishStatusSchema,
  checkStatus: checkerStatusSchema,
  isWinner: z.boolean(),
  matches: z.array(checkerMatchSchema),
  totalWinningAmount: z.number().int().nonnegative(),
  checkedPrizeTypes: z.array(prizeTypeSchema),
  uncheckedPrizeTypes: z.array(prizeTypeSchema)
});

export const adminResultListItemSchema = z.object({
  id: z.string().uuid(),
  drawDate: z.string().regex(drawDatePattern),
  drawCode: z.string().nullable(),
  status: publishStatusSchema,
  publishedAt: z.string().datetime({ offset: true }).nullable(),
  updatedAt: z.string().datetime({ offset: true })
});

export const adminResultListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(5)
});

export const adminResultListResponseSchema = z.object({
  items: z.array(adminResultListItemSchema),
  page: z.number().int().min(1),
  limit: z.number().int().min(1).max(50),
  total: z.number().int().min(0)
});

export const adminResultDetailSchema = z.object({
  id: z.string().uuid(),
  drawDate: z.string().regex(drawDatePattern),
  drawCode: z.string().nullable(),
  status: publishStatusSchema,
  publishedAt: z.string().datetime({ offset: true }).nullable(),
  updatedAt: z.string().datetime({ offset: true }),
  prizeGroups: z.array(prizeGroupSchema)
});

export const adminResultDetailResponseSchema = z.object({
  result: adminResultDetailSchema
});

export const adminResultWriteRequestSchema = z.object({
  drawDate: z.string().regex(drawDatePattern),
  drawCode: z.string().trim().min(1).nullable().optional(),
  prizeGroups: z.array(prizeGroupInputSchema)
});

export const adminResultPublishResponseSchema = z.object({
  result: adminResultDetailSchema
});

export type AdminRoleSchema = z.infer<typeof adminRoleSchema>;
export type AdminPermissionSchema = z.infer<typeof adminPermissionSchema>;
export type PublishStatusSchema = z.infer<typeof publishStatusSchema>;
export type CheckerStatusSchema = z.infer<typeof checkerStatusSchema>;
export type CheckerMatchKindSchema = z.infer<typeof checkerMatchKindSchema>;
export type BlogParagraphBlockSchema = z.infer<typeof blogParagraphBlockSchema>;
export type BlogBodyBlockSchema = z.infer<typeof blogBodyBlockSchema>;
export type BlogBodySchema = z.infer<typeof blogBodySchema>;
export type BlogListQuerySchema = z.infer<typeof blogListQuerySchema>;
export type BlogSlugParamSchema = z.infer<typeof blogSlugParamSchema>;
export type BlogListItemSchema = z.infer<typeof blogListItemSchema>;
export type BlogListResponseSchema = z.infer<typeof blogListResponseSchema>;
export type BlogTranslationSchema = z.infer<typeof blogTranslationSchema>;
export type BlogDetailResponseSchema = z.infer<typeof blogDetailResponseSchema>;
export type AdminBlogStatusFilterSchema = z.infer<typeof adminBlogStatusFilterSchema>;
export type AdminBlogListQuerySchema = z.infer<typeof adminBlogListQuerySchema>;
export type AdminBlogListItemSchema = z.infer<typeof adminBlogListItemSchema>;
export type AdminBlogListResponseSchema = z.infer<typeof adminBlogListResponseSchema>;
export type AdminBlogTranslationDraftSchema = z.infer<typeof adminBlogTranslationDraftSchema>;
export type AdminBlogPublishReadinessSchema = z.infer<typeof adminBlogPublishReadinessSchema>;
export type AdminBlogDetailSchema = z.infer<typeof adminBlogDetailSchema>;
export type AdminBlogDetailResponseSchema = z.infer<typeof adminBlogDetailResponseSchema>;
export type AdminBlogMetadataRequestSchema = z.infer<typeof adminBlogMetadataRequestSchema>;
export type AdminBlogTranslationUpsertRequestSchema = z.infer<typeof adminBlogTranslationUpsertRequestSchema>;
export type AdminBlogPublishResponseSchema = z.infer<typeof adminBlogPublishResponseSchema>;
export type AdminBlogUnpublishResponseSchema = z.infer<typeof adminBlogUnpublishResponseSchema>;
export type AdminBlogBannerUploadContentTypeSchema = z.infer<typeof adminBlogBannerUploadContentTypeSchema>;
export type AdminBlogBannerUploadInitRequestSchema = z.infer<typeof adminBlogBannerUploadInitRequestSchema>;
export type AdminBlogBannerUploadInitResponseSchema = z.infer<typeof adminBlogBannerUploadInitResponseSchema>;
export type AdminBlogBannerCompleteRequestSchema = z.infer<typeof adminBlogBannerCompleteRequestSchema>;
export type AdminBlogBannerUpdateResponseSchema = z.infer<typeof adminBlogBannerUpdateResponseSchema>;
export type DrawDateParamSchema = z.infer<typeof drawDateParamSchema>;
export type AdminSessionPayloadSchema = z.infer<typeof adminSessionPayloadSchema>;
export type AuthenticatedAdminSchema = z.infer<typeof authenticatedAdminSchema>;
export type AdminLoginRequestSchema = z.infer<typeof adminLoginRequestSchema>;
export type AdminAuthResponseSchema = z.infer<typeof adminAuthResponseSchema>;
export type AdminInvitationCreateRequestSchema = z.infer<typeof adminInvitationCreateRequestSchema>;
export type AdminInvitationCreateResponseSchema = z.infer<typeof adminInvitationCreateResponseSchema>;
export type AdminInvitationAcceptRequestSchema = z.infer<typeof adminInvitationAcceptRequestSchema>;
export type AdminInvitationAcceptResponseSchema = z.infer<typeof adminInvitationAcceptResponseSchema>;
export type AdminInvitationRevokeRequestSchema = z.infer<typeof adminInvitationRevokeRequestSchema>;
export type AdminInvitationRevokeResponseSchema = z.infer<typeof adminInvitationRevokeResponseSchema>;
export type AdminPasswordResetRequestSchema = z.infer<typeof adminPasswordResetRequestSchema>;
export type AdminPasswordResetRequestResponseSchema = z.infer<typeof adminPasswordResetRequestResponseSchema>;
export type AdminPasswordResetConfirmRequestSchema = z.infer<typeof adminPasswordResetConfirmRequestSchema>;
export type AdminPasswordResetConfirmResponseSchema = z.infer<typeof adminPasswordResetConfirmResponseSchema>;
export type AdminListItemSchema = z.infer<typeof adminListItemSchema>;
export type AdminListResponseSchema = z.infer<typeof adminListResponseSchema>;
export type AdminUpdateRequestSchema = z.infer<typeof adminUpdateRequestSchema>;
export type AdminUpdateResponseSchema = z.infer<typeof adminUpdateResponseSchema>;
export type HistoryQuerySchema = z.infer<typeof historyQuerySchema>;
export type CheckerCheckRequestSchema = z.infer<typeof checkerCheckRequestSchema>;
export type PrizeGroupSchema = z.infer<typeof prizeGroupSchema>;
export type PrizeGroupInputSchema = z.infer<typeof prizeGroupInputSchema>;
export type ResultDetailResponseSchema = z.infer<typeof resultDetailResponseSchema>;
export type ResultHistoryItemSchema = z.infer<typeof resultHistoryItemSchema>;
export type ResultHistoryResponseSchema = z.infer<typeof resultHistoryResponseSchema>;
export type CheckerDrawOptionSchema = z.infer<typeof checkerDrawOptionSchema>;
export type CheckerDrawOptionsResponseSchema = z.infer<typeof checkerDrawOptionsResponseSchema>;
export type CheckerMatchSchema = z.infer<typeof checkerMatchSchema>;
export type CheckerCheckResponseSchema = z.infer<typeof checkerCheckResponseSchema>;
export type AdminResultListQuerySchema = z.infer<typeof adminResultListQuerySchema>;
export type AdminResultListItemSchema = z.infer<typeof adminResultListItemSchema>;
export type AdminResultListResponseSchema = z.infer<typeof adminResultListResponseSchema>;
export type AdminResultDetailSchema = z.infer<typeof adminResultDetailSchema>;
export type AdminResultDetailResponseSchema = z.infer<typeof adminResultDetailResponseSchema>;
export type AdminResultWriteRequestSchema = z.infer<typeof adminResultWriteRequestSchema>;
export type AdminResultPublishResponseSchema = z.infer<typeof adminResultPublishResponseSchema>;
