BEGIN;

-- Create the unified exam_submissions table
CREATE TABLE public.exam_submissions (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email        text NOT NULL,
  user_id      uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  exam_number  integer NOT NULL DEFAULT 1,
  score        integer NOT NULL,
  total        integer NOT NULL,
  pct          integer NOT NULL,
  passed       boolean NOT NULL,
  cat_scores   jsonb,
  completed_at timestamptz DEFAULT now(),
  CONSTRAINT exam_submissions_email_exam_key UNIQUE (email, exam_number)
);

ALTER TABLE public.exam_submissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own submissions"
  ON public.exam_submissions FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Migrate existing rows from exam_results, looking up email from auth.users
INSERT INTO public.exam_submissions (email, user_id, exam_number, score, total, pct, passed, cat_scores, completed_at)
SELECT
  u.email,
  er.user_id,
  er.exam_number,
  er.score,
  er.total,
  er.pct,
  er.passed,
  er.cat_scores,
  er.completed_at
FROM public.exam_results er
JOIN auth.users u ON u.id = er.user_id
ON CONFLICT (email, exam_number) DO NOTHING;

DROP TABLE public.exam_results;

COMMIT;
