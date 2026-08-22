import { cn } from '@/lib/utils';
import { C } from './tokens';

/**
 * The trust layer (§7.4) — the NT2-docent validation claim, which is the product's only
 * differentiator and the one place a mark may read as a "seal".
 *
 * **State the claim once per page, near the content it applies to.** Never stack two trust marks
 * in one view, and never turn the seal into a watermark or a background texture.
 */

/** The seal. Reserved for the validation claim; never reused as decoration. */
export function DocentSeal({ size = 56, className }: { size?: number; className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={cn('rounded-full shrink-0', className)}
      style={{
        width: size, height: size, background: C.primary,
        boxShadow: `0 0 0 8px ${C.secondaryContainer}, 0 0 0 15px rgba(255,255,255,0.12)`,
      }}
    />
  );
}

/**
 * The validation chip. Sits at the top of the component hub and on every exam-set header.
 * The copy is the caller's, because it must be translated — but it must stay a factual statement
 * about who wrote and checked the content, never a claim that no AI was involved in anything.
 */
export function ValidationChip({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <span
      className={cn('inline-flex items-center gap-2.5 rounded-full pl-2 pr-4 py-1.5 text-sm font-semibold', className)}
      style={{ background: C.surfaceContainerHigh, color: C.primary }}
    >
      <span
        aria-hidden="true"
        className="w-5 h-5 rounded-full flex items-center justify-center"
        style={{ background: C.primary }}
      >
        <span className="w-2 h-2 rounded-full" style={{ background: C.secondaryContainer }} />
      </span>
      {children}
    </span>
  );
}
