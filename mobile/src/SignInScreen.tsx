import { useState } from 'react';
import { Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import * as AppleAuthentication from 'expo-apple-authentication';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle, Defs, Path, RadialGradient, Rect, Stop } from 'react-native-svg';
import { signInWithApple, signInWithGoogle, type Tokens } from './auth';
import type { Locale } from './config';
import { STRINGS } from './strings';
import { color, font } from './theme';

type Props = {
  locale: Locale;
  /** Een fout van buiten dit scherm: de overdracht naar de webview mislukte. */
  failed?: boolean;
  onSignedIn: (tokens: Tokens) => void;
};

/**
 * Het enige scherm dat de app zelf tekent. Glas v1.0, veld "Licht" met één zonneschijf die
 * achter het inlogvlak opkomt — de horizon van het merk, één oranje punt per compositie.
 *
 * Twee knoppen en geen formulier: de site kent alleen Google, en Apple eist dat een app met
 * een externe login ook Inloggen met Apple biedt (richtlijn 4.8). Kopen kan hier niet.
 */
export default function SignInScreen({ locale, failed = false, onSignedIn }: Props) {
  const t = STRINGS[locale];
  const rtl = locale === 'ar';
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const [busy, setBusy] = useState<'google' | 'apple' | null>(null);
  const [error, setError] = useState(failed);

  async function run(provider: 'google' | 'apple') {
    if (busy) return;
    setError(false);
    setBusy(provider);
    try {
      const tokens = provider === 'google' ? await signInWithGoogle() : await signInWithApple();
      if (tokens) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
        onSignedIn(tokens);
        return;
      }
    } catch {
      setError(true);
    }
    setBusy(null);
  }

  const align = rtl ? ({ textAlign: 'right', writingDirection: 'rtl' } as const) : null;

  return (
    <View style={styles.root}>
      <Field width={width} height={height} />

      <View style={[styles.top, { paddingTop: insets.top + 20 }, rtl && styles.rowReverse]}>
        <LogoMark size={36} />
        <Text style={styles.wordmark}>Inburgering Oefenen</Text>
      </View>

      <View style={styles.copy}>
        <Text style={[styles.title, align]} accessibilityRole="header">
          {t.title}
          {'\n'}
          <Text style={styles.titleMuted}>{t.titleMuted}</Text>
        </Text>
      </View>

      <View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, 16) + 12 }]}>
        <Text style={[styles.body, align]}>{t.body}</Text>

        {error && (
          <View style={styles.alert} accessibilityRole="alert">
            <Text style={[styles.alertText, align]}>{t.signInFailed}</Text>
          </View>
        )}

        <View style={[styles.appleWrap, busy !== null && styles.dim]} pointerEvents={busy ? 'none' : 'auto'}>
          <AppleAuthentication.AppleAuthenticationButton
            buttonType={AppleAuthentication.AppleAuthenticationButtonType.CONTINUE}
            buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.BLACK}
            cornerRadius={27}
            style={styles.apple}
            onPress={() => run('apple')}
          />
        </View>

        <Pressable
          onPress={() => run('google')}
          disabled={busy !== null}
          accessibilityRole="button"
          accessibilityLabel={t.google}
          style={({ pressed }) => [
            styles.google,
            rtl && styles.rowReverse,
            pressed && styles.pressed,
            busy !== null && busy !== 'google' && styles.dim,
          ]}
        >
          <GoogleMark />
          <Text style={styles.googleText}>{busy === 'google' ? t.busy : t.google}</Text>
        </Pressable>
      </View>
    </View>
  );
}

/** Het veld: bijna vlak blauwgrijs met twee zachte gloeden, en de zon op de horizon. */
function Field({ width, height }: { width: number; height: number }) {
  const horizon = height - 250;
  return (
    <Svg width={width} height={height} style={StyleSheet.absoluteFill} pointerEvents="none">
      <Defs>
        <RadialGradient id="sky" cx="92%" cy="0%" rx="70%" ry="45%">
          <Stop offset="0" stopColor={color.hemel} stopOpacity="1" />
          <Stop offset="1" stopColor={color.hemel} stopOpacity="0" />
        </RadialGradient>
        <RadialGradient id="glow" cx="72%" cy={horizon / height} rx="75%" ry="26%">
          <Stop offset="0" stopColor="#ffd2b3" stopOpacity="0.9" />
          <Stop offset="1" stopColor="#ffd2b3" stopOpacity="0" />
        </RadialGradient>
      </Defs>
      <Rect width={width} height={height} fill={color.field} />
      <Rect width={width} height={height} fill="url(#sky)" />
      <Rect width={width} height={height} fill="url(#glow)" />
      <Circle cx={width * 0.72} cy={horizon} r={92} fill={color.oranje} />
    </Svg>
  );
}

/** Zelfde tekening als `components/site/LogoMark.tsx` op de site: de balk en de zonneschijf. */
export function LogoMark({ size }: { size: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100" accessibilityLabel="Inburgering Oefenen">
      <Rect width="100" height="100" rx="23" fill={color.navy} />
      <Rect x="26" y="27" width="17" height="46" rx="8.5" fill={color.white} />
      <Circle cx="65" cy="50" r="17" fill={color.oranje} />
    </Svg>
  );
}

/** Het officiële Google-merk; de huisstijl van Google schrijft het voor op deze knop. */
function GoogleMark() {
  return (
    <Svg width={20} height={20} viewBox="0 0 48 48">
      <Path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
      <Path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
      <Path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
      <Path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
    </Svg>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: color.field },
  rowReverse: { flexDirection: 'row-reverse' },
  top: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 24 },
  wordmark: { fontFamily: font.headline, fontSize: 17, letterSpacing: -0.3, color: color.navy },
  copy: { flex: 1, justifyContent: 'center', paddingHorizontal: 24, paddingBottom: 96 },
  title: { fontFamily: font.headline, fontSize: 38, lineHeight: 44, letterSpacing: -1.4, color: color.navy },
  titleMuted: { fontFamily: font.headlineMuted, color: color.ink2 },
  sheet: {
    backgroundColor: color.white,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 24,
    paddingTop: 24,
    gap: 12,
    shadowColor: color.navy,
    shadowOffset: { width: 0, height: -10 },
    shadowOpacity: 0.1,
    shadowRadius: 28,
  },
  body: { fontFamily: font.body, fontSize: 16, lineHeight: 24, color: color.ink2, marginBottom: 4 },
  alert: { backgroundColor: color.foutTint, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12 },
  alertText: { fontFamily: font.bodyStrong, fontSize: 15, lineHeight: 21, color: color.fout },
  appleWrap: { height: 54 },
  apple: { height: 54, width: '100%' },
  google: {
    height: 54,
    borderRadius: 27,
    backgroundColor: '#e9eef7',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  googleText: { fontFamily: font.bodyStrong, fontSize: 19, color: color.navy },
  pressed: { transform: [{ scale: 0.97 }], backgroundColor: '#dfe6f3' },
  dim: { opacity: 0.45 },
});
