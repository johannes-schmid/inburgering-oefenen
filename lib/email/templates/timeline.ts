/**
 * "Stuur mij mijn tijdlijn" — the take-it-with-you e-mail, and the tool's primary conversion event.
 *
 * It is deliberately **not a marketing e-mail with a link back**. The dates are *in the message*, as
 * a plain table, because the whole reason someone asks for this is to keep it: in their inbox, next
 * to their DUO papers, on the phone they show their klantmanager. An e-mail that only says "click
 * here to see your timeline" is a worse artifact than the page they were already looking at.
 *
 * Three constraints it inherits from `lib/email/i18n.ts` and honours:
 *
 * - **No number typed by hand.** Every date and amount is passed in, computed by the engine from the
 *   rules file. A stale figure in an inbox cannot be corrected later.
 * - **Estimates stay labelled as estimates.** The legal/estimate split survives the trip to e-mail:
 *   DUO dates are plain, ours carry the word *ongeveer*. Losing that distinction in a channel we
 *   cannot update would be the worst place to lose it.
 * - **RTL for Arabic**, via `renderEmail`, which sets `dir` on the document. Tables inherit it.
 *
 * The reminder — one mail timed to land before the last safe registration date — is the retention
 * mechanic, and it is a *separate consent* from this send. Asking once for both would make the
 * unsubscribe meaningless.
 */
import { type EmailLocale } from '../i18n';
import { renderEmail } from '../layout';

export type TimelineEmailRow = {
  /** Already-localised component name, e.g. "Schrijven". */
  label: string;
  /** Localised date string, or null when there is nothing dated to say. */
  registerBy: string | null;
  /** Localised range, always prefixed with the "about" word by the caller. */
  readyBy: string | null;
  fee: string;
  payer: string;
};

export type TimelineEmailPayload = {
  headlineDate: string | null;
  headlineWeeks: number | null;
  bindingComponent: string | null;
  deadline: string | null;
  rows: TimelineEmailRow[];
  costBest: string;
  costExpected: string;
  shareUrl: string;
  rulesVersion: string;
};

const COPY = {
  nl: {
    subject: (d: string | null) => (d ? `Je tijdlijn: meld je uiterlijk aan op ${d}` : 'Je tijdlijn inburgering'),
    title: 'Jouw tijdlijn',
    eyebrow: 'Tijdlijn inburgering',
    lead: 'Hieronder staat jouw plan. Bewaar deze mail bij je papieren van DUO.',
    headline: 'Meld je uiterlijk aan op',
    weeks: (n: number) => `nog ${n} weken`,
    forComponent: (c: string) => `voor je laatste examen (${c}).`,
    deadline: 'Je deadline',
    thName: 'Onderdeel',
    thRegister: 'Uiterlijk aanmelden',
    thReady: 'Klaar om examen te doen',
    thCost: 'Kosten',
    costTitle: 'Wat het kost',
    costBest: 'Als je in één keer slaagt',
    costExpected: 'Waarschijnlijk',
    open: 'Bekijk en pas je tijdlijn aan',
    disclaimer:
      'Deze tijdlijn is een hulpmiddel, geen officieel besluit. DUO bepaalt je termijn. Kijk in Mijn Inburgering. Regels gecontroleerd op',
  },
  en: {
    subject: (d: string | null) => (d ? `Your timeline: register no later than ${d}` : 'Your integration timeline'),
    title: 'Your timeline',
    eyebrow: 'Integration timeline',
    lead: 'Here is your plan. Keep this email with your DUO papers.',
    headline: 'Register no later than',
    weeks: (n: number) => `${n} weeks from now`,
    forComponent: (c: string) => `for your final exam (${c}).`,
    deadline: 'Your deadline',
    thName: 'Part',
    thRegister: 'Register by',
    thReady: 'Ready to sit the exam',
    thCost: 'Cost',
    costTitle: 'What it costs',
    costBest: 'If you pass first time',
    costExpected: 'Likely',
    open: 'View and change your timeline',
    disclaimer:
      'This timeline is a tool, not an official decision. DUO decides your term. Check Mijn Inburgering. Rules checked on',
  },
  ar: {
    subject: (d: string | null) => (d ? `جدولك الزمني: سجّل على أبعد تقدير في ${d}` : 'جدولك الزمني للاندماج'),
    title: 'جدولك الزمني',
    eyebrow: 'الجدول الزمني للاندماج',
    lead: 'هذه خطتك. احفظ هذه الرسالة مع أوراق DUO.',
    headline: 'سجّل على أبعد تقدير في',
    weeks: (n: number) => `بعد ${n} أسبوعًا`,
    forComponent: (c: string) => `لامتحانك الأخير (${c}).`,
    deadline: 'موعدك النهائي',
    thName: 'الجزء',
    thRegister: 'التسجيل قبل',
    thReady: 'جاهز للامتحان',
    thCost: 'التكلفة',
    costTitle: 'كم يكلّف',
    costBest: 'إذا نجحت من المرة الأولى',
    costExpected: 'على الأرجح',
    open: 'اعرض جدولك الزمني وعدّله',
    disclaimer:
      'هذا الجدول الزمني أداة مساعدة، وليس قرارًا رسميًا. DUO تحدد مدتك. راجع Mijn Inburgering. تمت مراجعة القواعد في',
  },
} as const;

const REMINDER = {
  nl: {
    subject: (c: string) => `Tijd om je aan te melden voor ${c}`,
    eyebrow: 'Herinnering',
    title: 'Dit is het moment',
    lead: (c: string, d: string) =>
      `Je hebt ons gevraagd je te herinneren. Meld je uiterlijk ${d} aan voor ${c}. Aanmelden duurt meer dan 6 weken, en daarna wacht je nog op de uitslag.`,
  },
  en: {
    subject: (c: string) => `Time to register for ${c}`,
    eyebrow: 'Reminder',
    title: 'This is the moment',
    lead: (c: string, d: string) =>
      `You asked us to remind you. Register for ${c} no later than ${d}. Registering takes more than 6 weeks, and after that you still wait for the result.`,
  },
  ar: {
    subject: (c: string) => `حان وقت التسجيل لـ ${c}`,
    eyebrow: 'تذكير',
    title: 'هذه هي اللحظة',
    lead: (c: string, d: string) =>
      `طلبت منّا أن نذكّرك. سجّل لـ ${c} في موعد لا يتجاوز ${d}. التسجيل يستغرق أكثر من ٦ أسابيع، وبعده تنتظر النتيجة أيضًا.`,
  },
} as const;

export function timelineReminderSubject(payload: TimelineEmailPayload, locale: EmailLocale): string {
  return REMINDER[locale].subject(payload.bindingComponent ?? COPY[locale].title);
}

/**
 * The follow-up, eight weeks before the last safe registration date.
 *
 * Same table, different opening: this mail exists to be acted on today, so the lead sentence names
 * the component and the date and then explains *why now* — the six-week queue is the whole reason a
 * reminder eight weeks out is not premature. It is recomputed from the stored state at send time, so
 * it reflects the rules as they stand on the day it lands, not on the day it was queued.
 */
export function timelineReminderEmail(
  payload: TimelineEmailPayload,
  locale: EmailLocale,
  unsubscribeUrl: string,
): string {
  const r = REMINDER[locale];
  const c = COPY[locale];
  const component = payload.bindingComponent ?? c.title;
  const body = `
<div class="hero">
  <p class="hero-eyebrow">${r.eyebrow}</p>
  <h1 class="hero-h1">${r.title}</h1>
  <p class="hero-sub">${r.lead(component, payload.headlineDate ?? '')}</p>
</div>
<div class="sec">
  <p style="margin:0 0 4px;font-size:14px;color:#434651;">${c.headline}</p>
  <p style="margin:0;font-family:Manrope,-apple-system,Arial,sans-serif;font-size:34px;font-weight:800;color:#a24000;letter-spacing:-1px;line-height:1.1;">${payload.headlineDate ?? '—'}</p>
  ${payload.deadline ? `<p style="margin:14px 0 0;font-size:14px;color:#434651;"><strong>${c.deadline}:</strong> ${payload.deadline}</p>` : ''}
  <a class="btn" style="margin-top:24px;" href="${payload.shareUrl}">${c.open}</a>
  <p style="margin:20px 0 0;font-size:12px;color:#434651;line-height:1.7;">${c.disclaimer} ${payload.rulesVersion}.</p>
</div>
`;
  return renderEmail({ locale, title: r.title, bodyHtml: body, unsubscribeUrl });
}

export function timelineEmailSubject(payload: TimelineEmailPayload, locale: EmailLocale): string {
  return COPY[locale].subject(payload.headlineDate);
}

/** Everything interpolated here comes from the engine, never from the request body. */
export function timelineEmail(payload: TimelineEmailPayload, locale: EmailLocale, unsubscribeUrl: string): string {
  const c = COPY[locale];
  const cell = 'padding:10px 12px;border-bottom:1px solid #eceef0;font-size:14px;color:#191c1e;';
  const head =
    'padding:10px 12px;border-bottom:2px solid #e0e3e5;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.6px;color:#434651;text-align:start;';

  const body = `
<div class="hero">
  <p class="hero-eyebrow">${c.eyebrow}</p>
  <h1 class="hero-h1">${c.title}</h1>
  <p class="hero-sub">${c.lead}</p>
</div>

${
  payload.headlineDate
    ? `<div class="sec">
  <p style="margin:0 0 4px;font-size:14px;color:#434651;">${c.headline}</p>
  <p style="margin:0;font-family:Manrope,-apple-system,Arial,sans-serif;font-size:34px;font-weight:800;color:#002b6d;letter-spacing:-1px;line-height:1.1;">${payload.headlineDate}</p>
  ${payload.headlineWeeks !== null ? `<p style="margin:6px 0 0;font-size:16px;font-weight:700;color:#a24000;">${c.weeks(payload.headlineWeeks)}</p>` : ''}
  ${payload.bindingComponent ? `<p style="margin:10px 0 0;font-size:14px;color:#434651;line-height:1.7;">${c.forComponent(payload.bindingComponent)}</p>` : ''}
  ${payload.deadline ? `<p style="margin:14px 0 0;font-size:14px;color:#434651;"><strong>${c.deadline}:</strong> ${payload.deadline}</p>` : ''}
</div>`
    : ''
}

<div class="sec" style="padding-top:0;">
  <table style="width:100%;border-collapse:collapse;">
    <thead>
      <tr>
        <th style="${head}">${c.thName}</th>
        <th style="${head}">${c.thRegister}</th>
        <th style="${head}">${c.thReady}</th>
        <th style="${head}">${c.thCost}</th>
      </tr>
    </thead>
    <tbody>
      ${payload.rows
        .map(
          r => `<tr>
        <td style="${cell}font-weight:700;">${r.label}</td>
        <td style="${cell}">${r.registerBy ?? '—'}</td>
        <td style="${cell}color:#434651;">${r.readyBy ?? '—'}</td>
        <td style="${cell}">${r.fee}<br><span style="font-size:12px;color:#434651;">${r.payer}</span></td>
      </tr>`,
        )
        .join('')}
    </tbody>
  </table>
</div>

<div class="sec" style="padding-top:0;">
  <p class="sec-label">${c.costTitle}</p>
  <table style="width:100%;border-collapse:collapse;">
    <tr>
      <td style="${cell}">${c.costBest}</td>
      <td style="${cell}text-align:end;font-weight:700;">${payload.costBest}</td>
    </tr>
    <tr>
      <td style="${cell}">${c.costExpected}</td>
      <td style="${cell}text-align:end;font-weight:700;">${payload.costExpected}</td>
    </tr>
  </table>
</div>

<div class="sec" style="padding-top:0;">
  <a class="btn" href="${payload.shareUrl}">${c.open}</a>
  <p style="margin:20px 0 0;font-size:12px;color:#434651;line-height:1.7;">${c.disclaimer} ${payload.rulesVersion}.</p>
</div>
`;

  return renderEmail({ locale, title: c.title, bodyHtml: body, unsubscribeUrl });
}
