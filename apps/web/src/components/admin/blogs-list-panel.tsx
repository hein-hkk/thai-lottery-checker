import Link from "next/link";
import type { AdminBlogListResponse, AdminBlogStatusFilter } from "@thai-lottery-checker/types";

function formatTimestamp(value: string | null): string {
  if (!value) {
    return "Not published";
  }

  return new Date(value).toLocaleString();
}

function getFilterHref(status: AdminBlogStatusFilter): string {
  return status === "all" ? "/admin/blogs" : `/admin/blogs?status=${status}`;
}

function getPageHref(status: AdminBlogStatusFilter, page: number): string {
  const search = new URLSearchParams();

  if (status !== "all") {
    search.set("status", status);
  }

  search.set("page", String(page));

  return `/admin/blogs?${search.toString()}`;
}

function BlogsPagination({
  activeStatus,
  blogs
}: {
  activeStatus: AdminBlogStatusFilter;
  blogs: AdminBlogListResponse;
}) {
  const hasPrevious = blogs.page > 1;
  const hasNext = blogs.page * blogs.limit < blogs.total;

  if (!hasPrevious && !hasNext) {
    return null;
  }

  return (
    <div className="ui-panel-muted flex flex-col gap-4 p-4 md:flex-row md:items-center md:justify-between">
      <div className="text-sm font-medium text-[var(--text-secondary)]">
        Page {blogs.page}
      </div>
      <div className="flex gap-3">
        {hasPrevious ? (
          <Link className="ui-button-secondary" href={getPageHref(activeStatus, blogs.page - 1)}>
            Previous
          </Link>
        ) : (
          <span className="ui-button-secondary opacity-50">Previous</span>
        )}
        {hasNext ? (
          <Link className="ui-button-primary" href={getPageHref(activeStatus, blogs.page + 1)}>
            Next
          </Link>
        ) : (
          <span className="ui-button-primary opacity-50">Next</span>
        )}
      </div>
    </div>
  );
}

export function BlogsListPanel({
  activeStatus,
  blogs
}: {
  activeStatus: AdminBlogStatusFilter;
  blogs: AdminBlogListResponse;
}) {
  const filters: AdminBlogStatusFilter[] = ["all", "draft", "published"];

  if (blogs.items.length === 0) {
    return (
      <section className="space-y-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="ui-kicker">Blog management</p>
            <h2 className="ui-title mt-2 text-[clamp(1.75rem,4vw,2.5rem)]">Blog posts</h2>
          </div>
          <Link className="ui-button-primary" href="/admin/blogs/new" prefetch={false}>
            Create post
          </Link>
        </div>

        <div className="flex flex-wrap gap-3">
          {filters.map((status) => (
            <Link
              className={status === activeStatus ? "ui-button-primary" : "ui-button-secondary"}
              href={getFilterHref(status)}
              key={status}
            >
              {status === "all" ? "All statuses" : status === "draft" ? "Drafts" : "Published"}
            </Link>
          ))}
        </div>

        <section className="ui-panel-dashed p-10 text-center">
          <p className="ui-kicker">Blog management</p>
          <h2 className="ui-section-title mt-3">
            {blogs.total > 0 ? "No posts on this page" : "No posts match this filter"}
          </h2>
          <p className="ui-copy mt-3">
            {blogs.total > 0
              ? "Go back to the previous page to continue reviewing blog posts."
              : "Create a draft post to start writing and publishing blog content."}
          </p>
        </section>

        <BlogsPagination activeStatus={activeStatus} blogs={blogs} />
      </section>
    );
  }

  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="ui-kicker">Blog management</p>
          <h2 className="ui-title mt-2 text-[clamp(1.75rem,4vw,2.5rem)]">Blog posts</h2>
        </div>
        <Link className="ui-button-primary" href="/admin/blogs/new" prefetch={false}>
          Create post
        </Link>
      </div>

      <div className="flex flex-wrap gap-3">
        {filters.map((status) => (
          <Link
            className={status === activeStatus ? "ui-button-primary" : "ui-button-secondary"}
            href={getFilterHref(status)}
            key={status}
          >
            {status === "all" ? "All statuses" : status === "draft" ? "Drafts" : "Published"}
          </Link>
        ))}
      </div>

      <div className="ui-table-wrap">
        <table className="ui-table">
          <thead>
            <tr>
              <th>Title</th>
              <th>Slug</th>
              <th>Status</th>
              <th>Locales</th>
              <th>Published</th>
              <th>Updated</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {blogs.items.map((item) => (
              <tr key={item.id}>
                <td className="font-medium text-[var(--text-primary)]">{item.displayTitle}</td>
                <td className="text-[var(--text-secondary)]">{item.slug}</td>
                <td>
                  <span className={item.status === "published" ? "ui-badge-success" : "ui-badge-warning"}>{item.status}</span>
                </td>
                <td className="text-[var(--text-secondary)]">{item.availableLocales.length > 0 ? item.availableLocales.join(", ") : "None"}</td>
                <td className="text-[var(--text-secondary)]">{formatTimestamp(item.publishedAt)}</td>
                <td className="text-[var(--text-secondary)]">{formatTimestamp(item.updatedAt)}</td>
                <td>
                  <Link className="ui-button-secondary" href={`/admin/blogs/${item.id}`} prefetch={false}>
                    {item.status === "draft" ? "Edit draft" : "Edit post"}
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <BlogsPagination activeStatus={activeStatus} blogs={blogs} />
    </section>
  );
}
