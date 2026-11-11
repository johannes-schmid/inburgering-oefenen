import { useEffect, useRef, useState, type ComponentRef } from 'react';
import { Alert, Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { WebView, type WebViewMessageEvent } from 'react-native-webview';
import type { ShouldStartLoadRequest, WebViewProgressEvent } from 'react-native-webview/lib/WebViewTypes';
import type { Tokens } from './auth';
import { BRIDGE_SCRIPT, type BridgeMessage } from './bridge';
import { WEB_URL, dashboardPath, isAuthPath, isPurchaseUrl, isSameSite, type Locale } from './config';
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
  devPath?: { path: string; at: number } | null;
  onSession: () => void;
  onSignedOut: (failed: boolean) => void;
};

/**
 * Het portaal zelf: de site in een webview, zonder dat er iets wordt nagebouwd. Wat de site
 * verandert, verandert hier dus mee — dat is de reden voor deze opzet.
 *
 * De app doet eromheen wat een webpagina niet kan: de sessie overdragen, kooplinks
 * tegenhouden, externe links naar Safari sturen, de microfoon toestaan, en een eigen scherm
 * tonen als er geen verbinding is.
 */
export default function PortalScreen({ locale, handoff, checking, devPath, onSession, onSignedOut }: Props) {
  const t = STRINGS[locale];
  const insets = useSafeAreaInsets();
  const webview = useRef<ComponentRef<typeof WebView>>(null);
  const [progress, setProgress] = useState(0);
  const [offline, setOffline] = useState(false);

  /* Eén keer bepaald per opbouw: verandert de bron later, dan laadt de webview opnieuw en is
     een lopend examen weg. Een nieuwe overdracht krijgt een nieuwe `key` in App.tsx. */
  const [source] = useState(() => {
    if (!handoff) return { uri: `${WEB_URL}${dashboardPath(locale)}` };
    const body = new URLSearchParams({
      access_token: handoff.accessToken,
      refresh_token: handoff.refreshToken,
      next: dashboardPath(locale),
    }).toString();
    return {
      uri: `${WEB_URL}/api/app-session`,
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'X-App-Shell': 'ios' },
      body,
    };
  });

  useEffect(() => {
    if (!devPath) return;
    webview.current?.injectJavaScript(`location.assign(${JSON.stringify(WEB_URL + devPath.path)}); true;`);
  }, [devPath]);

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
      if (request.navigationType === 'click') WebBrowser.openBrowserAsync(url).catch(() => {});
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
        onContentProcessDidTerminate={() => webview.current?.reload()}
        applicationNameForUserAgent="InburgeringOefenenApp/1.0"
        sharedCookiesEnabled
        allowsBackForwardNavigationGestures
        allowsInlineMediaPlayback
        mediaPlaybackRequiresUserAction={false}
        mediaCapturePermissionGrantType="grant"
        bounces={false}
        pullToRefreshEnabled={false}
        decelerationRate="normal"
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
