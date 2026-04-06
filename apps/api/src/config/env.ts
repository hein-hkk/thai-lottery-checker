import { z } from "zod";

function optionalStringField(schema: z.ZodType<string>): z.ZodEffects<z.ZodOptional<z.ZodType<string>>, string | undefined, unknown> {
  return z.preprocess((value) => {
    if (typeof value !== "string") {
      return value;
    }

    const trimmed = value.trim();
    return trimmed.length === 0 ? undefined : trimmed;
  }, schema.optional());
}

const apiEnvSchema = z.object({
  API_PORT: z.coerce.number().int().positive().default(4000),
  DATABASE_URL: z.string().min(1),
  APP_URL: optionalStringField(z.string().url()),
  NEXT_PUBLIC_APP_URL: optionalStringField(z.string().url()),
  ADMIN_SESSION_SECRET: z.string().min(32).default("development-admin-session-secret-change-me"),
  ADMIN_BOOTSTRAP_EMAIL: z.string().email().default("admin@thai-lottery-checker.local"),
  ADMIN_BOOTSTRAP_PASSWORD: z.string().min(8).default("ChangeMe123!"),
  ADMIN_BOOTSTRAP_NAME: z.string().min(1).default("Platform Super Admin"),
  ADMIN_INVITATION_EXPIRY_HOURS: z.coerce.number().int().positive().default(168),
  ADMIN_PASSWORD_RESET_EXPIRY_HOURS: z.coerce.number().int().positive().default(1),
  BLOG_BANNER_STORAGE_REGION: optionalStringField(z.string().min(1)),
  BLOG_BANNER_STORAGE_BUCKET: optionalStringField(z.string().min(1)),
  BLOG_BANNER_STORAGE_ACCESS_KEY_ID: optionalStringField(z.string().min(1)),
  BLOG_BANNER_STORAGE_SECRET_ACCESS_KEY: optionalStringField(z.string().min(1)),
  BLOG_BANNER_STORAGE_PUBLIC_BASE_URL: optionalStringField(z.string().url()),
  BLOG_BANNER_STORAGE_ENDPOINT: optionalStringField(z.string().url()),
  BLOG_BANNER_STORAGE_PREFIX: z.string().min(1).default("blog-banners"),
  BLOG_BANNER_STORAGE_PRESIGN_EXPIRES_SECONDS: z.coerce.number().int().positive().max(3600).default(600),
  BLOG_BANNER_STORAGE_FORCE_PATH_STYLE: z
    .enum(["true", "false"])
    .optional()
    .transform((value) => value === "true")
});

export type ApiEnv = z.infer<typeof apiEnvSchema>;

let cachedEnv: ApiEnv | undefined;

export function getApiEnv(): ApiEnv {
  if (cachedEnv) {
    return cachedEnv;
  }

  cachedEnv = apiEnvSchema.parse(process.env);
  return cachedEnv;
}
