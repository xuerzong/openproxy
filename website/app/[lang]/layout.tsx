import type { ReactNode } from 'react';
import { notFound } from 'next/navigation';
import { Provider } from '@/components/provider';
import { i18n } from '@/lib/i18n';

export default async function LangLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;

  if (!i18n.languages.includes(lang as (typeof i18n.languages)[number])) {
    notFound();
  }

  return <Provider locale={lang}>{children}</Provider>;
}
