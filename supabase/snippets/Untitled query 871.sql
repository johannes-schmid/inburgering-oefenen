-- Allow deleting auth.users by cascading to child tables that were missing ON DELETE CASCADE

ALTER TABLE user_question_results
  DROP CONSTRAINT user_question_results_user_id_fkey,
  ADD CONSTRAINT user_question_results_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE user_word_card_progress
  DROP CONSTRAINT user_word_card_progress_user_id_fkey,
  ADD CONSTRAINT user_word_card_progress_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
