import type { Metadata } from "next";
import Link from "next/link";
import { getPublicMessages, isSupportedLocale } from "@thai-lottery-checker/i18n";
import type { SupportedLocale } from "@thai-lottery-checker/types";
import { notFound } from "next/navigation";
import { BlogDetailSections } from "../../../../src/components/blog/blog-detail-sections";
import { StatusCard } from "../../../../src/components/results/status-card";
import { PublicPageShell } from "../../../../src/components/ui/public-page-shell";
import { getBlogDetail } from "../../../../src/blog/api";
import { getBlogDetailMetadata } from "../../../../src/blog/metadata";

export const dynamic = "force-dynamic";

interface BlogDetailPageProps {
  params: Promise<{ locale: string; slug: string }>;
}

export async function generateMetadata({ params }: BlogDetailPageProps): Promise<Metadata> {
  const { locale, slug } = await params;

  if (!isSupportedLocale(locale)) {
    return {};
  }

  try {
    const detail = await getBlogDetail(slug, locale as SupportedLocale);

    if (!detail) {
      return {};
    }

    return getBlogDetailMetadata(locale as SupportedLocale, detail, getPublicMessages(locale as SupportedLocale));
  } catch {
    return {};
  }
}

export default async function BlogDetailPage({ params }: BlogDetailPageProps) {
  const { locale, slug } = await params;

  if (!isSupportedLocale(locale)) {
    notFound();
  }

  const supportedLocale = locale as SupportedLocale;
  const messages = getPublicMessages(supportedLocale);
  let detail;

  try {
    detail = await getBlogDetail(slug, supportedLocale);
  } catch {
    return (
      <PublicPageShell currentPath="blog" locale={supportedLocale} messages={messages}>
        <div className="space-y-6">
          <StatusCard message={messages.blogDetailUnavailable} />
          <div className="flex justify-end">
            <Link className="ui-button-secondary" href={`/${supportedLocale}/blog`}>
              {messages.backToBlog}
            </Link>
          </div>
        </div>
      </PublicPageShell>
    );
  }

  if (!detail) {
    notFound();
  }

  return (
    <PublicPageShell currentPath="blog" locale={supportedLocale} messages={messages}>
      <div className="space-y-6">
        <BlogDetailSections detail={detail} locale={supportedLocale} messages={messages} />
        <div className="flex justify-end">
          <Link className="ui-button-secondary" href={`/${supportedLocale}/blog`}>
            {messages.backToBlog}
          </Link>
        </div>
      </div>
    </PublicPageShell>
  );
}
