import { useEffect, useRef, useState, type ComponentRef } from 'react';
import { Alert, BackHandler, Linking, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { WebView, type WebViewMessageEvent } from 'react-native-webview';
import type { ShouldStartLoadRequest, WebViewProgressEvent } from 'react-native-webview/lib/WebViewTypes';
import type { Tokens } from './auth';
import { BRIDGE_SCRIPT, type BridgeMessage } from './bridge';
import { HANDOFF_PATH, WEB_URL, dashboardPath, isAuthPath, isPurchaseUrl, isSameSite, type Locale } from './config';
import { LogoMark } from './SignInScreen';
import { STRINGS } from './strings';
import { color, font } from './theme';

type Props = {
  locale: Locale;
  /** Net ingelogd: de eerste aanvraag is dan de overdracht naar `/api/app-session`. */
  handoff: Tokens | null;
  /** Waar tot de eerste melding van de pagina: het portaal blijft dan achter het laadvlak. */
  checking: boolean;
  /** Alleen in een dev-build: een pad dat van buitenaf is aangereikt (`dev-open`). */
  devPath?: { path: string; clean: boolean; scroll: number; at: number } | null;
  onSession: () => void;
  onSignedOut: (failed: boolean) => void;
};

/**
 * Het portaal zelf: de site in een webview, zonder dat er iets wordt nagebouwd. Wat de site
 * verandert, verandert hier dus mee — dat is de reden voor deze opzet.
 *
 * De app doet eromheen wat een webpagina niet kan: de sessie overdragen, kooplinks
 * tegenhouden, externe links naar de browser sturen, de microfoon toestaan, de terugknop van
 * Android door de geschiedenis van het portaal laten gaan, en een eigen scherm tonen als er geen
 * verbinding is.
 */
export default function PortalScreen({ locale, handoff, checking, devPath, onSession, onSignedOut }: Props) {
  const t = STRINGS[locale];
  const insets = useSafeAreaInsets();
  const webview = useRef<ComponentRef<typeof WebView>>(null);
  const [progress, setProgress] = useState(0);
  const [offline, setOffline] = useState(false);
  const clean = useRef(false);
  const scroll = useRef(0);

  /* Eén keer bepaald per opbouw: verandert de bron later, dan laadt de webview opnieuw en is
     een lopend examen weg. Een nieuwe overdracht krijgt een nieuwe `key` in App.tsx. */
  const [source] = useState(() => {
    if (!handoff) return { uri: `${WEB_URL}${dashboardPath(locale)}` };
    const body = new URLSearchParams({
      access_token: handoff.accessToken,
      refresh_token: handoff.refreshToken,
      next: dashboardPath(locale),
    }).toString();
    const headers = { 'Content-Type': 'application/x-www-form-urlencoded', 'X-App-Shell': Platform.OS };
    if (Platform.OS === 'android') return androidHandoff(body, headers);
    return { uri: `${WEB_URL}${HANDOFF_PATH}`, method: 'POST', headers, body };
  });

  const canGoBack = useRef(false);
  useEffect(() => {
    if (Platform.OS !== 'android') return;
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      if (!canGoBack.current) return false;
      webview.current?.goBack();
      return true;
    });
    return () => subscription.remove();
  }, []);

  useEffect(() => {
    if (!devPath) return;
    clean.current = devPath.clean;
    scroll.current = devPath.scroll;
    webview.current?.injectJavaScript(`location.assign(${JSON.stringify(WEB_URL + devPath.path)}); true;`);
  }, [devPath]);

  function hideDevBars() {
    if (scroll.current) {
      // Op een breed scherm scrolt `#dash-main`, op een telefoon het document: zet ze allebei.
      webview.current?.injectJavaScript(
        `setTimeout(function(){var y=${scroll.current};window.scrollTo(0,y);document.documentElement.scrollTop=y;var m=document.getElementById('dash-main');if(m)m.scrollTop=y;},800); true;`,
      );
    }
    if (!clean.current) return;
    webview.current?.injectJavaScript(
      `(function(){var s=document.createElement('style');s.textContent='nextjs-portal,[data-dev-toolbar]{display:none!important}';document.head.appendChild(s);})(); true;`,
    );
  }

  function purchaseNotice() {
    Alert.alert(t.purchaseTitle, t.purchaseBody, [{ text: t.ok }]);
  }

  function onMessage(event: WebViewMessageEvent) {
    let message: BridgeMessage;
    try {
      message = JSON.parse(event.nativeEvent.data);
    } catch {
      return;
    }
    if (message.type === 'purchase') return purchaseNotice();
    if (message.type !== 'nav') return;
    if (message.path === HANDOFF_PATH) return;

    if (isAuthPath(message.path)) return onSignedOut(message.path.includes('/login') && checking && !!handoff);
    if (!message.auth) return onSignedOut(false);
    if (isPurchaseUrl(message.path)) {
      webview.current?.goBack();
      return purchaseNotice();
    }
    onSession();
  }

  function shouldLoad(request: ShouldStartLoadRequest): boolean {
    const { url } = request;
    if (!request.isTopFrame) return true;
    if (isPurchaseUrl(url)) {
      purchaseNotice();
      return false;
    }
    if (isSameSite(url) || /^(about|blob|data):/.test(url)) return true;
    if (/^https?:/.test(url)) {
      // Android meldt altijd `other`, maar roept dit alleen aan voor echte navigaties (een tik of
      // een doorverwijzing), nooit voor wat de app zelf laadt.
      if (Platform.OS === 'android' || request.navigationType === 'click') {
        WebBrowser.openBrowserAsync(url).catch(() => {});
      }
      return false;
    }
    Linking.openURL(url).catch(() => {});
    return false;
  }

  return (
    <View style={[styles.root, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <WebView
        ref={webview}
        source={source}
        style={styles.web}
        injectedJavaScriptBeforeContentLoaded={BRIDGE_SCRIPT}
        onMessage={onMessage}
        onShouldStartLoadWithRequest={shouldLoad}
        onLoadProgress={(e: WebViewProgressEvent) => setProgress(e.nativeEvent.progress)}
        onError={() => setOffline(true)}
        onLoadEnd={hideDevBars}
        onNavigationStateChange={state => {
          canGoBack.current = state.canGoBack;
        }}
        onContentProcessDidTerminate={() => webview.current?.reload()}
        onRenderProcessGone={() => webview.current?.reload()}
        applicationNameForUserAgent="InburgeringOefenenApp/1.0"
        sharedCookiesEnabled
        allowsBackForwardNavigationGestures
        allowsLinkPreview={false}
        allowsInlineMediaPlayback
        mediaPlaybackRequiresUserAction={false}
        mediaCapturePermissionGrantType="grant"
        bounces={false}
        overScrollMode="never"
        pullToRefreshEnabled={false}
        // Alleen iOS zet "normal" om naar een getal; Android krijgt de string door en crasht erop.
        decelerationRate={Platform.OS === 'ios' ? 'normal' : undefined}
        contentInsetAdjustmentBehavior="never"
        automaticallyAdjustContentInsets={false}
        setSupportMultipleWindows={false}
        webviewDebuggingEnabled={__DEV__}
      />

      {progress > 0 && progress < 1 && !checking && (
        <View style={[styles.progressTrack, { top: insets.top }]} pointerEvents="none">
          <View style={[styles.progressFill, { width: `${Math.round(progress * 100)}%` }]} />
        </View>
      )}

      {checking && !offline && (
        <View style={styles.cover} pointerEvents="none">
          <LogoMark size={72} />
        </View>
      )}

      {offline && (
        <View style={styles.cover}>
          <Text style={styles.offlineTitle} accessibilityRole="header">{t.offlineTitle}</Text>
          <Text style={styles.offlineBody}>{t.offlineBody}</Text>
          <Pressable
            accessibilityRole="button"
            onPress={() => {
              setOffline(false);
              webview.current?.reload();
            }}
            style={({ pressed }) => [styles.retry, pressed && styles.retryPressed]}
          >
            <Text style={styles.retryText}>{t.retry}</Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}

/**
 * Android stuurt bij een POST-bron géén eigen koppen mee (`WebView.postUrl` kent ze niet), en
 * zonder `X-App-Shell` weigert `/api/app-session`. Daarom laadt de webview hier een lege pagina
 * mét de site als herkomst, die de overdracht zelf als `fetch` doet: zelfde herkomst, dus geen
 * CORS-preflight, en de cookies uit het antwoord landen in de webview. Daarna vervangt hij
 * zichzelf door waar de doorverwijzing eindigde, zodat de terugknop er niet op uitkomt.
 */
function androidHandoff(body: string, headers: Record<string, string>) {
  const fail = `${WEB_URL}/nl/login?error=app_session`;
  const html = `<!doctype html><html><body style="background:${color.field}"><script>
fetch(${JSON.stringify(HANDOFF_PATH)}, { method: 'POST', credentials: 'same-origin', headers: ${JSON.stringify(headers)}, body: ${JSON.stringify(body)} })
  .then(function (r) { location.replace(r.ok ? r.url : ${JSON.stringify(fail)}); })
  .catch(function () { location.replace(${JSON.stringify(fail)}); });
</script></body></html>`;
  return { html, baseUrl: `${WEB_URL}${HANDOFF_PATH}` };
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: color.field },
  web: { flex: 1, backgroundColor: color.field },
  progressTrack: { position: 'absolute', left: 0, right: 0, height: 2 },
  progressFill: { height: 2, backgroundColor: color.navy },
  cover: {
    ...StyleSheet.absoluteFill,
    backgroundColor: color.field,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  offlineTitle: { fontFamily: font.headline, fontSize: 26, letterSpacing: -0.8, color: color.navy, textAlign: 'center' },
  offlineBody: {
    fontFamily: font.body,
    fontSize: 16,
    lineHeight: 24,
    color: color.ink2,
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 24,
  },
  retry: { height: 52, borderRadius: 26, paddingHorizontal: 28, backgroundColor: color.navy, justifyContent: 'center' },
  retryPressed: { transform: [{ scale: 0.97 }], backgroundColor: color.navy2 },
  retryText: { fontFamily: font.bodyStrong, fontSize: 17, color: color.white },
});
