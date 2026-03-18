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
      <section className="rounded-[1.75rem] border border-dashed border-slate-300 bg-white p-10 text-center shadow-[0_14px_40px_rgba(15,23,42,0.05)]">
        <p className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-500">Result management</p>
        <h2 className="mt-3 text-2xl font-semibold tracking-tight text-slate-950">No managed results yet</h2>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          Create the first draft draw to start the publish and correction workflow.
        </p>
        <div className="mt-6">
          <Link
            className="inline-flex rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
            href="/admin/results/new"
          >
            Create result
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-500">Result management</p>
          <h2 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">Lottery results</h2>
        </div>
        <Link
          className="inline-flex rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
          href="/admin/results/new"
        >
          Create result
        </Link>
      </div>

      <div className="overflow-hidden rounded-[1.75rem] border border-slate-200 bg-white shadow-[0_14px_40px_rgba(15,23,42,0.05)]">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50 text-left text-slate-600">
            <tr>
              <th className="px-5 py-4 font-medium">Draw date</th>
              <th className="px-5 py-4 font-medium">Draw code</th>
              <th className="px-5 py-4 font-medium">Status</th>
              <th className="px-5 py-4 font-medium">Published</th>
              <th className="px-5 py-4 font-medium">Updated</th>
              <th className="px-5 py-4 font-medium">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {items.map((item) => (
              <tr key={item.id}>
                <td className="px-5 py-4 font-medium text-slate-900">{item.drawDate}</td>
                <td className="px-5 py-4 text-slate-600">{item.drawCode ?? "None"}</td>
                <td className="px-5 py-4">
                  <span className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-slate-700">
                    {item.status}
                  </span>
                </td>
                <td className="px-5 py-4 text-slate-600">{formatTimestamp(item.publishedAt)}</td>
                <td className="px-5 py-4 text-slate-600">{formatTimestamp(item.updatedAt)}</td>
                <td className="px-5 py-4">
                  <Link
                    className="inline-flex rounded-full border border-slate-300 px-4 py-2 font-medium text-slate-700 transition hover:border-slate-500 hover:text-slate-950"
                    href={`/admin/results/${item.id}`}
                  >
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
