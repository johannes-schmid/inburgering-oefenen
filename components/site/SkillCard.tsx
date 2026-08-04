import { DEFAULT_LEVEL, type Skill } from '@/data/skills';
import { ArrowRight } from 'lucide-react';
import SkillIcon from './SkillIcon';

type Props = {
  skill: Skill;
  name: string;
  tagline: string;
  /** e.g. "10 oefenexamens" */
  examsLabel: string;
  /** e.g. "25 vragen" */
  itemsLabel: string;
  /** e.g. "65 minuten" */
  durationLabel: string;
  freeNote: string;
  cta: string;
};

/**
 * One of the four A2 exam components on the homepage / overview grid.
 * Links to the skill's exam overview at /oefenexamen/{level}/{slug}. A2 only — this card
 * is a marketing component and the homepage that renders it sells A2.
 */
export default function SkillCard({
  skill, name, tagline, examsLabel, itemsLabel, durationLabel, freeNote, cta,
}: Props) {
  return (
    <a
      href={`/oefenexamen/${DEFAULT_LEVEL}/${skill.slug}`}
      className="skill-card group flex flex-col gap-4 p-7 rounded-2xl bg-surface-container-lowest no-underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-secondary-container"
      style={{ boxShadow: 'var(--shadow-card-md)' }}
    >
      <div className="flex items-start justify-between gap-3">
        <SkillIcon skill={skill.slug} size="lg" />
        <span
          className="text-[0.68rem] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full"
          style={{ background: '#f0fdf4', color: '#15803d' }}
        >
          {freeNote}
        </span>
      </div>

      <div>
        <h3 className="font-headline font-bold text-on-surface text-lg mb-1.5 tracking-tight">{name}</h3>
        <p className="text-sm text-on-surface-variant leading-relaxed">{tagline}</p>
      </div>

      <dl className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-on-surface-variant mt-auto pt-1">
        <div className="flex items-center gap-1.5">
          <dt className="sr-only">Oefenexamens</dt>
          <dd className="font-semibold text-on-surface">{examsLabel}</dd>
        </div>
        <span aria-hidden="true" className="text-outline-variant">·</span>
        <div className="flex items-center gap-1.5">
          <dt className="sr-only">Opgaven</dt>
          <dd>{itemsLabel}</dd>
        </div>
        <span aria-hidden="true" className="text-outline-variant">·</span>
        <div className="flex items-center gap-1.5">
          <dt className="sr-only">Duur</dt>
          <dd>{durationLabel}</dd>
        </div>
      </dl>

      <span className="skill-card-cta inline-flex items-center gap-1.5 text-sm font-semibold" style={{ color: '#a24000' }}>
        {cta}
        <ArrowRight size={15} strokeWidth={2.2} aria-hidden="true" />
      </span>
    </a>
  );
}
