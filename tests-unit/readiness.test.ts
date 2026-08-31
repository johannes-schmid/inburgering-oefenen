import { describe, expect, it } from 'vitest';
import { averageReadiness, readiness } from '@/lib/lessons/readiness';

const base = { lessonsDone: 0, lessonsTotal: 0, examsDone: 0, examCount: 10, averagePct: null };

describe('readiness', () => {
  it('geeft null als er niets te zeggen valt', () => {
    expect(readiness(base).pct).toBeNull();
  });

  it('maximeert een cursus zonder examens op 50 — gelezen is niet bewezen', () => {
    expect(readiness({ ...base, lessonsDone: 20, lessonsTotal: 20 }).pct).toBe(50);
  });

  it('weegt dekking maal kwaliteit aan de oefenkant', () => {
    // 3 van 10 examens op 80% = 0,24 → zonder cursus telt die helft voor het geheel.
    expect(readiness({ ...base, examsDone: 3, averagePct: 80 }).pct).toBe(24);
  });

  it('telt een gemaakt maar nog niet nagekeken examen niet als nul', () => {
    const r = readiness({ ...base, lessonsDone: 10, lessonsTotal: 20, examsDone: 2, averagePct: null });
    expect(r.practice).toBeNull();
    expect(r.pct).toBe(25);
  });

  it('weegt de twee helften even zwaar als ze er allebei zijn', () => {
    const r = readiness({ lessonsDone: 10, lessonsTotal: 20, examsDone: 5, examCount: 10, averagePct: 80 });
    expect(r.pct).toBe(45); // 0,5·0,5 + 0,4·0,5
  });

  it('laat een onderdeel zonder cijfer buiten het gemiddelde', () => {
    expect(averageReadiness([{ pct: 60, learn: null, practice: null }, { pct: null, learn: null, practice: null }])).toBe(60);
    expect(averageReadiness([{ pct: null, learn: null, practice: null }])).toBeNull();
  });
});
