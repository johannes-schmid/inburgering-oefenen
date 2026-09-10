-- Hoe zwaar een concept weegt in het onderdeel waar het aan hangt.
--
-- ── WAAROM DEZE KOLOM BESTAAT ────────────────────────────────────────────────
-- `concept_onderdelen` zei tot vandaag alleen *of* een concept in een onderdeel voorkomt. Dat
-- klonk als een inhoudelijke uitspraak en was er geen: 27 van de 31 grammaticaconcepten stonden
-- op alle vier de onderdelen, dus de tabel beweerde dat de overtreffende trap even hard telt
-- voor een luistervraag als hoofdzinwoordorde voor een geschreven e-mail. Dat is niet waar, en
-- het is precies het verschil dat de leerlaag moet kunnen maken.
--
-- Het onderscheid is receptief tegenover productief, en het volgt uit de examenvorm:
--
--   'kern'       je moet dit zélf goed doen, anders kost het een punt. Bij Schrijven en
--                Spreken bouw je de zin, dus daar is de lijst lang. Bij Lezen en Luisteren
--                staat hier alleen wat de bétekenis verandert — voegwoorden, verwijswoorden,
--                klemtoon — want een meerkeuzevraag vraagt nooit om een vorm.
--   'herkennen'  je moet dit begrijpen als je het tegenkomt. Producéren hoeft niet.
--
-- Er is geen derde waarde voor "telt hier niet mee": dan bestaat de rij niet. Een concept
-- zonder rijen is onvindbaar, en dat wordt door tests-unit/lesson-syllabus.test.ts afgedwongen.
--
-- ── DE BRON IS scripts/lesson-content/concepts-a2.mjs ────────────────────────
-- Daar staat per concept `onderdelen` (waar het voorkomt) en `kern` (waar het zwaar weegt), met
-- de hand vastgelegd en in git. Deze migratie voegt alleen de kolom toe; de waarden komen uit
-- de seeder, en de docent kan ze in /admin verzetten. `default 'kern'` is bedoeld voor de
-- strategieconcepten: die hangen aan precies één onderdeel en zijn daar per definitie kern.

alter table concept_onderdelen
  add column weight text not null default 'kern';

alter table concept_onderdelen
  add constraint concept_onderdelen_weight_check
  check (weight = any (array['kern', 'herkennen']::text[]));

comment on column concept_onderdelen.weight is
  'kern = zelf goed kunnen doen (kost een punt), herkennen = begrijpen is genoeg. Zie de kop van deze migratie.';

-- Ordenen op gewicht binnen een onderdeel is de enige query die deze kolom draagt.
create index concept_onderdelen_onderdeel_weight_idx
  on concept_onderdelen (onderdeel, weight);
