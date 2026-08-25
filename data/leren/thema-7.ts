/**
 * GENERATED — do not edit by hand.
 *
 * Written by scripts/knm-content/generate-leren-data.mjs from the KNM production
 * `leren_content` table. Edit a section in /admin and re-run the exporter + generator;
 * editing this file instead is a change that the next run silently reverts.
 */
import type { LerenThema } from './types';

export const thema: LerenThema = {
  id: 7,
  slug: "thema-7-regering-en-wet",
  title: "Regering en Wet",
  description: "In dit thema leer je alles over de Nederlandse democratie, het bestuur en de rechtsstaat: hoe wetten worden gemaakt, wie de macht heeft en hoe je je rechten kunt gebruiken.",
  quizCategory: "Staatsinrichting en Rechtsstaat",
  sections: [
    {
      id: "democratie",
      icon: "how_to_vote",
      title: "Democratie",
      subtitle: "Verkiezingen, politieke partijen, rechten en plichten van burgers",
      contentHtml: `<section id="democratie" class="scroll-mt-24 mb-8">
            <div class="bg-white rounded-3xl p-7 shadow-sm">
              <h2 class="text-xl sm:text-2xl font-bold text-primary mb-5 flex items-center gap-3">
                <span class="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                  <span class="material-symbols-outlined text-primary text-[18px]">how_to_vote</span>
                </span>
                Democratie
              </h2>

              <div class="bg-blue-50 border border-blue-200 rounded-2xl p-4 mb-6">
                <p class="text-sm text-blue-900 leading-relaxed">Nederland is sinds <strong>1848</strong> een <strong>democratie</strong>. In een democratie is er niet één baas. De inwoners kiezen samen wie het land mag regeren. Dit heet <strong>stemmen</strong>.</p>
              </div>

              <!-- Soorten verkiezingen -->
              <h3 class="text-base font-bold text-on-surface mb-3 flex items-center gap-2">
                <span class="material-symbols-outlined text-primary text-[18px]" style="font-variation-settings:'FILL' 1,'wght' 400,'GRAD' 0,'opsz' 24;">calendar_month</span>
                Wanneer kun je stemmen?
              </h3>
              <div class="space-y-2 mb-6">
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div class="bg-surface-container-low rounded-2xl p-3 border border-outline-variant/40 flex items-center gap-3">
                    <span class="w-8 h-8 rounded-full bg-primary text-white text-xs font-bold flex items-center justify-center shrink-0">4j</span>
                    <div>
                      <p class="text-sm font-semibold text-on-surface">Tweede Kamer</p>
                      <p class="text-xs text-on-surface-variant">Verkiezingen voor het land</p>
                    </div>
                  </div>
                  <div class="bg-surface-container-low rounded-2xl p-3 border border-outline-variant/40 flex items-center gap-3">
                    <span class="w-8 h-8 rounded-full bg-primary text-white text-xs font-bold flex items-center justify-center shrink-0">4j</span>
                    <div>
                      <p class="text-sm font-semibold text-on-surface">Provinciale Staten</p>
                      <p class="text-xs text-on-surface-variant">Verkiezingen voor de provincie</p>
                    </div>
                  </div>
                  <div class="bg-surface-container-low rounded-2xl p-3 border border-outline-variant/40 flex items-center gap-3">
                    <span class="w-8 h-8 rounded-full bg-primary text-white text-xs font-bold flex items-center justify-center shrink-0">4j</span>
                    <div>
                      <p class="text-sm font-semibold text-on-surface">Gemeenteraad</p>
                      <p class="text-xs text-on-surface-variant">Verkiezingen voor de gemeente</p>
                    </div>
                  </div>
                  <div class="bg-surface-container-low rounded-2xl p-3 border border-outline-variant/40 flex items-center gap-3">
                    <span class="w-8 h-8 rounded-full bg-primary text-white text-xs font-bold flex items-center justify-center shrink-0">4j</span>
                    <div>
                      <p class="text-sm font-semibold text-on-surface">Waterschappen</p>
                      <p class="text-xs text-on-surface-variant">Beheer van water en dijken</p>
                    </div>
                  </div>
                  <div class="bg-surface-container-low rounded-2xl p-3 border border-outline-variant/40 flex items-center gap-3">
                    <span class="w-8 h-8 rounded-full bg-primary/60 text-white text-xs font-bold flex items-center justify-center shrink-0">5j</span>
                    <div>
                      <p class="text-sm font-semibold text-on-surface">Europees Parlement</p>
                      <p class="text-xs text-on-surface-variant">Verkiezingen voor de EU</p>
                    </div>
                  </div>
                  <div class="bg-surface-container-low rounded-2xl p-3 border border-outline-variant/40 flex items-center gap-3">
                    <span class="w-8 h-8 rounded-full bg-outline text-white text-xs font-bold flex items-center justify-center shrink-0 leading-none">soms</span>
                    <div>
                      <p class="text-sm font-semibold text-on-surface">Referendum</p>
                      <p class="text-xs text-on-surface-variant">Stemmen over een onderwerp, niet een persoon</p>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Wie mag stemmen -->
              <h3 class="text-base font-bold text-on-surface mb-3 flex items-center gap-2">
                <span class="material-symbols-outlined text-primary text-[18px]" style="font-variation-settings:'FILL' 1,'wght' 400,'GRAD' 0,'opsz' 24;">person_check</span>
                Wie mag stemmen?
              </h3>
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                <div class="bg-green-50 border border-green-200 rounded-2xl p-4 flex gap-3">
                  <span class="material-symbols-outlined text-green-600 text-[20px] shrink-0" style="font-variation-settings:'FILL' 1,'wght' 400,'GRAD' 0,'opsz' 24;">check_circle</span>
                  <div>
                    <p class="text-sm font-bold text-green-900 mb-0.5">Je bent 18 jaar of ouder</p>
                    <p class="text-xs text-green-800">EN je hebt de Nederlandse nationaliteit</p>
                  </div>
                </div>
                <div class="bg-surface-container-low border border-outline-variant/40 rounded-2xl p-4 flex gap-3">
                  <span class="material-symbols-outlined text-primary text-[20px] shrink-0" style="font-variation-settings:'FILL' 1,'wght' 400,'GRAD' 0,'opsz' 24;">info</span>
                  <div>
                    <p class="text-sm font-bold text-on-surface mb-0.5">Verblijfsvergunning?</p>
                    <p class="text-xs text-on-surface-variant">Woon je 5+ jaar in NL met verblijfsvergunning? Dan mag je stemmen bij de <strong>gemeentelijke</strong> verkiezingen.</p>
                  </div>
                </div>
              </div>
              <div class="bg-amber-50 border border-amber-200 rounded-2xl p-3 flex gap-3 mb-6">
                <span class="material-symbols-outlined text-amber-600 text-[18px] shrink-0" style="font-variation-settings:'FILL' 1,'wght' 400,'GRAD' 0,'opsz' 24;">info</span>
                <p class="text-sm text-amber-900"><strong>Stemmen is niet verplicht</strong> in Nederland.</p>
              </div>

              <!-- Kiesrecht -->
              <h3 class="text-base font-bold text-on-surface mb-3">Kiesrecht</h3>
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
                <div class="bg-surface-container-low rounded-2xl p-4 border border-outline-variant/40">
                  <p class="text-xs font-bold text-primary uppercase tracking-wide mb-1">Actief kiesrecht</p>
                  <p class="text-sm text-on-surface-variant">Jij mag stemmen bij verkiezingen.</p>
                </div>
                <div class="bg-surface-container-low rounded-2xl p-4 border border-outline-variant/40">
                  <p class="text-xs font-bold text-primary uppercase tracking-wide mb-1">Passief kiesrecht</p>
                  <p class="text-sm text-on-surface-variant">Andere mensen mogen op jou stemmen — jij mag je kandidaat stellen.</p>
                </div>
              </div>

              <!-- Politieke partijen -->
              <h3 class="text-base font-bold text-on-surface mb-3">Politieke partijen</h3>
              <div class="bg-surface-container-low rounded-2xl p-4 border border-outline-variant/40">
                <p class="text-sm text-on-surface-variant leading-relaxed">Bij verkiezingen stem je op een persoon van een <strong>politieke partij</strong>. In Nederland zijn er veel partijen — elke partij vindt andere dingen belangrijk. Je stemt op de partij die jij het beste vindt. De partijen met de meeste stemmen gaan <strong>samen regeren</strong>.</p>
              </div>
            </div>
          </section>
      <!-- WIDGET:les-thema7-democratie -->`,
    },
    {
      id: "bestuur",
      icon: "gavel",
      title: "Het bestuur",
      subtitle: "Koning, ministers, Eerste en Tweede Kamer",
      contentHtml: `<section id="bestuur" class="scroll-mt-24 mb-8">
            <div class="bg-white rounded-3xl p-7 shadow-sm">
              <h2 class="text-xl sm:text-2xl font-bold text-primary mb-5 flex items-center gap-3">
                <span class="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                  <span class="material-symbols-outlined text-primary text-[18px]">domain</span>
                </span>
                Het bestuur
              </h2>

              <p class="text-on-surface-variant leading-relaxed mb-6">Nederland heeft een bestuur op <strong>drie niveaus</strong>: het rijk (het land), de provincies en de gemeenten.</p>

              <!-- Parlement -->
              <h3 class="text-base font-bold text-on-surface mb-3 flex items-center gap-2">
                <span class="w-6 h-6 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <span class="material-symbols-outlined text-primary text-[14px]">account_balance</span>
                </span>
                Het parlement
              </h3>
              <p class="text-sm text-on-surface-variant leading-relaxed mb-4">Het land wordt bestuurd door het <strong>parlement</strong> en de <strong>regering</strong>. Samen maken zij de wetten.</p>
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
                <div class="bg-primary/5 border border-primary/15 rounded-2xl p-4">
                  <div class="flex items-center gap-2 mb-2">
                    <span class="text-2xl font-black text-primary" style="font-family:'Manrope',sans-serif;">150</span>
                    <span class="text-sm font-bold text-primary">Tweede Kamer</span>
                  </div>
                  <p class="text-xs text-on-surface-variant leading-relaxed">Gekozen door de inwoners bij verkiezingen. De Tweede Kamer en de regering <strong>bedenken en maken</strong> de wetten.</p>
                </div>
                <div class="bg-surface-container-low border border-outline-variant/40 rounded-2xl p-4">
                  <div class="flex items-center gap-2 mb-2">
                    <span class="text-2xl font-black text-on-surface-variant" style="font-family:'Manrope',sans-serif;">75</span>
                    <span class="text-sm font-bold text-on-surface">Eerste Kamer</span>
                  </div>
                  <p class="text-xs text-on-surface-variant leading-relaxed">Gekozen door de leden van de Provinciale Staten. De Eerste Kamer <strong>controleert</strong> de wetten.</p>
                </div>
              </div>

              <!-- Regering -->
              <h3 class="text-base font-bold text-on-surface mb-3 flex items-center gap-2">
                <span class="w-6 h-6 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <span class="material-symbols-outlined text-primary text-[14px]">groups</span>
                </span>
                De regering
              </h3>
              <div class="bg-surface-container-low rounded-2xl p-4 border border-outline-variant/40 mb-6">
                <p class="text-sm text-on-surface-variant leading-relaxed">Na de verkiezingen maakt de grootste partij samen met anderen een <strong>regering</strong>. Ze kiezen de <strong>ministers</strong> — elke minister gaat over één onderwerp (bijv. onderwijs, zorg). De baas van de regering is de <strong>minister-president</strong>.</p>
                <p class="text-xs text-on-surface-variant mt-2 italic">Let op: de regering wordt ook wel het <strong>kabinet</strong> genoemd, maar dat is niet hetzelfde.</p>
              </div>

              <!-- Koning -->
              <h3 class="text-base font-bold text-on-surface mb-3 flex items-center gap-2">
                <span class="w-6 h-6 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <span class="material-symbols-outlined text-primary text-[14px]">king</span>
                </span>
                De koning
              </h3>
              <div class="bg-surface-container-low rounded-2xl p-4 border border-outline-variant/40 mb-4">
                <p class="text-sm text-on-surface-variant leading-relaxed mb-3">Nederland heet officieel het <em>Koninkrijk der Nederlanden</em>. Sinds <strong>30 april 2013</strong> is <strong>Willem-Alexander</strong> de koning, getrouwd met koningin Máxima. Ze hebben drie dochters.</p>
                <p class="text-sm text-on-surface-variant leading-relaxed">De koning hoort bij de regering maar heeft <strong>niet veel macht</strong>. Hij praat met ministers en ondertekent alle nieuwe wetten.</p>
              </div>
              <div class="bg-blue-50 border border-blue-200 rounded-2xl p-4 mb-6 flex gap-3">
                <span class="material-symbols-outlined text-blue-600 text-[20px] shrink-0" style="font-variation-settings:'FILL' 1,'wght' 400,'GRAD' 0,'opsz' 24;">event</span>
                <div>
                  <p class="text-sm font-bold text-blue-900 mb-1">Prinsjesdag — derde dinsdag van september</p>
                  <p class="text-xs text-blue-800 leading-relaxed">De koning leest in Den Haag de <strong>Troonrede</strong> voor: de plannen van de regering voor het volgende jaar. De ministers schrijven de tekst.</p>
                </div>
              </div>

              <!-- Koningsdag + Wilhelmus -->
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div class="bg-orange-50 border border-orange-200 rounded-2xl p-4">
                  <p class="text-sm font-bold text-orange-900 mb-2">🟠 Koningsdag — 27 april</p>
                  <p class="text-sm text-orange-800 leading-relaxed">De koning is jarig. Mensen zijn vrij, dragen <strong>oranje</strong> kleding en er zijn markten op straat.</p>
                </div>
                <div class="bg-surface-container-low border border-outline-variant/40 rounded-2xl p-4">
                  <p class="text-sm font-bold text-on-surface mb-2">🎵 Het Wilhelmus</p>
                  <p class="text-sm text-on-surface-variant leading-relaxed">Het Nederlandse volkslied. Gaat over Willem van Oranje (16e eeuw). Heeft 15 delen — meestal wordt alleen het eerste deel gezongen.</p>
                </div>
              </div>
            </div>
          </section>
      <!-- WIDGET:les-thema7-bestuur -->`,
    },
    {
      id: "machtenscheiding",
      icon: "balance",
      title: "De machtenscheiding",
      subtitle: "Wetgevende, uitvoerende en rechterlijke macht",
      contentHtml: `<section id="machtenscheiding" class="scroll-mt-24 mb-8">
            <div class="bg-white rounded-3xl p-7 shadow-sm">
              <h2 class="text-xl sm:text-2xl font-bold text-primary mb-5 flex items-center gap-3">
                <span class="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                  <span class="material-symbols-outlined text-primary text-[18px]">balance</span>
                </span>
                De machtenscheiding
              </h2>

              <p class="text-on-surface-variant leading-relaxed mb-6">
                In Nederland heeft niet één persoon of groep alle macht. Er is <strong>machtenscheiding</strong>. De drie machten controleren elkaar — zo kan niemand te veel macht krijgen.
              </p>

              <!-- 3 machten -->
              <div class="space-y-4 mb-6">
                <div class="bg-blue-50 border border-blue-200 rounded-2xl p-4">
                  <div class="flex items-start gap-3">
                    <span class="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center shrink-0">
                      <span class="material-symbols-outlined text-blue-700 text-[20px]" style="font-variation-settings:'FILL' 1,'wght' 400,'GRAD' 0,'opsz' 24;">edit_document</span>
                    </span>
                    <div>
                      <p class="text-sm font-bold text-blue-900 mb-1">Wetgevende macht</p>
                      <p class="text-sm text-blue-800 leading-relaxed">Het <strong>parlement</strong> en de <strong>regering</strong> maken samen de wetten. De Tweede Kamer bedenkt ze, de Eerste Kamer controleert ze.</p>
                    </div>
                  </div>
                </div>
                <div class="bg-green-50 border border-green-200 rounded-2xl p-4">
                  <div class="flex items-start gap-3">
                    <span class="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center shrink-0">
                      <span class="material-symbols-outlined text-green-700 text-[20px]" style="font-variation-settings:'FILL' 1,'wght' 400,'GRAD' 0,'opsz' 24;">settings</span>
                    </span>
                    <div>
                      <p class="text-sm font-bold text-green-900 mb-1">Uitvoerende macht</p>
                      <p class="text-sm text-green-800 leading-relaxed">De <strong>regering</strong> voert de wetten uit. Het parlement controleert of dat goed gaat.</p>
                    </div>
                  </div>
                </div>
                <div class="bg-purple-50 border border-purple-200 rounded-2xl p-4">
                  <div class="flex items-start gap-3">
                    <span class="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center shrink-0">
                      <span class="material-symbols-outlined text-purple-700 text-[20px]" style="font-variation-settings:'FILL' 1,'wght' 400,'GRAD' 0,'opsz' 24;">gavel</span>
                    </span>
                    <div>
                      <p class="text-sm font-bold text-purple-900 mb-1">Rechterlijke macht</p>
                      <p class="text-sm text-purple-800 leading-relaxed">De <strong>rechters</strong> en officieren van justitie controleren of iedereen zich aan de wet houdt. Ze geven straf of een boete. Naar de rechter luisteren is verplicht. Ben je het niet eens? Dan kun je <strong>in hoger beroep</strong> gaan — een hogere rechter kijkt er opnieuw naar.</p>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Rechtsstaat + corruptie -->
              <div class="bg-surface-container-low rounded-2xl p-4 border border-outline-variant/40">
                <p class="text-sm font-bold text-on-surface mb-2">Democratische rechtsstaat</p>
                <p class="text-sm text-on-surface-variant leading-relaxed mb-3">Nederland is een <strong>democratische rechtsstaat</strong>: de wetten gelden voor <em>iedereen</em>, ook voor de overheid en de politie. Zo kan niemand te veel macht krijgen.</p>
                <div class="flex gap-2 items-start">
                  <span class="material-symbols-outlined text-red-500 text-[16px] shrink-0 mt-0.5" style="font-variation-settings:'FILL' 1,'wght' 400,'GRAD' 0,'opsz' 24;">warning</span>
                  <p class="text-sm text-on-surface-variant"><strong>Corruptie</strong> — de macht op een slechte manier gebruiken — is in Nederland <strong>strafbaar</strong>. De machtenscheiding vermindert de kans erop.</p>
                </div>
              </div>
            </div>
          </section>
      <!-- WIDGET:les-thema7-machtenscheiding -->`,
    },
    {
      id: "wetten",
      icon: "policy",
      title: "De wetten",
      subtitle: "Rechten, plichten, grondrechten en de rechtsstaat",
      contentHtml: `<section id="wetten" class="scroll-mt-24 mb-8">
            <div class="bg-white rounded-3xl p-7 shadow-sm">
              <h2 class="text-xl sm:text-2xl font-bold text-primary mb-5 flex items-center gap-3">
                <span class="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                  <span class="material-symbols-outlined text-primary text-[18px]">gavel</span>
                </span>
                De wetten
              </h2>

              <p class="text-on-surface-variant leading-relaxed mb-6">
                In Nederland zijn er veel wetten en regels. De belangrijkste staan in de <strong>Grondwet</strong>. Rond 1960 werden vrijheid en gelijkheid steeds belangrijker voor Nederlanders. Daar zijn wetten over gemaakt.
              </p>

              <!-- Artikel 1 -->
              <div class="bg-primary rounded-2xl p-5 mb-6 text-white">
                <p class="text-xs font-bold uppercase tracking-wider opacity-70 mb-2">Artikel 1 — De belangrijkste wet</p>
                <p class="text-base font-bold leading-relaxed font-headline italic">"Iedereen die in Nederland is, heeft recht op een gelijke behandeling."</p>
                <p class="text-sm opacity-80 mt-2 leading-relaxed">Je mag iemand niet anders behandelen om zijn religie, stem, land van herkomst, geslacht of een andere reden. Ongelijke behandeling heet <strong>discriminatie</strong> — dat is strafbaar.</p>
              </div>

              <!-- Zelfbeschikkingsrecht -->
              <h3 class="text-base font-bold text-on-surface mb-3 flex items-center gap-2">
                <span class="material-symbols-outlined text-primary text-[18px]" style="font-variation-settings:'FILL' 1,'wght' 400,'GRAD' 0,'opsz' 24;">self_improvement</span>
                Zelfbeschikkingsrecht
              </h3>
              <p class="text-sm text-on-surface-variant leading-relaxed mb-3">Nederlanders vinden het belangrijk dat je zelf kiest hoe je leeft. Daarom staan er wetten over in de Grondwet:</p>
              <div class="space-y-2 mb-6">
                <div class="flex gap-3 p-3 bg-surface-container-low rounded-xl border border-outline-variant/40">
                  <span class="material-symbols-outlined text-primary text-[18px] shrink-0 mt-0.5" style="font-variation-settings:'FILL' 1,'wght' 400,'GRAD' 0,'opsz' 24;">favorite</span>
                  <p class="text-sm text-on-surface-variant">Je mag zelf kiezen of en met wie je trouwt — ook met iemand van hetzelfde geslacht.</p>
                </div>
                <div class="flex gap-3 p-3 bg-surface-container-low rounded-xl border border-outline-variant/40">
                  <span class="material-symbols-outlined text-primary text-[18px] shrink-0 mt-0.5" style="font-variation-settings:'FILL' 1,'wght' 400,'GRAD' 0,'opsz' 24;">medical_services</span>
                  <p class="text-sm text-on-surface-variant">Een vrouw mag zelf beslissen over een <strong>abortus</strong> (mag tot de 24e week van de zwangerschap).</p>
                </div>
                <div class="flex gap-3 p-3 bg-surface-container-low rounded-xl border border-outline-variant/40">
                  <span class="material-symbols-outlined text-primary text-[18px] shrink-0 mt-0.5" style="font-variation-settings:'FILL' 1,'wght' 400,'GRAD' 0,'opsz' 24;">elderly</span>
                  <p class="text-sm text-on-surface-variant">Iemand die heel ziek is, mag kiezen voor <strong>euthanasie</strong> met hulp van een arts. Er zijn regels voor.</p>
                </div>
                <div class="flex gap-3 p-3 bg-surface-container-low rounded-xl border border-outline-variant/40">
                  <span class="material-symbols-outlined text-primary text-[18px] shrink-0 mt-0.5" style="font-variation-settings:'FILL' 1,'wght' 400,'GRAD' 0,'opsz' 24;">church</span>
                  <p class="text-sm text-on-surface-variant"><strong>Godsdienstvrijheid</strong>: je kiest zelf je religie, of geen. De overheid mag dat niet bepalen.</p>
                </div>
                <div class="flex gap-3 p-3 bg-red-50 rounded-xl border border-red-200">
                  <span class="material-symbols-outlined text-red-500 text-[18px] shrink-0 mt-0.5" style="font-variation-settings:'FILL' 1,'wght' 400,'GRAD' 0,'opsz' 24;">block</span>
                  <p class="text-sm text-red-800">Dingen die strafbaar zijn, mogen <strong>nooit</strong> — ook niet als ze bij jouw religie horen (bijv. besnijdenis bij meisjes, eerwraak).</p>
                </div>
              </div>

              <!-- Vrijheid van meningsuiting + Privacy -->
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div class="bg-surface-container-low rounded-2xl p-4 border border-outline-variant/40">
                  <div class="flex items-center gap-2 mb-2">
                    <span class="material-symbols-outlined text-primary text-[18px]" style="font-variation-settings:'FILL' 1,'wght' 400,'GRAD' 0,'opsz' 24;">record_voice_over</span>
                    <p class="text-sm font-bold text-on-surface">Vrijheid van meningsuiting</p>
                  </div>
                  <p class="text-sm text-on-surface-variant leading-relaxed">Iedereen mag zijn eigen mening hebben en geven. Maar je mag <strong>niet</strong> discrimineren of anderen aanzetten tot geweld — dat is strafbaar.</p>
                </div>
                <div class="bg-surface-container-low rounded-2xl p-4 border border-outline-variant/40">
                  <div class="flex items-center gap-2 mb-2">
                    <span class="material-symbols-outlined text-primary text-[18px]" style="font-variation-settings:'FILL' 1,'wght' 400,'GRAD' 0,'opsz' 24;">lock</span>
                    <p class="text-sm font-bold text-on-surface">Privacy</p>
                  </div>
                  <p class="text-sm text-on-surface-variant leading-relaxed mb-3">Organisaties mogen alleen noodzakelijke informatie vragen en geen gegevens delen zonder toestemming. Je mag altijd zien welke gegevens de overheid van jou heeft.</p>
                  <div class="bg-red-50 border border-red-200 rounded-xl p-3">
                    <p class="text-xs font-bold text-red-800 mb-1">BSN — burgerservicenummer</p>
                    <p class="text-xs text-red-800 leading-relaxed">Je <strong>BSN</strong> is privéinformatie. Alleen instanties die dit <strong>wettelijk mogen vragen</strong> — zoals je werkgever, de huisarts en de Belastingdienst — mogen ernaar vragen. Winkels, particulieren en websites mogen je BSN <strong>niet</strong> vragen.</p>
                  </div>
                </div>
              </div>
            </div>
          </section>
      <!-- WIDGET:les-thema7-wetten -->`,
    },
  ],
};
