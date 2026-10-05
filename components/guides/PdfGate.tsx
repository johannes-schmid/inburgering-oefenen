'use client';

/**
 * De PDF-poort: een e-mailadres in ruil voor de gids als PDF (eigenaar, 05-10-2026).
 *
 * Eén dialoog per gidspagina, drie knoppen die hem openen (hero, zijbalk, slot-CTA). De knop is
 * een `<button>` en geen link: zonder adres is er geen URL. Na het indienen geeft
 * `/api/guide-pdf-request` een URL met een bewijs van een uur terug en start de browser de
 * download zelf (`Content-Disposition: attachment`), zodat de pagina blijft staan.
 *
 * Native `<dialog>`: focus-vangst, Escape en de achtergrond komen van de browser. De animatie is
 * alleen opacity en transform, met een reduced-motion-uitweg in `globals.css`.
 */
import { createContext, useContext, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { useTranslations } from 'next-intl';
import { FileDown, X } from 'lucide-react';

type Ctx = { open: () => void };
const GateContext = createContext<Ctx | null>(null);

type Status = 'idle' | 'sending' | 'done' | 'error';

export function PdfGateProvider({
  section,
  slug,
  locale,
  title,
  children,
}: {
  section: string;
  slug: string;
  locale: string;
  title: string;
  children: ReactNode;
}) {
  const t = useTranslations('guides');
  const ref = useRef<HTMLDialogElement>(null);
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<Status>('idle');
  const [url, setUrl] = useState<string | null>(null);

  const open = () => {
    const d = ref.current;
    if (d && !d.open) d.showModal();
  };
  const close = () => ref.current?.close();

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (status === 'sending') return;
    setStatus('sending');
    try {
      const res = await fetch('/api/guide-pdf-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, section, slug, locale }),
      });
      const data = (await res.json().catch(() => ({}))) as { url?: string };
      if (!res.ok || !data.url) throw new Error('request_failed');
      setUrl(data.url);
      setStatus('done');
      window.location.assign(data.url);
    } catch {
      setStatus('error');
    }
  };

  return (
    <GateContext.Provider value={{ open }}>
      {children}
      <dialog
        ref={ref}
        className="pdf-dialog no-print"
        aria-labelledby="pdf-dialog-title"
        onClick={e => {
          /* Klik op de achtergrond sluit; de achtergrond is het dialog-element zelf. */
          if (e.target === ref.current) close();
        }}
      >
        <div className="pdf-dialog-panel">
          <button
            type="button"
            onClick={close}
            aria-label={t('pdf_close')}
            className="pdf-dialog-close"
          >
            <X size={18} aria-hidden="true" />
          </button>
          <p className="text-[11px] font-bold uppercase tracking-widest m-0 mb-3" style={{ color: '#a24000' }}>
            PDF
          </p>
          <h2
            id="pdf-dialog-title"
            className="font-headline font-extrabold m-0 mb-2"
            style={{ color: '#002b6d', fontSize: '1.45rem', letterSpacing: '-0.02em', lineHeight: 1.15 }}
          >
            {title}
          </h2>
          {status === 'done' ? (
            <p className="text-base leading-relaxed m-0 mt-4 text-on-surface">
              {t('pdf_success')}{' '}
              {url && (
                <a href={url} className="font-semibold" style={{ color: '#a24000' }}>
                  {t('pdf_retry')}
                </a>
              )}
            </p>
          ) : (
            <form onSubmit={submit} className="mt-2">
              <p className="text-base leading-relaxed m-0 mb-5 text-on-surface-variant">{t('pdf_modal_desc')}</p>
              <label htmlFor="pdf-email" className="block text-sm font-semibold mb-1.5 text-on-surface">
                {t('pdf_email_label')}
              </label>
              <input
                id="pdf-email"
                type="email"
                required
                autoComplete="email"
                inputMode="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder={t('pdf_email_placeholder')}
                className="pdf-dialog-input w-full rounded-xl px-4 py-3 text-base text-on-surface bg-surface-container-low focus:outline-none"
              />
              {status === 'error' && (
                <p className="text-sm m-0 mt-2" style={{ color: 'var(--color-error)' }}>
                  {t('pdf_error')}
                </p>
              )}
              <button
                type="submit"
                disabled={status === 'sending'}
                className="pdf-dialog-submit mt-4 w-full inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3 font-bold text-sm bg-secondary-container text-on-secondary-container border-0 cursor-pointer active:scale-[0.98] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 disabled:opacity-60"
              >
                <FileDown size={16} aria-hidden="true" />
                {status === 'sending' ? t('pdf_sending') : t('pdf_submit')}
              </button>
              <p className="text-xs leading-relaxed m-0 mt-3 text-on-surface-variant">{t('pdf_consent')}</p>
            </form>
          )}
        </div>
      </dialog>
    </GateContext.Provider>
  );
}

/** Een knop die de poort opent. Stijl komt van de plek: hero, zijbalk of slot-CTA. */
export function PdfButton({
  className,
  style,
  children,
}: {
  className?: string;
  style?: CSSProperties;
  children: ReactNode;
}) {
  const ctx = useContext(GateContext);
  if (!ctx) throw new Error('PdfGateProvider ontbreekt');
  return (
    <button type="button" onClick={ctx.open} className={className} style={style} data-pdf-gate>
      <FileDown size={16} aria-hidden="true" />
      {children}
    </button>
  );
}
