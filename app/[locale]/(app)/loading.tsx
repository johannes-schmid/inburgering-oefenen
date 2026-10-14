import { getTranslations } from 'next-intl/server';
import { LogoLoader } from '@/components/glas';

/** Het laden van een hele portaalpagina: het logo als laadstaat (Glas §G4, pas na 400ms). */
export default async function Loading() {
  const t = await getTranslations('dashboard');
  return <LogoLoader fullPage label={t('loading')} />;
}
