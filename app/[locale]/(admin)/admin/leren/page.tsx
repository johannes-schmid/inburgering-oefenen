import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';

export const revalidate = 0;

const THEMES = [
  { id: 1, title: 'Geschiedenis en Geografie' },
  { id: 2, title: 'Staatsinrichting en Rechtsstaat' },
  { id: 3, title: 'Maatschappij en Samenleven' },
  { id: 4, title: 'Werk en Inkomen' },
  { id: 5, title: 'Gezondheid en Zorg' },
  { id: 6, title: 'Onderwijs' },
  { id: 7, title: 'Wonen' },
];

export default async function LerenAdminPage() {
  const supabase = await createClient();

  const { data: sections } = await supabase
    .from('leren_content')
    .select('id, theme_id, heading, sort_order, updated_at')
    .order('theme_id')
    .order('sort_order');

  const countsByTheme = THEMES.map(t => ({
    ...t,
    count: sections?.filter(s => s.theme_id === t.id).length ?? 0,
  }));

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-headline font-bold text-on-surface">Lessen</h1>
          <p className="text-on-surface-variant text-sm">
            {sections?.length ?? 0} secties over 7 thema's
            {(sections?.length ?? 0) === 0 && (
              <span className="ml-2 text-amber-600 font-medium">⚠ Nog geen inhoud geïmporteerd — run het import-script eerst</span>
            )}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {countsByTheme.map(theme => (
          <div key={theme.id} className="bg-white rounded-2xl shadow-[var(--shadow-card)] p-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="w-8 h-8 rounded-xl bg-primary/10 text-primary text-sm font-bold flex items-center justify-center">
                  {theme.id}
                </span>
                <div>
                  <p className="font-medium text-on-surface">{theme.title}</p>
                  <p className="text-xs text-on-surface-variant">{theme.count} secties</p>
                </div>
              </div>
              <Link
                href={`leren/${theme.id}`}
                className="flex items-center gap-2 bg-surface-container px-4 py-2 rounded-xl text-sm font-medium text-on-surface hover:bg-surface-container-high transition-colors"
              >
                <span className="material-symbols-outlined text-[18px]">edit</span>
                Bewerken
              </Link>
            </div>

            {sections && sections.filter(s => s.theme_id === theme.id).length > 0 && (
              <div className="mt-4 border-t border-outline-variant/30 pt-3 space-y-1">
                {sections.filter(s => s.theme_id === theme.id).map(s => (
                  <div key={s.id} className="flex items-center justify-between text-sm">
                    <span className="text-on-surface-variant">{s.heading}</span>
                    <Link
                      href={`leren/${theme.id}/section/${s.id}`}
                      className="text-primary hover:underline text-xs"
                    >
                      Bewerken
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
