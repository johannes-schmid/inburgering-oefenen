import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import WoordkaartForm from '../../_components/WoordkaartForm';

export const revalidate = 0;

export default async function EditWoordkaartPage({ params }: { params: Promise<{ locale: string; id: string }> }) {
  const { locale, id } = await params;
  const supabase = await createClient();

  const { data: card } = await supabase
    .from('word_cards')
    .select('*')
    .eq('id', parseInt(id))
    .single();

  if (!card) notFound();

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Link href={`/${locale}/admin/woordkaarten`} className="text-on-surface-variant hover:text-on-surface transition-colors">
          <span className="material-symbols-outlined text-[20px]">arrow_back</span>
        </Link>
        <h1 className="text-2xl font-headline font-bold text-on-surface">
          {card.article && <span className="text-on-surface-variant mr-1">{card.article}</span>}
          {card.dutch}
        </h1>
      </div>
      <WoordkaartForm initial={card} locale={locale} />
    </div>
  );
}
