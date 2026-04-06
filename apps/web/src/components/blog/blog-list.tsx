import Link from "next/link";
import type { PublicMessages } from "@thai-lottery-checker/i18n";
import type { BlogListResponse, SupportedLocale } from "@thai-lottery-checker/types";
import { formatBlogPublishedAt } from "./blog-primitives";

interface BlogListProps {
  locale: SupportedLocale;
  messages: PublicMessages;
  page: number;
  posts: BlogListResponse;
}

export function BlogList({ locale, messages, page, posts }: BlogListProps) {
  const hasPrevious = page > 1;
  const hasNext = page * posts.limit < posts.total;

  return (
    <div className="space-y-6">
      <ul className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {posts.items.map((post) => (
          <li className="ui-panel-muted flex h-full flex-col overflow-hidden" key={post.slug}>
            <Link className="flex h-full flex-col" href={`/${locale}/blog/${post.slug}`}>
              {post.bannerImageUrl ? (
                <img
                  alt={post.title}
                  className="h-48 w-full object-cover"
                  loading="lazy"
                  src={post.bannerImageUrl}
                />
              ) : null}
              <div className="flex flex-1 flex-col gap-4 p-5">
                <div className="space-y-2">
                  <p className="text-sm font-medium text-[var(--text-secondary)]">
                    {messages.publishedAt}: {formatBlogPublishedAt(locale, post.publishedAt)}
                  </p>
                  <h2 className="ui-section-title text-balance">{post.title}</h2>
                  {post.excerpt ? <p className="ui-copy">{post.excerpt}</p> : null}
                </div>
                <div className="mt-auto flex justify-start">
                  <span className="ui-button-primary">{messages.readArticle}</span>
                </div>
              </div>
            </Link>
          </li>
        ))}
      </ul>

      <div className="ui-panel-muted flex flex-col gap-4 p-4 md:flex-row md:items-center md:justify-between">
        <div className="text-sm font-medium text-[var(--text-secondary)]">
          {messages.page} {posts.page}
        </div>
        <div className="flex gap-3">
          {hasPrevious ? (
            <Link className="ui-button-secondary" href={`/${locale}/blog?page=${page - 1}`}>
              {messages.previousPage}
            </Link>
          ) : (
            <span className="ui-button-secondary opacity-50">{messages.previousPage}</span>
          )}
          {hasNext ? (
            <Link className="ui-button-primary" href={`/${locale}/blog?page=${page + 1}`}>
              {messages.nextPage}
            </Link>
          ) : (
            <span className="ui-button-primary opacity-50">{messages.nextPage}</span>
          )}
        </div>
      </div>
    </div>
  );
}
