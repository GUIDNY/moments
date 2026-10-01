import { useState } from 'react';
import { useI18n } from '../i18n/I18nContext';
import { useCity } from '../stocks/CityContext';
import Sheet from '../ui/Sheet';
import { GLOSSARY, LESSONS, MISSIONS } from './content';

/**
 * The classroom: the missions in order with the live one marked, every
 * lesson (read ones open again; unread ones say what will open them), and
 * the glossary. The missions are the path; the rest is for looking things up.
 */
export default function LearnScreen({ open, onClose }) {
  const { t, loc } = useI18n();
  const { progress, readLesson } = useCity();
  const [tab, setTab] = useState('missions');
  const done = new Set(progress.missions);
  const read = new Set(progress.lessons);
  const live = MISSIONS.find((m) => !done.has(m.id))?.id ?? null;

  const tabs = [
    ['missions', t('learn.missions')],
    ['lessons', t('learn.lessons')],
    ['glossary', t('learn.glossary')],
  ];

  return (
    <Sheet open={open} onClose={onClose} title={t('learn.title')} tone="paper">
      <div className="flex gap-1.5 -mt-1 mb-3">
        {tabs.map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            className={`h-9 px-3.5 rounded-xl text-[13px] font-bold border transition-colors ${
              tab === id ? 'bg-brand text-white border-brand' : 'bg-paper-50 text-ink-900/70 border-paper-200'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === 'missions' && (
        <ol className="space-y-2">
          {MISSIONS.map((m, i) => {
            const isDone = done.has(m.id);
            const isLive = m.id === live;
            return (
              <li
                key={m.id}
                className={`rounded-2xl border p-3 flex items-start gap-3 ${
                  isLive ? 'bg-white border-brand shadow-card' : isDone ? 'bg-paper-50 border-paper-200' : 'bg-paper-50 border-paper-200 opacity-60'
                }`}
              >
                <span className="text-2xl leading-none">{isDone ? '✅' : m.emoji}</span>
                <div className="min-w-0 flex-1">
                  <div className="text-[13.5px] font-black text-ink-900 leading-tight">
                    {i + 1}. {loc(m.title)}
                  </div>
                  <div className="text-[12px] text-paper-muted leading-snug mt-0.5">{loc(m.why)}</div>
                </div>
                {isDone && <span className="text-[11px] font-bold text-paper-muted shrink-0">{t('learn.done')}</span>}
              </li>
            );
          })}
          {!live && <p className="text-[13px] font-bold text-brand-deep px-1">{t('learn.allDone')}</p>}
        </ol>
      )}

      {tab === 'lessons' && (
        <ul className="space-y-2">
          {LESSONS.map((l) => {
            const seen = read.has(l.id);
            return (
              <li key={l.id}>
                <button
                  type="button"
                  disabled={!seen}
                  onClick={() => {
                    onClose();
                    readLesson(l.id);
                  }}
                  className={`w-full rounded-2xl border p-3 flex items-center gap-3 text-start ${
                    seen ? 'bg-white border-paper-200 shadow-card active:scale-[0.99] transition-transform' : 'bg-paper-50 border-paper-200 opacity-60'
                  }`}
                >
                  <span className={`text-2xl leading-none ${seen ? '' : 'grayscale'}`}>{l.emoji}</span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-[13.5px] font-black text-ink-900 leading-tight">{loc(l.title)}</span>
                    {!seen && <span className="block text-[11.5px] text-paper-muted">{t('learn.locked')}</span>}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}

      {tab === 'glossary' && (
        <dl className="space-y-2.5">
          {GLOSSARY.map((g, i) => (
            <div key={i} className="rounded-2xl bg-paper-50 border border-paper-200 p-3">
              <dt className="text-[13.5px] font-black text-ink-900">{loc(g.term)}</dt>
              <dd className="text-[12.5px] text-ink-900/75 leading-snug mt-0.5">{loc(g.def)}</dd>
            </div>
          ))}
        </dl>
      )}

      <p className="text-[11px] text-paper-muted mt-4 leading-snug">{t('learn.notAdvice')}</p>
    </Sheet>
  );
}
