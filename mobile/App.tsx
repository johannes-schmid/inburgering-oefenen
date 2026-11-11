import { useEffect, useState } from 'react';
import { Linking } from 'react-native';
import { useFonts } from 'expo-font';
import { Manrope_500Medium, Manrope_800ExtraBold } from '@expo-google-fonts/manrope';
import { PublicSans_400Regular, PublicSans_600SemiBold } from '@expo-google-fonts/public-sans';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { tokensFromUrl, type Tokens } from './src/auth';
import { SCHEME, deviceLocale } from './src/config';
import PortalScreen from './src/PortalScreen';
import SignInScreen from './src/SignInScreen';

SplashScreen.preventAutoHideAsync().catch(() => {});

/**
 * Drie standen, en de webview beslist welke het is:
 *
 *  - `checking` — het portaal laadt achter een laadvlak; de pagina meldt zo of er een sessie is.
 *  - `portal`   — er is een sessie: de cursist ziet het portaal.
 *  - `signedOut`— geen sessie (of uitgelogd op de site): het eigen inlogscherm.
 *
 * De app onthoudt zelf niets over de sessie. De cookie in de webview is de enige waarheid, dus
 * een uitlog op de site en een verlopen sessie komen vanzelf op hetzelfde scherm uit.
 */
type Phase = 'checking' | 'portal' | 'signedOut';

export default function App() {
  const [fontsLoaded] = useFonts({
    Manrope_500Medium,
    Manrope_800ExtraBold,
    PublicSans_400Regular,
    PublicSans_600SemiBold,
  });
  const [locale] = useState(deviceLocale);
  const [phase, setPhase] = useState<Phase>('checking');
  const [handoff, setHandoff] = useState<Tokens | null>(null);
  const [failed, setFailed] = useState(false);
  /** Een nieuwe sleutel bouwt de webview opnieuw op, zodat de overdracht de eerste aanvraag is. */
  const [attempt, setAttempt] = useState(0);
  const [devPath, setDevPath] = useState<{ path: string; at: number } | null>(null);

  function start(tokens: Tokens) {
    setFailed(false);
    setHandoff(tokens);
    setAttempt(n => n + 1);
    setPhase('checking');
  }

  useEffect(() => {
    if (fontsLoaded) SplashScreen.hideAsync().catch(() => {});
  }, [fontsLoaded]);

  /* Alleen in een dev-build: een sessie uit de lokale stack aanreiken zonder door Google te
     gaan, met `xcrun simctl openurl booted "inburgeringoefenen://dev-session#access_token=…"`,
     en een pad in het portaal openen met `…://dev-open?path=/nl/…`.
     In een release-build is `__DEV__` onwaar en bestaat deze ingang niet. */
  useEffect(() => {
    if (!__DEV__) return;
    const open = (url?: string | null) => {
      if (url?.startsWith(`${SCHEME}://dev-open?`)) {
        // `inburgeringoefenen://dev-open?path=/nl/dashboard/profiel` — een scherm openen om het na te kijken.
        const path = new URLSearchParams(url.split('?')[1]).get('path');
        if (path?.startsWith('/') && !path.startsWith('//')) setDevPath({ path, at: Date.now() });
        return;
      }
      if (!url?.startsWith(`${SCHEME}://dev-session`)) return;
      const tokens = tokensFromUrl(url);
      if (tokens) start(tokens);
    };
    Linking.getInitialURL().then(open).catch(() => {});
    const subscription = Linking.addEventListener('url', event => open(event.url));
    return () => subscription.remove();
  }, []);

  if (!fontsLoaded) return null;

  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      {phase === 'signedOut' ? (
        <SignInScreen key={`signin-${attempt}`} locale={locale} failed={failed} onSignedIn={start} />
      ) : (
        <PortalScreen
          key={`portal-${attempt}`}
          locale={locale}
          handoff={handoff}
          checking={phase === 'checking'}
          devPath={devPath}
          onSession={() => {
            setHandoff(null);
            setPhase('portal');
          }}
          onSignedOut={didFail => {
            setHandoff(null);
            setFailed(didFail);
            setPhase('signedOut');
          }}
        />
      )}
    </SafeAreaProvider>
  );
}
