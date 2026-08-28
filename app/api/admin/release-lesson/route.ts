import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requireAdmin } from '@/lib/admin/guard';

/**
 * Geef één les vrij, of trek hem terug.
 *
 * ── DIT IS DE REVIEWGATE, EN HIJ ZIT MAAR OP ÉÉN PLEK ────────────────────────
 * De seeder schrijft elke les `pending` en `fetchCourse` laat alleen `validated` lessen in een
 * blok zien. Deze route is de enige manier waarop dat verschuift, en er is bewust **geen
 * `--publish`-vlag** in de seeder: vrijgeven is een handeling van een mens.
 *
 * ── `requireAdmin` OMDAT EEN ROUTE GEEN LAYOUT BOVEN ZICH HEEFT ──────────────
 * De `(admin)`-layout beschermt pagina's; een route handler zit daarbuiten. Zonder deze guard
 * zou iedereen die het pad kent lessen kunnen publiceren — precies het gat dat
 * `/api/upload-pexels-image` had.
 *
 * ── `reviewed_by` KOMT UIT DE SESSIE ─────────────────────────────────────────
 * Niet uit de body. De publieke kant zegt dat er een docent naar heeft gekeken; die naam mag
 * dus niet iets zijn dat een client kan opgeven.
 */
export async function POST(req: Request) {
  const admin = await requireAdmin();
  if (!admin.ok) return NextResponse.json({ error: admin.error }, { status: admin.status });

  let body: { lessonId?: unknown; release?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'geen geldige body' }, { status: 400 });
  }

  const { lessonId, release } = body;
  if (!Number.isInteger(lessonId) || typeof release !== 'boolean') {
    return NextResponse.json({ error: 'lessonId en release zijn verplicht' }, { status: 400 });
  }

  const supabase = await createClient();

  const { data, error } = await supabase
    .from('lessons')
    .update(release
      ? {
        review_status: 'validated',
        // Uit de guard, dus uit de sessie — nooit uit de body.
        reviewed_by: admin.email,
        reviewed_on: new Date().toISOString().slice(0, 10),
      }
      : {
        review_status: 'pending',
        // Bij terugtrekken wordt de naam gewist: hij zou zeggen dat iemand het heeft
        // goedgekeurd terwijl het niet meer vrijgegeven is.
        reviewed_by: null,
        reviewed_on: null,
      })
    .eq('id', lessonId)
    .select('id');

  if (error) {
    console.error('[lessons] vrijgeven mislukt', error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Het aantal geraakte rijen teruggeven, want een RLS-weigering geeft hier 200 met nul rijen
  // en is anders niet van succes te onderscheiden.
  return NextResponse.json({ changed: data?.length ?? 0 });
}
