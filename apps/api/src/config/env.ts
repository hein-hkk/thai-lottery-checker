import { z } from "zod";

const apiEnvSchema = z.object({
  API_PORT: z.coerce.number().int().positive().default(4000),
  DATABASE_URL: z.string().min(1),
  APP_URL: z.string().url().optional(),
  NEXT_PUBLIC_APP_URL: z.string().url().optional(),
  ADMIN_SESSION_SECRET: z.string().min(32).default("development-admin-session-secret-change-me"),
  ADMIN_BOOTSTRAP_EMAIL: z.string().email().default("admin@thai-lottery-checker.local"),
  ADMIN_BOOTSTRAP_PASSWORD: z.string().min(8).default("ChangeMe123!"),
  ADMIN_BOOTSTRAP_NAME: z.string().min(1).default("Platform Super Admin"),
  ADMIN_INVITATION_EXPIRY_HOURS: z.coerce.number().int().positive().default(168),
  ADMIN_PASSWORD_RESET_EXPIRY_HOURS: z.coerce.number().int().positive().default(1)
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
