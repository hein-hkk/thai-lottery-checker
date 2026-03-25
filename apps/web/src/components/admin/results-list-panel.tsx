import Link from "next/link";
import type { AdminResultListItem } from "@thai-lottery-checker/types";

function formatTimestamp(value: string | null): string {
  if (!value) {
    return "Not published";
  }

  return new Date(value).toLocaleString();
}

export function ResultsListPanel({ items }: { items: AdminResultListItem[] }) {
  if (items.length === 0) {
    return (
      <section className="ui-panel-dashed p-10 text-center">
        <p className="ui-kicker">Result management</p>
        <h2 className="ui-section-title mt-3">No managed results yet</h2>
        <p className="ui-copy mt-3">
          Create the first draft draw to start the publish and correction workflow.
        </p>
        <div className="mt-6">
          <Link className="ui-button-primary" href="/admin/results/new">
            Create result
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="ui-kicker">Result management</p>
          <h2 className="ui-title mt-2 text-[clamp(1.75rem,4vw,2.5rem)]">Lottery results</h2>
        </div>
        <Link className="ui-button-primary" href="/admin/results/new">
          Create result
        </Link>
      </div>

      <div className="ui-table-wrap">
        <table className="ui-table">
          <thead>
            <tr>
              <th>Draw date</th>
              <th>Draw code</th>
              <th>Status</th>
              <th>Published</th>
              <th>Updated</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id}>
                <td className="font-medium text-[var(--text-primary)]">{item.drawDate}</td>
                <td className="text-[var(--text-secondary)]">{item.drawCode ?? "None"}</td>
                <td>
                  <span className={item.status === "published" ? "ui-badge-success" : "ui-badge-warning"}>
                    {item.status}
                  </span>
                </td>
                <td className="text-[var(--text-secondary)]">{formatTimestamp(item.publishedAt)}</td>
                <td className="text-[var(--text-secondary)]">{formatTimestamp(item.updatedAt)}</td>
                <td>
                  <Link className="ui-button-secondary" href={`/admin/results/${item.id}`}>
                    {item.status === "draft" ? "Edit draft" : "Correct result"}
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
