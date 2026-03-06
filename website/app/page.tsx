import Link from 'next/link';

export default function RootPage() {
  return (
    <main className="flex flex-col items-center justify-center min-h-screen gap-4">
      <h1 className="text-2xl font-bold">OpenProxy Docs</h1>
      <div className="flex items-center gap-4">
        <Link href="/zh/docs" className="underline font-medium">
          中文文档
        </Link>
        <Link href="/en/docs" className="underline font-medium">
          English Docs
        </Link>
      </div>
    </main>
  );
}
