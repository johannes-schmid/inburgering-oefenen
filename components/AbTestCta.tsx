'use client';

import { track } from '@/lib/analytics';

interface Props {
  label: React.ReactNode;
  href?: string;
  className?: string;
  style?: React.CSSProperties;
}

/**
 * Primary practice CTA. Was a PostHog-flagged A/B between /oefenen and /dashboard;
 * the experiment concluded and PostHog was removed, so it now points at a fixed
 * destination and only reports the click to GA.
 */
export default function AbTestCta({ label, href = '/oefenen', className, style }: Props) {
  return (
    <a
      href={href}
      className={className}
      style={style}
      onClick={() => track('practice_cta_clicked', { destination: href, label: typeof label === 'string' ? label : undefined })}
    >
      {label}
    </a>
  );
}
