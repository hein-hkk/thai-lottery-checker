import Link from "next/link";
import type { AdminResultListResponse } from "@thai-lottery-checker/types";

function formatTimestamp(value: string | null): string {
  if (!value) {
    return "Not published";
  }

  return new Date(value).toLocaleString();
}

function ResultsPagination({ results }: { results: AdminResultListResponse }) {
  const hasPrevious = results.page > 1;
  const hasNext = results.page * results.limit < results.total;

  if (!hasPrevious && !hasNext) {
    return null;
  }

  return (
    <div className="ui-panel-muted flex flex-col gap-4 p-4 md:flex-row md:items-center md:justify-between">
      <div className="text-sm font-medium text-[var(--text-secondary)]">
        Page {results.page}
      </div>
      <div className="flex gap-3">
        {hasPrevious ? (
          <Link className="ui-button-secondary" href={`/admin/results?page=${results.page - 1}`}>
            Previous
          </Link>
        ) : (
          <span className="ui-button-secondary opacity-50">Previous</span>
        )}
        {hasNext ? (
          <Link className="ui-button-primary" href={`/admin/results?page=${results.page + 1}`}>
            Next
          </Link>
        ) : (
          <span className="ui-button-primary opacity-50">Next</span>
        )}
      </div>
    </div>
  );
}

export function ResultsListPanel({ results }: { results: AdminResultListResponse }) {
  if (results.items.length === 0) {
    return (
      <section className="space-y-6">
        <section className="ui-panel-dashed p-10 text-center">
          <p className="ui-kicker">Result management</p>
          <h2 className="ui-section-title mt-3">
            {results.total > 0 ? "No results on this page" : "No managed results yet"}
          </h2>
          <p className="ui-copy mt-3">
            {results.total > 0
              ? "Go back to the previous page to continue reviewing managed draws."
              : "Create the first draft draw to start the publish and correction workflow."}
          </p>
          <div className="mt-6">
            <Link className="ui-button-primary" href="/admin/results/new">
              Create result
            </Link>
          </div>
        </section>
        <ResultsPagination results={results} />
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
            {results.items.map((item) => (
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

      <ResultsPagination results={results} />
    </section>
  );
}
