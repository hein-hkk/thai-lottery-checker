import Link from "next/link";
import type { PublicMessages } from "@thai-lottery-checker/i18n";
import type { BlogListResponse, SupportedLocale } from "@thai-lottery-checker/types";
import { StatusCard } from "../results/status-card";
import { formatBlogPublishedAt } from "./blog-primitives";

interface HomeBlogTeasersProps {
  locale: SupportedLocale;
  messages: PublicMessages;
  posts?: BlogListResponse["items"];
  statusMessage?: string;
}

export function HomeBlogTeasers({ locale, messages, posts = [], statusMessage }: HomeBlogTeasersProps) {
  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div className="space-y-2">
          <h2 className="ui-section-title">{messages.homeBlogTeasersTitle}</h2>
          <p className="ui-copy max-w-3xl">{messages.homeBlogTeasersDescription}</p>
        </div>
        <Link className="ui-button-secondary" href={`/${locale}/blog`}>
          {messages.browseBlog}
        </Link>
      </div>

      <div className="ui-divider mt-6 pt-6">
        {statusMessage ? (
          <StatusCard message={statusMessage} />
        ) : (
          <ul className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {posts.map((post) => (
              <li className="ui-panel-muted flex h-full flex-col overflow-hidden" key={post.slug}>
                <Link className="flex h-full flex-col" href={`/${locale}/blog/${post.slug}`}>
                  {post.bannerImageUrl ? (
                    <img
                      alt={post.title}
                      className="h-40 w-full object-cover"
                      loading="lazy"
                      src={post.bannerImageUrl}
                    />
                  ) : (
                    <div className="h-40 w-full bg-[linear-gradient(160deg,var(--surface-secondary),var(--surface-primary))]" />
                  )}
                  <div className="flex flex-1 flex-col gap-4 p-4">
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-[var(--text-secondary)]">
                        {messages.publishedAt}: {formatBlogPublishedAt(locale, post.publishedAt)}
                      </p>
                      <h3 className="text-[clamp(1.3rem,2vw,1.75rem)] font-semibold leading-tight text-[var(--text-primary)] text-balance">
                        {post.title}
                      </h3>
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
        )}
      </div>
    </section>
  );
}
