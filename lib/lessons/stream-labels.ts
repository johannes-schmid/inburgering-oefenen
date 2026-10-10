import { getTranslations } from 'next-intl/server';
import type { StreamLabels } from '@/components/lessons/LessonStream';

/**
 * De labels van `LessonStream`, op één plek.
 *
 * Twee pagina's renderen de stroom — de les (`leren/[lesSlug]`) en het grammaticaonderwerp
 * (`grammatica/[n]`) — en een tweede kopie van deze veertig regels loopt uit de pas zodra er
 * één sleutel bij komt. Server-only: hij leest de vertalingen.
 *
 * `t.raw` waar de string placeholders draagt die pas in de client bekend zijn ({done},
 * {total}, {n}): next-intl weigert een bericht met onopgevulde placeholders en gaf dan de
 * sleutel in kapitalen terug midden op de pagina. De client vult ze met `.replace()`.
 */
export async function lessonStreamLabels(): Promise<StreamLabels> {
  const t = await getTranslations('lessons');
  const tg = await getTranslations('grammar');
  return {
    check: t('check'),
    correct: t('correct'),
    wrong: t('wrong'),
    why: t('why'),
    again: t('again'),
    showAnswer: t('show_answer'),
    modelAnswer: t('model_answer'),
    compare: t('compare'),
    progress: t.raw('stream_progress') as string,
    yourAnswer: t('mark_pick'),
    ruleKick: t('rule_kick'),
    demoKick: t('demo_kick'),
    demoCount: t.raw('demo_count') as string,
    learnHead: t('section_learn'),
    learnSub: t('section_learn_sub'),
    practiceHead: t('section_practice'),
    exHead: t('ex_head'),
    exSub: t('ex_sub'),
    exOf: t.raw('ex_of') as string,
    exGoto: t.raw('ex_goto') as string,
    exPrev: t('ex_prev'),
    exNext: t('ex_next'),
    exNextItem: t('ex_next_item'),
    exSkip: t('ex_skip'),
    tierHeads: [t('tier_0_head'), t('tier_1_head'), t('tier_2_head')],
    tierSubs: [t('tier_0_sub'), t('tier_1_sub'), t('tier_2_sub')],
    tierOther: t('tier_other_head'),
    visual: {
      kicker: t('visual_kicker'),
      walk: t('visual_walk'),
      walkStop: t('visual_walk_stop'),
      step: t.raw('visual_step') as string,
    },
    recorder: {
      record: t('rec_record'),
      stop: t('rec_stop'),
      again: t('rec_again'),
      recording: t('rec_recording'),
      heard: t('rec_heard'),
      heardNote: t('rec_heard_note'),
      noMic: t('rec_no_mic'),
      noRecorder: t('rec_no_recorder'),
      seconds: t('rec_seconds'),
    },
    sayAfter: t('say_after'),
    sayFocus: t('say_focus'),
    audioTodo: t('audio_todo'),
    video: {
      play: tg('video_play'),
      soon: tg('video_soon'),
      soonSub: null,
    },
  };
}
