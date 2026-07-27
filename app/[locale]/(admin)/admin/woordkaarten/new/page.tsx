import Link from 'next/link';
import WoordkaartForm from '../_components/WoordkaartForm';

export default async function NewWoordkaartPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Link href={`/${locale}/admin/woordkaarten`} className="text-on-surface-variant hover:text-on-surface transition-colors">
          <span className="material-symbols-outlined text-[20px]">arrow_back</span>
        </Link>
        <h1 className="text-2xl font-headline font-bold text-on-surface">Nieuwe woordkaart</h1>
      </div>
      <WoordkaartForm locale={locale} />
    </div>
  );
}
