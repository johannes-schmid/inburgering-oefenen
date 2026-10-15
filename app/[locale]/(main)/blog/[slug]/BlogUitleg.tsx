'use client';

import { getFormat, type Level, type SkillSlug } from '@/data/skills';
import {
  Beslispad, ExamenOpbouw, KloptHet, Pogingen, Stappen, Termijn, Vergelijker,
  type OpbouwOnderdeel,
} from '@/components/glas/uitleg';
import { UitlegBronTaal } from '@/components/glas/uitleg/UitlegShell';

/* De uitlegelementen in de blog. Een post zet `<!--uitleg:<id>-->` in zijn `articleHtml`; de
 * route knipt de tekst daar en zet dit element ertussen. Elk getal hieronder staat al in een
 * fact-box van dezelfde post (en dus in SEO/facts.md); hier komt niets nieuws bij. De voorbeeld-
 * zinnen blijven in elke taal Nederlands — dat is wat er geleerd wordt.
 *
 * Client-bestand omdat KloptHet een functie als label krijgt, en die kan niet van server naar
 * client. */

type Loc = 'nl' | 'en' | 'ar';
type T<V = string> = Record<Loc, V>;

const SRC_INHOUD = 'https://www.inburgeren.nl/examen-doen/inhoud-taalexamens-a2-b1-b2.jsp';
const SRC_REGLEMENT = 'https://www.inburgeren.nl/images/examenreglement.pdf';
const SRC_OEFENEN = 'https://www.inburgeren.nl/examen-doen/oefenen.jsp';
const SRC_UITSLAG = 'https://www.inburgeren.nl/examen-doen/uitslag.jsp';
const SRC_BETALEN = 'https://www.inburgeren.nl/inburgeren-betalen/index.jsp';
const W21 = 'https://wetten.overheid.nl/jci1.3:c:BWBR0044770&artikel=11';
const RIJK_WET = 'https://www.rijksoverheid.nl/themas/migratie-en-reizen/inburgeren-in-nederland/nieuwe-wet-inburgering';

const BRON: T<{ bronLabel: string; checkedLabel: string }> = {
  nl: { bronLabel: 'Bron', checkedLabel: 'geraadpleegd' },
  en: { bronLabel: 'Source', checkedLabel: 'consulted' },
  ar: { bronLabel: 'المصدر', checkedLabel: 'تم الرجوع إليه في' },
};

const TOOL: T = {
  nl: '/nl/inburgering/tools/tijdlijn',
  en: '/en/civic-integration/tools/timeline',
  ar: '/ar/الاندماج/أدوات/الجدول-الزمني',
};

const L = {
  stappen: {
    nl: { prev: 'Vorige', next: 'Volgende stap', step: 'Stap', of: 'van' },
    en: { prev: 'Previous', next: 'Next step', step: 'Step', of: 'of' },
    ar: { prev: 'السابق', next: 'الخطوة التالية', step: 'الخطوة', of: 'من' },
  },
  opbouw: {
    nl: { min: 'min', perItem: 'min per vraag', unknown: 'Nog niet bekend: hier is geen openbaar oefenmateriaal van.' },
    en: { min: 'min', perItem: 'min per question', unknown: 'Not known yet: there is no public practice material for this.' },
    ar: { min: 'دقيقة', perItem: 'دقيقة لكل سؤال', unknown: 'غير معروف بعد: لا توجد مواد تدريب منشورة لهذا الجزء.' },
  },
  pogingen: {
    nl: { attempt: 'Poging', gehaald: 'Gehaald', gezakt: 'Gezakt', afgezegd: 'Afgezegd', free: 'gratis', paid: 'Je betaalt', used: 'Pogingen', again: 'Opnieuw', next: 'Wat gebeurt er?', counts: 'telt niet' },
    en: { attempt: 'Attempt', gehaald: 'Passed', gezakt: 'Failed', afgezegd: 'Cancelled', free: 'free', paid: 'You pay', used: 'Attempts', again: 'Start again', next: 'What happens?', counts: 'does not count' },
    ar: { attempt: 'المحاولة', gehaald: 'نجحت', gezakt: 'رسبت', afgezegd: 'ألغيت', free: 'مجانًا', paid: 'تدفع', used: 'المحاولات', again: 'من جديد', next: 'ماذا يحدث؟', counts: 'لا تُحتسب' },
  },
  termijn: {
    nl: { input: 'Datum op je PIP', inputHelp: 'De dagtekening staat bovenaan de brief van de gemeente.', left: 'dagen over van je termijn', start: 'Termijn begint', end: 'Termijn eindigt', notYet: 'Je termijn is nog niet begonnen.', over: 'Je termijn is voorbij. Neem contact op met je gemeente.', year: 'Jaar', tool: 'Maak je hele planning met de tijdlijn', empty: 'Vul een datum in.' },
    en: { input: 'Date on your PIP', inputHelp: 'The date is at the top of the letter from the municipality.', left: 'days left in your period', start: 'Period starts', end: 'Period ends', notYet: 'Your period has not started yet.', over: 'Your period is over. Contact your municipality.', year: 'Year', tool: 'Make your full plan with the timeline', empty: 'Enter a date.' },
    ar: { input: 'التاريخ على خطة PIP', inputHelp: 'التاريخ مكتوب في أعلى رسالة البلدية.', left: 'يومًا متبقيًا من مهلتك', start: 'تبدأ المهلة', end: 'تنتهي المهلة', notYet: 'لم تبدأ مهلتك بعد.', over: 'انتهت مهلتك. تواصل مع بلديتك.', year: 'السنة', tool: 'خطّط لكل شيء بأداة الجدول الزمني', empty: 'أدخل تاريخًا.' },
  },
  vergelijker: {
    nl: { mine: 'Wat geldt voor jou?', diff: 'Alleen verschillen', same: 'gelijk', none: 'geldt niet' },
    en: { mine: 'Which applies to you?', diff: 'Only differences', same: 'same', none: 'does not apply' },
    ar: { mine: 'ما الذي ينطبق عليك؟', diff: 'الفروق فقط', same: 'متطابق', none: 'لا ينطبق' },
  },
  klopt: {
    nl: { yes: 'Klopt', no: 'Klopt niet', right: 'Goed gezien', wrong: 'Niet goed', score: (n: number, t: number) => `${n} van ${t} goed`, again: 'Opnieuw' },
    en: { yes: 'Correct', no: 'Not correct', right: 'Well spotted', wrong: 'Not quite', score: (n: number, t: number) => `${n} of ${t} right`, again: 'Start again' },
    ar: { yes: 'صحيحة', no: 'غير صحيحة', right: 'أحسنت', wrong: 'ليس تمامًا', score: (n: number, t: number) => `${n} من ${t} صحيحة`, again: 'من جديد' },
  },
  beslis: {
    nl: { again: 'Opnieuw', question: 'Vraag', yes: 'Ja', no: 'Nee', leadsTo: 'Ja:' },
    en: { again: 'Start again', question: 'Question', yes: 'Yes', no: 'No', leadsTo: 'Yes:' },
    ar: { again: 'من جديد', question: 'السؤال', yes: 'نعم', no: 'لا', leadsTo: 'نعم:' },
  },
};

const SKILL_NAME: T<Record<SkillSlug, string>> = {
  nl: { lezen: 'Lezen', luisteren: 'Luisteren', schrijven: 'Schrijven', spreken: 'Spreken' },
  en: { lezen: 'Reading', luisteren: 'Listening', schrijven: 'Writing', spreken: 'Speaking' },
  ar: { lezen: 'القراءة', luisteren: 'الاستماع', schrijven: 'الكتابة', spreken: 'التحدث' },
};
const UNIT: T<[string, string]> = { nl: ['vragen', 'opdrachten'], en: ['questions', 'tasks'], ar: ['سؤالًا', 'مهام'] };
const TAAL: T = { nl: 'Taal', en: 'Language', ar: 'اللغة' };

function niveau(loc: Loc, level: Level, slug: SkillSlug, label?: string) {
  const f = getFormat(level, slug);
  return { level, label: label ?? `${TAAL[loc]} ${level.toUpperCase()}`, items: f.itemCount, minutes: f.durationMinutes };
}

function onderdeel(loc: Loc, slug: SkillSlug, levels: Level[] = ['a2', 'b1']): OpbouwOnderdeel {
  const unit = UNIT[loc][slug === 'schrijven' ? 1 : 0];
  return { id: slug, label: SKILL_NAME[loc][slug], unit, niveaus: levels.map(l => niveau(loc, l, slug)) };
}

/** Een Nederlandse zin in Arabische tekst: isoleren, anders zet de bidi-regel de punt vooraan. */
const ltr = (loc: Loc, s: string) => (loc === 'ar' ? `\u2066${s}\u2069` : s);

function element(id: string, loc: Loc) {
  switch (id) {
    case 'a2-examendag': {
      const c = {
        nl: {
          title: 'Je examendag, stap voor stap', intro: 'Zo gaat het bij elk onderdeel. Vink aan wat je meeneemt.',
          stappen: [
            { id: 's1', when: '30 min', whenSub: 'voor de start', title: 'Je bent er op tijd', body: 'Kom 30 minuten voor het examen. Zonder geldig legitimatiebewijs mag je geen examen doen.', check: ['Ik heb een geldig legitimatiebewijs bij me'] },
            { id: 's2', when: 'Kluis', whenSub: 'bij aankomst', title: 'Alles in het kluisje', body: 'Je telefoon, tas en horloge gaan in een kluisje. Naar de wc mag, maar alleen met begeleiding.', check: ['Telefoon', 'Tas', 'Horloge'] },
            { id: 's3', when: '15 min', whenSub: 'uitleg', title: 'Uitleg voor het examen', body: 'Je krijgt eerst 15 minuten uitleg. Die tijd is extra: hij gaat niet van je examentijd af.' },
            { id: 's4', when: 'Examen', whenSub: 'per onderdeel', title: 'Het examen', body: 'Het examen is geheim. Maak geen foto’s en schrijf geen vragen over: dat is examenfraude.' },
            { id: 's5', when: '8 wk', whenSub: 'uiterlijk', title: 'De uitslag', body: 'Je krijgt de uitslag binnen 8 weken per brief. Hij staat ook in Mijn Inburgering.' },
          ],
        },
        en: {
          title: 'Your exam day, step by step', intro: 'This is how it goes for every part. Tick off what you bring.',
          stappen: [
            { id: 's1', when: '30 min', whenSub: 'before the start', title: 'Arrive on time', body: 'Arrive 30 minutes before the exam. Without valid ID you may not take the exam.', check: ['I have valid ID with me'] },
            { id: 's2', when: 'Locker', whenSub: 'on arrival', title: 'Everything in the locker', body: 'Your phone, bag and watch go in a locker. You may go to the toilet, but only with a supervisor.', check: ['Phone', 'Bag', 'Watch'] },
            { id: 's3', when: '15 min', whenSub: 'instructions', title: 'Instructions before the exam', body: 'You first get 15 minutes of instructions. That time is extra: it does not come off your exam time.' },
            { id: 's4', when: 'Exam', whenSub: 'per part', title: 'The exam', body: 'The exam is confidential. Do not take photos or copy questions: that is exam fraud.' },
            { id: 's5', when: '8 wks', whenSub: 'at the latest', title: 'The result', body: 'You get your result by letter within 8 weeks. It also appears in Mijn Inburgering.' },
          ],
        },
        ar: {
          title: 'يوم امتحانك، خطوة بخطوة', intro: 'هكذا يسير كل جزء. ضع علامة على ما تحضره معك.',
          stappen: [
            { id: 's1', when: '30 د', whenSub: 'قبل البدء', title: 'احضر في الوقت', body: 'احضر قبل الامتحان بـ30 دقيقة. بدون إثبات هوية ساري المفعول لا يُسمح لك بالامتحان.', check: ['معي إثبات هوية ساري المفعول'] },
            { id: 's2', when: 'الخزانة', whenSub: 'عند الوصول', title: 'كل شيء في الخزانة', body: 'هاتفك وحقيبتك وساعتك تذهب إلى خزانة. يمكنك الذهاب إلى الحمّام، لكن بمرافقة فقط.', check: ['الهاتف', 'الحقيبة', 'الساعة'] },
            { id: 's3', when: '15 د', whenSub: 'الشرح', title: 'شرح قبل الامتحان', body: 'تحصل أولًا على 15 دقيقة من الشرح. هذا الوقت إضافي: لا يُخصم من وقت امتحانك.' },
            { id: 's4', when: 'الامتحان', whenSub: 'لكل جزء', title: 'الامتحان', body: 'الامتحان سرّي. لا تلتقط صورًا ولا تنسخ الأسئلة: هذا غشّ في الامتحان.' },
            { id: 's5', when: '8 أسابيع', whenSub: 'كحد أقصى', title: 'النتيجة', body: 'تصلك النتيجة برسالة خلال 8 أسابيع. وتظهر أيضًا في Mijn Inburgering.' },
          ],
        },
      }[loc];
      return (
        <Stappen
          {...c}
          labels={L.stappen[loc]}
          bron={[{ label: 'DUO Examenreglement', href: SRC_REGLEMENT }, { label: 'inburgeren.nl', href: SRC_UITSLAG }]}
        />
      );
    }

    case 'a2-opbouw': {
      const t = {
        nl: { title: 'A2 en B1 naast elkaar', intro: 'Kies een onderdeel. De lengte van de balk is de tijd, elk blokje is een vraag of opdracht.' },
        en: { title: 'A2 and B1 side by side', intro: 'Pick a part. The length of the bar is the time; each block is a question or task.' },
        ar: { title: 'A2 وB1 جنبًا إلى جنب', intro: 'اختر جزءًا. طول الشريط هو الوقت، وكل مربّع سؤال أو مهمة.' },
      }[loc];
      return (
        <ExamenOpbouw
          {...t}
          locale={loc}
          labels={L.opbouw[loc]}
          onderdelen={(['lezen', 'luisteren', 'schrijven', 'spreken'] as SkillSlug[]).map(s => onderdeel(loc, s))}
          bron={[{ label: 'inburgeren.nl', href: SRC_INHOUD }, { label: loc === 'nl' ? 'oefenexamens van DUO' : loc === 'en' ? 'DUO practice exams' : 'امتحانات DUO التدريبية', href: SRC_OEFENEN }]}
        />
      );
    }

    case 'lezen-opbouw': {
      const t = {
        nl: { title: 'Lezen: A2 tegen B1', intro: 'Op B1 krijg je meer vragen, maar ook meer tijd per vraag.' },
        en: { title: 'Reading: A2 against B1', intro: 'At B1 you get more questions, but also more time per question.' },
        ar: { title: 'القراءة: A2 مقابل B1', intro: 'في B1 تحصل على أسئلة أكثر، لكن أيضًا على وقت أطول لكل سؤال.' },
      }[loc];
      return (
        <ExamenOpbouw
          {...t}
          locale={loc}
          labels={L.opbouw[loc]}
          onderdelen={[onderdeel(loc, 'lezen')]}
          bron={[{ label: 'inburgeren.nl', href: SRC_INHOUD }, { label: loc === 'nl' ? 'oefenexamens van DUO' : loc === 'en' ? 'DUO practice exams' : 'امتحانات DUO التدريبية', href: SRC_OEFENEN }]}
        />
      );
    }

    case 'luisteren-vs-lezen': {
      const t = {
        nl: { title: 'Zelfde aantal vragen, 20 minuten minder', intro: 'Lezen en Luisteren A2 in de oefenexamens van DUO. Elk blokje is een vraag.' },
        en: { title: 'Same number of questions, 20 minutes less', intro: 'Reading and Listening A2 in the DUO practice exams. Each block is a question.' },
        ar: { title: 'نفس عدد الأسئلة، و20 دقيقة أقل', intro: 'القراءة والاستماع A2 في امتحانات DUO التدريبية. كل مربّع سؤال.' },
      }[loc];
      return (
        <ExamenOpbouw
          {...t}
          locale={loc}
          labels={L.opbouw[loc]}
          onderdelen={[{
            id: 'luisteren',
            label: SKILL_NAME[loc].luisteren,
            unit: UNIT[loc][0],
            niveaus: [
              { ...niveau(loc, 'a2', 'lezen', `${SKILL_NAME[loc].lezen} A2`), level: 'lezen' },
              { ...niveau(loc, 'a2', 'luisteren', `${SKILL_NAME[loc].luisteren} A2`), level: 'luisteren' },
            ],
          }]}
          bron={[{ label: 'inburgeren.nl', href: SRC_INHOUD }, { label: loc === 'nl' ? 'oefenexamens van DUO' : loc === 'en' ? 'DUO practice exams' : 'امتحانات DUO التدريبية', href: SRC_OEFENEN }]}
        />
      );
    }

    case 'herkansen-pogingen': {
      const c = {
        nl: {
          title: 'Wat kost het als je herkanst?', intro: 'Kies wie je bent, en klik per poging wat er gebeurt.',
          profielen: [
            { id: 'asiel', label: 'Asielstatushouder', gratis: 2, prijs: 50, noot: 'De eerste 2 pogingen van elk examen zijn gratis. Een extra poging betaal je zelf, en daarvoor kun je niet lenen bij DUO.' },
            { id: 'overig', label: 'Andere inburgeraar', gratis: 0, prijs: 50, noot: 'Je betaalt elke poging zelf: op dit moment €50 per onderdeel. Zeg je uiterlijk 7 dagen vooraf af, dan krijg je je geld terug.' },
          ],
          maxNote: 'DUO noemt geen maximum aantal pogingen. In de praktijk is je termijn de grens.',
        },
        en: {
          title: 'What does retaking cost?', intro: 'Choose who you are, then click what happens at each attempt.',
          profielen: [
            { id: 'asiel', label: 'Asylum status holder', gratis: 2, prijs: 50, noot: 'The first 2 attempts at each exam are free. You pay for an extra attempt yourself, and you cannot borrow from DUO for it.' },
            { id: 'overig', label: 'Other learner', gratis: 0, prijs: 50, noot: 'You pay for every attempt: currently €50 per part. Cancel at least 7 days ahead and you get your money back.' },
          ],
          maxNote: 'DUO gives no maximum number of attempts. In practice your deadline is the limit.',
        },
        ar: {
          title: 'كم تكلّف الإعادة؟', intro: 'اختر وضعك، ثم اضغط ما يحدث في كل محاولة.',
          profielen: [
            { id: 'asiel', label: 'حاصل على حق اللجوء', gratis: 2, prijs: 50, noot: 'أول محاولتين لكل امتحان مجانيتان. المحاولة الإضافية تدفعها بنفسك، ولا يمكنك الاقتراض من DUO لها.' },
            { id: 'overig', label: 'متعلّم آخر', gratis: 0, prijs: 50, noot: 'تدفع كل محاولة بنفسك: حاليًا 50 يورو لكل جزء. إذا ألغيت قبل 7 أيام على الأقل، تسترد مالك.' },
          ],
          maxNote: 'لا تحدد DUO عددًا أقصى للمحاولات. عمليًا، مهلتك هي الحد.',
        },
      }[loc];
      return (
        <Pogingen
          {...c}
          locale={loc}
          labels={L.pogingen[loc]}
          bron={[{ label: 'inburgeren.nl', href: SRC_BETALEN }, { label: 'DUO Examenreglement, art. 11', href: SRC_REGLEMENT }]}
        />
      );
    }

    case 'herkansen-termijn': {
      const t = {
        nl: { title: 'Hoeveel tijd heb je nog?', intro: 'Onder de Wet inburgering 2021. Vul de datum van je PIP in: je termijn begint de dag erna en duurt 3 jaar.' },
        en: { title: 'How much time do you have left?', intro: 'Under the Wet inburgering 2021. Enter the date of your PIP: your period starts the day after and lasts 3 years.' },
        ar: { title: 'كم بقي لك من الوقت؟', intro: 'بموجب قانون الاندماج لعام 2021. أدخل تاريخ خطة PIP: تبدأ مهلتك في اليوم التالي وتستمر 3 سنوات.' },
      }[loc];
      return (
        <Termijn
          {...t}
          locale={loc}
          labels={L.termijn[loc]}
          toolHref={TOOL[loc]}
          bron={{ label: 'Wet inburgering 2021, art. 11', href: W21, checked: '19-08-2026' }}
        />
      );
    }

    case 'niveaus-routes': {
      const c = {
        nl: {
          title: 'De drie leerroutes naast elkaar', intro: 'Welke route je volgt, staat in je PIP. Kies hem hieronder.',
          kolommen: [{ id: 'b1', label: 'B1-route' }, { id: 'onderwijs', label: 'Onderwijs' }, { id: 'z', label: 'Z-route' }],
          rijen: [
            { id: 'niv', label: 'Taalniveau', waarden: ['B1', 'B1 of hoger', 'A1'] },
            { id: 'wie', label: 'Voor wie', waarden: [{ t: 'standaard', sub: 'taal en (vrijwilligers)werk, maximaal 3 jaar' }, { t: 'vooral jongeren', sub: 'op weg naar mbo, hbo of universiteit' }, { t: 'als B1 niet haalbaar is', sub: 'taal en meedoen' }] },
            { id: 'knm', label: 'KNM', waarden: ['Ja', 'Ja', 'Ja'], zelfde: true },
          ],
        },
        en: {
          title: 'The three learning routes side by side', intro: 'Your route is in your PIP. Choose it below.',
          kolommen: [{ id: 'b1', label: 'B1 route' }, { id: 'onderwijs', label: 'Education' }, { id: 'z', label: 'Self-reliance' }],
          rijen: [
            { id: 'niv', label: 'Language level', waarden: ['B1', 'B1 or higher', 'A1'] },
            { id: 'wie', label: 'For whom', waarden: [{ t: 'standard', sub: 'language and (voluntary) work, maximum 3 years' }, { t: 'mainly young people', sub: 'heading for further education' }, { t: 'when B1 is not achievable', sub: 'language and participation' }] },
            { id: 'knm', label: 'KNM', waarden: ['Yes', 'Yes', 'Yes'], zelfde: true },
          ],
        },
        ar: {
          title: 'مسارات التعلّم الثلاثة جنبًا إلى جنب', intro: 'مسارك مكتوب في خطة PIP. اختره أدناه.',
          kolommen: [{ id: 'b1', label: 'مسار B1' }, { id: 'onderwijs', label: 'التعليم' }, { id: 'z', label: 'الاعتماد على الذات' }],
          rijen: [
            { id: 'niv', label: 'المستوى', waarden: ['B1', 'B1 أو أعلى', 'A1'] },
            { id: 'wie', label: 'لمن', waarden: [{ t: 'القياسي', sub: 'اللغة والعمل (التطوعي)، بحد أقصى 3 سنوات' }, { t: 'بشكل أساسي للشباب', sub: 'المتجهين إلى مواصلة الدراسة' }, { t: 'حين يكون B1 غير قابل للتحقيق', sub: 'اللغة والمشاركة' }] },
            { id: 'knm', label: 'KNM', waarden: ['نعم', 'نعم', 'نعم'], zelfde: true },
          ],
        },
      }[loc];
      return <Vergelijker {...c} labels={L.vergelijker[loc]} bron={{ label: 'rijksoverheid.nl', href: RIJK_WET }} />;
    }

    case 'schrijven-klopt': {
      const c = {
        nl: {
          title: 'Klopt deze zin?', intro: 'Vier zinnen met de fouten uit dit artikel. Kies, en zie meteen waarom.',
          uitleg: [
            'Een zin, een plaats en een naam beginnen met een hoofdletter: Ik woon in Amsterdam met mijn zoon Ali.',
            'Een komma vóór want, en een punt aan het eind.',
            'Maanden en dagen schrijf je met een kleine letter: Ik kom op maandag 3 maart.',
            'Twee zinnen, elk met een punt.',
          ],
          bron: ['Fout 1', 'Fout 3', 'Fout 5', 'Fout 2'],
        },
        en: {
          title: 'Is this sentence right?', intro: 'Four sentences with the mistakes from this article. Choose, and see why straight away.',
          uitleg: [
            'A sentence, a place and a name start with a capital: Ik woon in Amsterdam met mijn zoon Ali.',
            'A comma before want, and a full stop at the end.',
            'Months and days are written in lower case: Ik kom op maandag 3 maart.',
            'Two sentences, each with a full stop.',
          ],
          bron: ['Mistake 1', 'Mistake 3', 'Mistake 5', 'Mistake 2'],
        },
        ar: {
          title: 'هل هذه الجملة صحيحة؟', intro: 'أربع جمل فيها أخطاء هذا المقال. اختر، وسترى السبب فورًا.',
          uitleg: [
            'الجملة واسم المكان واسم الشخص تبدأ بحرف كبير: \u2066Ik woon in Amsterdam met mijn zoon Ali.\u2069',
            'فاصلة قبل want، ونقطة في النهاية.',
            'تُكتب الشهور والأيام بحرف صغير: \u2066Ik kom op maandag 3 maart.\u2069',
            'جملتان، ولكل منهما نقطة.',
          ],
          bron: ['الخطأ 1', 'الخطأ 3', 'الخطأ 5', 'الخطأ 2'],
        },
      }[loc];
      const zinnen: [string, boolean][] = [
        ['ik woon in amsterdam met mijn zoon ali.', false],
        ['Ik kan niet komen, want ik moet werken.', true],
        ['Ik kom op Maandag 3 Maart.', false],
        ['Ik kom morgen langs. Tot ziens.', true],
      ];
      return (
        <KloptHet
          title={c.title}
          intro={c.intro}
          labels={L.klopt[loc]}
          beweringen={zinnen.map(([tekst, klopt], k) => ({ id: `z${k}`, tekst: ltr(loc, tekst), klopt, uitleg: c.uitleg[k], bron: c.bron[k] }))}
        />
      );
    }

    case 'wederkerend-klopt': {
      const c = {
        nl: {
          title: 'Klopt deze zin?', intro: 'De drie fouten die het vaakst voorkomen, plus één goede zin.',
          uitleg: [
            'Het woordje ontbreekt. Concentreren is wederkerend: Ik kan me beter concentreren.',
            'Bij u hoort zich, niet je: Voelt u zich goed?',
            'Het woordje staat na het werkwoord: Ik bereid me voor.',
            'Me staat direct na het werkwoord, en het hoort erbij.',
          ],
          bron: ['Fout 1', 'Fout 2', 'Fout 3', 'De regel'],
        },
        en: {
          title: 'Is this sentence right?', intro: 'The three most common mistakes, plus one correct sentence.',
          uitleg: [
            'The small word is missing. Concentreren is reflexive: Ik kan me beter concentreren.',
            'With u you use zich, not je: Voelt u zich goed?',
            'The small word goes after the verb: Ik bereid me voor.',
            'Me comes straight after the verb, and it belongs there.',
          ],
          bron: ['Mistake 1', 'Mistake 2', 'Mistake 3', 'The rule'],
        },
        ar: {
          title: 'هل هذه الجملة صحيحة؟', intro: 'الأخطاء الثلاثة الأكثر شيوعًا، وجملة واحدة صحيحة.',
          uitleg: [
            'الكلمة الصغيرة ناقصة. الفعل concentreren انعكاسي: \u2066Ik kan me beter concentreren.\u2069',
            'مع u تستخدم zich وليس je: \u2066Voelt u zich goed?\u2069',
            'الكلمة الصغيرة تأتي بعد الفعل: \u2066Ik bereid me voor.\u2069',
            'تأتي me مباشرة بعد الفعل، وهي جزء منه.',
          ],
          bron: ['الخطأ 1', 'الخطأ 2', 'الخطأ 3', 'القاعدة'],
        },
      }[loc];
      const zinnen: [string, boolean][] = [
        ['Ik kan beter concentreren.', false],
        ['Voelt u je goed?', false],
        ['Ik me bereid voor.', false],
        ['Ik voel me goed.', true],
      ];
      return (
        <KloptHet
          title={c.title}
          intro={c.intro}
          labels={L.klopt[loc]}
          beweringen={zinnen.map(([tekst, klopt], k) => ({ id: `w${k}`, tekst: ltr(loc, tekst), klopt, uitleg: c.uitleg[k], bron: c.bron[k] }))}
        />
      );
    }

    case 'want-of-omdat': {
      const c = {
        nl: {
          title: 'Want, omdat of twee zinnen?', intro: 'Twee vragen, en je weet welk woord je kiest.',
          vragen: [
            { id: 'q1', vraag: 'Geef je antwoord op een vraag met ‘waarom’?', hint: 'Bijvoorbeeld: Waarom kom je niet?', opties: [{ label: 'Ja', naar: 'omdat' }, { label: 'Nee', naar: 'q2' }] },
            { id: 'q2', vraag: 'Wil je de twee delen in één zin zetten?', opties: [{ label: 'Ja', naar: 'want' }, { label: 'Nee', naar: 'twee' }] },
          ],
          uitkomsten: [
            { id: 'omdat', toon: 'moet' as const, titel: 'Begin met ‘Omdat’', tekst: 'Het werkwoord gaat naar achteren: Omdat ik ziek ben.' },
            { id: 'want', toon: 'vrij' as const, titel: 'Kies ‘want’', tekst: 'Na want blijft de zin gewoon: Ik kom niet, want ik ben ziek. De komma staat vóór want.' },
            { id: 'twee', toon: 'vrij' as const, titel: 'Maak er twee zinnen van', tekst: 'Ik kom niet. Ik ben ziek. Twee korte, goede zinnen zijn beter dan één lange zin met een fout.' },
          ],
        },
        en: {
          title: 'Want, omdat or two sentences?', intro: 'Two questions, and you know which word to choose.',
          vragen: [
            { id: 'q1', vraag: 'Are you answering a question with ‘waarom’ (why)?', hint: 'For example: Waarom kom je niet?', opties: [{ label: 'Yes', naar: 'omdat' }, { label: 'No', naar: 'q2' }] },
            { id: 'q2', vraag: 'Do you want to put both parts in one sentence?', opties: [{ label: 'Yes', naar: 'want' }, { label: 'No', naar: 'twee' }] },
          ],
          uitkomsten: [
            { id: 'omdat', toon: 'moet' as const, titel: 'Start with ‘Omdat’', tekst: 'The verb moves to the end: Omdat ik ziek ben.' },
            { id: 'want', toon: 'vrij' as const, titel: 'Choose ‘want’', tekst: 'After want the sentence stays normal: Ik kom niet, want ik ben ziek. The comma goes before want.' },
            { id: 'twee', toon: 'vrij' as const, titel: 'Make it two sentences', tekst: 'Ik kom niet. Ik ben ziek. Two short, correct sentences beat one long sentence with a mistake.' },
          ],
        },
        ar: {
          title: 'want أم omdat أم جملتان؟', intro: 'سؤالان، وستعرف أي كلمة تختار.',
          vragen: [
            { id: 'q1', vraag: 'هل تجيب عن سؤال يبدأ بـ«waarom» (لماذا)؟', hint: 'مثلًا: \u2066Waarom kom je niet?\u2069', opties: [{ label: 'نعم', naar: 'omdat' }, { label: 'لا', naar: 'q2' }] },
            { id: 'q2', vraag: 'هل تريد وضع الجزأين في جملة واحدة؟', opties: [{ label: 'نعم', naar: 'want' }, { label: 'لا', naar: 'twee' }] },
          ],
          uitkomsten: [
            { id: 'omdat', toon: 'moet' as const, titel: 'ابدأ بـ«Omdat»', tekst: 'ينتقل الفعل إلى آخر الجملة: \u2066Omdat ik ziek ben.\u2069' },
            { id: 'want', toon: 'vrij' as const, titel: 'اختر «want»', tekst: 'بعد want تبقى الجملة عادية: \u2066Ik kom niet, want ik ben ziek.\u2069 والفاصلة قبل want.' },
            { id: 'twee', toon: 'vrij' as const, titel: 'اجعلها جملتين', tekst: '\u2066Ik kom niet. Ik ben ziek.\u2069 جملتان قصيرتان صحيحتان أفضل من جملة طويلة فيها خطأ.' },
          ],
        },
      }[loc];
      return <Beslispad {...c} start="q1" labels={L.beslis[loc]} />;
    }

    default:
      return null;
  }
}

export default function BlogUitleg({ id, locale }: { id: string; locale: string }) {
  const loc: Loc = locale === 'en' || locale === 'ar' ? locale : 'nl';
  const el = element(id, loc);
  if (!el) return null;
  return (
    <UitlegBronTaal.Provider value={BRON[loc]}>
      <div className="g-blog-uitleg">{el}</div>
    </UitlegBronTaal.Provider>
  );
}
