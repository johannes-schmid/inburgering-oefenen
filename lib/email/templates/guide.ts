/**
 * De gidsvariant van de dag-2- en dag-7-mail — voor wie een gids als PDF heeft gedownload.
 *
 * Zelfde reeks, zelfde planner, andere tekst (eigenaar, 05-10-2026): wie een gids over KNM
 * downloadt, wil KNM halen, en de mail zegt dat. De keuze zit in `payload.source === 'guide'`
 * in `/api/send-campaign-emails`; `payload.section` kiest het examen en `payload.title` noemt
 * de gids. Geen getallen met de hand: prijzen komen uit `packageCards`.
 */
import { type EmailLocale } from '../i18n';
import { renderEmail } from '../layout';
import { packageCards, paymentBadges, skillsShowcase } from '../components';
import type { GuideSection } from '@/data/guides/types';

type Copy = {
  exam: Record<GuideSection, string>;
  day2Subject: (exam: string) => string;
  greeting: (name: string) => string;
  day2Headline: (exam: string) => string;
  day2Sub: (title: string) => string;
  day2Label: string;
  day2Title: string;
  day2Body: string;
  day2Btn: string;
  readyLabel: string;
  day7Subject: (exam: string) => string;
  day7Eyebrow: string;
  day7Headline: (exam: string) => string;
  day7Body: (name: string) => string;
  day7Label: string;
  day7Title: string;
  secure: string;
};

const COPY: Record<EmailLocale, Copy> = {
  nl: {
    exam: { inburgering: 'het inburgeringsexamen', taalexamens: 'je taalexamen', knm: 'je KNM-examen' },
    day2Subject: exam => `Wil je ${exam} halen? Begin met een gratis oefenexamen`,
    greeting: name => `Hoi ${name},`,
    day2Headline: exam => `Wil je ${exam} <span style="color:#fe762c;">halen</span>?`,
    day2Sub: title => `Je hebt de gids “${title}” gedownload. Lezen is stap één. Stap twee is kijken waar je nu staat.`,
    day2Label: 'Gratis',
    day2Title: 'Doe een gratis oefenexamen',
    day2Body: 'Oefenexamen 1 van elk onderdeel is gratis, in dezelfde vorm en met dezelfde tijd als het echte examen. Elke vraag is geschreven en nagekeken door een NT2-docent.',
    day2Btn: 'Start gratis →',
    readyLabel: 'Klaar voor meer?',
    day7Subject: exam => `Nog een week verder — hoe staat het met ${exam}?`,
    day7Eyebrow: 'Een week later',
    day7Headline: exam => `Een gids lezen is goed. Oefenen voor ${exam} is beter.`,
    day7Body: name => `Hoi ${name}, een week geleden las je onze gids. Het examen oefen je het best in de echte vorm: tien oefenexamens per onderdeel, allemaal nagekeken door een gecertificeerde NT2-docent.`,
    day7Label: 'Jouw voorbereiding',
    day7Title: 'Kies alleen de onderdelen die je nodig hebt.',
    secure: 'Veilig betalen via iDEAL · Direct toegang',
  },
  en: {
    exam: { inburgering: 'the inburgering exam', taalexamens: 'your language exam', knm: 'your KNM exam' },
    day2Subject: exam => `Want to pass ${exam}? Start with a free practice exam`,
    greeting: name => `Hi ${name},`,
    day2Headline: exam => `Want to <span style="color:#fe762c;">pass</span> ${exam}?`,
    day2Sub: title => `You downloaded the guide “${title}”. Reading is step one. Step two is seeing where you stand right now.`,
    day2Label: 'Free',
    day2Title: 'Take a free practice exam',
    day2Body: 'Practice exam 1 of every part is free, in the same format and with the same time limit as the real exam. Every question is written and checked by an NT2 teacher.',
    day2Btn: 'Start for free →',
    readyLabel: 'Ready for more?',
    day7Subject: exam => `One week on — how is ${exam} going?`,
    day7Eyebrow: 'One week later',
    day7Headline: exam => `Reading a guide is good. Practising for ${exam} is better.`,
    day7Body: name => `Hi ${name}, a week ago you read our guide. The best way to prepare is the real format: ten practice exams per part, all checked by a certified NT2 teacher.`,
    day7Label: 'Your preparation',
    day7Title: 'Choose only the parts you need.',
    secure: 'Secure payment via iDEAL · Instant access',
  },
  ar: {
    exam: { inburgering: 'امتحان الاندماج', taalexamens: 'امتحان اللغة', knm: 'امتحان KNM' },
    day2Subject: exam => `هل تريد اجتياز ${exam}؟ ابدأ باختبار تدريبي مجاني`,
    greeting: name => `مرحباً ${name}،`,
    day2Headline: exam => `هل تريد <span style="color:#fe762c;">اجتياز</span> ${exam}؟`,
    day2Sub: title => `لقد حمّلت الدليل “${title}”. القراءة هي الخطوة الأولى. الخطوة الثانية هي معرفة مستواك الآن.`,
    day2Label: 'مجاناً',
    day2Title: 'قم باختبار تدريبي مجاني',
    day2Body: 'الاختبار التدريبي الأول من كل جزء مجاني، بنفس شكل ومدة الامتحان الحقيقي. كل سؤال كتبه وراجعه مدرّس NT2.',
    day2Btn: 'ابدأ مجاناً ←',
    readyLabel: 'جاهز للمزيد؟',
    day7Subject: exam => `بعد أسبوع — كيف تسير الأمور مع ${exam}؟`,
    day7Eyebrow: 'بعد أسبوع',
    day7Headline: exam => `قراءة الدليل جيدة. التدرّب على ${exam} أفضل.`,
    day7Body: name => `مرحباً ${name}، قبل أسبوع قرأت دليلنا. أفضل تحضير هو الشكل الحقيقي: عشرة اختبارات تدريبية لكل جزء، جميعها راجعها مدرّس NT2 معتمد.`,
    day7Label: 'تحضيرك',
    day7Title: 'اختر فقط الأجزاء التي تحتاجها.',
    secure: 'دفع آمن عبر iDEAL · وصول فوري',
  },
};

export type GuidePayload = { section?: string; title?: string };

function examOf(c: Copy, section?: string): string {
  return c.exam[(section as GuideSection) in c.exam ? (section as GuideSection) : 'inburgering'];
}

export function guideDay2Subject(payload: GuidePayload, locale: EmailLocale): string {
  const c = COPY[locale];
  return c.day2Subject(examOf(c, payload.section));
}

export function guideDay2Email(payload: GuidePayload, firstName: string, locale: EmailLocale, unsubscribeUrl: string): string {
  const c = COPY[locale];
  const exam = examOf(c, payload.section);
  const body = `
<div class="hero">
  <p class="hero-greet">${c.greeting(firstName)}</p>
  <h1 class="hero-h1">${c.day2Headline(exam)}</h1>
  <p class="hero-sub">${c.day2Sub(payload.title ?? '')}</p>
</div>
<div class="sec">
  <p class="sec-label">${c.day2Label}</p>
  <h2 class="sec-title">${c.day2Title}</h2>
  <p class="sec-body" style="margin-bottom:24px;">${c.day2Body}</p>
  <a href="https://inburgeringoefenen.nl/oefenen" class="btn">${c.day2Btn}</a>
</div>
<div class="div"></div>
${skillsShowcase(locale)}
<div class="div"></div>
<div class="sec" style="background:#f8f9fb;">
  <p class="sec-label" style="text-align:center;">${c.readyLabel}</p>
  ${packageCards(locale)}
  ${paymentBadges(locale)}
</div>`;
  return renderEmail({ locale, title: guideDay2Subject(payload, locale), bodyHtml: body, unsubscribeUrl });
}

export function guideDay7Subject(payload: GuidePayload, locale: EmailLocale): string {
  const c = COPY[locale];
  return c.day7Subject(examOf(c, payload.section));
}

export function guideDay7Email(payload: GuidePayload, firstName: string, locale: EmailLocale, unsubscribeUrl: string): string {
  const c = COPY[locale];
  const exam = examOf(c, payload.section);
  const body = `
<div class="hero">
  <p class="hero-eyebrow">${c.day7Eyebrow}</p>
  <h1 class="hero-h1">${c.day7Headline(exam)}</h1>
  <p class="hero-sub">${c.day7Body(firstName)}</p>
</div>
<div class="sec" style="background:#f8f9fb;">
  <p class="sec-label" style="text-align:center;">${c.day7Label}</p>
  <h2 class="sec-title" style="text-align:center;">${c.day7Title}</h2>
  ${packageCards(locale)}
  ${paymentBadges(locale)}
  <p style="font-size:11px;color:#9CA3AF;text-align:center;margin-top:12px;">${c.secure}</p>
</div>`;
  return renderEmail({ locale, title: guideDay7Subject(payload, locale), bodyHtml: body, unsubscribeUrl });
}
