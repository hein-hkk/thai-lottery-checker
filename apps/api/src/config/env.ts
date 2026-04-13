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
  API_TRUST_PROXY: z.string().trim().min(1).default("false"),
  ADMIN_SESSION_SECRET: z.string().min(32).default("development-admin-session-secret-change-me"),
  ADMIN_SESSION_TTL_HOURS: z.coerce.number().int().positive().max(24 * 30).default(12),
  ADMIN_BOOTSTRAP_EMAIL: z.string().email().default("admin@thai-lottery-checker.local"),
  ADMIN_BOOTSTRAP_PASSWORD: z.string().min(8).default("ChangeMe123!"),
  ADMIN_BOOTSTRAP_NAME: z.string().min(1).default("Platform Super Admin"),
  ADMIN_INVITATION_EXPIRY_HOURS: z.coerce.number().int().positive().default(168),
  ADMIN_PASSWORD_RESET_EXPIRY_HOURS: z.coerce.number().int().positive().default(1),
  ADMIN_LOGIN_RATE_LIMIT_WINDOW_MINUTES: z.coerce.number().int().positive().max(24 * 60).default(15),
  ADMIN_LOGIN_RATE_LIMIT_MAX_ATTEMPTS: z.coerce.number().int().positive().max(500).default(20),
  ADMIN_PASSWORD_RESET_RATE_LIMIT_WINDOW_MINUTES: z.coerce.number().int().positive().max(24 * 60).default(15),
  ADMIN_PASSWORD_RESET_RATE_LIMIT_MAX_ATTEMPTS: z.coerce.number().int().positive().max(500).default(10),
  ADMIN_INVITATION_ACCEPT_RATE_LIMIT_WINDOW_MINUTES: z.coerce.number().int().positive().max(24 * 60).default(15),
  ADMIN_INVITATION_ACCEPT_RATE_LIMIT_MAX_ATTEMPTS: z.coerce.number().int().positive().max(500).default(10),
  ADMIN_WRITE_RATE_LIMIT_WINDOW_MINUTES: z.coerce.number().int().positive().max(24 * 60).default(1),
  ADMIN_WRITE_RATE_LIMIT_MAX_REQUESTS: z.coerce.number().int().positive().max(1000).default(120),
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

function isProductionRuntime(): boolean {
  return process.env.NODE_ENV === "production";
}

function isHttpsUrl(value: string): boolean {
  try {
    return new URL(value).protocol === "https:";
  } catch {
    return false;
  }
}

function assertProductionSafeEnv(env: ApiEnv): void {
  if (!isProductionRuntime()) {
    return;
  }

  const appUrls = [env.APP_URL, env.NEXT_PUBLIC_APP_URL].filter((value): value is string => Boolean(value));

  if (appUrls.length === 0) {
    throw new Error("Production configuration must include APP_URL or NEXT_PUBLIC_APP_URL");
  }

  if (appUrls.some((value) => !isHttpsUrl(value))) {
    throw new Error("Production application origins must use https");
  }

  if (env.ADMIN_SESSION_SECRET === "development-admin-session-secret-change-me") {
    throw new Error("Production ADMIN_SESSION_SECRET must not use the development default");
  }

  if (env.ADMIN_BOOTSTRAP_PASSWORD === "ChangeMe123!") {
    throw new Error("Production ADMIN_BOOTSTRAP_PASSWORD must not use the development default");
  }

  if (env.ADMIN_BOOTSTRAP_EMAIL === "admin@thai-lottery-checker.local") {
    throw new Error("Production ADMIN_BOOTSTRAP_EMAIL must not use the development default");
  }

  if (env.BLOG_BANNER_STORAGE_PUBLIC_BASE_URL && !isHttpsUrl(env.BLOG_BANNER_STORAGE_PUBLIC_BASE_URL)) {
    throw new Error("Production BLOG_BANNER_STORAGE_PUBLIC_BASE_URL must use https");
  }
}

export function resetApiEnvCache(): void {
  cachedEnv = undefined;
}

export function getApiEnv(): ApiEnv {
  if (cachedEnv) {
    return cachedEnv;
  }

  cachedEnv = apiEnvSchema.parse(process.env);
  assertProductionSafeEnv(cachedEnv);
  return cachedEnv;
}
