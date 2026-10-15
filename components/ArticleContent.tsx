'use client';

import { useEffect, useRef } from 'react';

type Props = { html: string; className?: string };

export default function ArticleContent({ html, className }: Props) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref.current) return;
    const fn = (btn: HTMLElement) => {
      const card = btn.closest('.blog-quiz-card') as HTMLElement | null;
      if (!card || card.dataset.answered) return;
      card.dataset.answered = '1';
      card.querySelectorAll<HTMLButtonElement>('.blog-quiz-opt').forEach(b => {
        b.disabled = true;
        if (b.dataset.answer === 'correct') b.classList.add('blog-quiz-correct');
        else if (b === btn) b.classList.add('blog-quiz-wrong');
      });
      const ans = card.querySelector<HTMLElement>('.blog-quiz-ans');
      if (ans) ans.style.display = 'block';
    };
    ref.current.querySelectorAll<HTMLElement>('.blog-quiz-opt').forEach(btn => {
      btn.addEventListener('click', () => fn(btn));
    });
  }, []);

  return (
    <div
      ref={ref}
      className={className ? `article-body ${className}` : 'article-body'}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
