import type { Locale } from './config';

/**
 * De paar zinnen die de app zelf zegt. Al het andere komt van de site, in de taal van het pad.
 * Drie talen, net als `messages/*.json`; `je` en korte zinnen, voor een lezer op A2.
 */
type Strings = {
  title: string;
  titleMuted: string;
  body: string;
  google: string;
  busy: string;
  signInFailed: string;
  offlineTitle: string;
  offlineBody: string;
  retry: string;
  purchaseTitle: string;
  purchaseBody: string;
  ok: string;
};

export const STRINGS: Record<Locale, Strings> = {
  nl: {
    title: 'Oefen voor je inburgering.',
    titleMuted: 'Elke dag een stukje.',
    body: 'Log in en ga verder waar je was.',
    google: 'Doorgaan met Google',
    busy: 'Bezig…',
    signInFailed: 'Inloggen lukt nu niet. Probeer het opnieuw.',
    offlineTitle: 'Geen verbinding',
    offlineBody: 'Controleer je internet en probeer het opnieuw.',
    retry: 'Opnieuw proberen',
    purchaseTitle: 'Niet in de app',
    purchaseBody: 'Je pakket kun je in de app niet wijzigen.',
    ok: 'Oké',
  },
  en: {
    title: 'Practise for your civic integration.',
    titleMuted: 'A little every day.',
    body: 'Sign in and continue where you left off.',
    google: 'Continue with Google',
    busy: 'One moment…',
    signInFailed: 'Signing in did not work. Please try again.',
    offlineTitle: 'No connection',
    offlineBody: 'Check your internet and try again.',
    retry: 'Try again',
    purchaseTitle: 'Not in the app',
    purchaseBody: 'You cannot change your package in the app.',
    ok: 'OK',
  },
  ar: {
    title: 'تدرّب على امتحان الاندماج.',
    titleMuted: 'قليلًا كل يوم.',
    body: 'سجّل الدخول وتابع من حيث توقفت.',
    google: 'المتابعة باستخدام Google',
    busy: 'لحظة…',
    signInFailed: 'تعذّر تسجيل الدخول. حاول مرة أخرى.',
    offlineTitle: 'لا يوجد اتصال',
    offlineBody: 'تحقق من الإنترنت وحاول مرة أخرى.',
    retry: 'حاول مرة أخرى',
    purchaseTitle: 'غير متاح في التطبيق',
    purchaseBody: 'لا يمكنك تغيير باقتك في التطبيق.',
    ok: 'حسنًا',
  },
};
