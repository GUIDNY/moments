import { useI18n } from '../i18n/I18nContext';
import { LESSON_BY_ID, MISSION_BY_ID } from './content';
import Sheet from '../ui/Sheet';

/**
 * One lesson, or one completed mission, on screen at a time. A mission card
 * says what you did and why it mattered, with a button to its lesson; a
 * lesson is a few paragraphs and one tip, and reading it is what marks it
 * read — nothing here is skippable by accident.
 */
export default function LessonSheet({ item, onDone, onReadLesson }) {
  const { t, loc } = useI18n();
  if (!item) return null;

  if (item.kind === 'mission') {
    const m = MISSION_BY_ID[item.id];
    if (!m) return null;
    return (
      <Sheet open onClose={onDone} title={t('mission.done', { name: loc(m.title) })} tone="paper">
        <div className="flex items-start gap-3">
          <span className="text-4xl leading-none">{m.emoji}</span>
          <p className="text-[14px] text-ink-900/80 leading-relaxed">{loc(m.why)}</p>
        </div>
        <div className="flex gap-2 mt-4">
          <button type="button" onClick={onDone} className="flex-1 h-11 rounded-2xl bg-paper-100 text-ink-900 font-bold text-[13px]">
            {t('learn.gotIt')}
          </button>
          {m.lesson && (
            <button
              type="button"
              onClick={() => {
                onDone();
                onReadLesson(m.lesson);
              }}
              className="flex-[2] h-11 rounded-2xl bg-brand text-white font-black text-[14px]"
            >
              {t('learn.next')}
            </button>
          )}
        </div>
      </Sheet>
    );
  }

  const l = LESSON_BY_ID[item.id];
  if (!l) return null;
  return (
    <Sheet open onClose={onDone} title={`${l.emoji} ${loc(l.title)}`} tone="paper">
      <div className="space-y-3">
        {loc(l.body).map((p, i) => (
          <p key={i} className="text-[14px] text-ink-900/85 leading-relaxed">
            {p}
          </p>
        ))}
        {l.tip && (
          <p className="text-[13px] font-bold text-brand-deep bg-brand/10 rounded-2xl px-3 py-2.5">💡 {loc(l.tip)}</p>
        )}
      </div>
      <p className="text-[11px] text-paper-muted mt-3 leading-snug">{t('learn.notAdvice')}</p>
      <button type="button" onClick={onDone} className="w-full h-11 mt-3 rounded-2xl bg-brand text-white font-black text-[14px]">
        {t('learn.gotIt')}
      </button>
    </Sheet>
  );
}
