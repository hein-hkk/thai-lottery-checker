import type { Metadata } from "next";
import { getPublicMessages, isSupportedLocale } from "@thai-lottery-checker/i18n";
import type { SupportedLocale } from "@thai-lottery-checker/types";
import { notFound } from "next/navigation";
import { BlogList } from "../../../src/components/blog/blog-list";
import { StatusCard } from "../../../src/components/results/status-card";
import { PublicPageShell } from "../../../src/components/ui/public-page-shell";
import { BlogApiError, getBlogList } from "../../../src/blog/api";
import { getBlogListMetadata } from "../../../src/blog/metadata";
import { parseBlogPage } from "../../../src/blog/queries";

export const dynamic = "force-dynamic";

interface BlogListPageProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ page?: string | string[] }>;
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;

  if (!isSupportedLocale(locale)) {
    return {};
  }

  return getBlogListMetadata(locale as SupportedLocale, getPublicMessages(locale as SupportedLocale));
}

export default async function BlogListPage({ params, searchParams }: BlogListPageProps) {
  const { locale } = await params;

  if (!isSupportedLocale(locale)) {
    notFound();
  }

  const supportedLocale = locale as SupportedLocale;
  const messages = getPublicMessages(supportedLocale);
  const { page } = await searchParams;
  const currentPage = parseBlogPage(page);

  try {
    const posts = await getBlogList(supportedLocale, currentPage);

    return (
      <PublicPageShell
        currentPath="blog"
        description={messages.blogListDescription}
        locale={supportedLocale}
        messages={messages}
        title={messages.blogListTitle}
      >
        {posts.items.length === 0 ? (
          <StatusCard message={messages.noBlogPosts} />
        ) : (
          <BlogList locale={supportedLocale} messages={messages} page={currentPage} posts={posts} />
        )}
      </PublicPageShell>
    );
  } catch (error) {
    const message =
      error instanceof BlogApiError && error.status === 404 ? messages.noBlogPosts : messages.blogListUnavailable;

    return (
      <PublicPageShell
        currentPath="blog"
        description={messages.blogListDescription}
        locale={supportedLocale}
        messages={messages}
        title={messages.blogListTitle}
      >
        <StatusCard message={message} />
      </PublicPageShell>
    );
  }
}
