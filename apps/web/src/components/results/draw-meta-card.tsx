import type { ResultsMessages } from "@thai-lottery-checker/i18n";

interface DrawMetaCardProps {
  messages: ResultsMessages;
  drawDate: string;
  drawCode: string | null;
  publishedAt: string | null;
}

export function DrawMetaCard({ messages, drawDate, drawCode, publishedAt }: DrawMetaCardProps) {
  return (
    <div className="ui-panel-muted grid gap-4 p-5 md:grid-cols-3">
      <div>
        <p className="ui-kicker">{messages.drawDate}</p>
        <p className="mt-2 text-lg font-semibold text-[var(--text-primary)]">{drawDate}</p>
      </div>
      <div>
        <p className="ui-kicker">{messages.drawCode}</p>
        <p className="mt-2 text-lg font-semibold text-[var(--text-primary)]">{drawCode ?? "-"}</p>
      </div>
      <div>
        <p className="ui-kicker">{messages.publishedAt}</p>
        <p className="mt-2 text-lg font-semibold text-[var(--text-primary)]">{publishedAt ?? "-"}</p>
      </div>
    </div>
  );
}
