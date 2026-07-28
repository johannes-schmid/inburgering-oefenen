type LogoMarkProps = {
  size?: number;
  /** 'light' for light surfaces (navy tile), 'dark' for navy surfaces (translucent tile) */
  surface?: 'light' | 'dark';
  className?: string;
};

export default function LogoMark({ size = 34, surface = 'light', className }: LogoMarkProps) {
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
      <rect width="100" height="100" rx="23" fill={surface === 'dark' ? 'rgba(255,255,255,0.12)' : '#002b6d'} />
      <rect x="28" y="29" width="13" height="43" rx="6.5" fill="#fe762c" />
      <circle cx="61" cy="50.5" r="16" fill="none" stroke="#ffffff" strokeWidth="11" />
    </svg>
  );
}
