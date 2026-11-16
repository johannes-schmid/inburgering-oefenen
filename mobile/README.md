# Inburgering Oefenen — iOS- en Android-app

Het studieportaal als app voor iPhone en Android, uit één codebase. **De app bouwt het portaal niet na**: hij toont de site in een
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

Android (JDK 17 en de Android-SDK via Homebrew: `openjdk@17`, `android-commandlinetools`):

```bash
export JAVA_HOME=/opt/homebrew/opt/openjdk@17 ANDROID_HOME=/opt/homebrew/share/android-commandlinetools
export PATH="/opt/homebrew/opt/node@24/bin:$ANDROID_HOME/platform-tools:$ANDROID_HOME/emulator:$PATH"
emulator -avd inburgering &                       # eenmalig aangemaakt met avdmanager, zie hieronder
adb reverse tcp:3001 tcp:3001 && adb reverse tcp:54421 tcp:54421   # localhost van de emulator → deze Mac
npx expo run:android
./scripts/dev-session.sh menu-partial@local.test android
```

**De microfoon is in de emulator niet te testen**: de toestemmingsvraag verschijnt, maar de emulator
bevriest zodra hij de audio-ingang van de Mac opent. Spreken test je op een echte telefoon
(`adb devices` met USB-debugging, daarna dezelfde `adb reverse`).

De AVD: `avdmanager create avd -n inburgering -k "system-images;android-36.1;google_apis;arm64-v8a" -d pixel_8`.
`adb reverse` is waarom `.env.development` voor beide platforms dezelfde `localhost`-URL's kan
houden; zonder is `localhost` in de emulator de emulator zelf.

**Versies lopen gelijk.** `expo.version` is de versie voor beide winkels; `ios.buildNumber` en
`android.versionCode` gaan samen omhoog en hebben altijd hetzelfde getal.

Eigen pakket met eigen `node_modules`, net als `e2e/`: React Native en de site delen geen
dependencies. `mobile/` staat in de `exclude` van de root-`tsconfig.json` en -`eslint.config.mjs`.
`ios/` en `android/` worden gegenereerd door `expo prebuild` en staan niet in git.

## Hoe het werkt

| Bestand | Wat het doet |
|---|---|
| `App.tsx` | drie standen: `checking` → `portal` of `signedOut`. De cookie in de webview beslist. |
| `src/SignInScreen.tsx` | het enige eigen scherm: Inloggen met Apple (alleen iOS) en met Google |
| `src/auth.ts` | Google via het systeemvenster, Apple via `signInWithIdToken`. Bewaart géén sessie. |
| `src/PortalScreen.tsx` | de webview: overdracht, kooplinks tegenhouden, externe links naar de browser, microfoon, terugknop (Android) |
| `src/bridge.ts` | het script in elke pagina: meldt pad + sessie, onderschept kooplinks |
| `../app/api/app-session/route.ts` | de site-kant van de overdracht: tokens → dezelfde cookies als `/auth/callback` |

Zes regels die stil fout gaan:

- **De app bewaart de sessie niet.** Na de overdracht is de webview de enige houder van het
  refresh-token. Twee houders trekken elkaars sessie in bij de tweede verversing.
- **De bron van de webview staat vast per opbouw.** Verandert `source`, dan laadt de pagina
  opnieuw en is een lopend examen weg. Een nieuwe login krijgt een nieuwe `key`.
- **Kopen kan niet in de app** (App Store-richtlijn 3.1.1, Google Play Payments policy). `isPurchaseUrl` in `src/config.ts` en
  `PURCHASE` in `src/bridge.ts` zijn dezelfde lijst op twee plekken; een nieuw kooppad moet in
  beide. De melding noemt bewust geen website.
- **Android stuurt bij een POST-bron geen eigen koppen mee** (`WebView.postUrl`), en zonder
  `X-App-Shell` weigert `/api/app-session`. Op Android laadt de webview daarom een lege pagina
  met de site als herkomst die de overdracht als `fetch` doet — zie `androidHandoff`. De kop
  draagt het platform (`ios`/`android`), zodat `signup_completed` per platform telt.
- **Inloggen met Apple bestaat alleen op iOS.** Richtlijn 4.8 is een App Store-eis; Android toont
  alleen Google.
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

## Wat de eigenaar nog moet doen voor Google Play

1. **Play Console** → app aanmaken met package `nl.inburgeringoefenen.app`; Play App Signing aan.
2. Een upload-key maken en buiten git bewaren (`*.jks` staat in `.gitignore`), of EAS Build laten
   signeren.
3. Bouwen: `npx expo run:android --variant release` lokaal (levert een `.aab` via
   `cd android && ./gradlew bundleRelease`), of EAS Build.
4. Store-vermelding, gegevensveiligheid-formulier (account, microfoon) en de accountverwijder-URL
   die Play eist — dezelfde open eis als bij Apple 5.1.1(v).

Supabase en de site hoeven niets extra's: Google rondt op Android af op hetzelfde
`inburgeringoefenen://auth`, en `/api/app-session` is dezelfde.

Nog niet gebouwd: pushmeldingen, offline, in-app-aankopen. Accountverwijdering in de app is een
App Store-eis (5.1.1(v)) zodra er accounts in de app worden aangemaakt — het portaal heeft die
knop nog niet.
