import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requireAdmin } from '@/lib/admin/guard';

/**
 * Zet of haal het nakijkstempel van één les.
 *
 * ── DIT IS NIET DEZELFDE HANDELING ALS VRIJGEVEN ─────────────────────────────
 * `/api/admin/release-lesson` beslist of een les in het portaal staat; deze route legt vast dat
 * een mens de inhoud heeft gelezen. Ze zaten tot 03-09 in één klik, waardoor de bewering waar de
 * hele USP op staat een bijproduct was van een publicatiebesluit. Zie de migratie
 * `20260903100000_lesson_checked.sql`.
 *
 * ── `requireAdmin` OMDAT EEN ROUTE GEEN LAYOUT BOVEN ZICH HEEFT ──────────────
 * De `(admin)`-layout beschermt pagina's, niet route handlers. Zonder deze guard kan iedereen die
 * het pad kent een les als "door een docent nagekeken" bestempelen — precies de claim die niet te
 * koop mag zijn.
 *
 * ── DE NAAM KOMT UIT DE SESSIE, NOOIT UIT DE BODY ────────────────────────────
 * `admin.email` komt uit de guard. Een naam uit de body zou betekenen dat de client kiest wie er
 * heeft nagekeken.
 */
export async function POST(req: Request) {
  const admin = await requireAdmin();
  if (!admin.ok) return NextResponse.json({ error: admin.error }, { status: admin.status });

  let body: { lessonId?: unknown; checked?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'geen geldige body' }, { status: 400 });
  }

  const { lessonId, checked } = body;
  if (!Number.isInteger(lessonId) || typeof checked !== 'boolean') {
    return NextResponse.json({ error: 'lessonId en checked zijn verplicht' }, { status: 400 });
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from('lessons')
    .update(checked
      ? { checked_by: admin.email, checked_on: new Date().toISOString().slice(0, 10) }
      : { checked_by: null, checked_on: null })
    .eq('id', lessonId)
    .select('id');

  if (error) {
    console.error('[lessons] nakijkstempel mislukt', error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Het aantal geraakte rijen, want een RLS-weigering geeft hier 200 met nul rijen.
  return NextResponse.json({ changed: data?.length ?? 0 });
}
