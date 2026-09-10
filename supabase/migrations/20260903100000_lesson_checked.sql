-- ---------------------------------------------------------------------------
-- "Nagekeken door de docent" wordt een eigen feit, los van "vrijgegeven"
-- ---------------------------------------------------------------------------
--
-- `review_status` deed tot nu toe twee dingen tegelijk: het zei dat een mens de les had
-- nagekeken én dat de les in het portaal stond. Dat is één klik voor twee besluiten, en het
-- besluit dat de USP draagt ("echt door een docent gevalideerd") was niet los te zien van het
-- besluit wanneer iets live gaat. Een nagekeken les die nog even moet wachten op de rest van
-- zijn blok bestond dus niet, en een vrijgegeven les kon nooit zeggen "dit is nog niet
-- nagekeken" — precies de leugen die de A2-examendataset al één keer heeft verteld.
--
-- Vanaf hier:
--   * `checked_by` / `checked_on` = een mens heeft de inhoud gelezen en goedgekeurd.
--   * `review_status` = staat hij in het portaal.
-- Vrijgeven zonder nakijken blijft mogelijk (de eigenaar beslist, niet dit schema), maar de
-- editor zet er een waarschuwing bij. Andersom is normaal werk.
--
-- Bestaande vrijgegeven lessen worden als nagekeken geboekt met hun `reviewed_by`: dat is wat
-- de klik op "Vrijgeven" op dat moment betekende, en het alternatief is 53 lessen die live
-- staan en zeggen dat niemand ernaar heeft gekeken.

ALTER TABLE public.lessons ADD COLUMN IF NOT EXISTS checked_by text;
ALTER TABLE public.lessons ADD COLUMN IF NOT EXISTS checked_on date;

COMMENT ON COLUMN public.lessons.checked_by IS
  'E-mail van de docent die de inhoud heeft nagekeken, uit de sessie — nooit uit een request '
  'body. Los van review_status, dat alleen zegt of de les in het portaal staat.';

UPDATE public.lessons
   SET checked_by = reviewed_by,
       checked_on = reviewed_on
 WHERE checked_by IS NULL
   AND review_status = 'validated'
   AND reviewed_by IS NOT NULL;
