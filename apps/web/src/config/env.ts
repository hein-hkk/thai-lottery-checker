import { z } from "zod";

const publicEnvSchema = z.object({
  NEXT_PUBLIC_APP_URL: z.string().url(),
  NEXT_PUBLIC_API_BASE_URL: z.string().url(),
  NEXT_PUBLIC_DEFAULT_LOCALE: z.enum(["en", "th", "my"])
});

export type PublicEnv = {
  appUrl: string;
  apiBaseUrl: string;
  defaultLocale: "en" | "th" | "my";
};

export function getPublicEnv(): PublicEnv {
  const env = publicEnvSchema.parse({
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    NEXT_PUBLIC_API_BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL,
    NEXT_PUBLIC_DEFAULT_LOCALE: process.env.NEXT_PUBLIC_DEFAULT_LOCALE
  });

  return {
    appUrl: env.NEXT_PUBLIC_APP_URL,
    apiBaseUrl: env.NEXT_PUBLIC_API_BASE_URL,
    defaultLocale: env.NEXT_PUBLIC_DEFAULT_LOCALE
  };
}
