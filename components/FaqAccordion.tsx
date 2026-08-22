'use client';

import { useState } from 'react';

type FaqItem = {
  question: string;
  answer: string;
  link?: { href: string; label: string };
};

export default function FaqAccordion({ items }: { items: FaqItem[] }) {
  const [open, setOpen] = useState<number | null>(null);

  return (
    <div className="bg-surface-container-lowest rounded-2xl overflow-hidden" style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
      {items.map((item, i) => {
        const isOpen = open === i;
        return (
          <div key={i}>
            {i > 0 && <div className="h-px bg-surface-container-low" />}
            <div className="px-5 py-4" style={{ transition: 'background 0.15s ease' }}>
              <button
                className="w-full text-left flex justify-between items-center gap-4 bg-transparent border-0 cursor-pointer p-0"
                onClick={() => setOpen(isOpen ? null : i)}
                aria-expanded={isOpen}
              >
                <span className="font-headline font-semibold text-on-surface text-base">{item.question}</span>
                <span
                  className="w-6 h-6 min-w-6 rounded-full border border-outline-variant flex items-center justify-center text-on-surface-variant text-xs font-bold"
                  style={{ transform: isOpen ? 'rotate(45deg)' : 'rotate(0deg)', transition: 'transform 0.3s ease' }}
                >
                  +
                </span>
              </button>
              <div
                style={{
                  maxHeight: isOpen ? '400px' : '0',
                  overflow: 'hidden',
                  transition: 'max-height 0.35s cubic-bezier(0.4,0,0.2,1)',
                }}
              >
                <p className="text-on-surface-variant text-sm leading-relaxed pt-3">{item.answer}</p>
                {item.link && (
                  <a href={item.link.href} className="text-secondary underline hover:opacity-75 text-sm mt-1 inline-block" style={{ transition: 'opacity 0.15s ease' }}>
                    {item.link.label}
                  </a>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
