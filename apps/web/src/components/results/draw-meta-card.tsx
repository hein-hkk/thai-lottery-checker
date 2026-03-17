import type { ResultsMessages } from "@thai-lottery-checker/i18n";

interface DrawMetaCardProps {
  messages: ResultsMessages;
  drawDate: string;
  drawCode: string | null;
  publishedAt: string;
}

export function DrawMetaCard({ messages, drawDate, drawCode, publishedAt }: DrawMetaCardProps) {
  return (
    <div className="grid gap-4 rounded-3xl border border-shell-border bg-slate-50/80 p-5 md:grid-cols-3">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">{messages.drawDate}</p>
        <p className="mt-2 text-lg font-semibold text-slate-900">{drawDate}</p>
      </div>
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">{messages.drawCode}</p>
        <p className="mt-2 text-lg font-semibold text-slate-900">{drawCode ?? "-"}</p>
      </div>
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">{messages.publishedAt}</p>
        <p className="mt-2 text-lg font-semibold text-slate-900">{publishedAt}</p>
      </div>
    </div>
  );
}
