import { createClient } from '@/lib/supabase/server';
import WoordkaartenTable from './_components/WoordkaartenTable';

export const revalidate = 0;

export default async function WoordkaartenAdminPage() {
  const supabase = await createClient();

  const { data: cards } = await supabase
    .from('word_cards')
    .select('id, theme_id, theme_name, dutch, article, plural, dutch_description, dutch_example, translation_en, description_en, translation_ar, description_ar, translation_tr, description_tr, sort_order, image_url, audio_dutch_word, audio_dutch_sentence')
    .order('theme_id')
    .order('sort_order');

  return (
    <WoordkaartenTable cards={cards ?? []} />
  );
}
