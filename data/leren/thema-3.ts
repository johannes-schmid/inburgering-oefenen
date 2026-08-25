/**
 * GENERATED — do not edit by hand.
 *
 * Written by scripts/knm-content/generate-leren-data.mjs from the KNM production
 * `leren_content` table. Edit a section in /admin and re-run the exporter + generator;
 * editing this file instead is a change that the next run silently reverts.
 */
import type { LerenThema } from './types';

export const thema: LerenThema = {
  id: 3,
  slug: "thema-3-gezondheid",
  title: "Gezondheid",
  description: "In dit thema leer je alles over gezondheid en gezondheidszorg in Nederland: de huisarts, spoedeisende hulp, de apotheek, de zorgverzekering en meer.",
  quizCategory: "Gezondheid en Gezondheidszorg",
  sections: [
    {
      id: "huisarts",
      icon: "local_hospital",
      title: "Naar de huisarts",
      subtitle: "Afspraak maken, wat je kunt verwachten, en de huisarts als poortwachter",
      contentHtml: `<section id="huisarts" class="scroll-mt-24 mb-8">
            <div class="bg-white rounded-3xl p-7 shadow-sm">
              <h2 class="text-xl sm:text-2xl font-bold text-primary mb-5 flex items-center gap-3">
                <span class="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                  <span class="material-symbols-outlined text-primary text-[18px]">medical_services</span>
                </span>
                Naar de huisarts
              </h2>

              <p class="text-on-surface-variant leading-relaxed mb-5">
                In Nederland heeft bijna iedereen een <strong class="text-on-surface">vaste huisarts</strong>. De huisarts is je eerste contactpersoon als je ziek bent, stress hebt of vragen hebt over je gezondheid. Je zoekt een huisarts in de buurt van je woning — soms is een praktijk vol en moet je verder zoeken.
              </p>

              <!-- Situation cards -->
              <h3 class="text-base font-bold text-on-surface mb-3">Wanneer ga je naar de huisarts?</h3>
              <div class="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
                <div class="bg-surface-container-low rounded-2xl p-4">
                  <span class="material-symbols-outlined text-primary text-[22px] mb-2 block">sick</span>
                  <p class="text-sm font-bold text-on-surface mb-1">Je bent ziek</p>
                  <p class="text-xs text-on-surface-variant leading-relaxed">Koorts, pijn, verkoudheid die lang duurt — bel de huisarts voor een afspraak.</p>
                </div>
                <div class="bg-surface-container-low rounded-2xl p-4">
                  <span class="material-symbols-outlined text-primary text-[22px] mb-2 block">psychology</span>
                  <p class="text-sm font-bold text-on-surface mb-1">Stress of angst</p>
                  <p class="text-xs text-on-surface-variant leading-relaxed">De huisarts helpt ook bij mentale klachten en kan je doorverwijzen naar een psycholoog.</p>
                </div>
                <div class="bg-surface-container-low rounded-2xl p-4">
                  <span class="material-symbols-outlined text-primary text-[22px] mb-2 block">pill</span>
                  <p class="text-sm font-bold text-on-surface mb-1">Medicijnen nodig</p>
                  <p class="text-xs text-on-surface-variant leading-relaxed">Alleen de huisarts mag een recept uitschrijven voor medicijnen op recept.</p>
                </div>
              </div>

              <!-- How to make an appointment -->
              <div class="bg-surface-container-low rounded-2xl p-5 mb-5">
                <h3 class="text-sm font-bold text-on-surface mb-3 flex items-center gap-2">
                  <span class="material-symbols-outlined text-primary text-[16px]">phone</span>
                  Een afspraak maken
                </h3>
                <div class="space-y-2.5 text-sm text-on-surface-variant">
                  <div class="flex gap-3">
                    <span class="text-primary font-bold shrink-0">→</span>
                    <span>Bel de <strong class="text-on-surface">assistent</strong> van de huisarts — zij plannen de afspraak</span>
                  </div>
                  <div class="flex gap-3">
                    <span class="text-primary font-bold shrink-0">→</span>
                    <span>Veel huisartsen hebben ook een <strong class="text-on-surface">app of website</strong> waarmee je online een afspraak kunt maken</span>
                  </div>
                  <div class="flex gap-3">
                    <span class="text-primary font-bold shrink-0">→</span>
                    <span>Kom altijd <strong class="text-on-surface">op tijd</strong> — te laat komen kan betekenen dat de afspraak niet doorgaat</span>
                  </div>
                  <div class="flex gap-3">
                    <span class="text-primary font-bold shrink-0">→</span>
                    <span>De <strong class="text-on-surface">praktijkondersteuner</strong> heeft meer tijd dan de huisarts — ze helpen mensen met chronische klachten (bijv. diabetes, hart)</span>
                  </div>
                </div>
              </div>

              <!-- Language + privacy -->
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
                <div class="border border-outline-variant/60 rounded-2xl p-4">
                  <div class="flex items-center gap-2 mb-2">
                    <span class="material-symbols-outlined text-primary text-[18px]">translate</span>
                    <p class="text-sm font-bold text-on-surface">Geen Nederlands?</p>
                  </div>
                  <p class="text-xs text-on-surface-variant leading-relaxed">Neem een vriend of familielid mee. Een <strong class="text-on-surface">kind mag niet vertalen</strong> — dat is te moeilijk en niet goed voor het kind. Vraag om een <strong class="text-on-surface">telefonische tolk</strong> als dat nodig is.</p>
                </div>
                <div class="border border-outline-variant/60 rounded-2xl p-4">
                  <div class="flex items-center gap-2 mb-2">
                    <span class="material-symbols-outlined text-primary text-[18px]">lock</span>
                    <p class="text-sm font-bold text-on-surface">Medisch beroepsgeheim</p>
                  </div>
                  <p class="text-xs text-on-surface-variant leading-relaxed">Alles wat je aan de huisarts vertelt, is <strong class="text-on-surface">geheim</strong>. De huisarts mag niets doorgeven aan anderen — ook niet aan familie — zonder jouw toestemming.</p>
                </div>
              </div>

              <div class="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex gap-3">
                <span class="material-symbols-outlined text-amber-500 text-[20px] shrink-0 mt-0.5">lightbulb</span>
                <div>
                  <p class="text-xs font-bold text-amber-800 uppercase tracking-wider mb-1">Onthoud dit!</p>
                  <p class="text-sm text-amber-900 leading-relaxed">Een kind mag <strong>niet vertalen</strong> bij de huisarts — dit is te zwaar voor een kind en kan fouten geven. Vraag altijd om een volwassen tolk of een telefonische tolk.</p>
                </div>
              </div>
            </div>
          </section>
      <!-- WIDGET:les-thema3-huisarts -->`,
    },
    {
      id: "spoedgeval",
      icon: "emergency",
      title: "Een spoedgeval",
      subtitle: "112 bellen, SEH, de HAP en wanneer je naar de dokter gaat",
      contentHtml: `<section id="spoedgeval" class="scroll-mt-24 mb-8">
            <div class="bg-white rounded-3xl p-7 shadow-sm">
              <h2 class="text-xl sm:text-2xl font-bold text-primary mb-5 flex items-center gap-3">
                <span class="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                  <span class="material-symbols-outlined text-primary text-[18px]">emergency</span>
                </span>
                Een spoedgeval
              </h2>

              <p class="text-on-surface-variant leading-relaxed mb-6">
                Bij een noodsituatie is het belangrijk dat je weet welk nummer je moet bellen. Dat hangt af van hoe ernstig de situatie is <em>en</em> hoe laat het is.
              </p>

              <!-- Decision tree -->
              <div class="bg-surface-container-low rounded-2xl p-5 mb-6">
                <p class="text-xs font-bold text-on-surface uppercase tracking-widest mb-4">Wat moet je doen?</p>

                <!-- Root question -->
                <div class="flex items-start gap-3 mb-4">
                  <div class="w-6 h-6 rounded-full bg-primary flex items-center justify-center shrink-0 mt-0.5">
                    <span class="text-white text-[11px] font-bold">?</span>
                  </div>
                  <p class="text-sm font-semibold text-on-surface">Is er <strong>direct levensgevaar</strong>? (bijv. hartaanval, ongeluk, brand)</p>
                </div>

                <!-- JA branch -->
                <div class="ml-9 mb-4">
                  <div class="border-l-2 border-red-400 pl-4 mb-2">
                    <div class="flex items-center gap-2 mb-1">
                      <span class="text-[10px] font-bold bg-red-100 text-red-700 px-2 py-0.5 rounded-full">JA</span>
                      <span class="text-sm font-bold text-on-surface">Altijd 112 bellen</span>
                    </div>
                    <p class="text-xs text-on-surface-variant leading-relaxed">Dag en nacht, 7 dagen per week. De ambulance komt naar je toe.</p>
                  </div>
                </div>

                <!-- NEE branch -->
                <div class="ml-9">
                  <div class="border-l-2 border-primary/30 pl-4">
                    <div class="flex items-center gap-2 mb-3">
                      <span class="text-[10px] font-bold bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">NEE</span>
                      <span class="text-sm font-semibold text-on-surface">Kijk dan naar de tijd:</span>
                    </div>
                    <div class="space-y-3">
                      <div class="border-l-2 border-primary pl-4">
                        <div class="flex items-center gap-2 mb-1">
                          <span class="text-[10px] font-bold bg-primary/10 text-primary px-2 py-0.5 rounded-full">08:00 – 17:00</span>
                          <span class="text-sm font-bold text-on-surface">Bel je eigen huisarts</span>
                        </div>
                        <p class="text-xs text-on-surface-variant leading-relaxed">De assistent stelt vragen en regelt hulp — soms komt de dokter naar je toe.</p>
                      </div>
                      <div class="border-l-2 border-secondary pl-4">
                        <div class="flex items-center gap-2 mb-1">
                          <span class="text-[10px] font-bold bg-secondary/10 text-secondary px-2 py-0.5 rounded-full">Avond / nacht / weekend</span>
                          <span class="text-sm font-bold text-on-surface">Bel de huisartsenpost</span>
                        </div>
                        <p class="text-xs text-on-surface-variant leading-relaxed">De huisartsenpost is open als jouw huisarts gesloten is. De assistent beslist of je langs moet komen, of de dokter naar je toe komt.</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div class="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex gap-3">
                <span class="material-symbols-outlined text-amber-500 text-[20px] shrink-0 mt-0.5">lightbulb</span>
                <div>
                  <p class="text-xs font-bold text-amber-800 uppercase tracking-wider mb-1">Onthoud dit!</p>
                  <p class="text-sm text-amber-900 leading-relaxed"><strong>112</strong> = direct levensgevaar, dag en nacht. <strong>Huisarts</strong> = overdag, niet spoedeisend. <strong>Huisartsenpost</strong> = avond, nacht of weekend, niet spoedeisend. Dit onderscheid staat bijna altijd op het KNM-examen.</p>
                </div>
              </div>
            </div>
          </section>
      <!-- WIDGET:les-thema3-spoedgeval -->`,
    },
    {
      id: "doorverwijzen",
      icon: "transfer_within_a_station",
      title: "Doorverwijzen",
      subtitle: "Specialist, GGZ en andere zorgverleners",
      contentHtml: `<section id="doorverwijzen" class="scroll-mt-24 mb-8">
            <div class="bg-white rounded-3xl p-7 shadow-sm">
              <h2 class="text-xl sm:text-2xl font-bold text-primary mb-5 flex items-center gap-3">
                <span class="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                  <span class="material-symbols-outlined text-primary text-[18px]">transfer_within_a_station</span>
                </span>
                Doorverwijzen
              </h2>

              <p class="text-on-surface-variant leading-relaxed mb-6">
                Soms kan de huisarts je <strong class="text-on-surface">niet zelf helpen</strong>. Dan verwijst hij of zij je door naar een specialist of andere zorgverlener.
              </p>

              <!-- Referral path diagram -->
              <div class="bg-surface-container-low rounded-2xl p-5 mb-6">
                <p class="text-xs font-bold text-on-surface uppercase tracking-widest mb-4">Doorverwijzingspad</p>

                <!-- Center: huisarts -->
                <div class="flex justify-center mb-4">
                  <div class="bg-primary text-white rounded-2xl px-5 py-3 text-center">
                    <span class="material-symbols-outlined text-[20px] block mb-1">medical_services</span>
                    <p class="text-sm font-bold">Huisarts</p>
                    <p class="text-[10px] text-white/70">Geeft verwijsbrief</p>
                  </div>
                </div>

                <!-- Three arrows down -->
                <div class="grid grid-cols-3 gap-3">
                  <div class="text-center">
                    <div class="text-primary text-lg font-bold mb-1">↓</div>
                    <div class="bg-white border border-primary/20 rounded-xl p-3">
                      <span class="material-symbols-outlined text-primary text-[18px] block mb-1">local_hospital</span>
                      <p class="text-xs font-bold text-on-surface">Specialist</p>
                      <p class="text-[10px] text-on-surface-variant mt-1">In het ziekenhuis. <span class="font-semibold text-primary">Verwijsbrief verplicht.</span></p>
                    </div>
                  </div>
                  <div class="text-center">
                    <div class="text-primary text-lg font-bold mb-1">↓</div>
                    <div class="bg-white border border-primary/20 rounded-xl p-3">
                      <span class="material-symbols-outlined text-primary text-[18px] block mb-1">psychology</span>
                      <p class="text-xs font-bold text-on-surface">Psycholoog</p>
                      <p class="text-[10px] text-on-surface-variant mt-1">Bij stress of psychische klachten. <span class="font-semibold text-primary">Verwijsbrief nodig.</span></p>
                    </div>
                  </div>
                  <div class="text-center">
                    <div class="text-secondary text-lg font-bold mb-1">↓</div>
                    <div class="bg-white border border-secondary/20 rounded-xl p-3">
                      <span class="material-symbols-outlined text-secondary text-[18px] block mb-1">sports_gymnastics</span>
                      <p class="text-xs font-bold text-on-surface">Fysiotherapeut</p>
                      <p class="text-[10px] text-on-surface-variant mt-1">Spier- of bewegingsproblemen. <span class="font-semibold text-secondary">Geen verwijsbrief nodig.</span></p>
                    </div>
                  </div>
                </div>
              </div>

              <div class="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex gap-3">
                <span class="material-symbols-outlined text-amber-500 text-[20px] shrink-0 mt-0.5">lightbulb</span>
                <div>
                  <p class="text-xs font-bold text-amber-800 uppercase tracking-wider mb-1">Onthoud dit!</p>
                  <p class="text-sm text-amber-900 leading-relaxed">Zonder <strong>verwijsbrief</strong> van de huisarts kun je géén afspraak maken in het ziekenhuis. Uitzondering: de <strong>fysiotherapeut</strong> — die mag je zelf bellen, zonder verwijsbrief.</p>
                </div>
              </div>
            </div>
          </section>
      <!-- WIDGET:les-thema3-doorverwijzen -->`,
    },
    {
      id: "apotheek",
      icon: "medication",
      title: "De apotheek en de tandarts",
      subtitle: "Medicijnen ophalen, de tandarts en mondzorg",
      contentHtml: `<section id="apotheek" class="scroll-mt-24 mb-8">
            <div class="bg-white rounded-3xl p-7 shadow-sm">
              <h2 class="text-xl sm:text-2xl font-bold text-primary mb-5 flex items-center gap-3">
                <span class="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                  <span class="material-symbols-outlined text-primary text-[18px]">medication</span>
                </span>
                De apotheek en de tandarts
              </h2>

              <div class="grid grid-cols-1 sm:grid-cols-2 gap-6">

                <!-- Apotheek -->
                <div>
                  <div class="flex items-center gap-2 mb-4">
                    <span class="w-6 h-6 rounded-full bg-primary flex items-center justify-center shrink-0">
                      <span class="material-symbols-outlined text-white text-[14px]">medication</span>
                    </span>
                    <h3 class="text-base font-bold text-on-surface">De apotheek</h3>
                  </div>
                  <div class="space-y-3 mb-4">
                    <div class="flex gap-3">
                      <div class="w-7 h-7 rounded-full bg-primary text-white text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">1</div>
                      <div>
                        <p class="text-sm font-semibold text-on-surface">Recept van de huisarts</p>
                        <p class="text-xs text-on-surface-variant leading-relaxed mt-0.5">De huisarts stuurt het recept <strong class="text-on-surface">digitaal</strong> naar de apotheek van jouw keuze.</p>
                      </div>
                    </div>
                    <div class="flex gap-3">
                      <div class="w-7 h-7 rounded-full bg-primary text-white text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">2</div>
                      <div>
                        <p class="text-sm font-semibold text-on-surface">Medicijnen ophalen</p>
                        <p class="text-xs text-on-surface-variant leading-relaxed mt-0.5">Je haalt de medicijnen op bij de apotheek. Sommige apotheken hebben een <strong class="text-on-surface">afhaalautomaat</strong> — je krijgt een code op je telefoon.</p>
                      </div>
                    </div>
                    <div class="flex gap-3">
                      <div class="w-7 h-7 rounded-full bg-primary text-white text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">3</div>
                      <div>
                        <p class="text-sm font-semibold text-on-surface">Vrij verkrijgbare medicijnen</p>
                        <p class="text-xs text-on-surface-variant leading-relaxed mt-0.5">Pijnstillers en koortsmedicijn koop je ook bij de <strong class="text-on-surface">drogist of supermarkt</strong> — geen recept nodig.</p>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Tandarts -->
                <div>
                  <div class="flex items-center gap-2 mb-4">
                    <span class="w-6 h-6 rounded-full bg-secondary flex items-center justify-center shrink-0">
                      <span class="material-symbols-outlined text-white text-[14px]">sentiment_satisfied</span>
                    </span>
                    <h3 class="text-base font-bold text-on-surface">De tandarts</h3>
                  </div>
                  <div class="space-y-3">
                    <div class="flex gap-3">
                      <span class="text-secondary font-bold mt-0.5 shrink-0">→</span>
                      <p class="text-sm text-on-surface-variant leading-relaxed">Zoek zelf een tandarts in de buurt — je hebt <strong class="text-on-surface">geen verwijzing</strong> nodig</p>
                    </div>
                    <div class="flex gap-3">
                      <span class="text-secondary font-bold mt-0.5 shrink-0">→</span>
                      <p class="text-sm text-on-surface-variant leading-relaxed">Ga <strong class="text-on-surface">1 à 2 keer per jaar</strong> voor een controle — ook als je niets voelt</p>
                    </div>
                    <div class="flex gap-3">
                      <span class="text-secondary font-bold mt-0.5 shrink-0">→</span>
                      <p class="text-sm text-on-surface-variant leading-relaxed">De <strong class="text-on-surface">mondhygiënist</strong> maakt je gebit professioneel schoon</p>
                    </div>
                    <div class="flex gap-3">
                      <span class="text-secondary font-bold mt-0.5 shrink-0">!</span>
                      <p class="text-sm text-on-surface-variant leading-relaxed">Kun je niet komen? Meld je <strong class="text-on-surface">tijdig af</strong> — anders moet je soms toch betalen</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>
      <!-- WIDGET:les-thema3-apotheek -->`,
    },
    {
      id: "kind",
      icon: "child_care",
      title: "Een kind krijgen",
      subtitle: "Zwangerschap, bevallen, kraamzorg en het consultatiebureau",
      contentHtml: `<section id="kind" class="scroll-mt-24 mb-8">
            <div class="bg-white rounded-3xl p-7 shadow-sm">
              <h2 class="text-xl sm:text-2xl font-bold text-primary mb-5 flex items-center gap-3">
                <span class="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                  <span class="material-symbols-outlined text-primary text-[18px]">baby_changing_station</span>
                </span>
                Een kind krijgen
              </h2>

              <p class="text-on-surface-variant leading-relaxed mb-6">
                Ben je zwanger? In Nederland is er goede zorg voor moeder en baby, van de zwangerschap tot na de geboorte.
              </p>

              <!-- STEP_TIMELINE:zwanger-baby -->

              <!-- Important rules -->
              <div class="bg-surface-container-low rounded-2xl p-5 mb-5">
                <h3 class="text-sm font-bold text-on-surface mb-3">Wettelijke verplichtingen na de geboorte</h3>
                <div class="space-y-2.5 text-sm text-on-surface-variant">
                  <div class="flex gap-3">
                    <span class="text-primary font-bold shrink-0">→</span>
                    <span>Baby binnen <strong class="text-on-surface">3 dagen</strong> aangeven bij de gemeente — dit heet <strong class="text-on-surface">aangifte doen</strong></span>
                  </div>
                  <div class="flex gap-3">
                    <span class="text-primary font-bold shrink-0">→</span>
                    <span>Niet getrouwd? De vader moet de baby <strong class="text-on-surface">erkennen</strong> bij de gemeente om juridisch vader te worden</span>
                  </div>
                </div>
              </div>

              <div class="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex gap-3">
                <span class="material-symbols-outlined text-amber-500 text-[20px] shrink-0 mt-0.5">lightbulb</span>
                <div>
                  <p class="text-xs font-bold text-amber-800 uppercase tracking-wider mb-1">Onthoud dit!</p>
                  <p class="text-sm text-amber-900 leading-relaxed">Baby <strong>binnen 3 dagen</strong> aangeven bij de gemeente — dit is verplicht. Het consultatiebureau begint <strong>vanaf 4 weken</strong> na de geboorte.</p>
                </div>
              </div>
            </div>
          </section>
      <!-- WIDGET:les-thema3-kind -->`,
    },
    {
      id: "zorgverzekering",
      icon: "health_and_safety",
      title: "De zorgverzekering",
      subtitle: "Eigen risico, verplichte en aanvullende verzekering",
      contentHtml: `<section id="zorgverzekering" class="scroll-mt-24 mb-8">
            <div class="bg-white rounded-3xl p-7 shadow-sm">
              <h2 class="text-xl sm:text-2xl font-bold text-primary mb-5 flex items-center gap-3">
                <span class="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                  <span class="material-symbols-outlined text-primary text-[18px]">health_and_safety</span>
                </span>
                De zorgverzekering
              </h2>

              <p class="text-on-surface-variant leading-relaxed mb-6">
                In Nederland is een <strong class="text-on-surface">zorgverzekering verplicht</strong> voor iedereen van 18 jaar en ouder. De basisverzekering dekt de zorg bij de huisarts en het ziekenhuis.
              </p>

              <!-- Cost breakdown -->
              <h3 class="text-base font-bold text-on-surface mb-3">Drie kostenlagen</h3>
              <div class="space-y-3 mb-6">
                <div class="flex items-start gap-4 bg-blue-50 border border-blue-200 rounded-2xl p-4">
                  <div class="w-10 h-10 rounded-xl bg-blue-500 flex items-center justify-center shrink-0">
                    <span class="material-symbols-outlined text-white text-[18px]">payments</span>
                  </div>
                  <div>
                    <p class="text-sm font-bold text-blue-900">Premie</p>
                    <p class="text-xs text-blue-800 leading-relaxed mt-0.5">Betaal je <strong>elke maand</strong> aan de verzekeraar — verplicht, ook als je niet ziek bent.</p>
                  </div>
                </div>
                <div class="flex items-start gap-4 bg-orange-50 border border-orange-200 rounded-2xl p-4">
                  <div class="w-10 h-10 rounded-xl bg-orange-400 flex items-center justify-center shrink-0">
                    <span class="material-symbols-outlined text-white text-[18px]">account_balance_wallet</span>
                  </div>
                  <div>
                    <p class="text-sm font-bold text-orange-900">Eigen risico</p>
                    <p class="text-xs text-orange-800 leading-relaxed mt-0.5">Bedrag dat je <strong>eerst zelf betaalt</strong> per jaar. Daarna betaalt de verzekeraar. <strong>Uitzondering: bij de huisarts betaal je géén eigen risico.</strong></p>
                  </div>
                </div>
                <div class="flex items-start gap-4 bg-yellow-50 border border-yellow-200 rounded-2xl p-4">
                  <div class="w-10 h-10 rounded-xl bg-yellow-500 flex items-center justify-center shrink-0">
                    <span class="material-symbols-outlined text-white text-[18px]">receipt</span>
                  </div>
                  <div>
                    <p class="text-sm font-bold text-yellow-900">Eigen bijdrage</p>
                    <p class="text-xs text-yellow-800 leading-relaxed mt-0.5">Extra bedrag voor <strong>bepaalde zorg</strong>, zoals sommige medicijnen of kraamzorg. Staat apart vermeld.</p>
                  </div>
                </div>
              </div>

              <!-- Extra rules -->
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
                <div class="bg-surface-container-low rounded-2xl p-4">
                  <div class="flex items-center gap-2 mb-2">
                    <span class="material-symbols-outlined text-primary text-[18px]">child_care</span>
                    <p class="text-sm font-bold text-on-surface">Kinderen</p>
                  </div>
                  <p class="text-xs text-on-surface-variant leading-relaxed">Kinderen tot 18 jaar zijn <strong class="text-on-surface">gratis meeverzekerd</strong>, maar je moet ze wel inschrijven bij jouw verzekering.</p>
                </div>
                <div class="bg-surface-container-low rounded-2xl p-4">
                  <div class="flex items-center gap-2 mb-2">
                    <span class="material-symbols-outlined text-primary text-[18px]">swap_horiz</span>
                    <p class="text-sm font-bold text-on-surface">Wisselen</p>
                  </div>
                  <p class="text-xs text-on-surface-variant leading-relaxed">Aan het <strong class="text-on-surface">einde van het jaar</strong> mag je wisselen van zorgverzekeraar — vergelijk prijzen en pakketten.</p>
                </div>
              </div>

              <!-- Zorgtoeslag callout -->
              <div class="bg-green-50 border border-green-200 rounded-2xl p-5">
                <div class="flex items-center gap-2 mb-3">
                  <span class="material-symbols-outlined text-green-700 text-[20px]">savings</span>
                  <p class="text-sm font-bold text-green-800">Zorgtoeslag — hulp bij de premie</p>
                </div>
                <p class="text-sm text-green-900 leading-relaxed mb-3">
                  Heb je een laag inkomen? Dan kun je <strong>zorgtoeslag</strong> aanvragen bij de <strong>Belastingdienst</strong>. Dat is een maandelijks bedrag om de zorgpremie mee te betalen.
                </p>
                <div class="space-y-2 text-sm text-green-900">
                  <div class="flex items-start gap-2">
                    <span class="font-bold shrink-0">→</span>
                    <span>Aanvragen via <strong>toeslagen.nl</strong></span>
                  </div>
                  <div class="flex items-start gap-2">
                    <span class="font-bold shrink-0">→</span>
                    <span>Verandert je inkomen? <strong>Direct doorgeven</strong> — anders krijg je te veel of te weinig</span>
                  </div>
                </div>
              </div>
            </div>
          </section>
      <!-- WIDGET:les-thema3-zorgverzekering -->`,
    },
    {
      id: "orgaandonatie",
      icon: "volunteer_activism",
      title: "Orgaandonatie",
      subtitle: "Hoe het werkt en waarom het belangrijk is",
      contentHtml: `<section id="orgaandonatie" class="scroll-mt-24 mb-8">
            <div class="bg-white rounded-3xl p-7 shadow-sm">
              <h2 class="text-xl sm:text-2xl font-bold text-primary mb-5 flex items-center gap-3">
                <span class="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                  <span class="material-symbols-outlined text-primary text-[18px]">volunteer_activism</span>
                </span>
                Orgaandonatie
              </h2>

              <p class="text-on-surface-variant leading-relaxed mb-6">
                Als je overlijdt, kunnen je organen — zoals je hart, longen of nieren — worden gebruikt om een andere persoon te helpen. In Nederland word je gevraagd om een keuze te maken.
              </p>

              <!-- When do you get a letter -->
              <div class="bg-surface-container-low rounded-2xl p-4 mb-6 flex gap-3">
                <span class="material-symbols-outlined text-primary text-[20px] shrink-0 mt-0.5">mail</span>
                <div>
                  <p class="text-sm font-bold text-on-surface mb-1">Je krijgt automatisch een brief</p>
                  <p class="text-xs text-on-surface-variant leading-relaxed">Als je <strong class="text-on-surface">18 jaar wordt</strong>, of als je <strong class="text-on-surface">3 jaar in Nederland woont</strong>, krijg je een brief met de vraag om je keuze vast te leggen in het <strong class="text-on-surface">Donorregister</strong>.</p>
                </div>
              </div>

              <!-- Choice cards -->
              <h3 class="text-base font-bold text-on-surface mb-3">Jouw opties in het Donorregister</h3>
              <div class="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
                <div class="bg-green-50 border border-green-200 rounded-2xl p-4 text-center">
                  <div class="text-2xl mb-2">✅</div>
                  <p class="text-sm font-bold text-green-900">Ja, ik wil donor zijn</p>
                  <p class="text-[11px] text-green-700 mt-1.5 leading-relaxed">Je organen mogen worden gebruikt na je overlijden.</p>
                </div>
                <div class="bg-red-50 border border-red-200 rounded-2xl p-4 text-center">
                  <div class="text-2xl mb-2">❌</div>
                  <p class="text-sm font-bold text-red-900">Nee, ik wil geen donor zijn</p>
                  <p class="text-[11px] text-red-700 mt-1.5 leading-relaxed">Je organen worden niet gebruikt.</p>
                </div>
                <div class="bg-surface-container-low border border-outline-variant rounded-2xl p-4 text-center">
                  <div class="text-2xl mb-2">👤</div>
                  <p class="text-sm font-bold text-on-surface">Ik laat het aan een naaste over</p>
                  <p class="text-[11px] text-on-surface-variant mt-1.5 leading-relaxed">Jouw partner of familie beslist na jouw overlijden.</p>
                </div>
              </div>

              <div class="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex gap-3">
                <span class="material-symbols-outlined text-amber-500 text-[20px] shrink-0 mt-0.5">lightbulb</span>
                <div>
                  <p class="text-xs font-bold text-amber-800 uppercase tracking-wider mb-1">Onthoud dit!</p>
                  <p class="text-sm text-amber-900 leading-relaxed">Heb je <strong>geen keuze gemaakt</strong>? Dan staat in de wet dat de overheid ervan uitgaat dat je <strong>geen bezwaar hebt</strong> — je organen mogen dan worden gebruikt. Registreer je keuze via het <strong>Donorregister</strong>. Je kunt je keuze altijd veranderen.</p>
                </div>
              </div>
            </div>
          </section>
      <!-- WIDGET:les-thema3-orgaandonatie -->`,
    },
    {
      id: "thuiszorg",
      icon: "home_health",
      title: "Thuiszorg en Wmo",
      subtitle: "Hulp thuis en de Wet maatschappelijke ondersteuning",
      contentHtml: `<section id="thuiszorg" class="scroll-mt-24 mb-8">
            <div class="bg-white rounded-3xl p-7 shadow-sm">
              <h2 class="text-xl sm:text-2xl font-bold text-primary mb-5 flex items-center gap-3">
                <span class="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                  <span class="material-symbols-outlined text-primary text-[18px]">elderly</span>
                </span>
                Thuiszorg, ouderenzorg en de Wmo
              </h2>
              <p class="text-on-surface-variant leading-relaxed mb-5">
                Heb je hulp nodig bij dagelijkse activiteiten thuis — zoals wassen, aankleden of eten? Of voor iemand anders in je gezin die dat niet meer zelf kan? Dan kun je ondersteuning aanvragen via de <strong class="text-on-surface">Wmo (Wet maatschappelijke ondersteuning)</strong>.
              </p>
              <div class="space-y-3 mb-5">
                <div class="flex gap-3 bg-surface-container-low rounded-2xl p-4">
                  <span class="material-symbols-outlined text-primary shrink-0 text-[20px]">home</span>
                  <div>
                    <p class="text-sm font-bold text-on-surface">Wmo aanvragen bij de gemeente</p>
                    <p class="text-xs text-on-surface-variant mt-0.5 leading-relaxed">Je vraagt thuiszorg of dagbesteding aan bij de <strong class="text-on-surface">gemeente</strong>. De gemeente beoordeelt de aanvraag en bekijkt welke hulp nodig is. Dit heet een <strong class="text-on-surface">Wmo-indicatie</strong>.</p>
                  </div>
                </div>
                <div class="flex gap-3 bg-surface-container-low rounded-2xl p-4">
                  <span class="material-symbols-outlined text-primary shrink-0 text-[20px]">volunteer_activism</span>
                  <div>
                    <p class="text-sm font-bold text-on-surface">Wat valt onder de Wmo?</p>
                    <p class="text-xs text-on-surface-variant mt-0.5 leading-relaxed">Hulp bij het huishouden, dagbesteding, begeleiding, rolstoel of scootmobiel, aanpassingen aan je woning (bijv. een traplift). De Wmo is voor mensen die door ziekte, beperking of ouderdom niet zelfstandig kunnen functioneren.</p>
                  </div>
                </div>
              </div>
              <div class="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex gap-3">
                <span class="material-symbols-outlined text-amber-500 text-[20px] shrink-0 mt-0.5">lightbulb</span>
                <p class="text-sm text-amber-900 leading-relaxed"><strong>Onthoud:</strong> Thuiszorg vraag je aan bij de <strong>gemeente</strong> via de Wmo — niet bij de huisarts of zorgverzekeraar.</p>
              </div>
            </div>
          </section>
      <!-- WIDGET:les-thema3-thuiszorg -->`,
    },
  ],
};
