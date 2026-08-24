/**
 * `/llms.txt` and `/llms-full.txt` — the rules that make them safe to publish.
 *
 * These two files are read by systems that will repeat what they say, at a remove from the page and
 * without the page's context. So the failure modes are not layout problems, they are false claims
 * with a long half-life: a price that has changed, a guide the docent has not reviewed, a figure
 * `SEO/facts.md` §9 forbids. Each of those is one line of content away and none of them would be
 * caught by a build or a screenshot.
 */
import { describe, it, expect } from 'vitest';
import { llmsTxt, llmsFullTxt } from '@/lib/llms';
import { GET as robotsGet } from '@/app/robots.txt/route';
import { GUIDES } from '@/data/guides';
import { publishedGuides } from '@/data/guides/helpers';

const index = llmsTxt();
const full = llmsFullTxt();

describe('llms.txt', () => {
  it('follows the llmstxt.org shape: an H1, then a blockquote summary', () => {
    const lines = index.split('\n');
    expect(lines[0]).toBe('# Inburgering Oefenen');
    expect(lines.find(l => l.startsWith('> '))).toBeTruthy();
    /* Exactly one H1. A second one makes the file two documents to a parser that splits on it. */
    expect(index.match(/^# /gm)?.length).toBe(1);
  });

  it('lists every published guide, in its own section', () => {
    for (const guide of publishedGuides()) {
      expect(index, `${guide.slug} is published but not listed`).toContain(
        `https://inburgeringoefenen.nl/nl/${guide.section}/${guide.slug}`,
      );
    }
  });

  /**
   * The review gate, restated for machines. A draft is `noindex`, absent from its hub and absent
   * from the sitemap; handing it to a model that will cite it as reviewed content undoes all three.
   */
  it('never lists an unreviewed guide', () => {
    for (const guide of GUIDES) {
      if (guide.status === 'reviewed') continue;
      expect(index, `${guide.slug} is a draft and must not be listed`).not.toContain(
        `/${guide.section}/${guide.slug})`,
      );
      expect(full, `${guide.slug} is a draft and must not be in the corpus`).not.toContain(
        `/${guide.section}/${guide.slug}\n`,
      );
    }
  });

  /**
   * `/premium` is the only page allowed to state **our** price, and `lib/pricing.ts` is the only
   * source of one — the same reason `scripts/check-schema.mjs` forbids `Offer` nodes elsewhere. A
   * figure copied into a text file keeps being quoted back long after the page is corrected.
   *
   * Scoped to the index, and to our own amounts. The corpus is the guides' own text, which
   * correctly states **DUO's** fees (€50 per exam part, €40 for ONA) with the government source and
   * the consulted-on date beside them — that is sourced reference content and removing it would
   * make the corpus worse. What must never appear is a *subscription* price: that is ours to
   * change, and nothing here would notice when we did. `htmlToText` drops the inline conversion
   * blocks for that reason — one of them interpolates `MODULE_PRICE`.
   */
  it('quotes no price of ours', () => {
    expect(index).not.toMatch(/€\s?\d/);
    for (const text of [index, full]) {
      for (const ours of ['9,95', '29,95', '19,95', '9.95', '29.95']) {
        expect(text, `contains the subscription price ${ours}`).not.toContain(ours);
      }
      expect(text).not.toMatch(/per (maand|month)[^.]{0,20}€/i);
    }
  });

  /**
   * `SEO/facts.md` §9's do-not-publish list. Both figures are stated by every competitor and
   * sourceable by none; refusing them is the wedge, and the file says so in prose — so it must not
   * then contain them.
   */
  it('states the unsourceable pass norms only in order to refuse them', () => {
    expect(index).toContain('are not\n  sourceable');
    expect(full).not.toMatch(/18 (van|of) de? ?25/);
    expect(full).not.toMatch(/500 punten/);
  });

  it('points at the corpus and the sitemap', () => {
    expect(index).toContain('https://inburgeringoefenen.nl/llms-full.txt');
  });
});

describe('llms-full.txt', () => {
  it('carries every published guide with its URL and review provenance', () => {
    for (const guide of publishedGuides()) {
      expect(full, `${guide.slug} missing`).toContain(
        `URL: https://inburgeringoefenen.nl/nl/${guide.section}/${guide.slug}`,
      );
      if (guide.reviewedBy) expect(full).toContain(`Reviewed by: ${guide.reviewedBy}`);
    }
  });

  /**
   * The corpus is plain text. Leftover markup is not cosmetic here: a model quoting a passage
   * would quote the tag with it, and an undecoded entity lands five literal characters in the
   * middle of a Dutch word.
   */
  it('leaves no markup or undecoded entities behind', () => {
    expect(full).not.toMatch(/<\/?(p|div|span|strong|em|svg|h2|h3|figure|a)\b/i);
    expect(full).not.toMatch(/&[a-zA-Z]+;|&#\d+;/);
  });

  /** Never the scoring side of the product: exam items, model answers, rubric anchors. */
  it('contains no exam content', () => {
    expect(full).not.toContain('model_answer');
    expect(full).not.toMatch(/\bjuist antwoord:\s*[A-D]\b/i);
  });
});

describe('robots.txt', () => {
  /**
   * The bug this exists for: a `robots.txt` group **replaces** `User-agent: *`, it does not extend
   * it. The hand-written file had `User-agent: GPTBot` followed by `Allow: /` and nothing else, so
   * the six crawlers most likely to visit were the six exempt from every `Disallow` — including
   * `/admin` and `/login`. It is generated from one list now, and this is what stops a future
   * hand-added group from reintroducing it.
   */
  it('repeats every Disallow inside every named agent group', async () => {
    const body = await (await robotsGet()).text();
    const groups = body
      .split(/\n\n+/)
      .filter(block => /^(#[^\n]*\n)?User-agent:/m.test(block));

    expect(groups.length).toBeGreaterThan(5);
    for (const block of groups) {
      const agents = [...block.matchAll(/^User-agent: (.+)$/gm)].map(m => m[1]);
      expect(agents.length, `a group with no agent:\n${block}`).toBeGreaterThan(0);
      for (const path of ['/*/admin', '/*/login', '/*/dashboard', '/api/']) {
        expect(block, `${agents.join(', ')} is not disallowed ${path}`).toContain(`Disallow: ${path}`);
      }
    }
  });

  /** A typo'd user agent is a group that matches nothing while reading like a decision. */
  it('uses the vendors\' real tokens', async () => {
    const body = await (await robotsGet()).text();
    expect(body).toContain('User-agent: Google-Extended');
    expect(body, 'Googlebot-Extended is not a token').not.toContain('Googlebot-Extended');
    for (const agent of ['GPTBot', 'OAI-SearchBot', 'ClaudeBot', 'Claude-User', 'PerplexityBot', 'CCBot']) {
      expect(body).toContain(`User-agent: ${agent}`);
    }
  });

  it('points at the sitemap and the two llms files', async () => {
    const body = await (await robotsGet()).text();
    expect(body).toContain('Sitemap: https://inburgeringoefenen.nl/sitemap.xml');
    expect(body).toContain('/llms.txt');
    expect(body).toContain('/llms-full.txt');
  });
});
