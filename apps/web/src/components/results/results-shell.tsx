import Link from "next/link";
import type { ReactNode } from "react";
import type { ResultsMessages } from "@thai-lottery-checker/i18n";
import type { SupportedLocale } from "@thai-lottery-checker/types";

interface ResultsShellProps {
  locale: SupportedLocale;
  messages: ResultsMessages;
  title: string;
  children: ReactNode;
}

export function ResultsShell({ locale, messages, title, children }: ResultsShellProps) {
  return (
    <main className="min-h-screen px-5 py-10 md:px-8">
      <section className="mx-auto max-w-6xl rounded-[2rem] border border-shell-border bg-white/90 p-6 shadow-[0_18px_60px_rgba(18,49,79,0.08)] backdrop-blur-sm md:p-10">
        <div className="flex flex-col gap-4 border-b border-shell-border pb-6 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm font-medium tracking-wide text-slate-500">{locale.toUpperCase()}</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-900 md:text-4xl">{title}</h1>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              className="inline-flex rounded-full bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800"
              href={`/${locale}/results`}
            >
              {messages.latestResults}
            </Link>
            <Link
              className="inline-flex rounded-full border border-shell-border bg-white px-4 py-2 text-sm font-medium text-slate-800 transition hover:bg-slate-50"
              href={`/${locale}/results/history`}
            >
              {messages.resultHistory}
            </Link>
          </div>
        </div>
        <div className="mt-8">{children}</div>
      </section>
    </main>
  );
}
