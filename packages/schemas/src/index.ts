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
export type HistoryQuerySchema = z.infer<typeof historyQuerySchema>;
export type PrizeGroupSchema = z.infer<typeof prizeGroupSchema>;
export type ResultDetailResponseSchema = z.infer<typeof resultDetailResponseSchema>;
export type ResultHistoryItemSchema = z.infer<typeof resultHistoryItemSchema>;
export type ResultHistoryResponseSchema = z.infer<typeof resultHistoryResponseSchema>;
