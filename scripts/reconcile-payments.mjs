/**
 * One-time (and safe to re-run) reconciliation of payments that Mollie marked "paid"
 * but whose internal status is still "open" or "pending".
 *
 * Run: node scripts/reconcile-payments.mjs
 * Add --execute to actually write changes (default is dry-run).
 *
 * Requires in environment (copy from .env.local or set inline):
 *   MOLLIE_API_KEY
 *   SUPABASE_SERVICE_ROLE_KEY
 *   NEXT_PUBLIC_SUPABASE_URL  (or SUPABASE_URL for prod)
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import { createMollieClient } from '@mollie/api-client';

// Load .env.local
const __dirname = dirname(fileURLToPath(import.meta.url));
const envPath = resolve(__dirname, '../.env.local');
try {
  const envContent = readFileSync(envPath, 'utf8');
  for (const line of envContent.split('\n')) {
    const m = line.match(/^([^#=]+)=(.*)$/);
    if (m) process.env[m[1].trim()] = m[2].trim().replace(/^["']|["']$/g, '');
  }
} catch {
  // env vars may already be set externally
}

const DRY_RUN = !process.argv.includes('--execute');

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;
const MOLLIE_API_KEY = process.env.MOLLIE_API_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY || !MOLLIE_API_KEY) {
  console.error('Missing SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY / MOLLIE_API_KEY');
  process.exit(1);
}

const PRODUCTS = {
  premium:        { grantsPlan: 'premium' },
  premium_plus:   { grantsPlan: 'premium_plus' },
  upgrade_to_plus:{ grantsPlan: 'premium_plus' },
};

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: { persistSession: false },
});
const mollie = createMollieClient({ apiKey: MOLLIE_API_KEY });

async function reconcile() {
  console.log(`\n=== reconcile-payments [${DRY_RUN ? 'DRY RUN' : 'EXECUTE'}] ===\n`);

  // Fetch all non-final payment rows
  const { data: rows, error } = await supabase
    .from('payments')
    .select('id, mollie_payment_id, user_id, email, status, product, created_at')
    .in('status', ['open', 'pending', 'authorized'])
    .order('created_at', { ascending: false });

  if (error) { console.error('Supabase fetch error:', error.message); process.exit(1); }
  console.log(`Found ${rows.length} non-final payment rows to check.\n`);

  let upgraded = 0, statusUpdated = 0, skipped = 0, errors = 0;

  for (const row of rows) {
    process.stdout.write(`[${row.mollie_payment_id}] ${row.email || row.user_id} — DB:${row.status} → `);

    let payment;
    try {
      payment = await mollie.payments.get(row.mollie_payment_id);
    } catch (err) {
      console.log(`MOLLIE ERROR: ${err.message}`);
      errors++;
      continue;
    }

    const mollieStatus = payment.status;
    process.stdout.write(`Mollie:${mollieStatus}`);

    if (mollieStatus === row.status) {
      console.log(' — no change');
      skipped++;
      continue;
    }

    // Update payments row to real status
    if (!DRY_RUN) {
      await supabase
        .from('payments')
        .update({ status: mollieStatus, updated_at: new Date().toISOString() })
        .eq('id', row.id);
    }
    statusUpdated++;

    // If paid → upgrade user
    if (mollieStatus === 'paid') {
      const meta = payment.metadata;
      const userId = meta?.userId || row.user_id;

      if (!userId) {
        console.log(' — PAID but no userId, cannot upgrade');
        continue;
      }

      const productSlug = meta?.product || row.product || 'premium';
      const productDef = PRODUCTS[productSlug] || PRODUCTS.premium;
      const grantedPlan = productDef.grantsPlan;

      let finalPlan = grantedPlan;
      if (!DRY_RUN) {
        const { data: userData } = await supabase.auth.admin.getUserById(userId);
        const existingMeta = userData?.user?.user_metadata ?? {};
        // Never downgrade premium_plus
        finalPlan = existingMeta.plan === 'premium_plus' ? 'premium_plus' : grantedPlan;
        await supabase.auth.admin.updateUserById(userId, {
          user_metadata: { ...existingMeta, premium: true, plan: finalPlan },
        });
      }

      console.log(` — UPGRADED to ${finalPlan}`);
      upgraded++;
    } else {
      console.log(` — status synced to ${mollieStatus}`);
    }

    // Small delay to avoid Mollie rate limiting
    await new Promise(r => setTimeout(r, 300));
  }

  console.log(`\n=== Done ===`);
  console.log(`Checked:        ${rows.length}`);
  console.log(`Upgraded users: ${upgraded}`);
  console.log(`Status synced:  ${statusUpdated}`);
  console.log(`No change:      ${skipped}`);
  console.log(`Errors:         ${errors}`);
  if (DRY_RUN) {
    console.log('\nThis was a DRY RUN. Re-run with --execute to apply changes.');
  }
}

reconcile().catch(err => { console.error(err); process.exit(1); });
