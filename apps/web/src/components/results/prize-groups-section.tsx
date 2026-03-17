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
        <section
          key={prizeGroup.type}
          className="rounded-3xl border border-shell-border bg-white p-5 shadow-[0_12px_40px_rgba(18,49,79,0.06)]"
        >
          <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">
            {messages.prizeLabels[prizeGroup.type]}
          </h2>
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
        </section>
      ))}
    </div>
  );
}
