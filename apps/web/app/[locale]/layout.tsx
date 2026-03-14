import { isSupportedLocale } from "@thai-lottery-checker/i18n";
import type { ReactNode } from "react";
import { notFound } from "next/navigation";

interface LocaleLayoutProps {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}

export default async function LocaleLayout({ children, params }: LocaleLayoutProps) {
  const { locale } = await params;

  if (!isSupportedLocale(locale)) {
    notFound();
  }

  return children;
}

