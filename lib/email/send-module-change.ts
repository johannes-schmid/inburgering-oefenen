import { Resend } from 'resend';
import type { SupabaseClient } from '@supabase/supabase-js';
import { type EmailLocale } from './i18n';
import { moduleChangeEmail, moduleChangeSubject, type ModuleChangeEmailInput } from './templates/module-change';

/**
 * Stuurt de bevestiging van een wijziging. Gooit nooit: de wijziging en de incasso zijn al
 * verwerkt als dit draait, en een Resend-storing mag daar geen fout van maken die de kandidaat
 * ziet (dan klikt hij nog eens). Luid gelogd in plaats daarvan.
 */
export async function sendModuleChangeEmail(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: SupabaseClient<any, any, any>,
  userId: string,
  input: Omit<ModuleChangeEmailInput, 'firstName' | 'accountUrl'> & { locale: string },
): Promise<void> {
  if (!process.env.RESEND_API_KEY) return;
  try {
    const { data } = await supabase.auth.admin.getUserById(userId);
    const email = data?.user?.email;
    if (!email) return;
    const fullName = data?.user?.user_metadata?.full_name;
    const locale: EmailLocale = input.locale === 'en' || input.locale === 'ar' ? input.locale : 'nl';
    const baseUrl = process.env.BASE_URL || 'https://inburgeringoefenen.nl';
    const resend = new Resend(process.env.RESEND_API_KEY);
    await resend.emails.send({
      from: 'Inburgering Oefenen <support@inburgeringoefenen.nl>',
      to: email,
      subject: moduleChangeSubject(input.outcome, locale),
      html: moduleChangeEmail(
        {
          ...input,
          firstName: typeof fullName === 'string' ? fullName.split(' ')[0] : '',
          accountUrl: `${baseUrl}/${locale}/dashboard/profiel`,
        },
        locale,
      ),
    });
  } catch (err) {
    console.error('[module-change] confirmation email failed:', userId, (err as Error)?.message);
  }
}
