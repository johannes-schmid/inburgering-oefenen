import { fetchPortalProgress } from '@/lib/portal-progress';
import { fetchKnmThemeWeakness, fetchSkillWeakness, type WeaknessRow } from '@/lib/vaardigheden-server';
import { modulesFromMetadata, parseModuleId } from '@/lib/entitlements';
import { LEVELS, SKILLS, isKnm, type Level, type OnderdeelSlug } from '@/data/skills';
import type { UserContext } from './context';
import { onderdeelLabel, siteUrl } from './entitlement';

/**
 * Het profiel en de voortgang voor een gekoppeld account — het minimum dat ChatGPT nodig heeft
 * om te personaliseren, uit de bestaande rekenlaag van het portaal.
 *
 * `fetchPortalProgress` en `fetchSkillWeakness` filteren zelf op `userId`; die krijgen hier de
 * geverifieerde id uit het token en nooit iets uit de aanroep. Er gaat geen e-mail, naam of
 * betaalgegeven mee: alleen tellingen, percentages en namen van taalregels.
 */
export type OnderdeelSummary = {
  level: Level | null;
  onderdeel: OnderdeelSlug;
  label: string;
  examsDone: number;
  averagePct: number | null;
  nextExamNumber: number;
  /** Losse antwoorden van de laatste dertig dagen (ChatGPT en dashboard), buiten een zitting. */
  recentAnswers: { answered: number; correct: number } | null;
};

export type Profile = {
  ownedModules: string[];
  active: OnderdeelSummary[];
  weakConcepts: string[];
};

export async function profile(ctx: UserContext): Promise<Profile> {
  const [all, recentByOnderdeel] = await Promise.all([fetchPortalProgress(ctx.userId), recentAnswers(ctx)]);
  const active: OnderdeelSummary[] = [];
  for (const level of LEVELS) {
    for (const s of SKILLS) {
      const p = all[level][s.slug];
      const recent = recentByOnderdeel.get(`${level}:${s.slug}`) ?? null;
      if (p.examsDone > 0 || recent) active.push({ level, onderdeel: s.slug, label: onderdeelLabel(level, s.slug), examsDone: p.examsDone, averagePct: p.averagePct, nextExamNumber: p.nextExamNumber, recentAnswers: recent });
    }
  }
  const recentKnm = recentByOnderdeel.get('knm') ?? null;
  if (all.knm.examsDone > 0 || recentKnm) active.push({ level: null, onderdeel: 'knm', label: 'KNM', examsDone: all.knm.examsDone, averagePct: all.knm.averagePct, nextExamNumber: all.knm.nextExamNumber, recentAnswers: recentKnm });

  const ownedModules = modulesFromMetadata(ctx.meta)
    .map(parseModuleId)
    .filter((m): m is NonNullable<typeof m> => m !== null)
    .map(m => onderdeelLabel(m.level, m.skill));

  const weak = new Set<string>();
  for (const a of active.slice(0, 3)) {
    const rows = await weaknessRows(ctx.userId, a.level, a.onderdeel);
    for (const r of weakestFirst(rows).slice(0, 2)) for (const c of r.concepts.slice(0, 1)) weak.add(c.name);
  }

  return { ownedModules, active, weakConcepts: [...weak].slice(0, 5) };
}

export type Progress = {
  onderdeel: OnderdeelSummary | null;
  skills: { label: string; pct: number | null; answered: number }[];
  weakConcepts: { name: string; lessonUrl: string | null }[];
  suggestion: { kind: 'lesson'; title: string; url: string } | { kind: 'exam'; examNumber: number } | { kind: 'practice' };
};

export async function progress(ctx: UserContext, level: Level | null, onderdeel: OnderdeelSlug): Promise<Progress> {
  const [all, recentByOnderdeel] = await Promise.all([fetchPortalProgress(ctx.userId), recentAnswers(ctx)]);
  const bucket = isKnm(onderdeel) || level === null ? all.knm : all[level][onderdeel as Exclude<OnderdeelSlug, 'knm'>];
  const summary: OnderdeelSummary = {
    level, onderdeel, label: onderdeelLabel(level, onderdeel),
    examsDone: bucket.examsDone, averagePct: bucket.averagePct, nextExamNumber: bucket.nextExamNumber,
    recentAnswers: recentByOnderdeel.get(isKnm(onderdeel) || level === null ? 'knm' : `${level}:${onderdeel}`) ?? null,
  };

  const rows = weakestFirst(await weaknessRows(ctx.userId, level, onderdeel));
  const skills = rows.slice(0, 6).map(r => ({ label: r.label, pct: r.pct, answered: r.n }));
  const weakConcepts = rows
    .flatMap(r => r.concepts)
    .slice(0, 3)
    .map(c => ({ name: c.name, lessonUrl: c.href ? `${siteUrl()}${c.href}?utm_source=chatgpt&utm_medium=app` : null }));

  const lesson = weakConcepts.find(c => c.lessonUrl);
  const suggestion: Progress['suggestion'] = lesson
    ? { kind: 'lesson', title: lesson.name, url: lesson.lessonUrl! }
    : (summary.recentAnswers?.answered ?? 0) >= 10 || bucket.examsDone > 0
      ? { kind: 'exam', examNumber: bucket.nextExamNumber }
      : { kind: 'practice' };

  return { onderdeel: summary, skills, weakConcepts, suggestion };
}

/**
 * Losse antwoorden (zonder zitting) van de laatste dertig dagen, geteld per onderdeel via het
 * examen van de vraag — dezelfde join als `fetchSkillWeakness`, zodat de taster-antwoorden van een
 * ander onderdeel er vanzelf buiten vallen.
 */
async function recentAnswers(ctx: UserContext): Promise<Map<string, { answered: number; correct: number }>> {
  const since = new Date(Date.now() - 30 * 86_400_000).toISOString();
  const { data } = await ctx.db
    .from('user_question_results')
    .select('was_correct, question:questions!inner ( exam:exams!inner ( level, skill ) )')
    .eq('user_id', ctx.userId)
    .is('attempt_id', null)
    .gte('answered_at', since)
    .limit(5000);
  const out = new Map<string, { answered: number; correct: number }>();
  type Row = { was_correct: boolean; question: { exam: { level: string | null; skill: string } | null } | null };
  for (const r of (data ?? []) as unknown as Row[]) {
    const exam = r.question?.exam;
    if (!exam) continue;
    const key = exam.skill === 'knm' ? 'knm' : `${exam.level}:${exam.skill}`;
    const cur = out.get(key) ?? { answered: 0, correct: 0 };
    cur.answered += 1;
    if (r.was_correct) cur.correct += 1;
    out.set(key, cur);
  }
  return out;
}

async function weaknessRows(userId: string, level: Level | null, onderdeel: OnderdeelSlug): Promise<WeaknessRow[]> {
  const w = isKnm(onderdeel) || level === null
    ? await fetchKnmThemeWeakness(userId)
    : await fetchSkillWeakness(userId, level, onderdeel);
  return w?.rows ?? [];
}

function weakestFirst(rows: WeaknessRow[]): WeaknessRow[] {
  return [...rows].filter(r => r.pct !== null).sort((a, b) => (a.pct ?? 100) - (b.pct ?? 100));
}
