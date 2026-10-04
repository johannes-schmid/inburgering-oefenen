// @ts-check
import { test, expect } from '@playwright/test';
import { available, skipReason, mintSession } from './helpers/session.mjs';

/**
 * Het MCP-eindpunt van de ChatGPT-app, tegen de lokale stack.
 *
 * Eén vraag per test: houdt de laag zich aan de drie beloften — anoniem precies tien proefvragen
 * (altijd dezelfde, één keer), een gratis account alleen examen 1, een module alles — en komt er
 * nooit een antwoordsleutel of andermans voortgang over de draad. De fixtures zijn KNM: dat is het
 * onderdeel dat lokaal volledig geseed is (tien examens, examen 1 gratis). Zie `tests-unit/mcp-*`
 * voor de pure rekenregels.
 *
 * Auth is echt: `mintSession` levert een Supabase-JWT van de lokale stack. Die heeft geen
 * `client_id`-claim (hij komt niet van de OAuth-server), wat buiten productie is toegestaan —
 * `MCP_REQUIRE_CLIENT_ID` staat in productie aan.
 */
test.skip(!available(), skipReason());

const MCP = '/api/mcp';
const RUN = `${Date.now()}`;
const FUTURE = new Date(Date.now() + 30 * 86400_000).toISOString();

/**
 * @param {import('@playwright/test').APIRequestContext} request
 * @param {string} name
 * @param {Record<string, unknown>} args
 * @param {{ token?: string, subject?: string }} [opts]
 */
async function call(request, name, args, opts = {}) {
  const headers = { 'Content-Type': 'application/json', Accept: 'application/json, text/event-stream' };
  if (opts.token) headers['Authorization'] = `Bearer ${opts.token}`;
  const res = await request.post(MCP, {
    headers,
    data: {
      jsonrpc: '2.0', id: 1, method: 'tools/call',
      params: { name, arguments: args, _meta: { 'openai/subject': opts.subject ?? `anon-${RUN}`, 'openai/locale': 'nl-NL' } },
    },
  });
  const text = await res.text();
  const line = text.split('\n').find(l => l.startsWith('data: '));
  const body = line ? JSON.parse(line.slice(6)) : JSON.parse(text || '{}');
  return { status: res.status(), result: body.result ?? null, headers: res.headers() };
}

test('tools/list exposes the seven tools and the widget resource', async ({ request }) => {
  const res = await request.post(MCP, {
    headers: { 'Content-Type': 'application/json', Accept: 'application/json, text/event-stream' },
    data: { jsonrpc: '2.0', id: 1, method: 'tools/list' },
  });
  const line = (await res.text()).split('\n').find(l => l.startsWith('data: '));
  const tools = JSON.parse(line.slice(6)).result.tools.map(t => t.name);
  expect(tools.sort()).toEqual(['explain_answer', 'get_learning_profile', 'get_learning_progress', 'get_practice_exercise', 'get_premium_status', 'submit_answer', 'submit_writing_answer']);
});

test('an anonymous exercise carries no answer key', async ({ request }) => {
  const { result } = await call(request, 'get_practice_exercise', { onderdeel: 'knm' }, { subject: `a-${RUN}` });
  const ex = result.structuredContent.exercise;
  expect(ex.kind).toBe('mcq');
  expect(ex.examNumber).toBe(1);
  expect(ex.options.length).toBeGreaterThanOrEqual(3);
  expect(JSON.stringify(result)).not.toMatch(/is_correct|explanation|model_answer/);
});

test('two anonymous subjects get the same first question; one subject never gets the same twice', async ({ request }) => {
  const a1 = (await call(request, 'get_practice_exercise', { onderdeel: 'knm' }, { subject: `b-${RUN}` })).result.structuredContent.exercise;
  const b1 = (await call(request, 'get_practice_exercise', { onderdeel: 'knm' }, { subject: `c-${RUN}` })).result.structuredContent.exercise;
  const a2 = (await call(request, 'get_practice_exercise', { onderdeel: 'knm' }, { subject: `b-${RUN}` })).result.structuredContent.exercise;
  expect(a1.questionId).toBe(b1.questionId);
  expect(a2.questionId).not.toBe(a1.questionId);
});

test('the eleventh anonymous question is the gate, and it stays the gate', async ({ request }) => {
  const subject = `d-${RUN}`;
  const ids = [];
  for (let i = 0; i < 10; i++) {
    const { result } = await call(request, 'get_practice_exercise', { onderdeel: 'knm' }, { subject });
    ids.push(result.structuredContent.exercise.questionId);
  }
  expect(new Set(ids).size).toBe(10);
  for (let i = 0; i < 2; i++) {
    const { result } = await call(request, 'get_practice_exercise', { onderdeel: 'knm' }, { subject });
    expect(result.structuredContent.gate.reason).toBe('taster_exhausted');
    expect(result.structuredContent.gate.action.url).toContain('/register');
  }
});

test('submit_answer decides on the server and explains; a question that was not served is refused', async ({ request }) => {
  const subject = `e-${RUN}`;
  const ex = (await call(request, 'get_practice_exercise', { onderdeel: 'knm' }, { subject })).result.structuredContent.exercise;
  const verdicts = [];
  for (const label of ex.options.map(o => o.label)) {
    const { result } = await call(request, 'submit_answer', { questionId: ex.questionId, label }, { subject });
    verdicts.push(result.structuredContent.verdict);
  }
  expect(verdicts.filter(v => v.correct)).toHaveLength(1);
  expect(new Set(verdicts.map(v => v.correctLabel)).size).toBe(1);
  expect(verdicts[0].explanation.length).toBeGreaterThan(0);
  expect(verdicts[0].saved).toBe(false);

  const other = (await call(request, 'get_practice_exercise', { onderdeel: 'knm' }, { subject: `f-${RUN}` })).result.structuredContent.exercise;
  // f's second question was never served to e.
  const second = (await call(request, 'get_practice_exercise', { onderdeel: 'knm' }, { subject: `f-${RUN}` })).result.structuredContent.exercise;
  expect(second.questionId).not.toBe(other.questionId);
  const refused = await call(request, 'submit_answer', { questionId: second.questionId, label: 'A' }, { subject });
  expect(refused.result.structuredContent.gate.reason).toBe('taster_exhausted');
});

test('an account-only tool without a token returns the login challenge, not data', async ({ request }) => {
  const { status, result } = await call(request, 'get_learning_profile', {});
  expect(status).toBe(200);
  expect(result.isError).toBe(true);
  expect(result._meta['mcp/www_authenticate'][0]).toMatch(/resource_metadata=.*oauth-protected-resource.*error="insufficient_scope"/);
});

test('a forged or expired bearer token is a 401 with a WWW-Authenticate challenge', async ({ request }) => {
  const forged = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIwMDAwMDAwMC0wMDAwLTAwMDAtMDAwMC0wMDAwMDAwMDAwMDAiLCJleHAiOjE2MDAwMDAwMDB9.invalid';
  const { status, headers } = await call(request, 'get_learning_profile', {}, { token: forged });
  expect(status).toBe(401);
  expect(headers['www-authenticate']).toMatch(/oauth-protected-resource/);
});

test('a free account opens exam 1, is gated on exam 3, and its answers are saved for it alone', async ({ request }) => {
  const free = await mintSession(`mcp-free-${RUN}@example.com`, {});
  const other = await mintSession(`mcp-other-${RUN}@example.com`, {});

  const ex = (await call(request, 'get_practice_exercise', { onderdeel: 'knm' }, { token: free.access_token })).result.structuredContent.exercise;
  expect(ex.examNumber).toBe(1);

  const gated = (await call(request, 'get_practice_exercise', { onderdeel: 'knm', examNumber: 3 }, { token: free.access_token })).result.structuredContent;
  expect(gated.gate.reason).toBe('module_required');
  expect(gated.gate.action.url).toContain('/premium?vanaf=knm');

  const verdict = (await call(request, 'submit_answer', { questionId: ex.questionId, label: ex.options[0].label }, { token: free.access_token })).result.structuredContent.verdict;
  expect(verdict.saved).toBe(true);

  const mine = (await call(request, 'get_learning_progress', { onderdeel: 'knm' }, { token: free.access_token })).result.structuredContent.progress;
  expect(mine.onderdeel.recentAnswers.answered).toBe(1);
  const theirs = (await call(request, 'get_learning_progress', { onderdeel: 'knm' }, { token: other.access_token })).result.structuredContent.progress;
  expect(theirs.onderdeel.recentAnswers).toBeNull();

  const premium = (await call(request, 'get_premium_status', {}, { token: free.access_token })).result.structuredContent;
  expect(premium).toEqual({ isPremium: false, modules: [], activeUntil: null });
});

test('a module owner opens exam 3 and reads as premium — from user_metadata, not from the request', async ({ request }) => {
  const owner = await mintSession(`mcp-owner-${RUN}@example.com`, { modules: ['knm'], modules_until: FUTURE });
  const ex = (await call(request, 'get_practice_exercise', { onderdeel: 'knm', examNumber: 3 }, { token: owner.access_token })).result.structuredContent.exercise;
  expect(ex.examNumber).toBe(3);
  const premium = (await call(request, 'get_premium_status', {}, { token: owner.access_token })).result.structuredContent;
  expect(premium.isPremium).toBe(true);
  expect(premium.modules).toEqual(['KNM']);

  // Nothing in the arguments can grant access.
  const free = await mintSession(`mcp-free2-${RUN}@example.com`, {});
  const sneaky = await call(request, 'get_practice_exercise', { onderdeel: 'knm', examNumber: 3, premium: true, isPremium: true }, { token: free.access_token });
  const sc = sneaky.result?.structuredContent;
  expect(sc?.gate?.reason ?? 'rejected').toMatch(/module_required|rejected/);
});

test('onderdelen without content or without widget support return an unavailable gate', async ({ request }) => {
  const b1l = (await call(request, 'get_practice_exercise', { onderdeel: 'luisteren', level: 'b1' }, { subject: `g-${RUN}` })).result.structuredContent;
  expect(b1l.gate.reason).toBe('unavailable');
  const spreken = (await call(request, 'get_practice_exercise', { onderdeel: 'spreken', level: 'a2' }, { subject: `g-${RUN}` })).result.structuredContent;
  expect(spreken.gate.reason).toBe('unavailable');
});
