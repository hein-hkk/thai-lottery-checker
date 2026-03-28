import type { ReactNode } from "react";

interface AdminAuthShellProps {
  kicker: string;
  title: string;
  description: string;
  children: ReactNode;
}

export function AdminAuthShell({ kicker, title, description, children }: AdminAuthShellProps) {
  return (
    <main className="ui-page flex items-start px-4 py-10 md:px-6 md:py-16">
      <div className="ui-container flex justify-center">
        <section className="ui-panel w-full max-w-md p-6 md:p-8">
          <div className="space-y-2 pb-6">
            <p className="ui-kicker">{kicker}</p>
            <h1 className="ui-title text-[clamp(1.75rem,4vw,2.25rem)]">{title}</h1>
            <p className="ui-copy">{description}</p>
          </div>
          <div className="ui-divider pt-6">{children}</div>
        </section>
      </div>
    </main>
  );
}
