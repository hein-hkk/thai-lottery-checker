import { defaultLocale, getLocaleLabel, isSupportedLocale, supportedLocales } from "@thai-lottery-checker/i18n";
import type { SupportedLocale } from "@thai-lottery-checker/types";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getPublicEnv } from "../../src/config/env";

interface LocalePageProps {
  params: Promise<{ locale: string }>;
}

const copyByLocale: Record<SupportedLocale, { title: string; body: string }> = {
  en: {
    title: "Foundation skeleton",
    body: "The web workspace is running with locale-aware routing and shared package imports."
  },
  th: {
    title: "Foundation skeleton",
    body: "เว็บแอปพร้อมใช้งานด้วยเส้นทางหลายภาษาและการเชื่อมต่อแพ็กเกจร่วมแล้ว"
  },
  my: {
    title: "Foundation skeleton",
    body: "Localized routing and shared workspace packages are ready for the next slices."
  }
};

export default async function LocalePage({ params }: LocalePageProps) {
  const { locale } = await params;

  if (!isSupportedLocale(locale)) {
    notFound();
  }

  const publicEnv = getPublicEnv();
  const copy = copyByLocale[locale];

  return (
    <main className="min-h-screen px-5 py-12 md:px-8">
      <section className="mx-auto max-w-3xl rounded-3xl border border-shell-border bg-white/88 p-8 shadow-[0_18px_60px_rgba(18,49,79,0.08)] backdrop-blur-sm md:p-10">
        <p className="text-sm font-medium tracking-wide text-slate-500">{publicEnv.appUrl}</p>
        <h1 className="mt-4 text-4xl font-semibold tracking-tight text-slate-900">{copy.title}</h1>
        <p className="mt-4 text-base leading-7 text-slate-700">{copy.body}</p>
        <div className="mt-8 grid gap-3 text-sm text-slate-600">
          <p>
            <span className="font-semibold text-slate-900">Current locale:</span> {getLocaleLabel(locale)}
          </p>
          <p>
            <span className="font-semibold text-slate-900">Default locale:</span> {getLocaleLabel(defaultLocale)}
          </p>
        </div>
        <ul className="mt-8 flex flex-wrap gap-3">
          {supportedLocales.map((supportedLocale) => (
            <li key={supportedLocale}>
              <Link
                className="inline-flex rounded-full bg-shell-pill px-4 py-2 text-sm font-medium text-slate-800 transition hover:bg-sky-100"
                href={`/${supportedLocale}`}
              >
                {supportedLocale}
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
