export type AudioCue = {
  time: number;
  subtitle?: string;
  province?: string | null;
  city?: string | null;
  step?: 'inchecken' | 'reizen' | 'uitchecken' | null;
  vehicle?: 'trein' | 'bus' | 'tram' | 'metro' | null;
  payment?: 'chipkaart' | 'bankpas' | 'telefoon' | null;
  // Colonies map (thema 1 — De koloniën en slavernij)
  colony?: 'indie' | 'suriname' | 'antillen' | null;
  leg?: 'leg1' | 'leg2' | 'leg3' | null;
  mode?: 'kolonien' | 'handel' | null;
  // Trade-routes map (thema 1 — De Gouden Eeuw)
  route?: 'oost' | 'west' | null;
  good?: 'peper' | 'koffie' | 'thee' | 'suiker' | 'cacao' | 'tabak' | null;
  home?: boolean | null; // highlight Amsterdam (the VOC home port)
  // Water defense widget (thema 1 — Nederland en het water)
  element?: 'dijk' | 'windmolen' | 'polder' | 'deltawerken' | 'afsluitdijk' | 'ramp1953' | null;
  // WW2 timeline widget (thema 1 — De Tweede Wereldoorlog)
  ww2event?: 'invasion' | 'rotterdam' | 'holocaust' | 'hongerwinter' | 'liberation' | 'dodenherdenking' | 'bevrijdingsdag' | 'volkslied' | 'antisemitisme' | null;
  // Nieuwe Nederlanders widget (thema 1 — Na de oorlog)
  group?: 'gastarbeiders' | 'gezinshereniging' | 'kolonieen' | 'vluchtelingen' | null;
  org?: 'vn' | 'navo' | 'eu' | null;
  // ── Thema 2 — Wonen ──────────────────────────────────────────────────────────
  // Mijn woonwens widget
  sector?: 'sociaal' | 'vrij' | null;       // sociale vs vrije huursector
  relatie?: 'huwelijk' | 'partnerschap' | null;
  // Een huis vinden widget
  pad?: 'huren' | 'kopen' | null;           // welke route (huren/kopen)
  stap?: number | null;                      // welke stap in de tijdlijn oplicht
  // Het huurcontract widget
  clause?: number | null;                    // welk contractonderdeel (1–5)
  borg?: 'intrek' | 'ok' | 'schade' | null;  // borg-simulatie scenario
  hulp?: 'huurcommissie' | 'juridischloket' | null;
  // Belastingen en verzekeringen widget
  cover?: 'opstal' | 'inboedel' | null;      // opstal vs inboedel klikbaar huis
  belasting?: 'riool' | 'parkeer' | 'afval' | 'hond' | 'ozb' | null;
  verzekering?: 'opstal' | 'wa' | 'avp' | 'inboedel' | null;
  // Gas, elektriciteit en water widget
  meter?: 'gas' | 'stroom' | 'water' | null;
  tarief?: 'vast' | 'variabel' | null;
  // Afval widget
  bak?: 'gft' | 'papier' | 'glas' | 'textiel' | 'plastic' | 'rest' | 'chemisch' | null;
};

// Netherlands map — province name in script → TopoJSON statnaam
const PROVINCE_MENTIONS = [
  { search: 'Groningen',    province: 'Groningen' },
  { search: 'Friesland',    province: 'Fryslân' },
  { search: 'Drenthe',      province: 'Drenthe' },
  { search: 'Overijssel',   province: 'Overijssel' },
  { search: 'Gelderland',   province: 'Gelderland' },
  { search: 'Utrecht',      province: 'Utrecht' },
  { search: 'Flevoland',    province: 'Flevoland' },
  { search: 'Noord-Holland',province: 'Noord-Holland' },
  { search: 'Zuid-Holland', province: 'Zuid-Holland' },
  { search: 'Zeeland',      province: 'Zeeland' },
  { search: 'Noord-Brabant',province: 'Noord-Brabant' },
  { search: 'Limburg',      province: 'Limburg' },
];

const CITY_MENTIONS = [
  { search: 'Amsterdam', city: 'amsterdam' },
  { search: 'Den Haag',  city: 'den-haag' },
];

type Alignment = {
  characters: string[];
  character_start_times_seconds: number[];
};

/**
 * Extracts subtitle sentence cues from character alignment data.
 * Works for any section.
 */
function extractSubtitleCues(script: string, alignment: Alignment): AudioCue[] {
  const { characters, character_start_times_seconds } = alignment;
  const charString = characters.join('');
  const cues: AudioCue[] = [];

  // Split script into sentences on ". " or ".\n" boundaries
  const sentences = script
    .replace(/\n+/g, ' ')
    .split(/(?<=\.)\s+/)
    .map(s => s.trim())
    .filter(Boolean);

  for (const sentence of sentences) {
    const probe = sentence.slice(0, 18);
    const idx = charString.indexOf(probe);
    if (idx !== -1) {
      cues.push({ time: Math.round(character_start_times_seconds[idx] * 1000) / 1000, subtitle: sentence });
    }
  }

  // Clear subtitle after last sentence ends
  const lastTime = character_start_times_seconds[characters.length - 1];
  cues.push({ time: Math.round((lastTime + 0.5) * 1000) / 1000, subtitle: '' });

  return cues;
}

/**
 * Extracts Netherlands map province + city highlight cues.
 * Only called when the section contains <!-- WIDGET:netherlands-map -->.
 */
function extractMapCues(alignment: Alignment): AudioCue[] {
  const { characters, character_start_times_seconds } = alignment;
  const charString = characters.join('');
  const cues: AudioCue[] = [];

  // Province cues — collect all occurrences, sorted by time
  const provinceTimes: { time: number; province: string }[] = [];
  for (const { search, province } of PROVINCE_MENTIONS) {
    let from = 0;
    while (true) {
      const idx = charString.indexOf(search, from);
      if (idx === -1) break;
      provinceTimes.push({ time: character_start_times_seconds[idx], province });
      from = idx + search.length;
    }
  }
  provinceTimes.sort((a, b) => a.time - b.time);
  for (const { time, province } of provinceTimes) {
    cues.push({ time: Math.round(time * 1000) / 1000, province });
  }

  // City cues — no resets; stays lit until next city or audio end
  for (const { search, city } of CITY_MENTIONS) {
    let from = 0;
    while (true) {
      const idx = charString.indexOf(search, from);
      if (idx === -1) break;
      cues.push({ time: Math.round(character_start_times_seconds[idx] * 1000) / 1000, city });
      from = idx + search.length;
    }
  }

  return cues;
}

/**
 * Extracts OV simulator step cues (inchecken / reizen / uitchecken).
 * Only called when the section contains <!-- WIDGET:ov-reis -->.
 *
 * The script must contain exactly these anchor phrases:
 *   Steps:   "Je hoort één piep" / "je reis bezig" / "Je hoort twee piepen"
 *   Vehicle: "met de trein" / "met de bus" / "met de tram" / "met de metro"
 *   Payment: "met een OV-chipkaart" / "met een bankpas" / "je telefoon via OVpay"
 */
function extractOVCues(alignment: Alignment): AudioCue[] {
  const { characters, character_start_times_seconds } = alignment;
  const charString = characters.join('');
  const cues: AudioCue[] = [];
  const at = (search: string) => {
    const idx = charString.indexOf(search);
    return idx === -1 ? null : Math.round(character_start_times_seconds[idx] * 1000) / 1000;
  };

  const STEP_ANCHORS: { search: string; step: AudioCue['step'] }[] = [
    { search: 'Je hoort één piep',    step: 'inchecken'  },
    { search: 'je reis bezig',        step: 'reizen'     },
    { search: 'Je hoort twee piepen', step: 'uitchecken' },
  ];
  for (const { search, step } of STEP_ANCHORS) {
    const t = at(search);
    if (t !== null) cues.push({ time: t, step });
  }

  // Vehicle mentions — highlight in order as narrated
  const VEHICLE_ANCHORS: { search: string; vehicle: AudioCue['vehicle'] }[] = [
    { search: 'met de trein',  vehicle: 'trein' },
    { search: 'met de bus',    vehicle: 'bus'   },
    { search: 'met de tram',   vehicle: 'tram'  },
    { search: 'met de metro',  vehicle: 'metro' },
  ];
  for (const { search, vehicle } of VEHICLE_ANCHORS) {
    let from = 0;
    while (true) {
      const idx = charString.indexOf(search, from);
      if (idx === -1) break;
      cues.push({ time: Math.round(character_start_times_seconds[idx] * 1000) / 1000, vehicle });
      from = idx + search.length;
    }
  }

  // Payment method mentions
  const PAY_ANCHORS: { search: string; payment: AudioCue['payment'] }[] = [
    { search: 'met een OV-chipkaart',    payment: 'chipkaart' },
    { search: 'met een bankpas',         payment: 'bankpas'   },
    { search: 'je telefoon via OVpay',   payment: 'telefoon'  },
  ];
  for (const { search, payment } of PAY_ANCHORS) {
    const t = at(search);
    if (t !== null) cues.push({ time: t, payment });
  }

  return cues;
}

/**
 * Extracts colonies-map cues: which mode is shown (kolonien / handel),
 * which colony pin is lit, and which trade leg is active.
 * Only called when the section contains <!-- WIDGET:colonies-map -->.
 *
 * The script must contain these anchor phrases (see generate-colonies-audio.mjs):
 *   colonies: "Nederlands-Indië was de grootste", "Suriname ligt in Zuid-Amerika",
 *             "De Nederlandse Antillen zijn eilanden", "onafhankelijk als Indonesië",
 *             "Suriname een zelfstandig land"
 *   modes:    "Nu de driehoekshandel" → handel, "Later werden de koloniën onafhankelijk" → kolonien
 *   legs:     "Eerst voeren de schepen" → leg1, "In Afrika kochten de Nederlanders" → leg2,
 *             "Daarna voeren de schepen terug" → leg3
 */
function extractColonyCues(alignment: Alignment): AudioCue[] {
  const { characters, character_start_times_seconds } = alignment;
  const charString = characters.join('');
  const cues: AudioCue[] = [];
  const at = (search: string): number | null => {
    const idx = charString.indexOf(search);
    return idx === -1 ? null : Math.round(character_start_times_seconds[idx] * 1000) / 1000;
  };

  // Start in the colonies view
  cues.push({ time: 0, mode: 'kolonien' });

  const COLONY: { search: string; colony: AudioCue['colony'] }[] = [
    { search: 'Nederlands-Indië was de grootste', colony: 'indie' },
    { search: 'Suriname ligt in Zuid-Amerika', colony: 'suriname' },
    { search: 'De Nederlandse Antillen zijn eilanden', colony: 'antillen' },
    { search: 'onafhankelijk als Indonesië', colony: 'indie' },
    { search: 'Suriname een zelfstandig land', colony: 'suriname' },
  ];
  const LEG: { search: string; leg: AudioCue['leg'] }[] = [
    { search: 'Eerst voeren de schepen', leg: 'leg1' },
    { search: 'In Afrika kochten de Nederlanders', leg: 'leg2' },
    { search: 'Daarna voeren de schepen terug', leg: 'leg3' },
  ];

  for (const { search, colony } of COLONY) {
    const t = at(search);
    if (t !== null) cues.push({ time: t, colony });
  }
  for (const { search, leg } of LEG) {
    const t = at(search);
    if (t !== null) cues.push({ time: t, leg });
  }

  // Mode switches — also clear the other mode's selection so nothing lingers
  const handel = at('Nu de driehoekshandel');
  if (handel !== null) cues.push({ time: handel, mode: 'handel', colony: null });
  const back = at('Later werden de koloniën onafhankelijk');
  if (back !== null) cues.push({ time: back, mode: 'kolonien', leg: null });

  return cues;
}

/**
 * Extracts trade-routes-map cues: which VOC route is sailing (oost / west)
 * and which trade good is highlighted. Only called when the section contains
 * <!-- WIDGET:trade-routes-map -->.
 *
 * The script must contain these anchor phrases (see generate-gouden-eeuw-audio.mjs):
 *   routes: "naar het oosten" → oost, "naar het westen" → west (clears the good)
 *   goods:  "haalden ze peper", "koffie mee", "En thee", "suiker vandaan",
 *           "cacao kwam", "En tabak"
 *   home:   "kwamen aan in Amsterdam" → highlight Amsterdam through the closing
 */
function extractTradeRoutesCues(alignment: Alignment): AudioCue[] {
  const { characters, character_start_times_seconds } = alignment;
  const charString = characters.join('');
  const cues: AudioCue[] = [];
  const at = (search: string): number | null => {
    const idx = charString.indexOf(search);
    return idx === -1 ? null : Math.round(character_start_times_seconds[idx] * 1000) / 1000;
  };

  const GOODS: { search: string; good: AudioCue['good'] }[] = [
    { search: 'haalden ze peper', good: 'peper' },
    { search: 'koffie mee',       good: 'koffie' },
    { search: 'En thee',          good: 'thee' },
    { search: 'suiker vandaan',   good: 'suiker' },
    { search: 'cacao kwam',       good: 'cacao' },
    { search: 'En tabak',         good: 'tabak' },
  ];

  // Route switches also clear any lit good so nothing lingers across routes
  const oost = at('naar het oosten');
  if (oost !== null) cues.push({ time: oost, route: 'oost', good: null });
  const west = at('naar het westen');
  if (west !== null) cues.push({ time: west, route: 'west', good: null });

  for (const { search, good } of GOODS) {
    const t = at(search);
    if (t !== null) cues.push({ time: t, good });
  }

  // Closing lines: clear the routes/goods and highlight Amsterdam (the home port)
  const clear = at('kwamen aan in Amsterdam');
  if (clear !== null) cues.push({ time: clear, route: null, good: null, home: true });

  return cues;
}

/**
 * Extracts WW2 timeline event cues.
 * Only called when the section contains <!-- WIDGET:ww2-timeline -->.
 *
 * Anchor phrases (must match the lesson script exactly):
 *   invasion:        "valt Nederland binnen"
 *   rotterdam:       "bombardeerde het Duitse leger Rotterdam"
 *   holocaust:       "Dit noemen we de Holocaust"
 *   hongerwinter:    "de Hongerwinter"
 *   liberation:      "bevrijd door de geallieerden"
 *   dodenherdenking: "4 mei herdenken"
 *   bevrijdingsdag:  "5 mei vieren"
 *   volkslied:       "Het Wilhelmus"
 *   antisemitisme:   "antisemitisme strafbaar"
 */
function extractWW2Cues(alignment: Alignment): AudioCue[] {
  const { characters, character_start_times_seconds } = alignment;
  const charString = characters.join('').toLowerCase();
  const cues: AudioCue[] = [];
  const at = (search: string): number | null => {
    const idx = charString.indexOf(search.toLowerCase());
    return idx === -1 ? null : Math.round(character_start_times_seconds[idx] * 1000) / 1000;
  };

  const EVENT_ANCHORS: { search: string; ww2event: AudioCue['ww2event'] }[] = [
    { search: 'valt Nederland binnen',              ww2event: 'invasion'         },
    { search: 'bombardeerde het Duitse leger Rotterdam', ww2event: 'rotterdam'   },
    { search: 'Dit noemen we de Holocaust',         ww2event: 'holocaust'        },
    { search: 'de Hongerwinter',                    ww2event: 'hongerwinter'     },
    { search: 'bevrijd door de geallieerden',       ww2event: 'liberation'       },
    { search: '4 mei herdenken',                    ww2event: 'dodenherdenking'  },
    { search: '5 mei vieren',                       ww2event: 'bevrijdingsdag'   },
    { search: 'Het Wilhelmus',                      ww2event: 'volkslied'        },
    { search: 'antisemitisme strafbaar',            ww2event: 'antisemitisme'    },
  ];

  for (const { search, ww2event } of EVENT_ANCHORS) {
    const t = at(search);
    if (t !== null) cues.push({ time: t, ww2event });
  }

  return cues;
}

/**
 * Extracts Nieuwe Nederlanders group + org highlight cues.
 * Only called when the section contains <!-- WIDGET:nieuwe-nederlanders -->.
 *
 * Anchor phrases (must match the lesson script exactly):
 *   gastarbeiders:   "In de jaren zestig en zeventig"
 *   gezinshereniging:"Dit heet gezinshereniging"
 *   kolonieen:       "mensen uit de voormalige koloniën"
 *   vluchtelingen:   "zijn er de vluchtelingen"
 *   clear groups:    "Nu de internationale samenwerking"
 *   vn:              "De VN — de Verenigde Naties"
 *   navo:            "De NAVO is een militair"
 *   eu:              "De Europese Unie — de EU"
 *   clear all:       "Onthoud voor het KNM-examen"
 */
function extractNieuweNederlandersCues(alignment: Alignment): AudioCue[] {
  const { characters, character_start_times_seconds } = alignment;
  const charString = characters.join('').toLowerCase();
  const cues: AudioCue[] = [];
  const at = (search: string): number | null => {
    const idx = charString.indexOf(search.toLowerCase());
    return idx === -1 ? null : Math.round(character_start_times_seconds[idx] * 1000) / 1000;
  };

  const GROUP_ANCHORS: { search: string; group: AudioCue['group'] }[] = [
    { search: 'In de jaren zestig en zeventig', group: 'gastarbeiders' },
    { search: 'Dit heet gezinshereniging',       group: 'gezinshereniging' },
    { search: 'mensen uit de voormalige koloniën', group: 'kolonieen' },
    { search: 'zijn er de vluchtelingen',         group: 'vluchtelingen' },
  ];
  const ORG_ANCHORS: { search: string; org: AudioCue['org'] }[] = [
    { search: 'De VN — de Verenigde Naties',  org: 'vn' },
    { search: 'De NAVO is een militair',       org: 'navo' },
    { search: 'De Europese Unie — de EU',      org: 'eu' },
  ];

  for (const { search, group } of GROUP_ANCHORS) {
    const t = at(search);
    if (t !== null) cues.push({ time: t, group });
  }
  for (const { search, org } of ORG_ANCHORS) {
    const t = at(search);
    if (t !== null) cues.push({ time: t, org });
  }

  // Switch away from groups view: clear group, stay neutral until org cue
  const switchToOrgs = at('Nu de internationale samenwerking');
  if (switchToOrgs !== null) cues.push({ time: switchToOrgs, group: null });

  // Clear everything at closing recap
  const clear = at('Onthoud voor het KNM-examen');
  if (clear !== null) cues.push({ time: clear, group: null, org: null });

  return cues;
}

/**
 * Main entry point. Pass `bodyHtml` to auto-detect which widget-specific
 * cue extractors to run on top of the universal subtitle cues.
 */
export function extractCues(script: string, bodyHtml: string, alignment: Alignment): AudioCue[] {
  const cues: AudioCue[] = [
    ...extractSubtitleCues(script, alignment),
    ...(bodyHtml.includes('WIDGET:netherlands-map') ? extractMapCues(alignment) : []),
    ...(bodyHtml.includes('WIDGET:ov-reis') ? extractOVCues(alignment) : []),
    ...(bodyHtml.includes('WIDGET:colonies-map') ? extractColonyCues(alignment) : []),
    ...(bodyHtml.includes('WIDGET:trade-routes-map') ? extractTradeRoutesCues(alignment) : []),
    ...(bodyHtml.includes('WIDGET:ww2-timeline') ? extractWW2Cues(alignment) : []),
    ...(bodyHtml.includes('WIDGET:nieuwe-nederlanders') ? extractNieuweNederlandersCues(alignment) : []),
  ];

  // Sort by time; within same time, subtitles first
  cues.sort((a, b) => a.time - b.time || (a.subtitle !== undefined ? -1 : 1));
  return cues;
}
