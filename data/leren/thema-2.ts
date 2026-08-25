/**
 * GENERATED — do not edit by hand.
 *
 * Written by scripts/knm-content/generate-leren-data.mjs from the KNM production
 * `leren_content` table. Edit a section in /admin and re-run the exporter + generator;
 * editing this file instead is a change that the next run silently reverts.
 */
import type { LerenThema } from './types';

export const thema: LerenThema = {
  id: 2,
  slug: "thema-2-wonen",
  title: "Wonen",
  description: "In dit thema leer je alles over wonen in Nederland: huren of kopen, een huis zoeken, het huurcontract, belastingen en verzekeringen, energie en water, en afval scheiden. Elke les heeft een audio-uitleg met interactieve onderdelen.",
  quizCategory: "Wonen",
  sections: [
    {
      id: "woonwens",
      icon: "home",
      title: "Mijn woonwens",
      subtitle: "Sociale vs. vrije huursector, huren of kopen, samenwonen en trouwen",
      contentHtml: `<section id="woonwens" class="scroll-mt-24 mb-8">
            <div class="bg-white rounded-3xl p-7 shadow-sm">
              <h2 class="text-xl sm:text-2xl font-bold text-primary mb-5 flex items-center gap-3">
                <span class="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                  <span class="material-symbols-outlined text-primary text-[18px]">home</span>
                </span>
                Mijn woonwens
              </h2>

              <p class="text-on-surface-variant leading-relaxed mb-5">
                In Nederland kun je een huis <strong class="text-on-surface">huren</strong> of <strong class="text-on-surface">kopen</strong>. Veel mensen huren een woning. Er zijn twee soorten huurwoningen: de <strong class="text-on-surface">sociale huursector</strong> en de <strong class="text-on-surface">vrije huursector</strong>.
              </p>

              <!-- Comparison block -->
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                <div class="bg-primary/5 border border-primary/20 rounded-2xl p-5">
                  <p class="text-[10px] font-bold text-primary uppercase tracking-widest mb-2">Sociale huursector</p>
                  <ul class="text-sm text-on-surface-variant leading-relaxed space-y-1.5 list-none p-0 m-0">
                    <li class="flex items-start gap-2"><span class="text-primary font-bold mt-0.5">→</span> Voor mensen met een <strong class="text-on-surface">laag of gemiddeld inkomen</strong></li>
                    <li class="flex items-start gap-2"><span class="text-primary font-bold mt-0.5">→</span> Er is een <strong class="text-on-surface">maximale huurprijs</strong></li>
                    <li class="flex items-start gap-2"><span class="text-primary font-bold mt-0.5">→</span> De huur mag niet veel omhoog gaan</li>
                  </ul>
                </div>
                <div class="bg-secondary/5 border border-secondary/20 rounded-2xl p-5">
                  <p class="text-[10px] font-bold text-secondary uppercase tracking-widest mb-2">Vrije huursector</p>
                  <ul class="text-sm text-on-surface-variant leading-relaxed space-y-1.5 list-none p-0 m-0">
                    <li class="flex items-start gap-2"><span class="text-secondary font-bold mt-0.5">→</span> Voor mensen met een <strong class="text-on-surface">hoog inkomen</strong></li>
                    <li class="flex items-start gap-2"><span class="text-secondary font-bold mt-0.5">→</span> De huur is <strong class="text-on-surface">hoog</strong></li>
                    <li class="flex items-start gap-2"><span class="text-secondary font-bold mt-0.5">→</span> De huur kan <strong class="text-on-surface">elk jaar veel stijgen</strong></li>
                  </ul>
                </div>
              </div>

              <!-- Samenwonen en trouwen -->
              <div class="bg-surface-container-low rounded-2xl p-5 mb-5">
                <h3 class="text-base font-bold text-on-surface mb-3 flex items-center gap-2">
                  <span class="material-symbols-outlined text-primary text-[18px]">favorite</span>
                  Samenwonen en trouwen
                </h3>
                <p class="text-sm text-on-surface-variant leading-relaxed mb-3">
                  In Nederland mag je zelf kiezen met wie je <strong class="text-on-surface">samenwoont</strong> en met wie je <strong class="text-on-surface">trouwt</strong>. Veel mensen wonen samen zonder te trouwen. Trouwen mag in Nederland vanaf <strong class="text-on-surface">18 jaar</strong>.
                </p>
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div class="bg-white border border-outline-variant/50 rounded-xl p-3.5">
                    <p class="text-xs font-bold text-on-surface mb-1">Het huwelijk</p>
                    <p class="text-xs text-on-surface-variant leading-relaxed">Een man en een vrouw, twee mannen of twee vrouwen mogen trouwen. Dit staat in de wet.</p>
                  </div>
                  <div class="bg-white border border-outline-variant/50 rounded-xl p-3.5">
                    <p class="text-xs font-bold text-on-surface mb-1">Geregistreerd partnerschap</p>
                    <p class="text-xs text-on-surface-variant leading-relaxed">Dit lijkt op het huwelijk en staat ook in de wet. Je kiest zelf of je trouwt of een geregistreerd partnerschap hebt.</p>
                  </div>
                </div>
              </div>

              <!-- Onthoud callout -->
              <div class="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex gap-3">
                <span class="material-symbols-outlined text-amber-500 text-[20px] shrink-0 mt-0.5">lightbulb</span>
                <div>
                  <p class="text-xs font-bold text-amber-800 uppercase tracking-wider mb-1">Onthoud dit!</p>
                  <p class="text-sm text-amber-900 leading-relaxed">Heb je een <strong>hoog inkomen</strong>? Dan kun je <em>niet</em> in de sociale huursector wonen — je moet dan in de vrije huursector of een huis kopen. Dit onderscheid komt vaak voor op het KNM-examen.</p>
                </div>
              </div>
            </div>
          </section>`,
    },
    {
      id: "huis-vinden",
      icon: "search",
      title: "Een huis vinden",
      subtitle: "Stappen voor huurwoning en koopwoning, inschrijven en adres doorgeven",
      contentHtml: `<section id="huis-vinden" class="scroll-mt-24 mb-8">
            <div class="bg-white rounded-3xl p-7 shadow-sm">
              <h2 class="text-xl sm:text-2xl font-bold text-primary mb-5 flex items-center gap-3">
                <span class="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                  <span class="material-symbols-outlined text-primary text-[18px]">search</span>
                </span>
                Een huis vinden
              </h2>

              <div class="grid grid-cols-1 md:grid-cols-2 gap-6">

                <!-- Huurwoning steps -->
                <div>
                  <div class="flex items-center gap-2 mb-4">
                    <span class="w-6 h-6 rounded-full bg-primary flex items-center justify-center shrink-0">
                      <span class="material-symbols-outlined text-white text-[14px]">key</span>
                    </span>
                    <h3 class="text-base font-bold text-on-surface">Een huurwoning vinden</h3>
                  </div>

                  <div class="flex gap-3 mb-3">
                    <div class="w-7 h-7 rounded-full bg-primary text-white text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">1</div>
                    <div class="flex-1">
                      <p class="text-sm font-semibold text-on-surface">Inschrijven bij de woningcorporatie</p>
                      <p class="text-xs text-on-surface-variant leading-relaxed mt-0.5">Je betaalt inschrijfgeld. Schrijf je <strong class="text-on-surface">vroeg</strong> in — hoe langer ingeschreven, hoe meer kans op een woning.</p>
                    </div>
                  </div>
                  <div class="flex gap-3 mb-3">
                    <div class="w-7 h-7 rounded-full bg-primary text-white text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">2</div>
                    <div class="flex-1">
                      <p class="text-sm font-semibold text-on-surface">Zoek op de website van de woningcorporatie</p>
                      <p class="text-xs text-on-surface-variant leading-relaxed mt-0.5">Je ziet foto's en informatie. Er zijn regels over inkomen, leeftijd en hoe lang je ingeschreven bent.</p>
                    </div>
                  </div>
                  <div class="flex gap-3 mb-3">
                    <div class="w-7 h-7 rounded-full bg-primary text-white text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">3</div>
                    <div class="flex-1">
                      <p class="text-sm font-semibold text-on-surface">Reageer op een huis</p>
                      <p class="text-xs text-on-surface-variant leading-relaxed mt-0.5">Via de website. Veel mensen reageren op hetzelfde huis.</p>
                    </div>
                  </div>
                  <div class="flex gap-3 mb-3">
                    <div class="w-7 h-7 rounded-full bg-primary text-white text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">4</div>
                    <div class="flex-1">
                      <p class="text-sm font-semibold text-on-surface">De woningcorporatie beslist</p>
                      <p class="text-xs text-on-surface-variant leading-relaxed mt-0.5">Ze kiezen wie het langst ingeschreven is <em>en</em> het huis kan betalen.</p>
                    </div>
                  </div>
                  <div class="flex gap-3 mb-3">
                    <div class="w-7 h-7 rounded-full bg-primary text-white text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">5</div>
                    <div class="flex-1">
                      <p class="text-sm font-semibold text-on-surface">Kijk in het huis → teken het huurcontract</p>
                      <p class="text-xs text-on-surface-variant leading-relaxed mt-0.5">Eerst kijken, dan beslissen, dan tekenen.</p>
                    </div>
                  </div>
                  <div class="flex gap-3">
                    <div class="w-7 h-7 rounded-full bg-primary text-white text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">6</div>
                    <div class="flex-1">
                      <p class="text-sm font-semibold text-on-surface">Geef je nieuwe adres door aan de gemeente</p>
                      <p class="text-xs text-on-surface-variant leading-relaxed mt-0.5">Dit moet je doen <strong class="text-on-surface">binnen 5 dagen</strong> na je verhuizing. Je nieuwe adres wordt bijgehouden in de <strong class="text-on-surface">BRP (Basisregistratie Personen)</strong>. Ook als je naar het buitenland verhuist, moet je je uitschrijven bij de gemeente.</p>
                    </div>
                  </div>
                </div>

                <!-- Koopwoning steps -->
                <div>
                  <div class="flex items-center gap-2 mb-4">
                    <span class="w-6 h-6 rounded-full bg-secondary flex items-center justify-center shrink-0">
                      <span class="material-symbols-outlined text-white text-[14px]">sell</span>
                    </span>
                    <h3 class="text-base font-bold text-on-surface">Een koopwoning vinden</h3>
                  </div>

                  <div class="flex gap-3 mb-3">
                    <div class="w-7 h-7 rounded-full bg-secondary text-white text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">1</div>
                    <div class="flex-1">
                      <p class="text-sm font-semibold text-on-surface">Hypotheek aanvragen bij de bank</p>
                      <p class="text-xs text-on-surface-variant leading-relaxed mt-0.5">Je leent geld van de bank. Dit heet een <strong class="text-on-surface">hypotheek</strong>. Je kunt dit meestal alleen krijgen als je <strong class="text-on-surface">werk hebt</strong>.</p>
                    </div>
                  </div>
                  <div class="flex gap-3 mb-3">
                    <div class="w-7 h-7 rounded-full bg-secondary text-white text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">2</div>
                    <div class="flex-1">
                      <p class="text-sm font-semibold text-on-surface">Zoek een huis online of via een makelaar</p>
                      <p class="text-xs text-on-surface-variant leading-relaxed mt-0.5">Een <strong class="text-on-surface">makelaar</strong> helpt je bij het zoeken en kopen. Dit kost geld.</p>
                    </div>
                  </div>
                  <div class="flex gap-3 mb-3">
                    <div class="w-7 h-7 rounded-full bg-secondary text-white text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">3</div>
                    <div class="flex-1">
                      <p class="text-sm font-semibold text-on-surface">Kijk in het huis → doe een bod</p>
                      <p class="text-xs text-on-surface-variant leading-relaxed mt-0.5">Je zegt wat je wilt betalen. Dit heet een <strong class="text-on-surface">bod doen</strong>. Je praat met de verkoper over de prijs.</p>
                    </div>
                  </div>
                  <div class="flex gap-3 mb-3">
                    <div class="w-7 h-7 rounded-full bg-secondary text-white text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">4</div>
                    <div class="flex-1">
                      <p class="text-sm font-semibold text-on-surface">Naar de notaris → teken het koopcontract</p>
                      <p class="text-xs text-on-surface-variant leading-relaxed mt-0.5">De <strong class="text-on-surface">notaris</strong> regelt de officiële overdracht van het huis.</p>
                    </div>
                  </div>
                  <div class="flex gap-3">
                    <div class="w-7 h-7 rounded-full bg-secondary text-white text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">5</div>
                    <div class="flex-1">
                      <p class="text-sm font-semibold text-on-surface">Geef je nieuwe adres door aan de gemeente</p>
                      <p class="text-xs text-on-surface-variant leading-relaxed mt-0.5">Binnen <strong class="text-on-surface">5 dagen</strong> na je verhuizing. Je nieuwe adres wordt geregistreerd in de <strong class="text-on-surface">BRP</strong>.</p>
                    </div>
                  </div>
                </div>
              </div>

              <div class="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex gap-3 mt-6">
                <span class="material-symbols-outlined text-amber-500 text-[20px] shrink-0 mt-0.5">lightbulb</span>
                <div>
                  <p class="text-xs font-bold text-amber-800 uppercase tracking-wider mb-1">Onthoud dit!</p>
                  <p class="text-sm text-amber-900 leading-relaxed">Je nieuwe adres doorgeven aan de gemeente moet <strong>binnen 5 dagen</strong> na je verhuizing — niet later. Dit geldt ook als je met iemand gaat samenwonen of naar het buitenland verhuist.</p>
                </div>
              </div>
            </div>
          </section>`,
    },
    {
      id: "huurcontract",
      icon: "description",
      title: "Het huurcontract",
      subtitle: "Wat staat erin, rechten en plichten van huurder en verhuurder",
      contentHtml: `<section id="huurcontract" class="scroll-mt-24 mb-8">
            <div class="bg-white rounded-3xl p-7 shadow-sm">
              <h2 class="text-xl sm:text-2xl font-bold text-primary mb-5 flex items-center gap-3">
                <span class="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                  <span class="material-symbols-outlined text-primary text-[18px]">description</span>
                </span>
                Het huurcontract
              </h2>

              <p class="text-on-surface-variant leading-relaxed mb-5">
                Een <strong class="text-on-surface">huurcontract</strong> is een afspraak tussen de <strong class="text-on-surface">verhuurder</strong> (eigenaar van het huis) en de <strong class="text-on-surface">huurder</strong> (jij). Beiden moeten zich aan de afspraken houden. Doen ze dat niet, dan heet dat <strong class="text-on-surface">contractbreuk</strong>.
              </p>

              <!-- Mock contract -->
              <div class="bg-surface-container-low border border-outline-variant rounded-2xl p-5 mb-6">
                <div class="flex items-center gap-2 mb-4">
                  <span class="material-symbols-outlined text-on-surface-variant text-[18px]">article</span>
                  <p class="text-xs font-bold text-on-surface uppercase tracking-widest">Voorbeeld huurcontract</p>
                </div>
                <div class="space-y-2.5 text-sm text-on-surface-variant">
                  <div class="flex gap-3">
                    <span class="text-primary font-bold shrink-0">1.</span>
                    <span>Het <strong class="text-on-surface">adres</strong> van de woning staat in het contract.</span>
                  </div>
                  <div class="flex gap-3">
                    <span class="text-primary font-bold shrink-0">2.</span>
                    <span>De <strong class="text-on-surface">huurprijs per maand</strong> plus servicekosten staan erin. Je betaalt altijd vóór de eerste dag van de maand.</span>
                  </div>
                  <div class="flex gap-3">
                    <span class="text-primary font-bold shrink-0">3.</span>
                    <span>De huur wordt elk jaar op <strong class="text-on-surface">1 juli</strong> een beetje hoger.</span>
                  </div>
                  <div class="flex gap-3">
                    <span class="text-primary font-bold shrink-0">4.</span>
                    <span>Je betaalt één keer een <strong class="text-on-surface">borg</strong> (= waarborgsom). Dit is geld dat je terugkrijgt als je vertrekt en alles in orde is.</span>
                  </div>
                  <div class="flex gap-3">
                    <span class="text-primary font-bold shrink-0">5.</span>
                    <span>Het soort woning (flat, eengezinswoning, etc.) en de <strong class="text-on-surface">begindatum</strong> van het contract.</span>
                  </div>
                </div>
              </div>

              <!-- Rechten en plichten -->
              <h3 class="text-base font-bold text-on-surface mb-3">Rechten en plichten</h3>
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                <div class="bg-green-50 border border-green-200 rounded-2xl p-4">
                  <p class="text-xs font-bold text-green-800 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                    <span class="material-symbols-outlined text-[15px]">check_circle</span>
                    Rechten van de huurder
                  </p>
                  <ul class="text-sm text-green-900 space-y-2 list-none p-0 m-0">
                    <li class="flex items-start gap-2"><span class="shrink-0 mt-0.5">✓</span> Verhuurder mag de huur <strong>niet zomaar stopzetten</strong></li>
                    <li class="flex items-start gap-2"><span class="shrink-0 mt-0.5">✓</span> Huur mag <strong>niet veel omhoog</strong> gaan</li>
                    <li class="flex items-start gap-2"><span class="shrink-0 mt-0.5">✓</span> Geen <strong>discriminatie</strong> door verhuurder</li>
                    <li class="flex items-start gap-2"><span class="shrink-0 mt-0.5">✓</span> Verhuurder moet de woning goed <strong>onderhouden</strong></li>
                  </ul>
                </div>
                <div class="bg-red-50 border border-red-200 rounded-2xl p-4">
                  <p class="text-xs font-bold text-red-800 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                    <span class="material-symbols-outlined text-[15px]">assignment</span>
                    Plichten van de huurder
                  </p>
                  <ul class="text-sm text-red-900 space-y-2 list-none p-0 m-0">
                    <li class="flex items-start gap-2"><span class="shrink-0 mt-0.5">!</span> Huur <strong>op tijd betalen</strong></li>
                    <li class="flex items-start gap-2"><span class="shrink-0 mt-0.5">!</span> Kleine <strong>reparaties</strong> zelf doen</li>
                    <li class="flex items-start gap-2"><span class="shrink-0 mt-0.5">!</span> Geen <strong>overlast</strong> geven aan buren</li>
                    <li class="flex items-start gap-2"><span class="shrink-0 mt-0.5">!</span> Woning <strong>niet onderverhuren</strong> aan iemand anders</li>
                  </ul>
                </div>
              </div>

              <div class="bg-surface-container-low border border-outline-variant/50 rounded-2xl p-4 flex gap-3">
                <span class="material-symbols-outlined text-primary text-[20px] shrink-0 mt-0.5">support_agent</span>
                <div>
                  <p class="text-xs font-bold text-on-surface mb-1">Probleem met je verhuurder?</p>
                  <p class="text-sm text-on-surface-variant leading-relaxed">Vertel het eerst aan de verhuurder. Blijft het probleem? Dan kun je hulp krijgen van de <strong class="text-on-surface">Huurcommissie</strong> of bij het <strong class="text-on-surface">Juridisch Loket</strong>.</p>
                </div>
              </div>
            </div>
          </section>`,
    },
    {
      id: "belastingen",
      icon: "receipt_long",
      title: "Belastingen en verzekeringen",
      subtitle: "Gemeentelijke belastingen, OZB, opstal, WA, AVP en huurtoeslag",
      contentHtml: `<section id="belastingen" class="scroll-mt-24 mb-8">
            <div class="bg-white rounded-3xl p-7 shadow-sm">
              <h2 class="text-xl sm:text-2xl font-bold text-primary mb-5 flex items-center gap-3">
                <span class="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                  <span class="material-symbols-outlined text-primary text-[18px]">receipt_long</span>
                </span>
                Belastingen en verzekeringen
              </h2>

              <!-- Gemeentelijke belastingen -->
              <div class="mb-6">
                <h3 class="text-base font-bold text-on-surface mb-3">Gemeentelijke belastingen</h3>
                <p class="text-sm text-on-surface-variant leading-relaxed mb-4">
                  Alle mensen in Nederland betalen <strong class="text-on-surface">belasting aan de gemeente</strong>. Hoeveel je betaalt, verschilt per gemeente. Je betaalt dit elk jaar.
                </p>
                <div class="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
                  <div class="bg-surface-container-low rounded-2xl p-4 text-center">
                    <span class="material-symbols-outlined text-primary text-[24px] mb-2 block">plumbing</span>
                    <p class="text-xs font-bold text-on-surface">Rioolbelasting</p>
                    <p class="text-xs text-on-surface-variant mt-1">Voor het riool in jouw straat</p>
                  </div>
                  <div class="bg-surface-container-low rounded-2xl p-4 text-center">
                    <span class="material-symbols-outlined text-primary text-[24px] mb-2 block">local_parking</span>
                    <p class="text-xs font-bold text-on-surface">Parkeerbelasting</p>
                    <p class="text-xs text-on-surface-variant mt-1">Voor parkeren in de gemeente</p>
                  </div>
                  <div class="bg-surface-container-low rounded-2xl p-4 text-center">
                    <span class="material-symbols-outlined text-primary text-[24px] mb-2 block">pets</span>
                    <p class="text-xs font-bold text-on-surface">Hondenbelasting</p>
                    <p class="text-xs text-on-surface-variant mt-1">Als je een hond hebt</p>
                  </div>
                </div>
                <div class="bg-primary/5 border border-primary/15 rounded-2xl p-4">
                  <p class="text-xs font-bold text-primary uppercase tracking-widest mb-1.5">Extra bij koopwoning: OZB</p>
                  <p class="text-sm text-on-surface-variant leading-relaxed">Heb je een <strong class="text-on-surface">koopwoning</strong>? Dan betaal je ook <strong class="text-on-surface">onroerende zaakbelasting (OZB)</strong> — belasting over je huis. Huurders betalen geen OZB.</p>
                </div>
              </div>

              <!-- Verzekeringen -->
              <div class="mb-6">
                <h3 class="text-base font-bold text-on-surface mb-3">Verzekeringen</h3>
                <p class="text-sm text-on-surface-variant leading-relaxed mb-4">
                  Niet alle verzekeringen zijn verplicht. Je sluit een verzekering af bij een <strong class="text-on-surface">verzekeraar</strong>. Bij schade betaalt de verzekeraar — dit heet <strong class="text-on-surface">vergoeden</strong>.
                </p>
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div class="border-2 border-primary/20 rounded-2xl p-4">
                    <div class="flex items-center gap-2 mb-2">
                      <span class="material-symbols-outlined text-primary text-[18px]">home_work</span>
                      <p class="text-sm font-bold text-on-surface">Opstalverzekering</p>
                      <span class="ml-auto text-[10px] font-bold bg-red-100 text-red-700 px-2 py-0.5 rounded-full">VERPLICHT</span>
                    </div>
                    <p class="text-xs text-on-surface-variant leading-relaxed">Verplicht als je een <strong class="text-on-surface">koopwoning</strong> hebt. Dekt <strong class="text-on-surface">schade aan het huis zelf</strong> (bijv. storm, brand, lekkage).</p>
                  </div>
                  <div class="border-2 border-primary/20 rounded-2xl p-4">
                    <div class="flex items-center gap-2 mb-2">
                      <span class="material-symbols-outlined text-primary text-[18px]">directions_car</span>
                      <p class="text-sm font-bold text-on-surface">WA-verzekering</p>
                      <span class="ml-auto text-[10px] font-bold bg-red-100 text-red-700 px-2 py-0.5 rounded-full">VERPLICHT</span>
                    </div>
                    <p class="text-xs text-on-surface-variant leading-relaxed">Verplicht bij een <strong class="text-on-surface">auto, motor of scooter</strong>. Dekt schade die jij maakt aan de auto van iemand anders.</p>
                  </div>
                  <div class="border border-outline-variant/60 rounded-2xl p-4">
                    <div class="flex items-center gap-2 mb-2">
                      <span class="material-symbols-outlined text-on-surface-variant text-[18px]">shield_person</span>
                      <p class="text-sm font-bold text-on-surface">AVP</p>
                      <span class="ml-auto text-[10px] font-bold bg-surface-container text-outline px-2 py-0.5 rounded-full">HANDIG</span>
                    </div>
                    <p class="text-xs text-on-surface-variant leading-relaxed"><strong class="text-on-surface">Aansprakelijkheidsverzekering</strong> voor particulieren. Niet verplicht, maar handig. Dekt schade die <em>jij of je kind</em> bij iemand anders maakt (bijv. gebroken raam bij buren).</p>
                  </div>
                  <div class="border border-outline-variant/60 rounded-2xl p-4">
                    <div class="flex items-center gap-2 mb-2">
                      <span class="material-symbols-outlined text-on-surface-variant text-[18px]">inventory_2</span>
                      <p class="text-sm font-bold text-on-surface">Inboedelverzekering</p>
                      <span class="ml-auto text-[10px] font-bold bg-surface-container text-outline px-2 py-0.5 rounded-full">HANDIG</span>
                    </div>
                    <p class="text-xs text-on-surface-variant leading-relaxed">Dekt <strong class="text-on-surface">gestolen of beschadigde spullen</strong> in je woning, zoals een tv, laptop of meubels. Niet hetzelfde als de opstalverzekering (die dekt het gebouw zelf).</p>
                  </div>
                  <div class="border border-outline-variant/60 rounded-2xl p-4 bg-surface-container-lowest">
                    <div class="flex items-center gap-2 mb-2">
                      <span class="material-symbols-outlined text-on-surface-variant text-[18px]">info</span>
                      <p class="text-sm font-bold text-on-surface">Andere verzekeringen</p>
                    </div>
                    <p class="text-xs text-on-surface-variant leading-relaxed">Niet iedereen heeft dezelfde verzekeringen. Niet alle verzekeringen zijn <strong class="text-on-surface">verplicht</strong>. Je kiest zelf welke je afsluit.</p>
                  </div>
                </div>
              </div>

              <!-- Huurtoeslag callout -->
              <div class="bg-green-50 border border-green-200 rounded-2xl p-5">
                <div class="flex items-center gap-2 mb-3">
                  <span class="material-symbols-outlined text-green-700 text-[20px]">savings</span>
                  <p class="text-sm font-bold text-green-800">Huurtoeslag — hulp bij hoge huur</p>
                </div>
                <p class="text-sm text-green-900 leading-relaxed mb-3">
                  Kan jij de huur niet goed betalen? Dan kun je misschien <strong>huurtoeslag</strong> krijgen. Dat is geld om (een deel van) de huur mee te betalen.
                </p>
                <div class="space-y-2 text-sm text-green-900">
                  <div class="flex items-start gap-2">
                    <span class="font-bold shrink-0">→</span>
                    <span>Je <strong>inkomen</strong> en je <strong>huur</strong> mogen niet te hoog zijn</span>
                  </div>
                  <div class="flex items-start gap-2">
                    <span class="font-bold shrink-0">→</span>
                    <span>Je vraagt huurtoeslag aan bij <strong>Dienst Toeslagen</strong> — een afdeling van de <strong>Belastingdienst</strong> (belastingdienst.nl)</span>
                  </div>
                  <div class="flex items-start gap-2">
                    <span class="font-bold shrink-0">→</span>
                    <span>Verandert je inkomen? Geef dit <strong>direct door</strong> aan Dienst Toeslagen — anders krijg je te veel of te weinig</span>
                  </div>
                </div>
              </div>
            </div>
          </section>`,
    },
    {
      id: "energie",
      icon: "bolt",
      title: "Gas, elektriciteit en water",
      subtitle: "Energieleverancier kiezen, meters, tarieven en energie besparen",
      contentHtml: `<section id="energie" class="scroll-mt-24 mb-8">
            <div class="bg-white rounded-3xl p-7 shadow-sm">
              <h2 class="text-xl sm:text-2xl font-bold text-primary mb-5 flex items-center gap-3">
                <span class="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                  <span class="material-symbols-outlined text-primary text-[18px]">bolt</span>
                </span>
                Gas, elektriciteit en water
              </h2>

              <p class="text-sm text-on-surface-variant leading-relaxed mb-5">
                In een nieuw huis moet je zelf <strong class="text-on-surface">energie</strong> (gas en elektriciteit) en <strong class="text-on-surface">water</strong> regelen. Ook internet, televisie en telefoon regel je zelf.
              </p>

              <!-- Setup steps -->
              <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                <div class="bg-primary rounded-2xl p-4 text-white">
                  <span class="material-symbols-outlined text-[22px] mb-2 block opacity-80">local_fire_department</span>
                  <p class="text-xs font-bold mb-1.5">Energie (gas + elektriciteit)</p>
                  <p class="text-xs text-white/80 leading-relaxed">Kies zelf een <strong class="text-white">energieleverancier</strong>. Prijzen verschillen — vergelijk op internet. Meld je aan via de website van de leverancier.</p>
                </div>
                <div class="bg-primary-container rounded-2xl p-4 text-white">
                  <span class="material-symbols-outlined text-[22px] mb-2 block opacity-80">water_drop</span>
                  <p class="text-xs font-bold mb-1.5">Water</p>
                  <p class="text-xs text-white/80 leading-relaxed">Je kunt het <strong class="text-white">waterbedrijf niet kiezen</strong>. Elk deel van Nederland heeft één eigen waterbedrijf. Meld je aan via hun website.</p>
                </div>
                <div class="bg-surface-container-low border border-outline-variant/40 rounded-2xl p-4">
                  <span class="material-symbols-outlined text-secondary text-[22px] mb-2 block">wifi</span>
                  <p class="text-xs font-bold text-on-surface mb-1.5">Internet, tv & telefoon</p>
                  <p class="text-xs text-on-surface-variant leading-relaxed">Kies een <strong class="text-on-surface">provider</strong> en neem een <strong class="text-on-surface">abonnement</strong> via hun website.</p>
                </div>
              </div>

              <!-- Meters -->
              <div class="bg-surface-container-low rounded-2xl p-5 mb-6">
                <h3 class="text-sm font-bold text-on-surface mb-3 flex items-center gap-2">
                  <span class="material-symbols-outlined text-primary text-[16px]">speed</span>
                  De meters in je huis
                </h3>
                <p class="text-sm text-on-surface-variant leading-relaxed mb-3">
                  In je huis heb je <strong class="text-on-surface">drie meters</strong>: voor gas of warmte, voor elektriciteit en voor water. Op de meter zie je hoeveel je hebt gebruikt.
                </p>
                <div class="bg-amber-50 border border-amber-200 rounded-xl p-3 text-sm text-amber-900">
                  <strong>Let op:</strong> Je moet de <strong>meterstand één keer per jaar doorgeven</strong> aan je leverancier. Bij een nieuwe (slimme) meter hoef je dit niet meer te doen — de meter doet het zelf.
                </div>
              </div>

              <!-- Vast vs. variabel tarief -->
              <h3 class="text-base font-bold text-on-surface mb-3">Vast of variabel tarief?</h3>
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                <div class="bg-primary/5 border border-primary/20 rounded-2xl p-5">
                  <p class="text-[10px] font-bold text-primary uppercase tracking-widest mb-2">Vast tarief</p>
                  <ul class="text-sm text-on-surface-variant space-y-1.5 list-none p-0 m-0">
                    <li class="flex items-start gap-2"><span class="text-primary font-bold mt-0.5">→</span> De prijs <strong class="text-on-surface">blijft hetzelfde</strong></li>
                    <li class="flex items-start gap-2"><span class="text-primary font-bold mt-0.5">→</span> Contract duurt <strong class="text-on-surface">1, 2 of 3 jaar</strong></li>
                    <li class="flex items-start gap-2"><span class="text-primary font-bold mt-0.5">→</span> Je weet altijd wat je betaalt</li>
                  </ul>
                </div>
                <div class="bg-secondary/5 border border-secondary/20 rounded-2xl p-5">
                  <p class="text-[10px] font-bold text-secondary uppercase tracking-widest mb-2">Variabel tarief</p>
                  <ul class="text-sm text-on-surface-variant space-y-1.5 list-none p-0 m-0">
                    <li class="flex items-start gap-2"><span class="text-secondary font-bold mt-0.5">→</span> De prijs kan <strong class="text-on-surface">stijgen of dalen</strong></li>
                    <li class="flex items-start gap-2"><span class="text-secondary font-bold mt-0.5">→</span> <strong class="text-on-surface">Geen vaste looptijd</strong> — je kunt altijd stoppen</li>
                    <li class="flex items-start gap-2"><span class="text-secondary font-bold mt-0.5">→</span> Als energie goedkoper wordt, betaal je minder</li>
                  </ul>
                </div>
              </div>

              <!-- Jaarrekening -->
              <div class="bg-surface-container-low border border-outline-variant/50 rounded-2xl p-4 mb-6">
                <div class="flex items-center gap-2 mb-2">
                  <span class="material-symbols-outlined text-primary text-[18px]">receipt</span>
                  <p class="text-sm font-bold text-on-surface">De jaarrekening</p>
                </div>
                <p class="text-sm text-on-surface-variant leading-relaxed">
                  Één keer per jaar krijg je een <strong class="text-on-surface">jaarrekening</strong> van je energieleverancier en waterbedrijf. Heb je <strong class="text-on-surface">te weinig betaald</strong>? Dan betaal je extra. Heb je <strong class="text-on-surface">te veel betaald</strong>? Dan krijg je geld terug.
                </p>
              </div>

              <!-- Energie besparen -->
              <div class="bg-green-50 border border-green-200 rounded-2xl p-5">
                <p class="text-xs font-bold text-green-800 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                  <span class="material-symbols-outlined text-[15px]">eco</span>
                  Energie besparen — goed voor je portemonnee én de natuur
                </p>
                <div class="grid grid-cols-2 gap-x-4 gap-y-1.5">
                  <p class="text-xs text-green-900 flex items-center gap-1.5"><span>🌡️</span> Zet de verwarming lager</p>
                  <p class="text-xs text-green-900 flex items-center gap-1.5"><span>🚿</span> Douche kort</p>
                  <p class="text-xs text-green-900 flex items-center gap-1.5"><span>💡</span> Gebruik ledlampen</p>
                  <p class="text-xs text-green-900 flex items-center gap-1.5"><span>🔌</span> Opladers uit het stopcontact</p>
                  <p class="text-xs text-green-900 flex items-center gap-1.5"><span>📺</span> Apparaten helemaal uit</p>
                  <p class="text-xs text-green-900 flex items-center gap-1.5"><span>🏠</span> Isoleer je huis</p>
                </div>
              </div>
            </div>
          </section>`,
    },
    {
      id: "afval",
      icon: "delete",
      title: "Afval",
      subtitle: "Afval scheiden, containers, chemisch afval en statiegeld",
      contentHtml: `<section id="afval" class="scroll-mt-24 mb-8">
            <div class="bg-white rounded-3xl p-7 shadow-sm">
              <h2 class="text-xl sm:text-2xl font-bold text-primary mb-5 flex items-center gap-3">
                <span class="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                  <span class="material-symbols-outlined text-primary text-[18px]">delete</span>
                </span>
                Afval
              </h2>

              <p class="text-sm text-on-surface-variant leading-relaxed mb-5">
                <strong class="text-on-surface">Afval</strong> (ook: vuilnis) is alles wat je weggooit. De gemeente haalt het afval op — dit heet <strong class="text-on-surface">afvalinzameling</strong>. Je vindt in een <strong class="text-on-surface">afvalkalender</strong> (app of website) wanneer welk afval wordt opgehaald.
              </p>

              <!-- Afval scheiden -->
              <div class="mb-6">
                <h3 class="text-base font-bold text-on-surface mb-3">Afval scheiden</h3>
                <p class="text-sm text-on-surface-variant leading-relaxed mb-4">
                  Je moet verschillende soorten afval <strong class="text-on-surface">apart weggooien</strong>. Dit heet <strong class="text-on-surface">afval scheiden</strong>. Als je afval scheidt, kan een groot deel worden <strong class="text-on-surface">gerecycled</strong> — opnieuw gebruikt. Dat is beter voor de natuur.
                </p>

                <!-- Color-coded waste grid -->
                <div class="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4">
                  <div class="rounded-2xl p-4 flex flex-col items-center text-center" style="background:#dcfce7;border:1.5px solid #86efac;">
                    <span class="text-xl mb-1.5">🥦</span>
                    <p class="text-xs font-bold text-green-800">GFT</p>
                    <p class="text-[11px] text-green-700 mt-0.5">Groente, fruit en tuin</p>
                  </div>
                  <div class="rounded-2xl p-4 flex flex-col items-center text-center" style="background:#dbeafe;border:1.5px solid #93c5fd;">
                    <span class="text-xl mb-1.5">📄</span>
                    <p class="text-xs font-bold text-blue-800">Papier</p>
                    <p class="text-[11px] text-blue-700 mt-0.5">Kranten, dozen, post</p>
                  </div>
                  <div class="rounded-2xl p-4 flex flex-col items-center text-center" style="background:#fef9c3;border:1.5px solid #fde047;">
                    <span class="text-xl mb-1.5">🍶</span>
                    <p class="text-xs font-bold text-yellow-800">Glas</p>
                    <p class="text-[11px] text-yellow-700 mt-0.5">Flessen, potten</p>
                  </div>
                  <div class="rounded-2xl p-4 flex flex-col items-center text-center" style="background:#fce7f3;border:1.5px solid #f9a8d4;">
                    <span class="text-xl mb-1.5">👕</span>
                    <p class="text-xs font-bold text-pink-800">Textiel</p>
                    <p class="text-[11px] text-pink-700 mt-0.5">Kleding, stoffen</p>
                  </div>
                  <div class="rounded-2xl p-4 flex flex-col items-center text-center" style="background:#ffedd5;border:1.5px solid #fdba74;">
                    <span class="text-xl mb-1.5">🧴</span>
                    <p class="text-xs font-bold text-orange-800">Plastic</p>
                    <p class="text-[11px] text-orange-700 mt-0.5">Flessen, verpakkingen</p>
                  </div>
                  <div class="rounded-2xl p-4 flex flex-col items-center text-center" style="background:#f1f5f9;border:1.5px solid #cbd5e1;">
                    <span class="text-xl mb-1.5">🗑️</span>
                    <p class="text-xs font-bold text-slate-700">Restafval</p>
                    <p class="text-[11px] text-slate-600 mt-0.5">Alles dat niet apart kan</p>
                  </div>
                </div>

                <p class="text-xs text-on-surface-variant leading-relaxed">
                  Voor elk soort afval is er een <strong class="text-on-surface">container</strong>. Soms staat die bij je huis, soms in de buurt of bij de supermarkt.
                </p>
              </div>

              <!-- Speciaal afval -->
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                <div class="bg-surface-container-low border border-outline-variant/50 rounded-2xl p-4">
                  <div class="flex items-center gap-2 mb-2">
                    <span class="material-symbols-outlined text-secondary text-[18px]">warning</span>
                    <p class="text-sm font-bold text-on-surface">Chemisch afval</p>
                  </div>
                  <p class="text-xs text-on-surface-variant leading-relaxed">Gevaarlijk afval (bijv. verf, batterijen, medicijnen) mag <strong class="text-on-surface">niet in een gewone container</strong>. Dit breng je naar het <strong class="text-on-surface">afvalpunt van de gemeente</strong>.</p>
                </div>
                <div class="bg-surface-container-low border border-outline-variant/50 rounded-2xl p-4">
                  <div class="flex items-center gap-2 mb-2">
                    <span class="material-symbols-outlined text-primary text-[18px]">chair</span>
                    <p class="text-sm font-bold text-on-surface">Groot afval</p>
                  </div>
                  <p class="text-xs text-on-surface-variant leading-relaxed">Te groot voor een container (bijv. een bank of kast)? Breng het naar het afvalpunt, of maak een afspraak — de gemeente kan het <strong class="text-on-surface">ophalen</strong>.</p>
                </div>
              </div>

              <!-- Statiegeld callout -->
              <div class="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex gap-3 mb-5">
                <span class="material-symbols-outlined text-amber-500 text-[20px] shrink-0 mt-0.5">lightbulb</span>
                <div>
                  <p class="text-xs font-bold text-amber-800 uppercase tracking-wider mb-1">Statiegeld</p>
                  <p class="text-sm text-amber-900 leading-relaxed">Als je een <strong>blikje of plastic fles</strong> koopt, betaal je <strong>statiegeld</strong> — een klein extra bedrag. Lever je het blikje of de fles in bij een automaat (bijv. bij de supermarkt)? Dan krijg je het <strong>statiegeld terug</strong>.</p>
                </div>
              </div>

              <!-- Afvalstoffenheffing -->
              <div class="bg-surface-container-low border border-outline-variant/50 rounded-2xl p-4">
                <p class="text-sm text-on-surface-variant leading-relaxed">
                  De gemeente betaalt de afvalinzameling met de <strong class="text-on-surface">afvalstoffenheffing</strong>. Dit is een <strong class="text-on-surface">gemeentelijke belasting</strong> die iedereen betaalt. Het bedrag verschilt per gemeente.
                </p>
              </div>
            </div>
          </section>`,
    },
  ],
};
