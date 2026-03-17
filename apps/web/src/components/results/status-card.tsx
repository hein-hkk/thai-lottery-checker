interface StatusCardProps {
  message: string;
}

export function StatusCard({ message }: StatusCardProps) {
  return (
    <div className="rounded-3xl border border-dashed border-shell-border bg-slate-50/80 p-8 text-center text-base text-slate-700">
      {message}
    </div>
  );
}
