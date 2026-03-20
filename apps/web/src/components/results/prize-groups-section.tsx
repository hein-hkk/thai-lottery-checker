import { prizeTypeMetadataByType } from "@thai-lottery-checker/domain";
import type { ResultsMessages } from "@thai-lottery-checker/i18n";
import type { PrizeGroup } from "@thai-lottery-checker/types";

interface PrizeGroupsSectionProps {
  messages: ResultsMessages;
  prizeGroups: PrizeGroup[];
}

export function PrizeGroupsSection({ messages, prizeGroups }: PrizeGroupsSectionProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {prizeGroups.map((prizeGroup) => (
        <PrizeGroupCard key={prizeGroup.type} messages={messages} prizeGroup={prizeGroup} />
      ))}
    </div>
  );
}

function PrizeGroupCard({ messages, prizeGroup }: { messages: ResultsMessages; prizeGroup: PrizeGroup }) {
  const metadata = prizeTypeMetadataByType[prizeGroup.type];
  const placeholderDigits = "•".repeat(metadata.digitLength);

  return (
    <section className="rounded-3xl border border-shell-border bg-white p-5 shadow-[0_12px_40px_rgba(18,49,79,0.06)]">
      <div className="flex items-start justify-between gap-3">
        <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">
          {messages.prizeLabels[prizeGroup.type]}
        </h2>
        <span
          className={`rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] ${
            prizeGroup.isReleased ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"
          }`}
        >
          {prizeGroup.isReleased ? "Released" : "Pending"}
        </span>
      </div>

      {prizeGroup.isReleased ? (
        <div className="mt-4 flex flex-wrap gap-2">
          {prizeGroup.numbers.map((number) => (
            <span
              key={`${prizeGroup.type}-${number}`}
              className="inline-flex rounded-2xl bg-shell-pill px-3 py-2 font-mono text-sm font-semibold tracking-[0.2em] text-slate-900"
            >
              {number}
            </span>
          ))}
        </div>
      ) : (
        <div className="mt-4">
          <span className="inline-flex rounded-2xl border border-dashed border-slate-300 px-3 py-2 font-mono text-sm font-semibold tracking-[0.2em] text-slate-500">
            {placeholderDigits} x {metadata.expectedCount}
          </span>
        </div>
      )}
    </section>
  );
}
