import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/server';
import type { Level, OnderdeelSlug } from '@/data/skills';
import { clientIp } from '@/lib/grading-limits';
import { loginChallenge } from '../auth';
import { buildContext, type McpContext, type UserContext } from '../context';
import { nextExercise } from '../exercises';
import { checkMcq, explainQuestion } from '../answers';
import { submitWriting } from '../writing';
import { profile, progress } from '../progress';
import { tierFor, onderdeelLabel } from '../entitlement';
import { modulesFromMetadata, parseModuleId } from '@/lib/entitlements';
import { logEvent } from '../events';
import type { Gate, ToolOutcome } from '../types';

/**
 * De zeven tools van de ChatGPT-app.
 *
 * Elke tool is dun: context opbouwen (`buildContext`), de service aanroepen, het resultaat in
 * `structuredContent` zetten en één regel tekst voor het model. De beslissingen — wie mag wat,
 * welke vraag, goed of fout — staan in `lib/mcp/*` en worden daar getest.
 *
 * Een poort (`Gate`) is géén fout: het is een gewoon resultaat met `gate` erin, zodat het model
 * de kandidaat kan vertellen wat de volgende stap is. Alleen "er is geen account gekoppeld" op een
 * tool die er een vereist gaat als `isError` met `mcp/www_authenticate`, want dát is wat de
 * koppel-knop van ChatGPT laat verschijnen.
 */
const ONDERDEEL = z.enum(['lezen', 'luisteren', 'schrijven', 'spreken', 'knm']).describe(
  'Welk onderdeel: lezen, luisteren, schrijven, spreken of knm (Kennis van de Nederlandse Maatschappij).',
);
const LEVEL = z.enum(['a2', 'b1']).optional().describe('Het taalniveau, a2 of b1. Weglaten voor knm. Standaard a2.');
const LABEL = z.enum(['A', 'B', 'C', 'D']);

const WIDGET_URI = 'ui://inburgering-oefenen/exercise.html';

type ToolCtx = Parameters<typeof buildContext>[0];

function resolve(onderdeel: OnderdeelSlug, level: Level | undefined): { level: Level | null; onderdeel: OnderdeelSlug } {
  if (onderdeel === 'knm') return { level: null, onderdeel };
  return { level: level ?? 'a2', onderdeel };
}

function gateResult(gate: Gate, ctx: McpContext, tool: string, level?: Level | null, onderdeel?: OnderdeelSlug) {
  logEvent('chatgpt_premium_gate_shown', ctx, { tool, level, onderdeel, props: { reason: gate.reason } });
  const text = `${gate.title_nl}. ${gate.message_nl}${gate.action ? ` ${gate.action.label_nl}: ${gate.action.url}` : ''}`;
  return { content: [{ type: 'text' as const, text }], structuredContent: { gate } };
}

function loginRequired() {
  return {
    isError: true,
    content: [{ type: 'text' as const, text: 'Hiervoor moet een account van Inburgering Oefenen gekoppeld zijn.' }],
    _meta: { 'mcp/www_authenticate': [loginChallenge()] },
  };
}

function ipOf(ctx: ToolCtx): string | null {
  const req = ctx.http?.req;
  return req ? clientIp(req) : null;
}

export function registerTools(server: McpServer, widgetHtml: () => string): void {
  server.registerResource(
    'exercise-widget',
    WIDGET_URI,
    {
      title: 'Oefenvraag',
      description: 'De oefenvraag van Inburgering Oefenen als kaart: tekst of fragment, de vraag, de antwoorden en daarna de uitleg van de docent.',
      mimeType: 'text/html;profile=mcp-app',
    },
    async () => ({
      contents: [{
        uri: WIDGET_URI,
        mimeType: 'text/html;profile=mcp-app',
        text: widgetHtml(),
        _meta: {
          ui: { prefersBorder: true, csp: { connectDomains: [], resourceDomains: [new URL(process.env.NEXT_PUBLIC_SUPABASE_URL!).origin] } },
          'openai/widgetDescription': 'Een oefenvraag van Inburgering Oefenen met de antwoordopties; na het antwoord de uitleg van de docent.',
          'openai/widgetPrefersBorder': true,
        },
      }],
    }),
  );

  const widgetMeta = {
    ui: { resourceUri: WIDGET_URI },
    'openai/outputTemplate': WIDGET_URI,
    'openai/widgetAccessible': true,
  };

  server.registerTool(
    'get_practice_exercise',
    {
      title: 'Oefenvraag ophalen',
      description:
        'Geeft één echte oefenvraag voor het Nederlandse inburgeringsexamen uit de vragenbank van Inburgering Oefenen, ' +
        'geschreven en gecontroleerd door een NT2-docent. Gebruik dit als de gebruiker wil oefenen voor inburgering, ' +
        'bijvoorbeeld "geef me een A2 leesoefening", "ik wil lezen oefenen voor het inburgeringsexamen", "nog een KNM-vraag", ' +
        '"practice Dutch A2 reading", of een luister- of schrijfopdracht wil. Werkt ook zonder gekoppeld account. ' +
        'Verzin nooit zelf examenvragen; toon de vraag uit het resultaat en wacht op het antwoord van de gebruiker.',
      inputSchema: z.object({
        onderdeel: ONDERDEEL,
        level: LEVEL,
        mode: z.enum(['next', 'adaptive']).optional().describe('next = de volgende vraag; adaptive = oefen op zwakke punten.'),
        examNumber: z.number().int().min(1).max(10).optional().describe('Een specifiek oefenexamen (1–10). Weglaten voor de volgende passende vraag.'),
      }),
      annotations: { readOnlyHint: false, destructiveHint: false, openWorldHint: false, idempotentHint: false },
      _meta: {
        ...widgetMeta,
        securitySchemes: [{ type: 'noauth' }, { type: 'oauth2', scopes: [] }],
        'openai/toolInvocation/invoking': 'Oefenvraag ophalen…',
        'openai/toolInvocation/invoked': 'Oefenvraag klaar',
      },
    },
    async (args, toolCtx) => {
      const ctx = await buildContext(toolCtx as ToolCtx);
      const { level, onderdeel } = resolve(args.onderdeel, args.level);
      logEvent('chatgpt_tool_called', ctx, { tool: 'get_practice_exercise', level, onderdeel, tier: tierOf(ctx, level, onderdeel) });

      const out = await nextExercise(ctx, { level, onderdeel, mode: args.mode ?? 'next', examNumber: args.examNumber ?? null });
      if (!out.ok) return gateResult(out.gate, ctx, 'get_practice_exercise', level, onderdeel);

      const ex = out.data;
      logEvent('chatgpt_exercise_started', ctx, { tool: 'get_practice_exercise', level, onderdeel, tier: tierOf(ctx, level, onderdeel), props: { kind: ex.kind, examNumber: ex.examNumber } });

      const text = ex.kind === 'mcq'
        ? `Oefenvraag ${ex.onderdeelLabel} (examen ${ex.examNumber}${ex.section ? `, ${ex.section}` : ''}). Toon de vraag en de opties A–${ex.options[ex.options.length - 1].label}; vraag welke letter de gebruiker kiest en kijk na met submit_answer. Zeg niet zelf wat goed is.`
        : `Schrijfopdracht ${ex.onderdeelLabel} (examen ${ex.examNumber}). Toon de opdracht; laat de gebruiker de tekst schrijven en lever die in met submit_writing_answer.`;
      return { content: [{ type: 'text', text }], structuredContent: { exercise: ex } };
    },
  );

  server.registerTool(
    'submit_answer',
    {
      title: 'Antwoord nakijken',
      description:
        'Kijkt het gekozen antwoord (A, B, C of D) op een meerkeuze-oefenvraag na op de server en geeft terug of het goed is, ' +
        'wat het juiste antwoord is en de uitleg van de docent. Gebruik dit zodra de gebruiker een letter kiest na get_practice_exercise. ' +
        'Beoordeel nooit zelf; dit resultaat is het oordeel. Met een gekoppeld account wordt het antwoord in de voortgang opgeslagen.',
      inputSchema: z.object({
        questionId: z.number().int().describe("Het questionId uit get_practice_exercise (kan negatief zijn)."),
        label: LABEL.describe('De gekozen letter.'),
      }),
      annotations: { readOnlyHint: false, destructiveHint: false, openWorldHint: false, idempotentHint: false },
      _meta: {
        ...widgetMeta,
        securitySchemes: [{ type: 'noauth' }, { type: 'oauth2', scopes: [] }],
        'openai/toolInvocation/invoking': 'Antwoord nakijken…',
        'openai/toolInvocation/invoked': 'Nagekeken',
      },
    },
    async (args, toolCtx) => {
      const ctx = await buildContext(toolCtx as ToolCtx);
      logEvent('chatgpt_tool_called', ctx, { tool: 'submit_answer' });
      const out = await checkMcq(ctx, args.questionId, args.label);
      if (!out.ok) return gateResult(out.gate, ctx, 'submit_answer');
      const v = out.data;
      logEvent('chatgpt_answer_submitted', ctx, { tool: 'submit_answer', props: { correct: v.correct, saved: v.saved } });
      logEvent('chatgpt_exercise_completed', ctx, { tool: 'submit_answer', props: { questionId: v.questionId } });
      const text = v.correct
        ? `Goed: ${v.correctLabel} is juist. Uitleg van de docent: ${v.explanation}`
        : `Niet goed: de gebruiker koos ${v.chosenLabel}, het juiste antwoord is ${v.correctLabel}${v.correctBody ? ` (${v.correctBody})` : ''}. Uitleg van de docent: ${v.explanation}${v.taalregel ? ` Taalregel om te herhalen: ${v.taalregel.name} — ${v.taalregel.oneLiner} (${v.taalregel.url})` : ''}`;
      return { content: [{ type: 'text', text }], structuredContent: { verdict: v } };
    },
  );

  server.registerTool(
    'explain_answer',
    {
      title: 'Uitleg bij een vraag',
      description:
        'Geeft de uitleg van de docent bij een oefenvraag: waarom het juiste antwoord past bij de tekst en, als een letter is meegegeven, ' +
        'of die goed was. Gebruik dit als de gebruiker na het nakijken meer uitleg wil of de uitleg nog eens wil zien. ' +
        'De uitleg komt uit de vragenbank, niet van het model; vertaal of vereenvoudig hem gerust voor een A2-lezer.',
      inputSchema: z.object({
        questionId: z.number().int(),
        label: LABEL.optional().describe('De letter die de gebruiker koos, als die bekend is.'),
      }),
      annotations: { readOnlyHint: true, destructiveHint: false, openWorldHint: false, idempotentHint: true },
      _meta: { securitySchemes: [{ type: 'noauth' }, { type: 'oauth2', scopes: [] }] },
    },
    async (args, toolCtx) => {
      const ctx = await buildContext(toolCtx as ToolCtx);
      logEvent('chatgpt_tool_called', ctx, { tool: 'explain_answer' });
      const out = await explainQuestion(ctx, args.questionId, args.label ?? null);
      if (!out.ok) return gateResult(out.gate, ctx, 'explain_answer');
      const e = out.data;
      const text = `Juiste antwoord: ${e.correctLabel}${e.correctBody ? ` (${e.correctBody})` : ''}. Uitleg van de docent: ${e.explanation}${e.taalregel ? ` Taalregel: ${e.taalregel.name} — ${e.taalregel.oneLiner} (${e.taalregel.url})` : ''}`;
      return { content: [{ type: 'text', text }], structuredContent: { explanation: e } };
    },
  );

  server.registerTool(
    'submit_writing_answer',
    {
      title: 'Schrijfopdracht laten nakijken',
      description:
        'Levert de geschreven tekst voor een Schrijven-opdracht in en laat die nakijken met de rubriek van de docent. ' +
        'Gebruik dit na get_practice_exercise met onderdeel schrijven, zodra de gebruiker de tekst af heeft. Vereist een gekoppeld account.',
      inputSchema: z.object({
        taskId: z.number().int().positive().describe('Het taskId uit get_practice_exercise.'),
        text: z.string().min(1).max(4000).describe('De tekst van de gebruiker, letterlijk.'),
      }),
      annotations: { readOnlyHint: false, destructiveHint: false, openWorldHint: false, idempotentHint: false },
      _meta: {
        ...widgetMeta,
        securitySchemes: [{ type: 'oauth2', scopes: [] }],
        'openai/toolInvocation/invoking': 'Tekst nakijken…',
        'openai/toolInvocation/invoked': 'Nagekeken',
      },
    },
    async (args, toolCtx) => {
      const ctx = await buildContext(toolCtx as ToolCtx);
      if (ctx.kind !== 'user') return loginRequired();
      logEvent('chatgpt_tool_called', ctx, { tool: 'submit_writing_answer', onderdeel: 'schrijven' });
      const out = await submitWriting(ctx, args.taskId, args.text, ipOf(toolCtx as ToolCtx));
      if (!out.ok) return gateResult(out.gate, ctx, 'submit_writing_answer', null, 'schrijven');
      const v = out.data;
      logEvent('chatgpt_exercise_completed', ctx, { tool: 'submit_writing_answer', onderdeel: 'schrijven', props: { taskId: v.taskId } });
      const crit = v.criteria.map(c => `${c.key}: ${c.score}/${c.maxScore}${c.feedback ? ` — ${c.feedback}` : ''}`).join('; ');
      return { content: [{ type: 'text', text: `Nagekeken. ${v.overall ?? ''} Criteria: ${crit}. Tips: ${v.tips.join(' ')}` }], structuredContent: { writing: v } };
    },
  );

  server.registerTool(
    'get_learning_profile',
    {
      title: 'Leerprofiel',
      description:
        'Het leerprofiel van het gekoppelde account van Inburgering Oefenen: welke onderdelen en niveaus de gebruiker oefent, ' +
        'welke modules hij heeft, en de taalregels die het vaakst misgaan. Gebruik dit om te personaliseren voordat je een oefening kiest. Vereist een gekoppeld account.',
      inputSchema: z.object({}),
      annotations: { readOnlyHint: true, destructiveHint: false, openWorldHint: false, idempotentHint: true },
      _meta: { securitySchemes: [{ type: 'oauth2', scopes: [] }], 'openai/profile': true },
    },
    async (_args, toolCtx) => {
      const ctx = await buildContext(toolCtx as ToolCtx);
      if (ctx.kind !== 'user') return loginRequired();
      logEvent('chatgpt_tool_called', ctx, { tool: 'get_learning_profile' });
      const p = await profile(ctx);
      const text = p.active.length
        ? `Oefent: ${p.active.map(a => `${a.label} (${a.examsDone} examens, gemiddeld ${a.averagePct ?? '–'}%)`).join(', ')}. Modules: ${p.ownedModules.join(', ') || 'geen'}. Zwakke taalregels: ${p.weakConcepts.join(', ') || 'nog niet bekend'}.`
        : `Nog geen oefenexamens gemaakt. Modules: ${p.ownedModules.join(', ') || 'geen'}.`;
      return { content: [{ type: 'text', text }], structuredContent: { profile: p } };
    },
  );

  server.registerTool(
    'get_learning_progress',
    {
      title: 'Voortgang',
      description:
        'Een korte voortgangssamenvatting voor één onderdeel van het gekoppelde account: hoeveel examens gedaan, gemiddelde score, ' +
        'de zwakste vaardigheden en taalregels, en wat de beste volgende stap is. Gebruik dit bij "hoe sta ik ervoor" of "waar moet ik aan werken". Vereist een gekoppeld account.',
      inputSchema: z.object({ onderdeel: ONDERDEEL, level: LEVEL }),
      annotations: { readOnlyHint: true, destructiveHint: false, openWorldHint: false, idempotentHint: true },
      _meta: { securitySchemes: [{ type: 'oauth2', scopes: [] }] },
    },
    async (args, toolCtx) => {
      const ctx = await buildContext(toolCtx as ToolCtx);
      if (ctx.kind !== 'user') return loginRequired();
      const { level, onderdeel } = resolve(args.onderdeel, args.level);
      logEvent('chatgpt_tool_called', ctx, { tool: 'get_learning_progress', level, onderdeel });
      const p = await progress(ctx, level, onderdeel);
      const s = p.onderdeel!;
      const next = p.suggestion.kind === 'lesson' ? `Volgende stap: les over ${p.suggestion.title} (${p.suggestion.url}).`
        : p.suggestion.kind === 'exam' ? `Volgende stap: oefenexamen ${p.suggestion.examNumber}.` : 'Volgende stap: een paar oefenvragen maken.';
      const recent = s.recentAnswers ? ` Losse oefenvragen (30 dagen): ${s.recentAnswers.correct} van ${s.recentAnswers.answered} goed.` : '';
      const text = `${s.label}: ${s.examsDone} examens gedaan, gemiddeld ${s.averagePct ?? '–'}%.${recent} Zwakste vaardigheden: ${p.skills.slice(0, 3).map(k => `${k.label} ${k.pct ?? '–'}%`).join(', ') || 'nog te weinig antwoorden'}. ${next}`;
      return { content: [{ type: 'text', text }], structuredContent: { progress: p } };
    },
  );

  server.registerTool(
    'get_premium_status',
    {
      title: 'Toegang en modules',
      description:
        'Welke onderdelen en oefenexamens het gekoppelde account van Inburgering Oefenen kan openen. Gebruik dit als de gebruiker vraagt ' +
        'wat hij kan doen of waarom iets niet beschikbaar is. Vereist een gekoppeld account.',
      inputSchema: z.object({}),
      annotations: { readOnlyHint: true, destructiveHint: false, openWorldHint: false, idempotentHint: true },
      _meta: { securitySchemes: [{ type: 'oauth2', scopes: [] }] },
    },
    async (_args, toolCtx) => {
      const ctx = await buildContext(toolCtx as ToolCtx);
      if (ctx.kind !== 'user') return loginRequired();
      logEvent('chatgpt_tool_called', ctx, { tool: 'get_premium_status' });
      const modules = modulesFromMetadata(ctx.meta).map(parseModuleId).filter((m): m is NonNullable<typeof m> => m !== null).map(m => onderdeelLabel(m.level, m.skill));
      const until = typeof ctx.meta.modules_until === 'string' ? ctx.meta.modules_until.slice(0, 10) : null;
      const data = { isPremium: modules.length > 0, modules, activeUntil: until };
      return {
        content: [{ type: 'text', text: data.isPremium ? `Modules: ${modules.join(', ')}${until ? ` (toegang tot ${until})` : ''}.` : 'Geen betaalde module; oefenexamen 1 van elk onderdeel is gratis.' }],
        structuredContent: data,
      };
    },
  );
}

function tierOf(ctx: McpContext, level: Level | null, onderdeel: OnderdeelSlug) {
  return ctx.kind === 'user' ? tierFor((ctx as UserContext).meta, level, onderdeel) : 'anonymous';
}

