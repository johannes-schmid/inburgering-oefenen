'use client';

import { useState } from 'react';
import { Link } from '@/i18n/navigation';
import { cn } from '@/lib/utils';
import { buttonVariants } from '@/components/ui/button';

export default function ContactForm() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (!name || !email || !subject || !message) {
      setError('Vul alle velden in voordat je het formulier verstuurt.');
      return;
    }
    if (!email.includes('@') || !email.includes('.')) {
      setError('Voer een geldig e-mailadres in.');
      return;
    }
    if (message.length < 10) {
      setError('Je bericht is te kort. Schrijf minimaal 10 tekens.');
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
      setLoading(false);
    }
  }

  if (success) {
    return (
      <div className="text-center py-4">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-green-50 mb-6">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 13l4 4L19 7"/>
          </svg>
        </div>
        <h2 className="text-2xl font-extrabold font-headline text-primary mb-3">Bericht verstuurd!</h2>
        <p className="text-on-surface-variant leading-relaxed mb-6">We hebben je bericht ontvangen en reageren zo snel mogelijk op jouw e-mailadres.</p>
        <Link href="/" className="text-sm font-semibold text-secondary-container hover:opacity-80 transition-opacity no-underline">← Terug naar de homepage</Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      <div className="space-y-5">
        <div>
          <label className="form-label" htmlFor="input-name">Naam</label>
          <input
            id="input-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="form-input"
            placeholder="Jouw naam"
            required
            autoComplete="name"
          />
        </div>
        <div>
          <label className="form-label" htmlFor="input-email">E-mailadres</label>
          <input
            id="input-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="form-input"
            placeholder="jouw@email.nl"
            required
            autoComplete="email"
          />
        </div>
        <div>
          <label className="form-label" htmlFor="input-subject">Onderwerp</label>
          <select
            id="input-subject"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            className="form-input"
            required
          >
            <option value="" disabled>Kies een onderwerp…</option>
            <option value="Vraag over het examen">Vraag over het examen</option>
            <option value="Technisch probleem">Technisch probleem</option>
            <option value="Premium pakket">Premium pakket</option>
            <option value="Anders">Anders</option>
          </select>
        </div>
        <div>
          <label className="form-label" htmlFor="input-message">Bericht</label>
          <textarea
            id="input-message"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="form-input resize-y"
            style={{ minHeight: '120px' }}
            rows={5}
            placeholder="Schrijf hier je vraag of opmerking…"
            required
          />
        </div>

        {error && (
          <div className="rounded-xl px-4 py-3.5 text-sm font-semibold bg-red-50 text-red-800 border border-red-200">{error}</div>
        )}

        <button
          type="submit"
          disabled={loading}
          className={cn(buttonVariants({ variant: 'orange', size: 'cta' }), 'w-full mt-2 disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none justify-center')}
        >
          {loading ? 'Bezig met versturen…' : 'Verstuur bericht'}
        </button>
      </div>
    </form>
  );
}
