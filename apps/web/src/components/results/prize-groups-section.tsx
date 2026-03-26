import { prizeTypeMetadataByType } from "@thai-lottery-checker/domain";
import type { ResultsMessages } from "@thai-lottery-checker/i18n";
import type { PrizeGroup } from "@thai-lottery-checker/types";
import { CircleCheck, Clock3 } from "lucide-react";

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
    <section className="ui-panel p-5">
      <div className="flex items-start justify-between gap-3">
        <h2 className="text-sm font-semibold leading-6 text-[var(--text-secondary)]">{messages.prizeLabels[prizeGroup.type]}</h2>
        <span
          className={`${prizeGroup.isReleased ? "ui-badge-success" : "ui-badge-warning"} shrink-0`}
          aria-label={prizeGroup.isReleased ? "Released prize group" : "Pending prize group"}
          title={prizeGroup.isReleased ? "Released" : "Pending"}
        >
          {prizeGroup.isReleased ? <CircleCheck size={14} strokeWidth={2} /> : <Clock3 size={14} strokeWidth={2} />}
        </span>
      </div>

      {prizeGroup.isReleased ? (
        <div className="mt-4 flex flex-wrap gap-2">
          {prizeGroup.numbers.map((number) => (
            <span
              key={`${prizeGroup.type}-${number}`}
              className="inline-flex rounded-xl border border-[var(--border-default)] bg-[var(--surface-secondary)] px-3 py-2"
            >
              <span className="ui-number-compact text-[var(--text-primary)]">{number}</span>
            </span>
          ))}
        </div>
      ) : (
        <div className="mt-4">
          <span
            className="inline-flex rounded-xl border border-dashed border-[var(--border-strong)] bg-[var(--surface-secondary)] px-3 py-2"
            aria-label={`Pending release placeholder with ${metadata.expectedCount} values`}
          >
            <span className="ui-number-compact text-[var(--text-muted)]">
              {placeholderDigits} x {metadata.expectedCount}
            </span>
          </span>
        </div>
      )}
    </section>
  );
}
