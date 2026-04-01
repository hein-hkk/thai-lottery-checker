import type { PublicMessages } from "@thai-lottery-checker/i18n";
import type { BlogDetailResponse, SupportedLocale } from "@thai-lottery-checker/types";
import { formatBlogPublishedAt } from "./blog-primitives";

interface BlogDetailSectionsProps {
  detail: BlogDetailResponse;
  locale: SupportedLocale;
  messages: PublicMessages;
}

export function BlogDetailSections({ detail, locale, messages }: BlogDetailSectionsProps) {
  return (
    <article className="space-y-6">
      <header className="space-y-4">
        <div className="space-y-2">
          <p className="text-sm font-medium text-[var(--text-secondary)]">
            {messages.publishedAt}: {formatBlogPublishedAt(locale, detail.publishedAt)}
          </p>
          <h1 className="ui-title text-balance">{detail.translation.title}</h1>
          {detail.translation.excerpt ? <p className="ui-copy max-w-3xl">{detail.translation.excerpt}</p> : null}
        </div>
        {detail.bannerImageUrl ? (
          <img
            alt={detail.translation.title}
            className="max-h-[28rem] w-full rounded-[calc(var(--radius-xl)-0.25rem)] border border-[var(--border-default)] object-cover"
            src={detail.bannerImageUrl}
          />
        ) : null}
      </header>

      <div className="ui-divider pt-6">
        <div className="space-y-4">
          {detail.translation.body.map((block, index) => (
            <p className="ui-copy max-w-3xl" key={`${block.type}-${index}`}>
              {block.text}
            </p>
          ))}
        </div>
      </div>
    </article>
  );
}
