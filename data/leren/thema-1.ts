/**
 * GENERATED — do not edit by hand.
 *
 * Written by scripts/knm-content/generate-leren-data.mjs from the KNM production
 * `leren_content` table. Edit a section in /admin and re-run the exporter + generator;
 * editing this file instead is a change that the next run silently reverts.
 */
import type { LerenThema } from './types';

export const thema: LerenThema = {
  id: 1,
  slug: "thema-1-geschiedenis-en-geografie",
  title: "Geschiedenis en Geografie",
  description: "Nederland heeft een rijke geschiedenis die nog steeds zichtbaar is in het dagelijks leven. In dit thema leer je alles wat het KNM-examen verwacht: van de kaart van Nederland en het openbaar vervoer tot de Gouden Eeuw, het koloniale verleden en de Tweede Wereldoorlog.",
  quizCategory: "Geschiedenis en Geografie",
  sections: [
    {
      id: "kaart",
      icon: "map",
      title: "De kaart van Nederland",
      subtitle: "12 provincies, hoofdsteden en het verschil tussen Amsterdam en Den Haag",
      contentHtml: `<section id="kaart" class="scroll-mt-24 mb-8">
        <div class="bg-white rounded-3xl p-7 shadow-sm mb-5">
          <h2 class="text-xl sm:text-2xl font-bold text-primary mb-5 flex items-center gap-3">
            <span class="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
              <span class="material-symbols-outlined text-primary text-[18px]">map</span>
            </span>
            De kaart van Nederland
          </h2>
          <p class="text-on-surface-variant leading-relaxed mb-5">
            Nederland heeft <strong class="text-on-surface">twaalf provincies</strong>. Elke provincie heeft een eigen hoofdstad — de belangrijkste stad van die provincie.
          </p>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div class="bg-primary/5 border border-primary/15 rounded-2xl p-4">
              <p class="text-[10px] font-bold text-primary uppercase tracking-widest mb-1.5">Officiële hoofdstad</p>
              <p class="font-bold text-on-surface text-sm">Amsterdam</p>
              <p class="text-xs text-on-surface-variant mt-0.5">Koningshuis en officiële zetel</p>
            </div>
            <div class="bg-secondary-container/15 border border-secondary-container/40 rounded-2xl p-4">
              <p class="text-[10px] font-bold text-secondary uppercase tracking-widest mb-1.5">Zetel van de regering</p>
              <p class="font-bold text-on-surface text-sm">Den Haag</p>
              <p class="text-xs text-on-surface-variant mt-0.5">De Tweede Kamer, ministeries, ministers en rechtbanken zijn gevestigd in Den Haag.</p>
            </div>
          </div>
        </div>
      </section><!-- WIDGET:netherlands-map --><p></p>`,
    },
    {
      id: "ov",
      icon: "train",
      title: "Het openbaar vervoer",
      subtitle: "Hoe het OV werkt, inchecken en uitchecken, en de OV-chipkaart",
      contentHtml: `<!-- WIDGET:ov-reis --><p></p>`,
    },
    {
      id: "water",
      icon: "water",
      title: "Nederland en het water",
      subtitle: "Dijken, polders, de Deltawerken en de strijd tegen het water",
      contentHtml: `<section id="water" class="scroll-mt-24 mb-8">
        <div class="flex flex-col gap-4">
          <div class="bg-white rounded-3xl p-7 shadow-sm">
            <h2 class="text-xl sm:text-2xl font-bold text-primary mb-4 flex items-center gap-3">
              <span class="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                <span class="material-symbols-outlined text-primary text-[18px]">water</span>
              </span>
              Nederland en het water
            </h2>
            <p class="text-on-surface-variant leading-relaxed mb-4">
              De naam 'Nederland' betekent letterlijk <strong class="text-on-surface">'laag land'</strong>. Een groot deel van Nederland ligt <em>lager dan de zeespiegel</em>. Zonder bescherming zou het land overstromen.
            </p>
            <p class="text-on-surface-variant leading-relaxed mb-5">
              We gebruiken <strong class="text-on-surface">dijken</strong> en <strong class="text-on-surface">duinen</strong> als bescherming. Nederlanders maakten ook nieuw land van water — dit heet een <strong class="text-on-surface">polder</strong>. Vroeger gebruikten ze windmolens om het water weg te pompen. Je vindt veel polders in <strong class="text-on-surface">Noord-Holland en Flevoland</strong>.
            </p>

            <div class="grid grid-cols-2 gap-3">
              <div class="bg-surface-container-low rounded-2xl p-4 border-l-4 border-primary">
                <p class="text-xs font-bold text-primary uppercase tracking-wide mb-1">De Deltawerken</p>
                <p class="text-xs text-on-surface-variant leading-relaxed">Gebouwd na 1953 om Zeeland en Zuid-Holland te beschermen tegen overstromingen.</p>
              </div>
              <div class="bg-surface-container-low rounded-2xl p-4 border-l-4 border-primary">
                <p class="text-xs font-bold text-primary uppercase tracking-wide mb-1">De Afsluitdijk</p>
                <p class="text-xs text-on-surface-variant leading-relaxed">De grootste dijk van Nederland — van Noord-Holland naar Friesland. Beschermt Nederland tegen het water van de Waddenzee.</p>
              </div>
            </div>
          </div>

          <div class="bg-secondary rounded-3xl p-5 text-white flex items-start gap-4">
            <span class="material-symbols-outlined text-[28px] opacity-80 shrink-0 mt-0.5">warning</span>
            <div>
              <p class="text-[10px] font-bold uppercase tracking-widest opacity-75 mb-1">Datum om te onthouden</p>
              <p class="text-lg font-extrabold mb-1">1953 — De Watersnoodramp</p>
              <p class="text-sm text-white/85 leading-relaxed">Een zware storm brak de dijken door. Meer dan <strong>1.800 mensen</strong> kwamen om het leven. Dit leidde direct tot de bouw van de Deltawerken.</p>
            </div>
          </div>
        </div>
      </section>
      <!-- WIDGET:netherlands-map -->`,
    },
    {
      id: "gouden-eeuw",
      icon: "sailing",
      title: "De Gouden Eeuw",
      subtitle: "De VOC, handel, rijkdom en de bloeiperiode van de Republiek",
      contentHtml: `<section id="gouden-eeuw" class="scroll-mt-24 mb-8">
        <div class="bg-white rounded-3xl p-7 shadow-sm">
          <h2 class="text-xl sm:text-2xl font-bold text-primary mb-4 flex items-center gap-3">
            <span class="w-9 h-9 rounded-xl bg-amber-100 flex items-center justify-center shrink-0">
              <span class="material-symbols-outlined text-amber-600 text-[18px]">sailing</span>
            </span>
            De zeventiende eeuw — De Gouden Eeuw
          </h2>
          <p class="text-on-surface-variant leading-relaxed mb-4">
            In de <strong class="text-on-surface">17e eeuw (1600–1700)</strong> werd Nederland heel rijk door handel. Schepen haalden peper, koffie, thee, suiker, cacao en tabak uit Azië en Amerika.
          </p>
          <p class="text-on-surface-variant leading-relaxed mb-5">
            Rijke Nederlanders bouwden grote <strong class="text-on-surface">grachtenpanden</strong> in steden zoals Amsterdam. Een bekende kunstenaar was <strong class="text-on-surface">Rembrandt van Rijn</strong>. Zijn bekendste schilderij is <em>De Nachtwacht</em>. Dit schilderij hangt in het <strong class="text-on-surface">Rijksmuseum in Amsterdam</strong>.
          </p>

          <div class="bg-primary rounded-2xl p-5 text-white mb-4">
            <div class="flex items-start gap-3">
              <span class="material-symbols-outlined text-white/80 shrink-0 mt-0.5">business_center</span>
              <div>
                <p class="text-[10px] font-bold uppercase tracking-widest opacity-75 mb-1">Belangrijk bedrijf</p>
                <p class="font-extrabold text-base mb-1">VOC — Vereenigde Oost-Indische Compagnie</p>
                <p class="text-sm text-white/85 leading-relaxed">De VOC was heel bekend. Veel schepen van de VOC gingen naar het oosten (Azië). Andere schepen gingen naar het westen (Amerika).</p>
              </div>
            </div>
          </div>

          <div class="bg-surface-container-low border border-outline-variant/40 rounded-2xl p-4 flex gap-3">
            <span class="material-symbols-outlined text-on-surface-variant text-[18px] shrink-0 mt-0.5">info</span>
            <p class="text-sm text-on-surface-variant leading-relaxed">
              <strong class="text-on-surface">De andere kant:</strong> Bij de handel werd ook veel geweld gebruikt. Mensen in koloniën moesten hard werken voor de Nederlanders zonder betaling.
            </p>
          </div>
        </div>
      </section>
      <!-- WIDGET:lesson-audio -->`,
    },
    {
      id: "kolonien",
      icon: "public",
      title: "De koloniën en slavernij",
      subtitle: "Het koloniale verleden, slavernij en Keti Koti als herdenkingsdag",
      contentHtml: `<section id="kolonien" class="scroll-mt-24 mb-8">
        <div class="bg-white rounded-3xl p-7 shadow-sm">
          <h2 class="text-xl sm:text-2xl font-bold text-primary mb-4 flex items-center gap-3">
            <span class="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
              <span class="material-symbols-outlined text-primary text-[18px]">public</span>
            </span>
            De koloniën en slavernij
          </h2>
          <p class="text-on-surface-variant leading-relaxed mb-4">
            Nederland had vroeger koloniën: <strong class="text-on-surface">Nederlands-Indië</strong>, <strong class="text-on-surface">Suriname</strong> en de <strong class="text-on-surface">Nederlandse Antillen</strong>. Nederlanders kochten mensen in Afrika en brachten ze naar de koloniën. Daar moesten die mensen op <strong class="text-on-surface">plantages</strong> werken. Ze kregen geen geld en werden vaak mishandeld. Veel mensen gingen dood. In 1863 werd de slavernij verboden. Maar de tot slaaf gemaakte mensen moesten nog tien jaar op de plantages blijven werken. Pas daarna waren ze echt vrij.
          </p>

          <!-- Driehoekshandel -->
          <div class="bg-surface-container-low border border-outline-variant/30 rounded-2xl p-5 mb-6 flex gap-3">
            <span class="material-symbols-outlined text-on-surface-variant shrink-0 mt-0.5">route</span>
            <div>
              <p class="text-xs font-bold text-on-surface uppercase tracking-wide mb-1">De driehoekshandel</p>
              <p class="text-sm text-on-surface-variant leading-relaxed">Handel tussen Nederland, Afrika en Amerika in de 17e–18e eeuw. Schepen voeren in een driehoek tussen de drie werelddelen: goederen naar Afrika, mensen naar Amerika, producten terug naar Nederland.</p>
            </div>
          </div>

          <!-- Date timeline -->
          <div class="space-y-0">

            <div class="flex gap-4">
              <div class="flex flex-col items-center">
                <div class="w-3 h-3 rounded-full bg-secondary flex-shrink-0 mt-1.5" style="box-shadow:0 0 0 3px white,0 0 0 4px rgba(162,64,0,0.25);"></div>
                <div class="w-0.5 bg-primary/15 flex-1 mt-1.5"></div>
              </div>
              <div class="pb-5 flex-1 min-w-0">
                <p class="text-[10px] font-bold text-secondary uppercase tracking-widest mb-1.5">1 juli 1863 — Keti Koti</p>
                <div class="bg-secondary-container/10 border border-secondary-container/30 rounded-2xl p-4">
                  <p class="text-sm font-semibold text-on-surface mb-1">Slavernij afgeschaft</p>
                  <p class="text-xs text-on-surface-variant leading-relaxed">Elk jaar herdacht op 1 juli. De naam komt uit Suriname en betekent 'ketenen gebroken'. In Suriname is dit een nationale feestdag.</p>
                </div>
              </div>
            </div>

            <div class="flex gap-4">
              <div class="flex flex-col items-center">
                <div class="w-3 h-3 rounded-full bg-primary flex-shrink-0 mt-1.5" style="box-shadow:0 0 0 3px white,0 0 0 4px rgba(0,43,109,0.25);"></div>
                <div class="w-0.5 bg-primary/15 flex-1 mt-1.5"></div>
              </div>
              <div class="pb-5 flex-1 min-w-0">
                <p class="text-[10px] font-bold text-primary uppercase tracking-widest mb-1.5">1945 — Indonesië</p>
                <div class="bg-primary/5 border border-primary/15 rounded-2xl p-4">
                  <p class="text-sm font-semibold text-on-surface mb-1">Onafhankelijkheid</p>
                  <p class="text-xs text-on-surface-variant leading-relaxed">Nederlands-Indië werd onafhankelijk als Indonesië.</p>
                </div>
              </div>
            </div>

            <div class="flex gap-4">
              <div class="flex flex-col items-center">
                <div class="w-3 h-3 rounded-full bg-primary flex-shrink-0 mt-1.5" style="box-shadow:0 0 0 3px white,0 0 0 4px rgba(0,43,109,0.25);"></div>
              </div>
              <div class="pb-1 flex-1 min-w-0">
                <p class="text-[10px] font-bold text-primary uppercase tracking-widest mb-1.5">1975 — Suriname</p>
                <div class="bg-primary/5 border border-primary/15 rounded-2xl p-4">
                  <p class="text-sm font-semibold text-on-surface mb-1">Suriname onafhankelijk</p>
                  <p class="text-xs text-on-surface-variant leading-relaxed">Suriname werd een onafhankelijk land. De Nederlandse Antillen zijn nu geen koloniën meer (sinds 1954). Drie eilanden zijn nu zelfstandige landen. Drie andere eilanden zijn bijzondere gemeenten van Nederland.</p>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>
      <!-- WIDGET:lesson-audio -->`,
    },
    {
      id: "woii",
      icon: "history_edu",
      title: "De Tweede Wereldoorlog",
      subtitle: "Bezetting, de Holocaust, 4 en 5 mei en de Hongerwinter",
      contentHtml: `<section id="woii" class="scroll-mt-24 mb-8">
        <div class="bg-white rounded-3xl p-7 shadow-sm">
          <h2 class="text-xl sm:text-2xl font-bold text-primary mb-5 flex items-center gap-3">
            <span class="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
              <span class="material-symbols-outlined text-primary text-[18px]">history_edu</span>
            </span>
            De Tweede Wereldoorlog — Nederland 1940–1945
          </h2>
          <p class="text-on-surface-variant leading-relaxed mb-4">
            De Tweede Wereldoorlog duurde in Nederland van <strong class="text-on-surface">1940 tot 1945</strong>. In Duitsland was <strong class="text-on-surface">Adolf Hitler</strong> de baas. Hij wilde één groot land. Daarom bezette hij veel Europese landen, ook Nederland.
          </p>
          <p class="text-on-surface-variant leading-relaxed mb-6">
            Het leven voor <strong class="text-on-surface">Joden</strong> werd steeds moeilijker. Hitler gaf Joden de schuld van alle problemen. Sommige Joden vluchtten of gingen onderduiken. Maar veel Joden werden gevangen genomen en naar <strong class="text-on-surface">concentratiekampen</strong> in Duitsland en Polen gebracht. In de oorlog werden bijna <strong class="text-on-surface">6 miljoen Europese Joden vermoord</strong>. Dit heet de <strong class="text-on-surface">Holocaust</strong>. Een bekend voorbeeld is het joodse meisje <strong class="text-on-surface">Anne Frank</strong>. Zij moest met haar familie onderduiken in Amsterdam. Later is ze in een concentratiekamp overleden.
          </p>

          <!-- Timeline -->
          <div class="space-y-0 mb-6">

            <div class="flex gap-4">
              <div class="flex flex-col items-center">
                <div class="w-3 h-3 rounded-full bg-secondary flex-shrink-0 mt-1.5" style="box-shadow:0 0 0 3px white,0 0 0 4px rgba(162,64,0,0.25);"></div>
                <div class="w-0.5 bg-primary/15 flex-1 mt-1.5"></div>
              </div>
              <div class="pb-5 flex-1 min-w-0">
                <p class="text-[10px] font-bold text-secondary uppercase tracking-widest mb-1.5">10 mei 1940</p>
                <div class="bg-surface-container-low rounded-2xl p-4">
                  <p class="text-sm font-semibold text-on-surface mb-0.5">Duitsland valt Nederland binnen</p>
                  <p class="text-xs text-on-surface-variant">Begin van de vijfjarige bezetting.</p>
                </div>
              </div>
            </div>

            <div class="flex gap-4">
              <div class="flex flex-col items-center">
                <div class="w-3 h-3 rounded-full bg-secondary flex-shrink-0 mt-1.5" style="box-shadow:0 0 0 3px white,0 0 0 4px rgba(162,64,0,0.25);"></div>
                <div class="w-0.5 bg-primary/15 flex-1 mt-1.5"></div>
              </div>
              <div class="pb-5 flex-1 min-w-0">
                <p class="text-[10px] font-bold text-secondary uppercase tracking-widest mb-1.5">14 mei 1940</p>
                <div class="bg-surface-container-low rounded-2xl p-4">
                  <p class="text-sm font-semibold text-on-surface mb-0.5">Bombardement Rotterdam</p>
                  <p class="text-xs text-on-surface-variant">Het Duitse leger gooit bommen op Rotterdam. 800 mensen worden gedood. Na een kwartier is de stad kapot. Nederland stopt met vechten.</p>
                </div>
              </div>
            </div>

            <div class="flex gap-4">
              <div class="flex flex-col items-center">
                <div class="w-3 h-3 rounded-full bg-primary/60 flex-shrink-0 mt-1.5" style="box-shadow:0 0 0 3px white,0 0 0 4px rgba(0,43,109,0.2);"></div>
                <div class="w-0.5 bg-primary/15 flex-1 mt-1.5"></div>
              </div>
              <div class="pb-5 flex-1 min-w-0">
                <p class="text-[10px] font-bold text-primary/70 uppercase tracking-widest mb-1.5">Winter 1944–1945</p>
                <div class="bg-surface-container-low rounded-2xl p-4">
                  <p class="text-sm font-semibold text-on-surface mb-0.5">De Hongerwinter</p>
                  <p class="text-xs text-on-surface-variant">Bijna geen eten in West-Nederland. Duizenden mensen stierven van honger.</p>
                </div>
              </div>
            </div>

            <div class="flex gap-4">
              <div class="flex flex-col items-center">
                <div class="w-3 h-3 rounded-full bg-primary flex-shrink-0 mt-1.5" style="box-shadow:0 0 0 3px white,0 0 0 4px rgba(0,43,109,0.3);"></div>
              </div>
              <div class="pb-1 flex-1 min-w-0">
                <p class="text-[10px] font-bold text-primary uppercase tracking-widest mb-1.5">5 mei 1945</p>
                <div class="bg-surface-container-low rounded-2xl p-4">
                  <p class="text-sm font-semibold text-on-surface mb-0.5">Bevrijding</p>
                  <p class="text-xs text-on-surface-variant">Nederland bevrijd door de geallieerden: Amerika, Canada en Engeland.</p>
                </div>
              </div>
            </div>

          </div>

          <!-- 4 mei + 5 mei -->
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div class="bg-slate-900 text-white rounded-2xl p-5">
              <p class="text-2xl mb-2">🕯️</p>
              <p class="font-extrabold text-base">4 mei — Dodenherdenking</p>
              <p class="text-sm text-white/75 mt-1.5 leading-relaxed">De vlag hangt <strong class="text-white">halfstok</strong>. Om 20:00 uur zijn we <strong class="text-white">2 minuten stil</strong>. We herdenken alle slachtoffers van de Tweede Wereldoorlog.</p>
            </div>
            <div class="bg-primary text-white rounded-2xl p-5">
              <p class="text-2xl mb-2">🇳🇱</p>
              <p class="font-extrabold text-base">5 mei — Bevrijdingsdag</p>
              <p class="text-sm text-white/75 mt-1.5 leading-relaxed">We vieren dat we in <strong class="text-white">vrijheid</strong> leven. De vlag hangt bovenaan. Er is feest met muziek en <strong class="text-white">vrijmarkten</strong>.</p>
            </div>
          </div>

          <!-- Nationale symbolen -->
          <div class="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div class="bg-surface-container-low border border-outline-variant/40 rounded-2xl p-4 flex gap-3">
              <span class="text-2xl shrink-0">🎵</span>
              <div>
                <p class="text-sm font-bold text-on-surface">Het Wilhelmus — het volkslied</p>
                <p class="text-xs text-on-surface-variant mt-1 leading-relaxed">Het <strong class="text-on-surface">Wilhelmus</strong> is het nationale volkslied van Nederland. Het dateert uit de <strong class="text-on-surface">16e eeuw</strong> en is een van de oudste volksliederen ter wereld. Het Wilhelmus wordt gezongen bij officiële gelegenheden, zoals bij sportevenementen.</p>
              </div>
            </div>
            <div class="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex gap-3">
              <span class="material-symbols-outlined text-amber-500 text-[18px] shrink-0 mt-0.5">gavel</span>
              <p class="text-sm text-amber-900 leading-relaxed">
                <strong>Na de oorlog:</strong> Nederland maakte een nieuwe wet: antisemitisme is strafbaar. Het is verboden om Joden te discrimineren.
              </p>
            </div>
          </div>
        </div>
      </section>
      <!-- WIDGET:lesson-audio -->`,
    },
    {
      id: "na-de-oorlog",
      icon: "diversity_3",
      title: "Na de oorlog",
      subtitle: "Wederopbouw, de verzorgingsstaat, immigratie en de multiculturele samenleving",
      contentHtml: `<section id="na-de-oorlog" class="scroll-mt-24 mb-8">
        <div class="flex flex-col gap-4">
          <div class="bg-white rounded-3xl p-7 shadow-sm">
            <h2 class="text-xl sm:text-2xl font-bold text-primary mb-4 flex items-center gap-3">
              <span class="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                <span class="material-symbols-outlined text-primary text-[18px]">groups</span>
              </span>
              Na de oorlog: Nieuwe Nederlanders
            </h2>
            <p class="text-on-surface-variant leading-relaxed mb-5">
              Na de oorlog waren veel huizen, wegen en bruggen kapot. Er was veel werk in Nederland, maar te weinig mensen. Daarom kwamen er verschillende groepen mensen naar Nederland. Vandaag heeft Nederland een <strong class="text-on-surface">diverse, multiculturele samenleving</strong>.
            </p>

            <div class="space-y-2.5">
              <div class="flex gap-3 bg-surface-container-low rounded-2xl p-4">
                <span class="material-symbols-outlined text-primary shrink-0 text-[20px]">work</span>
                <div>
                  <p class="text-sm font-bold text-on-surface">Gastarbeiders (arbeidsmigranten)</p>
                  <p class="text-xs text-on-surface-variant mt-0.5">In de jaren '60 en '70 kwamen veel mensen uit Turkije en Marokko naar Nederland om te werken. Ze werden <strong class="text-on-surface">gastarbeiders</strong> (arbeidsmigranten) genoemd. De bedoeling was dat ze tijdelijk bleven, maar veel gastarbeiders vestigden zich permanent in Nederland samen met hun gezinnen.</p>
                </div>
              </div>
              <div class="flex gap-3 bg-surface-container-low rounded-2xl p-4">
                <span class="material-symbols-outlined text-primary shrink-0 text-[20px]">family_restroom</span>
                <div>
                  <p class="text-sm font-bold text-on-surface">Gezinshereniging</p>
                  <p class="text-xs text-on-surface-variant mt-0.5">De families van arbeiders kwamen later ook naar Nederland.</p>
                </div>
              </div>
              <div class="flex gap-3 bg-surface-container-low rounded-2xl p-4">
                <span class="material-symbols-outlined text-primary shrink-0 text-[20px]">public</span>
                <div>
                  <p class="text-sm font-bold text-on-surface">Mensen uit de koloniën</p>
                  <p class="text-xs text-on-surface-variant mt-0.5">Na de oorlog kwamen ook mensen uit de koloniën naar Nederland, bijvoorbeeld om te werken of te studeren.</p>
                </div>
              </div>
              <div class="flex gap-3 bg-surface-container-low rounded-2xl p-4">
                <span class="material-symbols-outlined text-primary shrink-0 text-[20px]">person_raised_hand</span>
                <div>
                  <p class="text-sm font-bold text-on-surface">Vluchtelingen</p>
                  <p class="text-xs text-on-surface-variant mt-0.5">Mensen die komen omdat het in hun eigen land niet veilig is, bijvoorbeeld door oorlog.</p>
                </div>
              </div>
            </div>
          </div>

          <div class="bg-white rounded-3xl p-5 shadow-sm">
            <p class="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest mb-3">Internationale samenwerking</p>
            <div class="space-y-2">
              <div class="flex items-center gap-3 bg-surface-container-low rounded-xl p-3">
                <span class="text-lg shrink-0">🌍</span>
                <div>
                  <p class="text-xs font-bold text-on-surface">VN — Verenigde Naties</p>
                  <p class="text-[11px] text-on-surface-variant">Werkt aan vrede in de wereld</p>
                </div>
              </div>
              <div class="flex items-center gap-3 bg-surface-container-low rounded-xl p-3">
                <span class="text-lg shrink-0">🛡️</span>
                <div>
                  <p class="text-xs font-bold text-on-surface">NAVO</p>
                  <p class="text-[11px] text-on-surface-variant">Veiligheid — landen beschermen elkaar</p>
                </div>
              </div>
              <div class="flex items-center gap-3 bg-surface-container-low rounded-xl p-3">
                <span class="text-lg shrink-0">🇪🇺</span>
                <div>
                  <p class="text-xs font-bold text-on-surface">EU — Europese Unie</p>
                  <p class="text-[11px] text-on-surface-variant">Maakt wetten over geld, veiligheid en gezondheid. Vrij reizen en werken in EU-landen. Veel landen gebruiken de euro.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      <!-- WIDGET:lesson-audio -->`,
    },
  ],
};
