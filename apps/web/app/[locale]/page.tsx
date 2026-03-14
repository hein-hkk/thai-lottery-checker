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
    <main className="shell">
      <section className="panel">
        <p>{publicEnv.appUrl}</p>
        <h1>{copy.title}</h1>
        <p>{copy.body}</p>
        <p>Current locale: {getLocaleLabel(locale)}</p>
        <p>Default locale: {getLocaleLabel(defaultLocale)}</p>
        <ul className="locale-list">
          {supportedLocales.map((supportedLocale) => (
            <li key={supportedLocale}>
              <Link className="locale-pill" href={`/${supportedLocale}`}>
                {supportedLocale}
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}

