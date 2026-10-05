'use client';

import { useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { identifyUser, initPostHog } from '@/lib/posthog-client';

/** Start PostHog (lui, zie lib/posthog-client.ts) en koppelt de sessie aan het account. */
export default function PostHogIdentifier() {
  useEffect(() => {
    void initPostHog();
    const supabase = createClient();
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session?.user) return;
      const { id, email, user_metadata } = session.user;
      void identifyUser(id, {
        email,
        name: user_metadata?.full_name,
        modules: Array.isArray(user_metadata?.modules) ? user_metadata.modules : [],
      });
    });
  }, []);

  return null;
}
