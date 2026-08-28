-- ============================================================================
-- user_leren_progress: de twee kolommen die de code al schreef en die nergens
-- bestonden
-- ============================================================================
--
-- Vier plekken in de code lezen of schrijven `max_section` en `completed_at` op
-- `user_leren_progress`. Geen enkele migratie heeft ze ooit aangemaakt — niet lokaal en
-- niet op de gehoste database. Gecontroleerd op 2026-08-28: op productie geeft
-- `?select=max_section` een 42703 ("column does not exist") en staat de tabel op nul rijen.
--
-- Er faalde niets zichtbaar, en dat is het hele punt:
--
--   * `LerenThemaClient.tsx` doet beide upserts met `.then(() => {})`. PostgREST antwoordt
--     400, het resultaat wordt weggegooid, en de lespagina rendert verder alsof er niets is.
--     **Gevolg: er is nooit één KNM-lesvoortgang vastgelegd** — niet welke sectie iemand
--     open had, niet of een thema was afgerond. De lege tabel op productie is daar het bewijs
--     van, niet een teken dat niemand de lessen gebruikt.
--   * `/admin/users` selecteert `completed_at` mee en doet `lerenRes.data ?? []`. Diezelfde
--     400 wordt dus een lege lijst, en de leren-regels in de activiteitentijdlijn van élke
--     gebruiker zijn altijd afwezig geweest.
--
-- De kolommen worden hier toegevoegd in plaats van uit de code gehaald, omdat de code de
-- juiste bedoeling heeft: `max_section` is een high-water mark (hoe ver iemand ooit is
-- gekomen, niet waar hij nu staat) en `completed_at` is het moment van afronden, dat
-- `completed` alleen niet kan dragen.
--
-- Let op wat dit *niet* is: dit is geen fundament voor de leerlaag van de taalonderdelen.
-- `thema_id` is een kaal integer zonder niveau- of onderdeel-as, dus A2-Lezen-les-1 hier
-- naast KNM-thema-1 zetten is precies de botsing die `lib/portal-progress.ts` al één keer
-- heeft moeten repareren toen `exam_${number}` Lezen 1 en Luisteren 1 over elkaar heen
-- schreef. De taalonderdelen krijgen eigen tabellen met die as er vanaf het begin in.

ALTER TABLE public.user_leren_progress
  ADD COLUMN IF NOT EXISTS max_section  integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS completed_at timestamptz;

COMMENT ON COLUMN public.user_leren_progress.max_section IS
  'High-water mark: de hoogste sectie-index (1-based) die deze gebruiker ooit heeft geopend. '
  'Loopt nooit terug — terugbladeren naar sectie 1 mag de voortgang niet wissen.';

COMMENT ON COLUMN public.user_leren_progress.completed_at IS
  'Wanneer het thema is afgerond. NULL zolang `completed` false is; /admin/users valt terug '
  'op `updated_at` voor rijen van vóór deze migratie.';

-- Bestaande rijen: een rij die als afgerond stond maar geen tijdstip had, krijgt
-- `updated_at` — het beste beschikbare antwoord, en dat is wat /admin/users toch al deed.
UPDATE public.user_leren_progress
   SET completed_at = updated_at
 WHERE completed AND completed_at IS NULL;
