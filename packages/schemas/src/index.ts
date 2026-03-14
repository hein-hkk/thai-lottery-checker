import { z } from "zod";

export const localeSchema = z.enum(["en", "th", "my"]);

export type LocaleSchema = z.infer<typeof localeSchema>;

