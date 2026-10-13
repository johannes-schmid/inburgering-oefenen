'use client';

import { Printer } from 'lucide-react';

export default function PrintButton({ label }: { label: string }) {
  return (
    <button type="button" className="ona-btn secondary ona-noprint" onClick={() => window.print()}>
      <Printer size={16} strokeWidth={2.2} aria-hidden />
      {label}
    </button>
  );
}
