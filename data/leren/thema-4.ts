/**
 * GENERATED — do not edit by hand.
 *
 * Written by scripts/knm-content/generate-leren-data.mjs from the KNM production
 * `leren_content` table. Edit a section in /admin and re-run the exporter + generator;
 * editing this file instead is a change that the next run silently reverts.
 */
import type { LerenThema } from './types';

export const thema: LerenThema = {
  id: 4,
  slug: "thema-4-onderwijs",
  title: "Onderwijs",
  description: "In dit thema leer je alles over het Nederlandse onderwijs: de leerplicht, de schoolsoorten, het vervolgonderwijs en de rol van ouders.",
  quizCategory: "Onderwijs en Opvoeding",
  sections: [
    {
      id: "leerplicht",
      icon: "school",
      title: "Leerplicht en scholen",
      subtitle: "Van basisschool tot voortgezet onderwijs, VMBO, HAVO en VWO",
      contentHtml: `<section id="leerplicht" class="scroll-mt-24 mb-8">
            <div class="bg-white rounded-3xl p-7 shadow-sm">
              <h2 class="text-xl sm:text-2xl font-bold text-primary mb-5 flex items-center gap-3">
                <span class="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                  <span class="material-symbols-outlined text-primary text-[18px]">school</span>
                </span>
                Leerplicht en scholen
              </h2>

              <p class="text-on-surface-variant leading-relaxed mb-5">
                In Nederland moeten alle kinderen van <strong class="text-on-surface">5 tot 16 jaar</strong> naar school. Dit heet <strong class="text-on-surface">leerplicht</strong>. Ouders zijn verantwoordelijk dat hun kind naar school gaat.
              </p>

              <!-- STEP_TIMELINE:onderwijs-leeftijd -->

              <!-- Kinderopvang types -->
              <div class="bg-surface-container-low rounded-2xl p-5 mb-6">
                <h3 class="text-sm font-bold text-on-surface mb-3 flex items-center gap-2">
                  <span class="material-symbols-outlined text-primary text-[16px]">child_care</span>
                  Soorten kinderopvang
                </h3>
                <div class="space-y-2.5 text-sm text-on-surface-variant">
                  <div class="flex gap-3">
                    <span class="text-primary font-bold shrink-0">→</span>
                    <span><strong class="text-on-surface">Kinderdagverblijf</strong> (0–4 jaar) — kinderen spelen, leren en bereiden zich voor op school</span>
                  </div>
                  <div class="flex gap-3">
                    <span class="text-primary font-bold shrink-0">→</span>
                    <span><strong class="text-on-surface">Voorschoolse educatie (VE)</strong> (2,5–4 jaar) — voor kinderen die thuis geen Nederlands spreken; 16 uur per week extra taal, tellen en bewegen; via het consultatiebureau</span>
                  </div>
                  <div class="flex gap-3">
                    <span class="text-primary font-bold shrink-0">→</span>
                    <span><strong class="text-on-surface">Buitenschoolse opvang (BSO)</strong> (4–12 jaar) — na schooltijd; voor ouders die werken; kinderen spelen en doen activiteiten</span>
                  </div>
                </div>
              </div>

              <!-- Basisschool -->
              <div class="mb-6">
                <h3 class="text-base font-bold text-on-surface mb-3">De basisschool</h3>
                <p class="text-sm text-on-surface-variant leading-relaxed mb-4">
                  De basisschool heeft <strong class="text-on-surface">8 groepen</strong>. Op de basisschool noem je de docent <strong class="text-on-surface">meester</strong> (man) of <strong class="text-on-surface">juf</strong> (vrouw).
                </p>
                <div class="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
                  <div class="bg-surface-container-low rounded-2xl p-4">
                    <p class="text-[10px] font-bold text-primary uppercase tracking-widest mb-2">Groep 1 & 2</p>
                    <p class="text-xs text-on-surface-variant leading-relaxed">Leren door te <strong class="text-on-surface">spelen</strong> — tekenen, zingen, bewegen</p>
                  </div>
                  <div class="bg-surface-container-low rounded-2xl p-4">
                    <p class="text-[10px] font-bold text-primary uppercase tracking-widest mb-2">Groep 3 en verder</p>
                    <p class="text-xs text-on-surface-variant leading-relaxed"><strong class="text-on-surface">Lezen, schrijven en rekenen</strong>. Vanaf groep 5 ook geschiedenis en aardrijkskunde</p>
                  </div>
                  <div class="bg-surface-container-low rounded-2xl p-4">
                    <p class="text-[10px] font-bold text-primary uppercase tracking-widest mb-2">Groep 8</p>
                    <p class="text-xs text-on-surface-variant leading-relaxed">Kind krijgt een <strong class="text-on-surface">advies</strong> voor de middelbare school. Ouders schrijven kind in.</p>
                  </div>
                </div>
              </div>

              <!-- VO levels comparison -->
              <h3 class="text-base font-bold text-on-surface mb-3">De vier soorten middelbare school</h3>
              <p class="text-sm text-on-surface-variant leading-relaxed mb-4">Na de basisschool gaat een kind naar het <strong class="text-on-surface">voortgezet onderwijs</strong>. Op de middelbare school noem je de docent <strong class="text-on-surface">docent</strong> of <strong class="text-on-surface">leraar / lerares</strong>.</p>
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
                <div class="border-2 border-primary/20 rounded-2xl p-4">
                  <div class="flex items-center justify-between mb-2">
                    <p class="text-sm font-bold text-on-surface">PRO</p>
                    <span class="text-[10px] font-bold bg-primary/10 text-primary px-2 py-0.5 rounded-full">5 jaar</span>
                  </div>
                  <p class="text-xs text-on-surface-variant leading-relaxed">Praktijkonderwijs — je leert <strong class="text-on-surface">weinig uit boeken</strong> en leert direct een <strong class="text-on-surface">beroep</strong></p>
                </div>
                <div class="border-2 border-primary/20 rounded-2xl p-4">
                  <div class="flex items-center justify-between mb-2">
                    <p class="text-sm font-bold text-on-surface">VMBO</p>
                    <span class="text-[10px] font-bold bg-primary/10 text-primary px-2 py-0.5 rounded-full">4 jaar</span>
                  </div>
                  <p class="text-xs text-on-surface-variant leading-relaxed">Een beetje uit boeken; je kunt al leren voor een <strong class="text-on-surface">beroep</strong>. Daarna naar het MBO.</p>
                </div>
                <div class="border-2 border-primary/20 rounded-2xl p-4">
                  <div class="flex items-center justify-between mb-2">
                    <p class="text-sm font-bold text-on-surface">HAVO</p>
                    <span class="text-[10px] font-bold bg-primary/10 text-primary px-2 py-0.5 rounded-full">5 jaar</span>
                  </div>
                  <p class="text-xs text-on-surface-variant leading-relaxed">Meer theorie; <strong class="text-on-surface">niet direct voor een beroep</strong>. Daarna naar het HBO.</p>
                </div>
                <div class="border-2 border-primary/20 rounded-2xl p-4">
                  <div class="flex items-center justify-between mb-2">
                    <p class="text-sm font-bold text-on-surface">VWO</p>
                    <span class="text-[10px] font-bold bg-primary/10 text-primary px-2 py-0.5 rounded-full">6 jaar</span>
                  </div>
                  <p class="text-xs text-on-surface-variant leading-relaxed">Veel theorie; voorbereiding op de <strong class="text-on-surface">universiteit</strong>. Langste opleiding van de vier.</p>
                </div>
              </div>

              <!-- Vrijheid van onderwijs -->
              <div class="bg-surface-container-low rounded-2xl p-4 mb-5">
                <div class="flex items-center gap-2 mb-2">
                  <span class="material-symbols-outlined text-primary text-[18px]">diversity_3</span>
                  <p class="text-sm font-bold text-on-surface">Vrijheid van onderwijs</p>
                </div>
                <p class="text-xs text-on-surface-variant leading-relaxed">In Nederland mag iedereen een school beginnen en mogen ouders <strong class="text-on-surface">zelf kiezen</strong> naar welke school hun kind gaat. Er zijn openbare scholen, maar ook christelijke, islamitische, Dalton- en Montessorischolen.</p>
              </div>

              <!-- Speciaal onderwijs -->
              <div class="bg-surface-container-low rounded-2xl p-4 mb-5">
                <div class="flex items-center gap-2 mb-2">
                  <span class="material-symbols-outlined text-primary text-[18px]">accessibility</span>
                  <p class="text-sm font-bold text-on-surface">Speciaal onderwijs</p>
                </div>
                <p class="text-xs text-on-surface-variant leading-relaxed">Voor kinderen die extra hulp nodig hebben — bijvoorbeeld kinderen die blind of doof zijn, een beperking hebben, moeilijk kunnen leren of moeilijk gedrag hebben.</p>
              </div>

              <div class="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex gap-3">
                <span class="material-symbols-outlined text-amber-500 text-[20px] shrink-0 mt-0.5">lightbulb</span>
                <div>
                  <p class="text-xs font-bold text-amber-800 uppercase tracking-wider mb-1">Onthoud dit!</p>
                  <p class="text-sm text-amber-900 leading-relaxed">Leerplicht = <strong>5 tot 16 jaar</strong>. Basisschool = <strong>4 tot 12 jaar</strong>, 8 groepen. Groep 8 geeft een <strong>advies</strong> voor de middelbare school. Inschrijven kan al als je kind <strong>2 jaar</strong> is — schrijf je vroeg in!</p>
                </div>
              </div>
            </div>
          </section>
      <!-- WIDGET:les-thema4-leerplicht -->`,
    },
    {
      id: "vervolg",
      icon: "account_balance",
      title: "Vervolgopleidingen",
      subtitle: "MBO, HBO en universiteit",
      contentHtml: `<section id="vervolg" class="scroll-mt-24 mb-8">
            <div class="bg-white rounded-3xl p-7 shadow-sm">
              <h2 class="text-xl sm:text-2xl font-bold text-primary mb-5 flex items-center gap-3">
                <span class="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                  <span class="material-symbols-outlined text-primary text-[18px]">account_tree</span>
                </span>
                Vervolgopleidingen
              </h2>

              <!-- Kwalificatieplicht callout -->
              <div class="bg-blue-50 border border-blue-200 rounded-2xl p-4 flex gap-3 mb-6">
                <span class="material-symbols-outlined text-blue-600 text-[20px] shrink-0 mt-0.5">gavel</span>
                <div>
                  <p class="text-sm font-bold text-blue-900 mb-1">De kwalificatieplicht</p>
                  <p class="text-xs text-blue-800 leading-relaxed">Ben je <strong>16 of 17 jaar</strong> en heb je nog <strong>geen havo-, vwo- of mbo-diploma (niveau 2 of hoger)</strong>? Dan moet je in Nederland verplicht verder leren. Je mag niet zomaar stoppen met school.</p>
                </div>
              </div>

              <!-- Three paths after VO -->
              <h3 class="text-base font-bold text-on-surface mb-4">Drie wegen na de middelbare school</h3>
              <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                <div class="bg-primary/5 border border-primary/20 rounded-2xl p-5">
                  <div class="w-10 h-10 rounded-xl bg-primary flex items-center justify-center mb-3">
                    <span class="material-symbols-outlined text-white text-[18px]">engineering</span>
                  </div>
                  <p class="text-sm font-bold text-on-surface mb-1">MBO</p>
                  <p class="text-[10px] font-bold text-primary uppercase tracking-widest mb-2">aan een ROC</p>
                  <ul class="text-xs text-on-surface-variant space-y-1 list-none p-0 m-0">
                    <li class="flex gap-1.5"><span class="text-primary font-bold">→</span> Duurt <strong class="text-on-surface">1 tot 4 jaar</strong></li>
                    <li class="flex gap-1.5"><span class="text-primary font-bold">→</span> Je leert een <strong class="text-on-surface">beroep</strong></li>
                    <li class="flex gap-1.5"><span class="text-primary font-bold">→</span> Combinatie school + werken</li>
                  </ul>
                </div>
                <div class="bg-primary/5 border border-primary/20 rounded-2xl p-5">
                  <div class="w-10 h-10 rounded-xl bg-primary flex items-center justify-center mb-3">
                    <span class="material-symbols-outlined text-white text-[18px]">business_center</span>
                  </div>
                  <p class="text-sm font-bold text-on-surface mb-1">HBO</p>
                  <p class="text-[10px] font-bold text-primary uppercase tracking-widest mb-2">aan een hogeschool</p>
                  <ul class="text-xs text-on-surface-variant space-y-1 list-none p-0 m-0">
                    <li class="flex gap-1.5"><span class="text-primary font-bold">→</span> Duurt <strong class="text-on-surface">4 jaar</strong></li>
                    <li class="flex gap-1.5"><span class="text-primary font-bold">→</span> Theorie + <strong class="text-on-surface">stage</strong></li>
                    <li class="flex gap-1.5"><span class="text-primary font-bold">→</span> Na HAVO of MBO</li>
                  </ul>
                </div>
                <div class="bg-primary/5 border border-primary/20 rounded-2xl p-5">
                  <div class="w-10 h-10 rounded-xl bg-primary flex items-center justify-center mb-3">
                    <span class="material-symbols-outlined text-white text-[18px]">science</span>
                  </div>
                  <p class="text-sm font-bold text-on-surface mb-1">Universiteit</p>
                  <p class="text-[10px] font-bold text-primary uppercase tracking-widest mb-2">aan een universiteit</p>
                  <ul class="text-xs text-on-surface-variant space-y-1 list-none p-0 m-0">
                    <li class="flex gap-1.5"><span class="text-primary font-bold">→</span> Duurt <strong class="text-on-surface">4 tot 5 jaar</strong></li>
                    <li class="flex gap-1.5"><span class="text-primary font-bold">→</span> Veel <strong class="text-on-surface">theorie</strong></li>
                    <li class="flex gap-1.5"><span class="text-primary font-bold">→</span> Na VWO</li>
                  </ul>
                </div>
              </div>

              <!-- Toelatingseisen note -->
              <div class="bg-surface-container-low rounded-2xl p-4 mb-5">
                <div class="flex items-center gap-2 mb-1">
                  <span class="material-symbols-outlined text-primary text-[16px]">checklist</span>
                  <p class="text-sm font-bold text-on-surface">Toelatingseisen</p>
                </div>
                <p class="text-xs text-on-surface-variant leading-relaxed">Sommige opleidingen hebben <strong class="text-on-surface">toelatingseisen</strong> — dat zijn extra voorwaarden om toegelaten te worden. Bijvoorbeeld: je hebt een bepaald vak op de middelbare school gehad, of je moet een toets maken.</p>
              </div>

              <div class="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex gap-3">
                <span class="material-symbols-outlined text-amber-500 text-[20px] shrink-0 mt-0.5">lightbulb</span>
                <div>
                  <p class="text-xs font-bold text-amber-800 uppercase tracking-wider mb-1">Onthoud dit!</p>
                  <p class="text-sm text-amber-900 leading-relaxed"><strong>MBO</strong> = aan een ROC. <strong>HBO</strong> = aan een hogeschool. <strong>Universiteit</strong> = na VWO, 4–5 jaar. En: bij <strong>kwalificatieplicht</strong> moet je op 16–17 jaar verplicht verder leren als je nog geen diploma hebt.</p>
                </div>
              </div>
            </div>
          </section>
      <!-- WIDGET:les-thema4-vervolg -->`,
    },
    {
      id: "ouders",
      icon: "groups",
      title: "Ouderbetrokkenheid",
      subtitle: "Ouderavonden, rapport en communicatie met school",
      contentHtml: `<section id="ouders" class="scroll-mt-24 mb-8">
            <div class="bg-white rounded-3xl p-7 shadow-sm">
              <h2 class="text-xl sm:text-2xl font-bold text-primary mb-5 flex items-center gap-3">
                <span class="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                  <span class="material-symbols-outlined text-primary text-[18px]">groups</span>
                </span>
                Ouderbetrokkenheid
              </h2>

              <p class="text-on-surface-variant leading-relaxed mb-5">
                Nederlandse scholen vinden het belangrijk dat ouders <strong class="text-on-surface">betrokken</strong> zijn bij de school van hun kind. Als ouders meehelpen, kunnen er meer activiteiten plaatsvinden.
              </p>

              <!-- Ways to be involved -->
              <h3 class="text-base font-bold text-on-surface mb-3">Hoe kun je helpen?</h3>
              <div class="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
                <div class="bg-surface-container-low rounded-2xl p-4 text-center">
                  <span class="material-symbols-outlined text-primary text-[24px] mb-2 block">class</span>
                  <p class="text-xs font-bold text-on-surface">In de klas</p>
                  <p class="text-xs text-on-surface-variant mt-1 leading-snug">Helpen bij activiteiten of lessen</p>
                </div>
                <div class="bg-surface-container-low rounded-2xl p-4 text-center">
                  <span class="material-symbols-outlined text-primary text-[24px] mb-2 block">directions_bus</span>
                  <p class="text-xs font-bold text-on-surface">Schoolreisje</p>
                  <p class="text-xs text-on-surface-variant mt-1 leading-snug">Meegaan als begeleider</p>
                </div>
                <div class="bg-surface-container-low rounded-2xl p-4 text-center">
                  <span class="material-symbols-outlined text-primary text-[24px] mb-2 block">celebration</span>
                  <p class="text-xs font-bold text-on-surface">Feesten en activiteiten</p>
                  <p class="text-xs text-on-surface-variant mt-1 leading-snug">Helpen bij bijv. Sinterklaasfeest</p>
                </div>
              </div>

              <!-- Oudergesprek -->
              <div class="bg-surface-container-low rounded-2xl p-5 mb-5">
                <h3 class="text-sm font-bold text-on-surface mb-3 flex items-center gap-2">
                  <span class="material-symbols-outlined text-primary text-[16px]">forum</span>
                  Het oudergesprek (10-minutengesprek)
                </h3>
                <div class="space-y-2 text-sm text-on-surface-variant">
                  <div class="flex gap-3">
                    <span class="text-primary font-bold shrink-0">→</span>
                    <span>Een paar keer per jaar organiseert de school <strong class="text-on-surface">oudergesprekken</strong></span>
                  </div>
                  <div class="flex gap-3">
                    <span class="text-primary font-bold shrink-0">→</span>
                    <span>Jij en de juf/meester praten over de <strong class="text-on-surface">ontwikkeling van je kind</strong></span>
                  </div>
                  <div class="flex gap-3">
                    <span class="text-primary font-bold shrink-0">→</span>
                    <span>Het gesprek duurt maar <strong class="text-on-surface">10 minuten</strong> — kom op tijd!</span>
                  </div>
                  <div class="flex gap-3">
                    <span class="text-primary font-bold shrink-0">→</span>
                    <span>Wil je meer bespreken? Maak dan een <strong class="text-on-surface">extra afspraak</strong></span>
                  </div>
                  <div class="flex gap-3">
                    <span class="text-primary font-bold shrink-0">→</span>
                    <span>Een juf of meester kan <strong class="text-on-surface">direct</strong> zijn — dat is normaal in Nederland</span>
                  </div>
                </div>
              </div>

              <!-- Trakteren -->
              <div class="bg-secondary/5 border border-secondary/20 rounded-2xl p-4">
                <div class="flex items-center gap-2 mb-2">
                  <span class="material-symbols-outlined text-secondary text-[18px]">cake</span>
                  <p class="text-sm font-bold text-on-surface">Trakteren bij een verjaardag</p>
                </div>
                <p class="text-xs text-on-surface-variant leading-relaxed">Is je kind jarig op de basisschool? Dan mag je kind de klas <strong class="text-on-surface">trakteren</strong> — iets lekkers of een klein cadeautje geven aan alle klasgenoten. Sommige scholen hebben regels, zoals dat je maar één ding mag geven of dat het gezond moet zijn. <strong class="text-on-surface">Vraag aan de juf of meester wat de regels zijn.</strong></p>
              </div>
            </div>
          </section>
      <!-- WIDGET:les-thema4-ouders -->`,
    },
    {
      id: "vakanties",
      icon: "beach_access",
      title: "Vakanties en vrije dagen",
      subtitle: "Schoolvakanties, vrije dagen en wat er van je verwacht wordt",
      contentHtml: `<section id="vakanties" class="scroll-mt-24 mb-8">
            <div class="bg-white rounded-3xl p-7 shadow-sm">
              <h2 class="text-xl sm:text-2xl font-bold text-primary mb-5 flex items-center gap-3">
                <span class="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                  <span class="material-symbols-outlined text-primary text-[18px]">calendar_month</span>
                </span>
                Vakanties en vrije dagen
              </h2>

              <p class="text-on-surface-variant leading-relaxed mb-5">
                Ouders zijn verantwoordelijk dat hun kind naar school gaat. Een kind is alleen vrij in de <strong class="text-on-surface">vakanties</strong>, op <strong class="text-on-surface">feestdagen</strong> en op <strong class="text-on-surface">studiedagen</strong>.
              </p>

              <!-- School holidays -->
              <h3 class="text-base font-bold text-on-surface mb-3">De schoolvakanties</h3>
              <div class="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-6">
                <div class="flex items-center gap-2 bg-primary/5 border border-primary/15 rounded-xl px-3 py-2.5">
                  <span class="material-symbols-outlined text-primary text-[16px]">wb_sunny</span>
                  <div>
                    <p class="text-xs font-bold text-on-surface">Zomervakantie</p>
                    <p class="text-[10px] text-on-surface-variant">± 6 weken in juli/aug.</p>
                  </div>
                </div>
                <div class="flex items-center gap-2 bg-surface-container-low border border-outline-variant/40 rounded-xl px-3 py-2.5">
                  <span class="material-symbols-outlined text-on-surface-variant text-[16px]">ac_unit</span>
                  <div>
                    <p class="text-xs font-bold text-on-surface">Kerstvakantie</p>
                    <p class="text-[10px] text-on-surface-variant">± 20 dec. – 4 jan.</p>
                  </div>
                </div>
                <div class="flex items-center gap-2 bg-surface-container-low border border-outline-variant/40 rounded-xl px-3 py-2.5">
                  <span class="material-symbols-outlined text-on-surface-variant text-[16px]">energy_savings_leaf</span>
                  <div>
                    <p class="text-xs font-bold text-on-surface">Meivakantie</p>
                    <p class="text-[10px] text-on-surface-variant">± eind april – begin mei</p>
                  </div>
                </div>
                <div class="flex items-center gap-2 bg-surface-container-low border border-outline-variant/40 rounded-xl px-3 py-2.5">
                  <span class="material-symbols-outlined text-on-surface-variant text-[16px]">park</span>
                  <div>
                    <p class="text-xs font-bold text-on-surface">Herfstvakantie</p>
                    <p class="text-[10px] text-on-surface-variant">± half oktober</p>
                  </div>
                </div>
                <div class="flex items-center gap-2 bg-surface-container-low border border-outline-variant/40 rounded-xl px-3 py-2.5">
                  <span class="material-symbols-outlined text-on-surface-variant text-[16px]">local_florist</span>
                  <div>
                    <p class="text-xs font-bold text-on-surface">Voorjaarsvakantie</p>
                    <p class="text-[10px] text-on-surface-variant">± feb. – begin maart</p>
                  </div>
                </div>
              </div>

              <!-- Studiedagen -->
              <div class="bg-blue-50 border border-blue-200 rounded-2xl p-4 mb-6">
                <div class="flex items-center gap-2 mb-2">
                  <span class="material-symbols-outlined text-blue-600 text-[18px]">menu_book</span>
                  <p class="text-sm font-bold text-blue-900">Studiedagen</p>
                </div>
                <p class="text-xs text-blue-800 leading-relaxed">Op een studiedag zijn <strong>kinderen vrij</strong> en krijgen de <strong>docenten zelf les</strong> — ze leren nieuwe dingen voor hun werk. Kijk op het <strong>vakantierooster van de school</strong> wanneer de studiedagen zijn.</p>
              </div>

              <!-- Feestdagen -->
              <h3 class="text-base font-bold text-on-surface mb-3">Feestdagen en vrije dagen</h3>
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-5">
                <div>
                  <p class="text-[10px] font-bold text-primary uppercase tracking-widest mb-2">Altijd vrij (nationale feestdagen)</p>
                  <div class="space-y-1.5">
                    <div class="flex gap-2 text-xs text-on-surface-variant"><span class="text-primary font-bold shrink-0">→</span> Pasen (2 dagen)</div>
                    <div class="flex gap-2 text-xs text-on-surface-variant"><span class="text-primary font-bold shrink-0">→</span> Hemelvaartsdag</div>
                    <div class="flex gap-2 text-xs text-on-surface-variant"><span class="text-primary font-bold shrink-0">→</span> Pinksteren (2 dagen)</div>
                    <div class="flex gap-2 text-xs text-on-surface-variant"><span class="text-primary font-bold shrink-0">→</span> Oud en nieuw (31 dec. + 1 jan.)</div>
                  </div>
                </div>
                <div>
                  <p class="text-[10px] font-bold text-secondary uppercase tracking-widest mb-2">Verschilt per school</p>
                  <div class="space-y-1.5">
                    <div class="flex gap-2 text-xs text-on-surface-variant"><span class="text-secondary font-bold shrink-0">→</span> Sinterklaas (soms 's middags vrij)</div>
                    <div class="flex gap-2 text-xs text-on-surface-variant"><span class="text-secondary font-bold shrink-0">→</span> Carnaval</div>
                    <div class="flex gap-2 text-xs text-on-surface-variant"><span class="text-secondary font-bold shrink-0">→</span> Eid-al-Fitr</div>
                  </div>
                </div>
              </div>

              <div class="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex gap-3">
                <span class="material-symbols-outlined text-amber-500 text-[20px] shrink-0 mt-0.5">lightbulb</span>
                <div>
                  <p class="text-xs font-bold text-amber-800 uppercase tracking-wider mb-1">Onthoud dit!</p>
                  <p class="text-sm text-amber-900 leading-relaxed">Wil je je kind een dag vrij geven voor een bijzondere reden (bijv. een feestdag uit je land van herkomst)? Dan moet je <strong>toestemming vragen</strong> aan de school — soms moet je een formulier invullen. Dit is niet automatisch vrij.</p>
                </div>
              </div>
            </div>
          </section>
      <!-- WIDGET:les-thema4-vakanties -->`,
    },
    {
      id: "opvoeden",
      icon: "family_restroom",
      title: "Opvoeden",
      subtitle: "Opvoedstijlen, normen en waarden, en de rol van ouders",
      contentHtml: `<section id="opvoeden" class="scroll-mt-24 mb-8">
            <div class="bg-white rounded-3xl p-7 shadow-sm">
              <h2 class="text-xl sm:text-2xl font-bold text-primary mb-5 flex items-center gap-3">
                <span class="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                  <span class="material-symbols-outlined text-primary text-[18px]">family_restroom</span>
                </span>
                Opvoeden
              </h2>

              <p class="text-on-surface-variant leading-relaxed mb-5">
                <strong class="text-on-surface">Opvoeding</strong> betekent: zorgen voor je kind en je kind leren wat het mag en moet doen. Ouders geven het kind eten, leren het praten en zoeken een goede school.
              </p>

              <!-- Juridische aansprakelijkheid -->
              <h3 class="text-base font-bold text-on-surface mb-3">Verantwoordelijkheid van ouders</h3>
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                <div class="bg-green-50 border border-green-200 rounded-2xl p-4">
                  <p class="text-xs font-bold text-green-800 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                    <span class="material-symbols-outlined text-[15px]">child_care</span>
                    Kind jonger dan 16 jaar
                  </p>
                  <p class="text-sm text-green-900 leading-relaxed">Ouders zijn <strong>juridisch aansprakelijk</strong> voor het gedrag van hun kind. Maakt je kind van 13 jaar iets kapot? Dan <strong>betalen de ouders</strong> de schade.</p>
                </div>
                <div class="bg-surface-container-low border border-outline-variant/60 rounded-2xl p-4">
                  <p class="text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-3 flex items-center gap-1.5">
                    <span class="material-symbols-outlined text-[15px]">person</span>
                    Kind 16 jaar of ouder
                  </p>
                  <p class="text-sm text-on-surface-variant leading-relaxed">Het kind is dan zelf verantwoordelijk. Maakt een kind van 17 jaar iets kapot? Dan <strong class="text-on-surface">betaalt het kind zelf</strong> de schade.</p>
                </div>
              </div>

              <!-- Help organizations -->
              <h3 class="text-base font-bold text-on-surface mb-3">Hulp bij opvoedingsproblemen</h3>
              <p class="text-sm text-on-surface-variant leading-relaxed mb-4">
                Opvoeden is niet altijd makkelijk. Als je problemen hebt, kun je bij verschillende organisaties terecht:
              </p>
              <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
                <div class="bg-surface-container-low rounded-2xl p-3 text-center">
                  <span class="material-symbols-outlined text-primary text-[22px] mb-1.5 block">medical_services</span>
                  <p class="text-xs font-bold text-on-surface">Huisarts</p>
                  <p class="text-[10px] text-on-surface-variant mt-1 leading-snug">Eerste stap bij zorgen over je kind</p>
                </div>
                <div class="bg-surface-container-low rounded-2xl p-3 text-center">
                  <span class="material-symbols-outlined text-primary text-[22px] mb-1.5 block">family_restroom</span>
                  <p class="text-xs font-bold text-on-surface">CJG</p>
                  <p class="text-[10px] text-on-surface-variant mt-1 leading-snug">Centrum voor Jeugd en Gezin</p>
                </div>
                <div class="bg-surface-container-low rounded-2xl p-3 text-center">
                  <span class="material-symbols-outlined text-primary text-[22px] mb-1.5 block">local_hospital</span>
                  <p class="text-xs font-bold text-on-surface">GGD / Jeugdzorg</p>
                  <p class="text-[10px] text-on-surface-variant mt-1 leading-snug">Gemeentelijke gezondheidsdienst</p>
                </div>
                <div class="bg-surface-container-low rounded-2xl p-3 text-center">
                  <span class="material-symbols-outlined text-primary text-[22px] mb-1.5 block">location_city</span>
                  <p class="text-xs font-bold text-on-surface">Wijkteam</p>
                  <p class="text-[10px] text-on-surface-variant mt-1 leading-snug">Gemeente regelt hulp bij gezinnen</p>
                </div>
              </div>

              <div class="bg-surface-container-low rounded-2xl p-4 mb-5">
                <div class="flex items-center gap-2 mb-1">
                  <span class="material-symbols-outlined text-on-surface-variant text-[16px]">gavel</span>
                  <p class="text-sm font-bold text-on-surface">Raad voor de Kinderbescherming</p>
                </div>
                <p class="text-xs text-on-surface-variant leading-relaxed">Als een kind thuis echt niet veilig kan opgroeien, kan de <strong class="text-on-surface">Raad voor de Kinderbescherming</strong> (en de rechter) ingrijpen. Zij beschermen het kind.</p>
              </div>

              <div class="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex gap-3">
                <span class="material-symbols-outlined text-amber-500 text-[20px] shrink-0 mt-0.5">lightbulb</span>
                <div>
                  <p class="text-xs font-bold text-amber-800 uppercase tracking-wider mb-1">Onthoud dit!</p>
                  <p class="text-sm text-amber-900 leading-relaxed">Ouders zijn juridisch aansprakelijk voor het gedrag van hun kind <strong>tot het kind 16 jaar is</strong>. Het CJG (Centrum voor Jeugd en Gezin) helpt families met opvoeding, gezondheid én veiligheid.</p>
                </div>
              </div>
            </div>
          </section>
      <!-- WIDGET:les-thema4-opvoeden -->`,
    },
    {
      id: "kosten",
      icon: "payments",
      title: "Kosten en financiële hulp",
      subtitle: "Schoolboeken, leermiddelen, kinderbijslag en studiefinanciering",
      contentHtml: `<section id="kosten" class="scroll-mt-24 mb-8">
            <div class="bg-white rounded-3xl p-7 shadow-sm">
              <h2 class="text-xl sm:text-2xl font-bold text-primary mb-5 flex items-center gap-3">
                <span class="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                  <span class="material-symbols-outlined text-primary text-[18px]">payments</span>
                </span>
                Kosten en financiële hulp
              </h2>

              <!-- Schoolkosten overview -->
              <h3 class="text-base font-bold text-on-surface mb-3">Wat kost wat?</h3>
              <div class="space-y-2.5 mb-6">
                <div class="flex items-start gap-4 bg-surface-container-low rounded-2xl p-3.5">
                  <span class="material-symbols-outlined text-green-600 text-[20px] shrink-0 mt-0.5">check_circle</span>
                  <div>
                    <p class="text-sm font-bold text-on-surface">Basisschool en middelbare school — gratis</p>
                    <p class="text-xs text-on-surface-variant leading-relaxed mt-0.5">De overheid betaalt het onderwijs voor alle kinderen tot 18 jaar. Je betaalt geen les- of schoolgeld.</p>
                  </div>
                </div>
                <div class="flex items-start gap-4 bg-surface-container-low rounded-2xl p-3.5">
                  <span class="material-symbols-outlined text-amber-500 text-[20px] shrink-0 mt-0.5">info</span>
                  <div>
                    <p class="text-sm font-bold text-on-surface">Ouderbijdrage — vrijwillig</p>
                    <p class="text-xs text-on-surface-variant leading-relaxed mt-0.5">Sommige scholen vragen een <strong class="text-on-surface">ouderbijdrage</strong> voor extra's zoals een schoolreisje of Sinterklaasfeest. Dit is <strong class="text-on-surface">niet verplicht</strong>. Kun je het niet betalen? Vertel het de school.</p>
                  </div>
                </div>
                <div class="flex items-start gap-4 bg-surface-container-low rounded-2xl p-3.5">
                  <span class="material-symbols-outlined text-on-surface-variant text-[20px] shrink-0 mt-0.5">backpack</span>
                  <div>
                    <p class="text-sm font-bold text-on-surface">Schoolspullen — ouders betalen</p>
                    <p class="text-xs text-on-surface-variant leading-relaxed mt-0.5">Basisschool: schooltas, broodtrommel, gymkleding. Middelbare school: agenda, schriften, woordenboeken, rekenmachine, soms een laptop.</p>
                  </div>
                </div>
                <div class="flex items-start gap-4 bg-surface-container-low rounded-2xl p-3.5">
                  <span class="material-symbols-outlined text-secondary text-[20px] shrink-0 mt-0.5">euro</span>
                  <div>
                    <p class="text-sm font-bold text-on-surface">Vervolgopleiding — schoolgeld betalen</p>
                    <p class="text-xs text-on-surface-variant leading-relaxed mt-0.5">MBO, HBO en universiteit kosten geld. HBO en universiteit zijn duurder dan MBO.</p>
                  </div>
                </div>
              </div>

              <!-- Financial aid cards -->
              <h3 class="text-base font-bold text-on-surface mb-3">Financiële hulp — overzicht</h3>
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
                <div class="border border-primary/20 rounded-2xl p-4">
                  <div class="flex items-center justify-between mb-2">
                    <p class="text-sm font-bold text-on-surface">Kinderbijslag</p>
                    <span class="text-[10px] font-bold bg-green-100 text-green-700 px-2 py-0.5 rounded-full">IEDEREEN</span>
                  </div>
                  <p class="text-xs text-on-surface-variant leading-relaxed mb-2">Elke ouder met een kind in Nederland. Je krijgt meer als je meer kinderen hebt.</p>
                  <p class="text-[11px] font-bold text-primary">Aanvragen: SVB (Sociale Verzekeringsbank)</p>
                  <p class="text-[10px] text-on-surface-variant mt-0.5">Pas kort in NL? Je moet het zelf aanvragen!</p>
                </div>
                <div class="border border-primary/20 rounded-2xl p-4">
                  <div class="flex items-center justify-between mb-2">
                    <p class="text-sm font-bold text-on-surface">Kindgebonden budget</p>
                    <span class="text-[10px] font-bold bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">LAAG INKOMEN</span>
                  </div>
                  <p class="text-xs text-on-surface-variant leading-relaxed mb-2">Extra geld voor de opvoeding van je kind, als je inkomen laag is.</p>
                  <p class="text-[11px] font-bold text-primary">Aanvragen: Dienst Toeslagen</p>
                  <p class="text-[10px] text-on-surface-variant mt-0.5">Verandert je inkomen? Direct doorgeven!</p>
                </div>
                <div class="border border-primary/20 rounded-2xl p-4">
                  <div class="flex items-center justify-between mb-2">
                    <p class="text-sm font-bold text-on-surface">Kinderopvangtoeslag</p>
                    <span class="text-[10px] font-bold bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">ALS JE WERKT</span>
                  </div>
                  <p class="text-xs text-on-surface-variant leading-relaxed mb-2">Hulp bij betalen van de kinderopvang.</p>
                  <p class="text-[11px] font-bold text-primary">Aanvragen: Dienst Toeslagen</p>
                  <p class="text-[10px] text-on-surface-variant mt-0.5">Aanvragen binnen <strong>3 maanden</strong> na start kinderopvang.</p>
                </div>
                <div class="border border-primary/20 rounded-2xl p-4">
                  <div class="flex items-center justify-between mb-2">
                    <p class="text-sm font-bold text-on-surface">Studiefinanciering</p>
                    <span class="text-[10px] font-bold bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">STUDENT &lt; 30 JAAR</span>
                  </div>
                  <p class="text-xs text-on-surface-variant leading-relaxed mb-2">Geld om de vervolgopleiding (deels) mee te betalen. Jonger dan 30 jaar — ook studentenreisproduct (gratis OV).</p>
                  <p class="text-[11px] font-bold text-primary">Aanvragen: DUO (Dienst Uitvoering Onderwijs)</p>
                </div>
              </div>

              <div class="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex gap-3">
                <span class="material-symbols-outlined text-amber-500 text-[20px] shrink-0 mt-0.5">lightbulb</span>
                <div>
                  <p class="text-xs font-bold text-amber-800 uppercase tracking-wider mb-1">Onthoud dit!</p>
                  <p class="text-sm text-amber-900 leading-relaxed"><strong>Kinderbijslag</strong> = SVB (iedereen). <strong>Kindgebonden budget</strong> = Dienst Toeslagen (laag inkomen). <strong>Kinderopvangtoeslag</strong> = Dienst Toeslagen (aanvragen binnen 3 maanden!). <strong>Studiefinanciering</strong> = DUO (jonger dan 30). <strong>Ouderbijdrage</strong> = vrijwillig, nooit verplicht.</p>
                </div>
              </div>
            </div>
          </section>
      <!-- WIDGET:les-thema4-kosten -->`,
    },
  ],
};
