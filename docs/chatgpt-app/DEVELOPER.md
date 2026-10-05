# De ChatGPT-app — ontwikkelaarsdocument

Hoe een kandidaat in ChatGPT oefent met de échte vragenbank van Inburgering Oefenen, zonder dat
er een tweede systeem bij komt. Gebouwd 2026-10-04 op de OpenAI Apps SDK (MCP + MCP Apps UI) en de
OAuth 2.1-server van Supabase Auth. Lees `CLAUDE.md` §2–§4 eerst; dit document gaat alleen over
wat er voor ChatGPT bij kwam.

## 1. Architectuur

```
ChatGPT ──Streamable HTTP──▶ POST /api/mcp                 app/api/mcp/route.ts   (mcp-handler 2 + @modelcontextprotocol/server 2)
                             GET  /.well-known/oauth-protected-resource            → authorization_servers: [<SUPABASE_URL>/auth/v1]
                                       │ Authorization: Bearer <Supabase OAuth-token>
                                       ▼
   lib/mcp/auth.ts          token → { userId, clientId }      (jose + JWKS; HS256 via auth.getUser)
   lib/mcp/context.ts       user-context (RLS-client op het token) óf anonieme context (gehasht openai/subject)
   lib/mcp/entitlement.ts   anonymous | connected | module → mag dit? zo niet: welke poort?
   lib/mcp/exercises.ts     de volgende vraag        ← fetchExamContent, fetchDbFreePractice, fetchSkillWeakness
   lib/mcp/answers.ts       nakijken + opslaan        → question_options.is_correct, user_question_results
   lib/mcp/writing.ts       Schrijven inleveren       → open_submissions + lib/grading/grade-submission.ts
   lib/mcp/progress.ts      profiel en voortgang      ← fetchPortalProgress, fetchSkillWeakness, fetchKnmThemeWeakness
   lib/mcp/events.ts        analytics                 → mcp_events
   lib/mcp/tools/register.ts  de zeven tools + de widget-resource
   widgets/exercise/        het widget (React, Vite → widgets/dist/exercise.js, inline in ui://…)
Toestemming:  Supabase /auth/v1/oauth/authorize ──▶ /[locale]/oauth/consent?authorization_id=…   (app/[locale]/(auth)/oauth/consent)
```

**Principe:** de SaaS is de bron van waarheid, ChatGPT is een client. Geen tweede gebruikerssysteem,
geen tweede vragenbank, geen tweede abonnement. Alles wat beslist (toegang, goed/fout, voortgang) staat
in `lib/mcp/*` en roept de bestaande functies van de site aan.

## 2. Het MCP-eindpunt

- URL: `MCP_RESOURCE_URL` — productie `https://inburgeringoefenen.nl/api/mcp`, lokaal
  `http://localhost:3001/api/mcp` (of de tunnel-URL).
- Transport: Streamable HTTP, stateless (mcp-handler 2.x serveert de 2026-07-28-spec en valt terug
  voor oudere clients). `GET/POST/DELETE` op dezelfde route.
- Auth is **optioneel op het eindpunt** (`withMcpAuth({ required: false })`): zonder token draait de
  aanroep anoniem, mét ongeldig token komt er een 401 met `WWW-Authenticate`. Tools die een account
  vereisen geven zelf `isError` + `_meta["mcp/www_authenticate"]` terug; dát opent de koppel-UI van
  ChatGPT.
- Serverinstructies (eerste 512 tekens tellen): nooit zelf examenvragen verzinnen, nooit zelf
  beoordelen, een `gate` in de taal van de gebruiker uitleggen, betalen alleen op de website.

## 3. De authenticatie

Supabase Auth is de **autorisatieserver** (Dashboard → Authentication → OAuth Server). ChatGPT
ontdekt hem via `/.well-known/oauth-protected-resource` op onze origin, registreert zichzelf met
**Dynamic Client Registration** (Supabase kent nog geen CIMD — supabase/auth#2850) en doorloopt
authorization-code + PKCE (S256). Supabase stuurt de kandidaat naar **onze** toestemmingspagina:

1. `/nl/oauth/consent?authorization_id=…` — niet ingelogd → de gewone Google-login (`AuthPanel`)
   met deze pagina als `next`; ingelogd → de kaart "Toegang geven?" (`ConsentPanel.tsx`).
2. `supabase.auth.oauth.getAuthorizationDetails(id)` → wie vraagt wat; `approveAuthorization` /
   `denyAuthorization` → `redirect_url` terug naar ChatGPT. Een herhaalde aanvraag van dezelfde
   client keurt Supabase zelf goed (de kaart verschijnt dan niet meer).
3. ChatGPT wisselt de code bij `/auth/v1/oauth/token` en krijgt een **gewone Supabase-gebruikers-JWT**
   met `sub` = `auth.users.id`, `aud = authenticated`, `client_id` = de OAuth-client, plus een refresh
   token.

**Verificatie per aanroep** (`lib/mcp/auth.ts`): handtekening tegen de JWKS van het project (ES256;
bij HS256 laat GoTrue zelf valideren via `auth.getUser(token)`), `iss` = `<SUPABASE_URL>/auth/v1`,
`exp`, `sub` uuid, `aud` bevat `authenticated`, en in productie **`client_id` verplicht** — een
gelekte browsersessie is geen MCP-toegang. Supabase geeft (nog) geen scopes uit; scopes staan daarom
per tool in `securitySchemes` en de toegang wordt in `entitlement.ts` beslist, niet aan het token.

Omdat het token een echte gebruikers-JWT is, bouwt `context.ts` er een supabase-js-client mee
(`Authorization: Bearer`) en geldt **RLS precies zoals in de browser**: `user_question_results` en
`open_submissions` worden als de kandidaat geschreven. De sleutels (`is_correct`, `explanation`,
rubrieken) worden met de service-sleutel gelezen en verlaten de server niet.

**Status (04-10):** lokaal volledig doorlopen — publieke client, PKCE, `resource`-parameter,
toestemming, code-wissel, refresh, geverifieerde `whoami`. Lokaal (GoTrue v2.194) wordt `offline_access`
nog geweigerd; de gehoste project-GoTrue adverteert die scope wél. De koppeling met ChatGPT zelf
vereist de dashboardstappen uit §8 door de eigenaar; supabase/auth#2820 (open, 20-09) meldt 400's op
een gehost project die lokaal níét reproduceren — controleer dat als eerste bij een rode spike.

## 4. De tools

| Tool | Auth | Doet | Bron |
|---|---|---|---|
| `get_practice_exercise` | noauth + oauth2 | de volgende vraag voor (`onderdeel`, `level`, `mode`, `examNumber?`); rendert het widget | `exercises.ts` |
| `submit_answer` | noauth + oauth2 | kijkt A/B/C/D na op de server, slaat op bij een account, geeft de docent-uitleg | `answers.ts` |
| `explain_answer` | noauth + oauth2 | dezelfde uitleg zonder (opnieuw) te antwoorden; **geen AI** | `answers.ts` |
| `submit_writing_answer` | oauth2 | Schrijven inleveren en nakijken met de rubriek | `writing.ts` → `lib/grading/grade-submission.ts` |
| `get_learning_profile` | oauth2, `openai/profile` | actieve onderdelen, modules, zwakke taalregels | `progress.ts` |
| `get_learning_progress` | oauth2 | één onderdeel: examens, losse antwoorden, zwakste vaardigheden, volgende stap | `progress.ts` |
| `get_premium_status` | oauth2 | `{ isPremium, modules: ['A2 Lezen', …], activeUntil }` — geen Mollie-gegevens | `register.ts` |

Elke tool geeft `structuredContent` terug; een geweigerde actie is een gewoon resultaat met `gate`
(`reason`, teksten NL/EN, `action.url`). De `action.url` is altijd een **informatiepagina** op de site
(`/register`, `/premium?vanaf=…`, `/platform`) met `utm_source=chatgpt` — nooit een afrekenlink, want
OpenAI verbiedt in-app betalingen voor digitale abonnementen.

## 5. Toegang (de drie lagen)

| Laag | Wie | Krijgt | Waar beslist |
|---|---|---|---|
| **anonymous** | geen token | per onderdeel precies de **tien proefvragen** van `/oefenen/[skill]`, altijd dezelfde, één keer; daarna `taster_exhausted` | `mcp_anonymous_usage` + RPC `mcp_anon_serve` (atomair) |
| **connected** | token, geen module | **oefenexamen 1** (`exams.is_free`) van elk gepubliceerd onderdeel; antwoorden opgeslagen; profiel en voortgang | `canOpenExam('connected', is_free)` |
| **module** | `ownsModule()` / `ownsKnm()` | examen 1–10, `mode: 'adaptive'`, Schrijven op de betaalde plafonds | dezelfde functies als de speler |

De anonieme sleutel is `sha256(MCP_SUBJECT_SALT + openai/subject)`. Zonder subject (een andere
MCP-client) valt het strengste pad: altijd vraag 1. De A2-taster valt lokaal terug op de statische set
(`data/free-practice.ts`); die items krijgen negatieve ids (`lib/mcp/static-taster.ts`) zodat
`submit_answer` ze kan nakijken zonder databaserij.

Premium komt **uitsluitend** uit `user_metadata` via `ownsModule()`; niets in de aanroep kan het
veranderen (getest in `tests/mcp.spec.js`). Bekend en gelogd in `open-items.md`: `user_metadata` is
door de gebruiker zelf te wijzigen — dat gold al voor de site.

## 6. Afhankelijkheden

- Tabellen (lezen): `exams`, `stimuli`, `questions`, `question_options`, `open_tasks`, `sections`,
  `question_concepts`, `concepts`, `exam_attempts`. Schrijven: `rubrics`, `grading_examples`.
- Tabellen (schrijven, als de kandidaat, onder RLS): `user_question_results` (zonder `attempt_id` —
  het patroon van de losse oefenvragen; het vaardighedenpaneel telt ze vanzelf mee), `open_submissions`.
- Nieuw (migratie `20261004120000_mcp_layer.sql`): `mcp_anonymous_usage`, `mcp_events`, RPC
  `mcp_anon_serve`. Alleen de admin leest ze.
- Functies: `fetchExamContent`, `fetchExamsForSkill`, `fetchDbFreePractice`, `fetchA2FreePractice`,
  `fetchPortalProgress`, `fetchSkillWeakness`, `fetchKnmThemeWeakness`, `fetchConceptAdvice`,
  `ownsModule`, `ownsKnm`, `checkGradingAllowed`, `gradeSubmission` (nieuw: de kern van
  `/api/grade-open`, verhuisd naar `lib/grading/grade-submission.ts`; de route is nu HTTP-glue).
- Pakketten: `mcp-handler@^2`, `@modelcontextprotocol/server@^2`, `@modelcontextprotocol/ext-apps`
  (widget), `jose`.
- Env: `MCP_RESOURCE_URL`, `MCP_SUBJECT_SALT`, optioneel `MCP_REQUIRE_CLIENT_ID=true` (in productie
  impliciet). Verder alleen wat er al was.

## 7. Lokaal testen

```bash
supabase start                                  # [auth.oauth_server] staat aan in config.toml
PATH="/opt/homebrew/bin:$PATH" npm run dev      # 3001
npm run build:widget                            # widgets/dist/exercise.js (ook prebuild van next build)
```

Rooktest zonder ChatGPT:

```bash
curl -s http://localhost:3001/.well-known/oauth-protected-resource
curl -s -X POST http://localhost:3001/api/mcp -H 'Content-Type: application/json' \
  -H 'Accept: application/json, text/event-stream' \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"get_practice_exercise","arguments":{"onderdeel":"knm"},"_meta":{"openai/subject":"test-1"}}}'
```

Een token zoals ChatGPT het krijgt, zonder ChatGPT: registreer een client op
`/auth/v1/oauth/clients/register`, open `/auth/v1/oauth/authorize?…&code_challenge=…&resource=…`, keur
goed op de consent-pagina (ingelogd), wissel de code op `/auth/v1/oauth/token` met de `code_verifier`.
Voor de tests volstaat een sessie van `tests/helpers/session.mjs` (buiten productie is `client_id` niet
verplicht).

Tests:

```bash
npm run test:unit                      # tests-unit/mcp-entitlement, mcp-static-taster, mcp-auth-claims
SUPABASE_SERVICE_KEY=… NEXT_PUBLIC_SUPABASE_ANON_KEY=… npx playwright test tests/mcp.spec.js
```

`tests/mcp.spec.js` gebruikt KNM als fixture (lokaal het enige volledig geseede onderdeel) en toetst:
geen sleutel in de payload, dezelfde tien voor hetzelfde onderwerp, de poort op elf, server-side
nakijken, de login-uitdaging, 401 op een vervalst token, examen 1 vs examen 3 voor een gratis account,
voortgang van A onzichtbaar voor B, en dat `premium: true` in de argumenten niets doet.

Een gratis account testen: elk Google-account zonder `modules`. Een module testen: zet
`user_metadata.modules = ["knm"]` (of `"a2:lezen"`) en `modules_until` in de toekomst via Studio of
`tests/helpers/session.mjs` — hetzelfde wat de Mollie-webhook schrijft.

Het widget los van ChatGPT bekijken: `tests/`-achtige harness in de sessielog van 04-10 — een pagina
met een `<iframe srcdoc>` die `ui/initialize` beantwoordt, `ui/notifications/tool-result` stuurt en
`tools/call` doorgeeft aan `/api/mcp`. Een vaste harness is nog niet in de repo opgenomen.

## 8. ChatGPT Developer Mode (de stappen voor de eigenaar)

1. **Supabase Dashboard** (hosted project) → Authentication → **OAuth Server**: inschakelen, **Allow
   dynamic registration** aan, **Authorization path** `https://inburgeringoefenen.nl/nl/oauth/consent`.
   Zet onder JWT Signing Keys een asymmetrische sleutel (ES256) actief, zodat `/api/mcp` tokens via de
   JWKS verifieert.
2. **Vercel** → env `MCP_RESOURCE_URL=https://inburgeringoefenen.nl/api/mcp`, `MCP_SUBJECT_SALT=<willekeurig>`.
   Deploy via `main` (de widget wordt in `prebuild` gebouwd en via `outputFileTracingIncludes` meegenomen).
3. **ChatGPT** → Settings → Security and login → **Developer mode** aan (Plus/Pro/Business/Edu).
   Plugins → **+** → naam "Inburgering Oefenen", URL `https://inburgeringoefenen.nl/api/mcp`.
   Lokaal: een HTTPS-tunnel naar 3001 (`MCP_RESOURCE_URL` = tunnel-URL + `/api/mcp`) óf de Secure MCP
   Tunnel van ChatGPT; ook de Supabase-URL moet dan publiek bereikbaar zijn (`jwt_issuer` in config.toml).
4. Test: "Geef me een KNM-vraag" → vraag zonder sleutel → antwoord → oordeel. Dan een tool die een
   account vraagt ("hoe sta ik ervoor?") → de koppel-knop → Google → "Toegang geven?" → terug.
   `whoami`-achtige controle: `get_premium_status` toont de modules van `user_metadata`.
5. Na een wijziging aan tools of beschrijvingen: Plugins → de app → **Refresh**, en een nieuw gesprek.

## 9. Productie

Dezelfde Vercel-functie als de site; geen extra infrastructuur. `MCP_RESOURCE_URL` moet exact de
publieke URL zijn (RFC 9728 `resource`). Controle na deploy:

```bash
curl -i https://inburgeringoefenen.nl/.well-known/oauth-protected-resource
curl -s -X POST https://inburgeringoefenen.nl/api/mcp -H 'Content-Type: application/json' \
  -H 'Accept: application/json, text/event-stream' -d '{"jsonrpc":"2.0","id":1,"method":"tools/list"}'
```

Analytics: `select event, tier, count(*) from mcp_events group by 1,2` beantwoordt gebruik, afgeronde
oefeningen, gekoppelde accounts (`chatgpt_account_connected` is af te leiden uit de eerste `connected`
aanroep per `user_id`), getoonde poorten en meest gebruikte tools. Kliks op "upgrade" en conversie
lopen via `utm_source=chatgpt` in GA4 op de website.

## 9a. Het reviewer-account voor de OpenAI-review

De review eist een testaccount dat "direct werkt, zonder MFA, e-mailcode of magic link". Een
Google-login vanaf het netwerk van OpenAI krijgt vrijwel zeker Googles "Verify it's you"-uitdaging,
die op geen enkel accounttype uit te zetten is. Daarom bestaat er precies één wachtwoordaccount,
met drie sloten (migratie `20261005090000_reviewer_login.sql`, besluit eigenaar 05-10):

| Slot | Waar | Wat het doet |
|---|---|---|
| Auth-hook `custom_access_token` → `hook_reviewer_claims` | Supabase | weigert elk token dat met een wachtwoord is verkregen tenzij `app_metadata.reviewer = true` (de *Password verification*-hook met slot is Team-plan-only; bruteforce vangt Supabase's rate-limit per IP + een wachtwoord van 32 tekens) |
| Auth-hook `before_user_created` → `hook_google_only_signup` | Supabase | weigert `signUp` met e-mail; alleen de admin-API (service-sleutel, met `reviewer: true`) mag een e-mailaccount maken |
| `REVIEWER_LOGIN_ENABLED=true` + `/login?reviewer=1` | Vercel + `AuthPanel` | toont het formulier; verbergen na de review is één env-var |

`app_metadata` is alleen met de service-sleutel te schrijven, dus niemand kan zichzelf reviewer
maken. Google-accounts hebben geen wachtwoord. Het formulier is daarmee alleen zichtbaarheid; de
server beslist.

**Aanzetten op het gehoste project (eigenaar):**

1. Authentication → Sign In / Providers → Email: *Enable Email provider* aan. *Confirm email* mag aan
   blijven; het reviewer-account wordt met `email_confirm: true` aangemaakt.
2. Authentication → Hooks → *Customize Access Token (JWT) Claims* → Postgres → `public.hook_reviewer_claims`.
3. Authentication → Hooks → *Before user created* → Postgres → `public.hook_google_only_signup`.
4. Vercel → `REVIEWER_LOGIN_ENABLED=true` (Production) → redeploy.
5. `node scripts/create-reviewer-account.mjs reviewer@inburgeringoefenen.nl --production` — drukt het
   wachtwoord één keer af. Zet het in het OpenAI-dashboard onder *Review details*, nergens anders.
   Login-URL: `https://inburgeringoefenen.nl/en/login?reviewer=1`.

Na de review: `REVIEWER_LOGIN_ENABLED` leeg, of het account verwijderen in Authentication → Users.
De hooks mogen blijven staan: ze weigeren dan alles.

Controle (lokaal of productie, met de anon-sleutel):

```bash
# reviewer met goed wachtwoord → access_token; elk ander e-mailaccount → "Inloggen met een wachtwoord is niet mogelijk"
curl -s -X POST "$SUPABASE_URL/auth/v1/token?grant_type=password" -H "apikey: $ANON" \
  -H 'Content-Type: application/json' -d '{"email":"...","password":"..."}'
# signUp met e-mail → 403 "Een account maak je aan met Inloggen met Google."
curl -s -X POST "$SUPABASE_URL/auth/v1/signup" -H "apikey: $ANON" \
  -H 'Content-Type: application/json' -d '{"email":"x@test.local","password":"CorrectHorse1234"}'
```

## 10. Uitbreiden

- **Een nieuw onderdeel of niveau** is geen code: `get_practice_exercise` leest `data/skills.ts`,
  `exams.is_free` en `fetchExamContent`. B1 Luisteren komt vanzelf mee zodra `itemCount` gevuld is en
  er examens gepubliceerd zijn.
- **Spreken**: `MCP_SPREKEN` in `lib/features.ts`. Vereist bewijs dat `getUserMedia` in het
  ChatGPT-widgetframe werkt; dan `components/exam/SpeakingTask`-achtige opname in het widget,
  upload naar `speaking-submissions` met de token-client, en `gradeSubmission` doet de rest.
- **Lessen** (`lib/lessons/*`, `/api/lesson-answer`): Zod-getypte payloads en server-side nakijken,
  dus een `get_lesson_item` / `submit_lesson_answer` paar is een middag werk; de poort is `is_free`
  van de les.
- **Scopes**: zodra Supabase OAuth-scopes uitgeeft, vul `securitySchemes[].scopes` en controleer ze in
  `auth.ts`; tot dan beslist `entitlement.ts`.
- **CIMD**: zodra supabase/auth#2850 landt, verdwijnt de dubbele-registratie van DCR vanzelf; hier
  hoeft niets te veranderen.
- **Widgetgrootte**: 760 kB (175 kB gzip) door `react-with-deps`. Wie dit wil halveren: Preact +
  `@modelcontextprotocol/ext-apps` met de client als peer, of een handgeschreven postMessage-bridge.
