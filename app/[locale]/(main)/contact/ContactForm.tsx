'use client';

import { useState } from 'react';
import { AlertCircle, ArrowLeft, Check } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import { glasButton } from '@/components/glas/Button';

/* Welk veld de fout betreft, zodat dát veld rood wordt en niet alleen de melding eronder. */
type ErrorField = 'empty' | 'email' | 'message' | 'server' | null;

export default function ContactForm() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [errorField, setErrorField] = useState<ErrorField>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setErrorField(null);
    if (!name || !email || !subject || !message) {
      setError('Vul alle velden in voordat je het formulier verstuurt.');
      setErrorField('empty');
      return;
    }
    if (!email.includes('@') || !email.includes('.')) {
      setError('Voer een geldig e-mailadres in.');
      setErrorField('email');
      return;
    }
    if (message.length < 10) {
      setError('Je bericht is te kort. Schrijf minimaal 10 tekens.');
      setErrorField('message');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/contact-submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, subject, message }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'server error');
      setSuccess(true);
    } catch {
      setError('Er is iets misgegaan. Probeer het opnieuw of mail naar support@inburgeringoefenen.nl.');
      setErrorField('server');
      setLoading(false);
    }
  }

  if (success) {
    return (
      <div className="flex flex-col items-center text-center gap-3 py-4" role="status">
        <span className="g-stateicon g-stateicon-goed" aria-hidden="true"><Check /></span>
        <h2 className="g-head g-head-2 mt-2">Bericht verstuurd!</h2>
        <p className="m-0 text-ink-2 leading-relaxed max-w-[40ch]">We hebben je bericht ontvangen en reageren zo snel mogelijk op jouw e-mailadres.</p>
        <Link href="/" className="g-textbtn mt-2">
          <ArrowLeft className="rtl-flip" aria-hidden="true" />
          Terug naar de homepage
        </Link>
      </div>
    );
  }

  const invalid = (filled: boolean, field?: ErrorField) =>
    (errorField === 'empty' && !filled) || (field !== undefined && errorField === field) ? true : undefined;

  return (
    <form onSubmit={handleSubmit} noValidate className="g-form">
      <div>
        <label className="g-label" htmlFor="input-name">Naam</label>
        <input
          id="input-name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="g-input"
          placeholder="Jouw naam"
          required
          autoComplete="name"
          aria-invalid={invalid(!!name)}
          aria-describedby={error ? 'contact-error' : undefined}
        />
      </div>
      <div>
        <label className="g-label" htmlFor="input-email">E-mailadres</label>
        <input
          id="input-email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="g-input"
          placeholder="jouw@email.nl"
          required
          autoComplete="email"
          aria-invalid={invalid(!!email, 'email')}
          aria-describedby={error ? 'contact-error' : undefined}
        />
      </div>
      <div>
        <label className="g-label" htmlFor="input-subject">Onderwerp</label>
        <select
          id="input-subject"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          className="g-input"
          required
          aria-invalid={invalid(!!subject)}
          aria-describedby={error ? 'contact-error' : undefined}
        >
          <option value="" disabled>Kies een onderwerp…</option>
          <option value="Vraag over het examen">Vraag over het examen</option>
          <option value="Technisch probleem">Technisch probleem</option>
          <option value="Premium pakket">Premium pakket</option>
          <option value="Anders">Anders</option>
        </select>
      </div>
      <div>
        <label className="g-label" htmlFor="input-message">Bericht</label>
        <textarea
          id="input-message"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          className="g-input"
          rows={5}
          placeholder="Schrijf hier je vraag of opmerking…"
          required
          aria-invalid={invalid(!!message, 'message')}
          aria-describedby={error ? 'contact-error' : undefined}
        />
      </div>

      {error && (
        <div id="contact-error" className="g-formerr" role="alert">
          <AlertCircle aria-hidden="true" />
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        className={glasButton({ variant: 'navy', size: 'lg', className: 'w-full mt-1' })}
      >
        {loading ? 'Bezig met versturen…' : 'Verstuur bericht'}
      </button>
    </form>
  );
}
