BEGIN;

WITH target AS (
  SELECT id FROM exams
  WHERE (level = 'a2' AND skill IN ('luisteren','schrijven','spreken'))
     OR  level = 'b1'
)
UPDATE stimuli SET review_status = 'pending'
WHERE exam_id IN (SELECT id FROM target) AND review_status <> 'pending';

WITH target AS (
  SELECT id FROM exams
  WHERE (level = 'a2' AND skill IN ('luisteren','schrijven','spreken'))
     OR  level = 'b1'
)
UPDATE questions SET review_status = 'pending'
WHERE exam_id IN (SELECT id FROM target) AND review_status <> 'pending';

WITH target AS (
  SELECT id FROM exams
  WHERE (level = 'a2' AND skill IN ('luisteren','schrijven','spreken'))
     OR  level = 'b1'
)
UPDATE open_tasks SET review_status = 'pending'
WHERE exam_id IN (SELECT id FROM target) AND review_status <> 'pending';

COMMIT;