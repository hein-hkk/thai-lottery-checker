import { z } from "zod";

export const localeSchema = z.enum(["en", "th", "my"]);
export const adminRoleSchema = z.enum(["super_admin", "editor"]);
export const adminPermissionSchema = z.enum(["manage_results", "manage_blogs"]);

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

export const prizeGroupSchema = z.object({
  type: prizeTypeSchema,
  numbers: z.array(z.string())
});

export const resultDetailResponseSchema = z.object({
  drawDate: z.string().regex(drawDatePattern),
  drawCode: z.string().nullable(),
  publishedAt: z.string().datetime({ offset: true }),
  prizeGroups: z.array(prizeGroupSchema)
});

export const resultHistoryItemSchema = z.object({
  drawDate: z.string().regex(drawDatePattern),
  drawCode: z.string().nullable(),
  firstPrize: z.string(),
  lastTwo: z.string()
});

export const resultHistoryResponseSchema = z.object({
  items: z.array(resultHistoryItemSchema),
  page: z.number().int().min(1),
  limit: z.number().int().min(1).max(50),
  total: z.number().int().min(0)
});

export type AdminRoleSchema = z.infer<typeof adminRoleSchema>;
export type AdminPermissionSchema = z.infer<typeof adminPermissionSchema>;
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
export type PrizeGroupSchema = z.infer<typeof prizeGroupSchema>;
export type ResultDetailResponseSchema = z.infer<typeof resultDetailResponseSchema>;
export type ResultHistoryItemSchema = z.infer<typeof resultHistoryItemSchema>;
export type ResultHistoryResponseSchema = z.infer<typeof resultHistoryResponseSchema>;
