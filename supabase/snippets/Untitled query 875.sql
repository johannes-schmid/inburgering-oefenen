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