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
import CategoryMark from '@/components/horizon/CategoryMark';
import { glasButton } from '@/components/glas/Button';

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
          <CategoryMark category="gidsen" size={44} />
          <h2 id="pdf-dialog-title" className="g-head g-head-3 !text-navy mt-4 mb-2">
            {title}
          </h2>
          {status === 'done' ? (
            <p className="text-base leading-relaxed m-0 mt-4 text-ink">
              {t('pdf_success')}{' '}
              {url && (
                <a href={url} className="g-ilink">
                  {t('pdf_retry')}
                </a>
              )}
            </p>
          ) : (
            <form onSubmit={submit} className="mt-2">
              <p className="text-base leading-relaxed m-0 mb-5 text-ink-2">{t('pdf_modal_desc')}</p>
              <label htmlFor="pdf-email" className="block text-sm font-semibold mb-1.5 text-ink">
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
                className="pdf-dialog-input"
              />
              {status === 'error' && (
                <p className="text-sm m-0 mt-2 text-fout" role="alert">
                  {t('pdf_error')}
                </p>
              )}
              <button
                type="submit"
                disabled={status === 'sending'}
                className={glasButton({ variant: 'navy', className: 'mt-4 w-full' })}
              >
                <FileDown size={16} aria-hidden="true" />
                {status === 'sending' ? t('pdf_sending') : t('pdf_submit')}
              </button>
              <p className="text-xs leading-relaxed m-0 mt-3 text-ink-2">{t('pdf_consent')}</p>
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
