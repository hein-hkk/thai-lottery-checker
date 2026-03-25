interface StatusCardProps {
  message: string;
}

export function StatusCard({ message }: StatusCardProps) {
  return (
    <div className="ui-panel-dashed p-8 text-center text-base text-[var(--text-secondary)]">
      {message}
    </div>
  );
}
