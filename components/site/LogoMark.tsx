type LogoMarkProps = {
  size?: number;
  /** 'light' for light surfaces (navy tile), 'dark' for navy surfaces (white tile) */
  surface?: 'light' | 'dark';
  className?: string;
};

/**
 * The mark is the **bar and the sun disc** — an "i" beside the sun that closes every horizon
 * in the design system (§7.3). It replaced an outlined ring on 2026-08-22: the ring was a
 * shape the graphic language does not contain, so the logo was the one place on the site that
 * did not speak it. A solid disc does, and it survives being drawn at 24px, which an 11px
 * stroke ring does not.
 *
 * The tile inverts rather than going translucent on navy. A 12%-white tile made the mark read
 * as a disabled control in the footer and on every dark page header.
 */
export default function LogoMark({ size = 34, surface = 'light', className }: LogoMarkProps) {
  const onNavy = surface === 'dark';
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="Inburgering Oefenen"
      className={className}
      style={{ flexShrink: 0, display: 'block' }}
    >
      <rect width="100" height="100" rx="23" fill={onNavy ? '#ffffff' : '#002b6d'} />
      <rect x="26" y="27" width="17" height="46" rx="8.5" fill={onNavy ? '#002b6d' : '#ffffff'} />
      <circle cx="65" cy="50" r="17" fill="#fe762c" />
    </svg>
  );
}
