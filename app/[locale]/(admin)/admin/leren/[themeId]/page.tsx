import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';

export const revalidate = 0;

const THEMES: Record<number, string> = {
  1: 'Geschiedenis en Geografie',
  2: 'Staatsinrichting en Rechtsstaat',
  3: 'Maatschappij en Samenleven',
  4: 'Werk en Inkomen',
  5: 'Gezondheid en Zorg',
  6: 'Onderwijs',
  7: 'Wonen',
};

const THEME_SLUGS: Record<number, string> = {
  1: 'thema-1-geschiedenis-en-geografie',
  2: 'thema-2-staatsinrichting-en-rechtsstaat',
  3: 'thema-3-maatschappij-en-samenleven',
  4: 'thema-4-werk-en-inkomen',
  5: 'thema-5-gezondheid-en-zorg',
  6: 'thema-6-onderwijs',
  7: 'thema-7-wonen',
};

export default async function ThemeSectionsPage({
  params,
}: {
  params: Promise<{ locale: string; themeId: string }>;
}) {
  const { locale, themeId } = await params;
  const tid = parseInt(themeId);
  const supabase = await createClient();

  const { data: sections } = await supabase
    .from('leren_content')
    .select('id, anchor, heading, subtitle, sort_order, updated_at')
    .eq('theme_id', tid)
    .order('sort_order');

  const themeTitle = THEMES[tid] ?? `Thema ${tid}`;
  const slug = THEME_SLUGS[tid];

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Link href={`/${locale}/admin/leren`} className="text-on-surface-variant hover:text-on-surface transition-colors">
          <span className="material-symbols-outlined text-[20px]">arrow_back</span>
        </Link>
        <div>
          <h1 className="text-2xl font-headline font-bold text-on-surface">Thema {tid}: {themeTitle}</h1>
          <a
            href={`/${locale}/leren/${slug}`}
            target="_blank"
            className="text-sm text-primary hover:underline"
          >
            Bekijk les op site →
          </a>
        </div>
      </div>

      {(!sections || sections.length === 0) ? (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 text-center">
          <p className="text-amber-800 font-medium mb-2">Geen secties gevonden voor dit thema</p>
          <p className="text-sm text-amber-700">
            Run het import-script om de statische inhoud naar de database te importeren:<br />
            <code className="bg-amber-100 px-2 py-0.5 rounded text-xs mt-2 inline-block">
              PATH="/opt/homebrew/bin:$PATH" node scripts/import-leren-content.mjs
            </code>
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {sections.map((section, i) => (
            <div key={section.id} className="bg-white rounded-2xl shadow-[var(--shadow-card)] p-5 flex items-center gap-4">
              <span className="w-8 h-8 rounded-lg bg-surface-container text-on-surface-variant text-sm font-medium flex items-center justify-center shrink-0">
                {i + 1}
              </span>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-on-surface truncate">{section.heading}</p>
                <p className="text-xs text-on-surface-variant">{section.subtitle || section.anchor}</p>
              </div>
              <Link
                href={`${themeId}/section/${section.id}`}
                className="flex items-center gap-2 border border-outline-variant px-3 py-1.5 rounded-xl text-sm text-on-surface hover:bg-surface transition-colors shrink-0"
              >
                <span className="material-symbols-outlined text-[16px]">edit</span>
                Bewerken
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
