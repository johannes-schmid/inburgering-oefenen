import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { fetchConceptAdvice } from '@/lib/lessons/concepts-server';
import { isLevel, isOnderdeelSlug } from '@/data/skills';

/**
 * Welke concepten verklaren deze foute antwoorden?
 *
 * Dit is de remediatie na een examen, en het is de reden dat de conceptenlaag bestaat en niet
 * alleen een tweede contentsoort is: zonder dit weet een kandidaat dát het fout ging en niet
 * wát hij moet leren.
 *
 * Een route en geen serverpropje, omdat `ExamShell` een clientcomponent is die het
 * resultaatscherm pas na inzending rendert — op dat moment is bekend welke vragen fout waren,
 * en dat is precies de input. Het vooraf meegeven zou betekenen dat de concepten van álle
 * vragen in de paginapayload staan, inclusief die van de vragen die de kandidaat goed had.
 *
 * Geeft een **lege lijst** als er niets getagd is. Dat is de eerlijke uitkomst: een examen
 * waarvan de items nog niet aan concepten hangen kan niets aanbevelen, en het scherm laat de
 * sectie dan weg in plaats van iets te verzinnen.
 */
export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'niet ingelogd' }, { status: 401 });

  let body: { wrongQuestionIds?: unknown; level?: unknown; onderdeel?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'geen geldige body' }, { status: 400 });
  }

  const { wrongQuestionIds, level, onderdeel } = body;
  if (!Array.isArray(wrongQuestionIds) || typeof level !== 'string' || typeof onderdeel !== 'string') {
    return NextResponse.json({ error: 'wrongQuestionIds, level en onderdeel zijn verplicht' }, { status: 400 });
  }
  if (!isLevel(level) || !isOnderdeelSlug(onderdeel)) {
    return NextResponse.json({ error: 'onbekend niveau of onderdeel' }, { status: 400 });
  }

  const ids = wrongQuestionIds.filter((n): n is number => Number.isInteger(n)).slice(0, 200);
  const advice = await fetchConceptAdvice(ids, level, onderdeel);

  return NextResponse.json({
    advice: advice.map(a => ({
      slug: a.concept.slug,
      name: a.concept.name_nl,
      one_liner: a.concept.one_liner,
      misses: a.misses,
      href: a.href,
      lessonTitle: a.lessonTitle,
    })),
  });
}
