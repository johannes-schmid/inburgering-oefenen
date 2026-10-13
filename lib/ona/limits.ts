import { createAdminClient } from '@/lib/supabase/admin';

/**
 * De rem op de twee ONA-modelaanroepen: de check van een kaart en een beurt in het oefengesprek.
 *
 * Zelfde ledger als het nakijken (`grade_rate_log`, skill `'ona'`), zodat er één plek is waar je
 * ziet hoeveel modelaanroepen een account doet. De plafonds zijn ruim voor een mens en krap voor
 * een script; wie de module niet heeft, heeft sowieso alleen kaart 1 en één oefengesprek.
 */
export const ONA_LIMITS = {
  free: { perHour: 15, perDay: 30 },
  paid: { perHour: 120, perDay: 400 },
} as const;

export type OnaLimitVerdict = { allowed: true } | { allowed: false; message: string };

export async function checkOnaRate(userId: string, paid: boolean): Promise<OnaLimitVerdict> {
  const limits = paid ? ONA_LIMITS.paid : ONA_LIMITS.free;
  const admin = createAdminClient();
  const now = Date.now();
  const [hour, day] = await Promise.all([
    admin.from('grade_rate_log').select('id', { count: 'exact', head: true })
      .eq('user_id', userId).eq('skill', 'ona')
      .gte('created_at', new Date(now - 3600_000).toISOString()),
    admin.from('grade_rate_log').select('id', { count: 'exact', head: true })
      .eq('user_id', userId).eq('skill', 'ona')
      .gte('created_at', new Date(now - 86400_000).toISOString()),
  ]);
  // Faalt dicht, net als het nakijken: een kapotte telling mag geen onbeperkte gratis laag zijn.
  if (hour.error || day.error) {
    return { allowed: false, message: 'We konden je tegoed niet controleren. Probeer het zo opnieuw.' };
  }
  if ((hour.count ?? 0) >= limits.perHour) {
    return { allowed: false, message: 'Je hebt veel achter elkaar laten nakijken. Probeer het over een uur weer.' };
  }
  if ((day.count ?? 0) >= limits.perDay) {
    return { allowed: false, message: 'Je hebt vandaag veel laten nakijken. Probeer het morgen weer.' };
  }
  return { allowed: true };
}

export async function logOnaCall(userId: string, ip: string | null): Promise<void> {
  try {
    await createAdminClient().from('grade_rate_log').insert({ user_id: userId, ip, skill: 'ona' });
  } catch {
    // Zie `logGradeAttempt`: de ledger mag een aanroep nooit laten mislukken.
  }
}
