# Inburgering Oefenen — iOS-app

Het studieportaal als iPhone-app. **De app bouwt het portaal niet na**: hij toont de site in een
webview en doet eromheen wat een webpagina niet kan. Wat op de site verandert, verandert in de
app dus vanzelf mee — er is geen tweede codebase om bij te houden.

```bash
# vanuit de repo-root: de lokale stack en de site
supabase start
PATH="/opt/homebrew/bin:$PATH" npm run dev

# de app (Node 24 is verplicht voor Expo SDK 58)
cd mobile
PATH="/opt/homebrew/opt/node@24/bin:$PATH" npx expo run:ios --device "iPhone 17 Pro"

# inloggen als lokale testgebruiker, zonder Google (alleen dev-build)
./scripts/dev-session.sh menu-partial@local.test
```

Eigen pakket met eigen `node_modules`, net als `e2e/`: React Native en de site delen geen
dependencies. `mobile/` staat in de `exclude` van de root-`tsconfig.json` en -`eslint.config.mjs`.
`ios/` wordt gegenereerd door `expo prebuild` en staat niet in git.

## Hoe het werkt

| Bestand | Wat het doet |
|---|---|
| `App.tsx` | drie standen: `checking` → `portal` of `signedOut`. De cookie in de webview beslist. |
| `src/SignInScreen.tsx` | het enige eigen scherm: Inloggen met Apple en met Google |
| `src/auth.ts` | Google via het systeemvenster, Apple via `signInWithIdToken`. Bewaart géén sessie. |
| `src/PortalScreen.tsx` | de webview: overdracht, kooplinks tegenhouden, externe links naar Safari, microfoon |
| `src/bridge.ts` | het script in elke pagina: meldt pad + sessie, onderschept kooplinks |
| `../app/api/app-session/route.ts` | de site-kant van de overdracht: tokens → dezelfde cookies als `/auth/callback` |

Vier regels die stil fout gaan:

- **De app bewaart de sessie niet.** Na de overdracht is de webview de enige houder van het
  refresh-token. Twee houders trekken elkaars sessie in bij de tweede verversing.
- **De bron van de webview staat vast per opbouw.** Verandert `source`, dan laadt de pagina
  opnieuw en is een lopend examen weg. Een nieuwe login krijgt een nieuwe `key`.
- **Kopen kan niet in de app** (App Store-richtlijn 3.1.1). `isPurchaseUrl` in `src/config.ts` en
  `PURCHASE` in `src/bridge.ts` zijn dezelfde lijst op twee plekken; een nieuw kooppad moet in
  beide. De melding noemt bewust geen website.
- **Geen pull-to-refresh.** Het portaal scrolt in `#dash-main`, niet in het document; een
  ververs-gebaar zou midden in een examen de pagina herladen.

## Wat de eigenaar nog moet doen voor TestFlight

1. **Apple Developer** → Identifiers → App ID `nl.inburgeringoefenen.app` met de capability
   *Sign in with Apple*.
2. **Supabase (gehost)** → Authentication → Providers → Apple: aanzetten, bij *Client IDs*
   `nl.inburgeringoefenen.app`. Geen geheim nodig (alleen de native flow).
3. **Supabase (gehost)** → Authentication → URL Configuration → Redirect URLs:
   `inburgeringoefenen://auth` toevoegen (Google rondt daar af).
4. **Deploy de site** (push naar `main`): `/api/app-session` moet op productie staan voordat een
   release-build kan inloggen.
5. `mobile/.env.production` en `.env.development` staan niet in git (root-`.gitignore`: `.env.*`).
   Ze bevatten alleen de publieke site-URL, de Supabase-URL en de anon key.
6. Bouwen en uploaden: `npx expo run:ios --configuration Release` lokaal, of EAS Build.

Nog niet gebouwd: pushmeldingen, offline, in-app-aankopen. Accountverwijdering in de app is een
App Store-eis (5.1.1(v)) zodra er accounts in de app worden aangemaakt — het portaal heeft die
knop nog niet.
