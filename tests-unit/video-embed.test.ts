import { describe, expect, it } from 'vitest';
import { toVideoEmbed, playerSrc } from '@/lib/lessons/video-embed';
import { buildGrammarStep, nextTopic, topicDone, type TopicLesson } from '@/lib/lessons/grammar';
import { GRAMMAR_EXTRAS, GRAMMAR_SYLLABUS, VIDEOS, grammarTopics } from '@/data/grammar-syllabus';
import type { LessonRef } from '@/data/grammar-syllabus';

describe('toVideoEmbed', () => {
  it('maakt van elke YouTube-vorm dezelfde nocookie-embed', () => {
    const want = 'https://www.youtube-nocookie.com/embed/9zTJcckIIYY';
    for (const url of [
      'https://www.youtube.com/watch?v=9zTJcckIIYY',
      'https://youtube.com/watch?v=9zTJcckIIYY&list=PL123',
      'https://m.youtube.com/watch?v=9zTJcckIIYY',
      'https://youtu.be/9zTJcckIIYY',
      'https://youtu.be/9zTJcckIIYY?si=abc',
      'https://www.youtube.com/shorts/9zTJcckIIYY',
      'https://www.youtube.com/embed/9zTJcckIIYY',
    ]) {
      expect(toVideoEmbed(url)).toMatchObject({ kind: 'iframe', provider: 'youtube', src: want });
    }
  });

  it('neemt een starttijd mee', () => {
    expect(toVideoEmbed('https://youtu.be/9zTJcckIIYY?t=42')).toMatchObject({
      src: 'https://www.youtube-nocookie.com/embed/9zTJcckIIYY?start=42',
    });
  });

  it('zet een Drive-bestand om naar /preview', () => {
    const want = 'https://drive.google.com/file/d/1AbCdEfGhIjKlMnOp/preview';
    expect(toVideoEmbed('https://drive.google.com/file/d/1AbCdEfGhIjKlMnOp/view?usp=sharing'))
      .toMatchObject({ kind: 'iframe', provider: 'drive', src: want });
    expect(toVideoEmbed('https://drive.google.com/open?id=1AbCdEfGhIjKlMnOp'))
      .toMatchObject({ kind: 'iframe', provider: 'drive', src: want });
  });

  it('laat een mp4 of andere link een native video zijn', () => {
    expect(toVideoEmbed('https://example.supabase.co/storage/v1/object/public/v/les.mp4'))
      .toEqual({ kind: 'video', src: 'https://example.supabase.co/storage/v1/object/public/v/les.mp4' });
  });

  it('geeft null voor leeg, onzin of een gevaarlijk protocol', () => {
    expect(toVideoEmbed(null)).toBeNull();
    expect(toVideoEmbed('')).toBeNull();
    expect(toVideoEmbed('   ')).toBeNull();
    expect(toVideoEmbed('geen url')).toBeNull();
    expect(toVideoEmbed('javascript:alert(1)')).toBeNull();
  });

  it('valt bij een YouTube-pagina zonder id terug op een video in plaats van een kapotte embed', () => {
    expect(toVideoEmbed('https://www.youtube.com/watch')).toMatchObject({ kind: 'video' });
  });

  it('zet rel=0 alleen op YouTube', () => {
    const yt = toVideoEmbed('https://youtu.be/9zTJcckIIYY');
    const drive = toVideoEmbed('https://drive.google.com/file/d/1AbCdEfGhIjKlMnOp/view');
    if (yt?.kind !== 'iframe' || drive?.kind !== 'iframe') throw new Error('verwacht iframes');
    expect(playerSrc(yt)).toBe('https://www.youtube-nocookie.com/embed/9zTJcckIIYY?rel=0');
    expect(playerSrc(drive)).toBe(drive.src);
  });

  it('elke ingevulde video-URL in de catalogus is te tonen', () => {
    for (const [key, v] of Object.entries(VIDEOS)) {
      if (v.url) expect(toVideoEmbed(v.url), key).not.toBeNull();
    }
  });
});

describe('de grammaticastap', () => {
  const lesson = (ref: LessonRef, over: Partial<TopicLesson> = {}): TopicLesson => ({
    ref, id: 1, slug: ref.split(':')[2], title: 't', review_status: 'validated', is_free: false, done: false, ...over,
  });

  it('een onderwerp is pas af als al zijn lessen bestaan én af zijn', () => {
    expect(topicDone([])).toBe(false);
    expect(topicDone([lesson('a2:lezen:x', { done: true })])).toBe(true);
    expect(topicDone([lesson('a2:lezen:x', { done: true }), lesson('a2:lezen:y', { id: null })])).toBe(false);
  });

  it('telt onderwerpen, niet lessen, en wijst het eerste open onderwerp aan', () => {
    const topics = grammarTopics('a2', 'lezen');
    const step = buildGrammarStep(topics, null, ref => lesson(ref, { done: ref.endsWith('b30-ontkenning') || ref.includes('b29') || ref.includes('b25') }));
    expect(step.total).toBe(topics.length);
    expect(step.done).toBe(2);
    expect(nextTopic(step)?.n).toBe(3);
  });

  it('de extra reeks staat los van de telling', () => {
    const step = buildGrammarStep(grammarTopics('a2', 'spreken'), GRAMMAR_EXTRAS['a2:spreken'], ref => lesson(ref));
    expect(step.extras?.lessons).toHaveLength(6);
    expect(step.total).toBe(grammarTopics('a2', 'spreken').length);
  });

  it('elke cursus heeft onderwerpen die op 1 beginnen en oplopen', () => {
    for (const level of ['a2', 'b1'] as const) {
      for (const [skill, topics] of Object.entries(GRAMMAR_SYLLABUS[level])) {
        expect(topics.map(t => t.n), `${level}:${skill}`).toEqual(topics.map((_, i) => i + 1));
      }
    }
  });
});
