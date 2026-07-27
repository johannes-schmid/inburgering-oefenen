import { revalidatePath, revalidateTag } from 'next/cache';
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: adminRow } = await supabase
    .from('admin_users')
    .select('email')
    .eq('email', user.email!)
    .maybeSingle();

  if (!adminRow) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const body = await req.json().catch(() => ({}));
  const { themeId, all } = body;

  const THEME_SLUGS: Record<number, string> = {
    1: 'thema-1-geschiedenis-en-geografie',
    2: 'thema-2-staatsinrichting-en-rechtsstaat',
    3: 'thema-3-maatschappij-en-samenleven',
    4: 'thema-4-werk-en-inkomen',
    5: 'thema-5-gezondheid-en-zorg',
    6: 'thema-6-onderwijs',
    7: 'thema-7-wonen',
  };

  if (all) {
    for (const slug of Object.values(THEME_SLUGS)) {
      revalidatePath(`/nl/leren/${slug}`, 'page');
      revalidatePath(`/en/leren/${slug}`, 'page');
    }
    revalidateTag('leren-content', 'leren-content');
  } else if (themeId && THEME_SLUGS[themeId as number]) {
    revalidatePath(`/nl/leren/${THEME_SLUGS[themeId as number]}`, 'page');
    revalidatePath(`/en/leren/${THEME_SLUGS[themeId as number]}`, 'page');
  }

  return NextResponse.json({ revalidated: true });
}
