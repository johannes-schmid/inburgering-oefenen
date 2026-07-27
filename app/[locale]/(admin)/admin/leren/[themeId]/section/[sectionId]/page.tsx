import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import SectionEditor from './_SectionEditor';

export const revalidate = 0;

export default async function EditSectionPage({
  params,
}: {
  params: Promise<{ locale: string; themeId: string; sectionId: string }>;
}) {
  const { locale, themeId, sectionId } = await params;
  const supabase = await createClient();

  const { data: section } = await supabase
    .from('leren_content')
    .select('*')
    .eq('id', parseInt(sectionId))
    .single();

  if (!section) notFound();

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Link href={`/${locale}/admin/leren/${themeId}`} className="text-on-surface-variant hover:text-on-surface transition-colors">
          <span className="material-symbols-outlined text-[20px]">arrow_back</span>
        </Link>
        <div>
          <h1 className="text-xl font-headline font-bold text-on-surface">{section.heading}</h1>
          <p className="text-sm text-on-surface-variant">Sectie #{sectionId} · Thema {themeId}</p>
        </div>
      </div>

      <SectionEditor initial={section} locale={locale} themeId={themeId} />
    </div>
  );
}
