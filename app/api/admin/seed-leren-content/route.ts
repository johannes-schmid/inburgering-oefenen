import { createAdminClient } from '@/lib/supabase/admin';
import { NextResponse } from 'next/server';
import { THEMAS } from '@/data/leren';

export async function POST() {
  const supabase = createAdminClient();

  const rows = THEMAS.flatMap((thema, themaIdx) =>
    thema.sections.map((section, sectionIdx) => ({
      theme_id:   thema.id,
      anchor:     section.id,
      icon:       section.icon,
      heading:    section.title,
      subtitle:   section.subtitle,
      body_html:  section.contentHtml,
      sort_order: sectionIdx,
    }))
  );

  const { data, error } = await supabase
    .from('leren_content')
    .upsert(rows, { onConflict: 'theme_id,anchor', ignoreDuplicates: false })
    .select('id, theme_id, anchor');

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({
    seeded: data?.length ?? 0,
    expected: rows.length,
    message: `${data?.length ?? 0} secties geïmporteerd`,
    themas: THEMAS.map(t => ({ id: t.id, sections: t.sections.length })),
  });
}
