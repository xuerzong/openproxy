import Link from 'next/link';
import { i18n } from '@/lib/i18n';

export default async function HomePage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;

  return (
    <div className="flex flex-col justify-center text-center flex-1">
      <h1 className="text-2xl font-bold mb-4">OpenProxy Docs</h1>
      <p>
        <Link href={`/${lang}/docs`} className="font-medium underline">
          {lang === 'zh' ? '打开文档' : 'Open documentation'}
        </Link>
      </p>
    </div>
  );
}

export function generateStaticParams() {
  return i18n.languages.map((lang) => ({ lang }));
}
