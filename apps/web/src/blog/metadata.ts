import type { Metadata } from "next";
import type { BlogDetailResponse, SupportedLocale } from "@thai-lottery-checker/types";
import type { PublicMessages } from "@thai-lottery-checker/i18n";
import { getPublicEnv } from "../config/env";

export function getBlogListMetadata(locale: SupportedLocale, messages: PublicMessages): Metadata {
  return {
    title: messages.blogListTitle,
    description: messages.blogListDescription,
    alternates: {
      canonical: `${getPublicEnv().appUrl}/${locale}/blog`
    }
  };
}

export function getBlogDetailMetadata(locale: SupportedLocale, detail: BlogDetailResponse, messages: PublicMessages): Metadata {
  return {
    title: detail.translation.seoTitle ?? detail.translation.title,
    description: detail.translation.seoDescription ?? detail.translation.excerpt ?? messages.blogDetailDescriptionFallback,
    alternates: {
      canonical: `${getPublicEnv().appUrl}/${locale}/blog/${detail.slug}`
    }
  };
}
