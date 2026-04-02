import Link from "next/link";
import type { AdminBlogListItem, AdminBlogStatusFilter } from "@thai-lottery-checker/types";

function formatTimestamp(value: string | null): string {
  if (!value) {
    return "Not published";
  }

  return new Date(value).toLocaleString();
}

function getFilterHref(status: AdminBlogStatusFilter): string {
  return status === "all" ? "/admin/blogs" : `/admin/blogs?status=${status}`;
}

export function BlogsListPanel({
  activeStatus,
  items
}: {
  activeStatus: AdminBlogStatusFilter;
  items: AdminBlogListItem[];
}) {
  const filters: AdminBlogStatusFilter[] = ["all", "draft", "published"];

  if (items.length === 0) {
    return (
      <section className="space-y-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="ui-kicker">Blog management</p>
            <h2 className="ui-title mt-2 text-[clamp(1.75rem,4vw,2.5rem)]">Blog posts</h2>
          </div>
          <Link className="ui-button-primary" href="/admin/blogs/new">
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
          <h2 className="ui-section-title mt-3">No posts match this filter</h2>
          <p className="ui-copy mt-3">Create a draft post to start writing and publishing blog content.</p>
        </section>
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
        <Link className="ui-button-primary" href="/admin/blogs/new">
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
            {items.map((item) => (
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
                  <Link className="ui-button-secondary" href={`/admin/blogs/${item.id}`}>
                    {item.status === "draft" ? "Edit draft" : "Edit post"}
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
