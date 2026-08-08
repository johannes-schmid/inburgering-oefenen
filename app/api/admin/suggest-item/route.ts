import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin/guard';
import {
  suggestQuestion,
  suggestStimulus,
  type StimulusKind,
} from '@/lib/ai/suggest';
import { fetchStimulusText, fetchSuggestExamples } from '@/lib/ai/suggest-examples';
import { isLevel, isSkillSlug, formatRules } from '@/data/skills';
import { VOICES, type VoiceKey } from '@/lib/tts-voices';

/**
 * "Magisch invullen" — a whole item suggested from the material that already exists.
 *
 * Returns an object; **writes nothing**. Like `/api/admin/draft-content` it cannot change an item,
 * cannot publish one and cannot move `review_status` to `validated`. The suggestion lands in form
 * fields and the docent decides. See the header of `lib/ai/suggest.ts`.
 *
 * Admin-only, because it spends gateway credits per call — and because the few-shot examples it
 * reads are exam content.
 *
 * Everything the model returns is re-validated here rather than trusted:
 * - `section_id` must be one of *this* skill's tekstsoorten. A hallucinated id would be a
 *   foreign-key error at save time, three clicks later, with nothing pointing at why.
 * - `voice_cast` keys must be real voices, must appear in the script, and must not double up —
 *   `/api/generate-stimulus-audio` refuses all three, and refusing here means the docent finds out
 *   while looking at the casting table instead of at a failed generation.
 * - The option count is trimmed to the format's range and exactly one option is left correct,
 *   which is what `question_options_one_correct_idx` requires.
 */

const KINDS: StimulusKind[] = ['text', 'audio', 'image'];

/** One line of scenario, not a place to paste a document. */
const MAX_SCENARIO = 500;

type Body = {
  target?: unknown;
  level?: unknown;
  skill?: unknown;
  kind?: unknown;
  scenario?: unknown;
  sections?: unknown;
  stimulusId?: unknown;
};

export async function POST(request: Request) {
  const admin = await requireAdmin();
  if (!admin.ok) return NextResponse.json({ error: admin.error }, { status: admin.status });

  let body: Body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Ongeldige aanvraag.' }, { status: 400 });
  }

  const level = isLevel(body.level) ? body.level : null;
  if (!level) return NextResponse.json({ error: 'Onbekend niveau.' }, { status: 400 });

  const skill = typeof body.skill === 'string' ? body.skill : '';
  if (!isSkillSlug(skill)) return NextResponse.json({ error: 'Onbekend onderdeel.' }, { status: 400 });

  const scenario =
    typeof body.scenario === 'string' ? body.scenario.slice(0, MAX_SCENARIO).trim() : undefined;

  try {
    if (body.target === 'stimulus') {
      const kind = KINDS.find(k => k === body.kind);
      if (!kind) return NextResponse.json({ error: 'Onbekende soort fragment.' }, { status: 400 });

      const sections = Array.isArray(body.sections)
        ? body.sections
            .filter(
              (s): s is { id: number; name_nl: string } =>
                !!s &&
                typeof (s as { id?: unknown }).id === 'number' &&
                typeof (s as { name_nl?: unknown }).name_nl === 'string'
            )
            .map(s => ({ id: s.id, name_nl: s.name_nl }))
        : [];

      const examples = await fetchSuggestExamples(level, skill, kind);
      const out = await suggestStimulus({ level, skill, kind, scenario, sections, examples });

      const allowed = new Set(sections.map(s => s.id));
      const speakers = new Set(
        (out.script ?? '')
          .split(/\r?\n/)
          .map(line => line.match(/^\s*([^:\n]{1,30}?)\s*:/)?.[1]?.trim())
          .filter((s): s is string => !!s)
      );

      // Kept as an object because that is the shape of `stimuli.voice_cast`; built by hand so a
      // duplicate voice or an unknown speaker is dropped rather than saved.
      const takenVoices = new Set<VoiceKey>();
      const voiceCast: Record<string, string> = {};
      for (const entry of out.voice_cast ?? []) {
        if (!(entry.voice in VOICES)) continue;
        if (!speakers.has(entry.speaker)) continue;
        if (takenVoices.has(entry.voice)) continue;
        takenVoices.add(entry.voice);
        voiceCast[entry.speaker] = entry.voice;
      }

      return NextResponse.json({
        suggestion: {
          intro: out.intro ?? '',
          title: out.title ?? '',
          body_html: kind === 'text' ? (out.body_html ?? '') : '',
          script: kind === 'audio' ? (out.script ?? '') : '',
          voice_cast: kind === 'audio' ? voiceCast : {},
          image_alt: kind === 'image' ? (out.image_alt ?? '') : '',
          section_id:
            typeof out.section_id === 'number' && allowed.has(out.section_id) ? out.section_id : null,
          rationale: out.rationale ?? '',
        },
        groundedIn: examples.items.length,
      });
    }

    if (body.target === 'question') {
      const stimulusId = typeof body.stimulusId === 'number' ? body.stimulusId : null;
      if (!stimulusId) {
        return NextResponse.json(
          { error: 'Kies eerst een fragment — een vraag wordt bij een fragment bedacht.' },
          { status: 400 }
        );
      }

      const stimulusText = await fetchStimulusText(stimulusId);
      if (!stimulusText) {
        return NextResponse.json(
          { error: 'Dit fragment heeft nog geen tekst of script om een vraag bij te bedenken.' },
          { status: 400 }
        );
      }

      const examples = await fetchSuggestExamples(level, skill);
      const out = await suggestQuestion({ level, skill, scenario, examples, stimulusText });

      // The format's range is the authority on how many options an item has, not the model.
      const range = formatRules(level, skill).options;
      const [min, max] = range ?? [3, 4];
      const options = out.options.slice(0, max);
      if (options.length < min) {
        return NextResponse.json(
          { error: `Het voorstel had te weinig opties (${options.length} van ${min}). Probeer het nog eens.` },
          { status: 502 }
        );
      }

      // Exactly one correct, relabelled from A: `question_options_one_correct_idx` is a unique
      // partial index, so two correct rows cannot be saved at all — and zero would save fine and
      // leave a question with no answer key.
      const correctIndex = Math.max(0, options.findIndex(o => o.is_correct));
      const labels = ['A', 'B', 'C', 'D'] as const;

      return NextResponse.json({
        suggestion: {
          prompt: out.prompt ?? '',
          explanation: out.explanation ?? '',
          options: options.map((o, i) => ({
            label: labels[i],
            body: o.body ?? '',
            is_correct: i === correctIndex,
          })),
          rationale: out.rationale ?? '',
        },
        groundedIn: examples.items.length,
      });
    }

    return NextResponse.json({ error: 'Onbekend doel.' }, { status: 400 });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('[suggest-item]', body.target, message);
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
