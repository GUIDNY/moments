import { useState } from 'react';
import { ExternalLink, Newspaper } from 'lucide-react';
import Sheet from '../Sheet';
import { useI18n } from '../../i18n/I18nContext';
import { useCity } from '../../stocks/CityContext';
import { SECTOR_BY_ID } from '../../stocks/catalog';
import { ago } from '../../stocks/news';

/** Every headline the board cycles, as a list: the stocks held, or the
    market. Each opens the paper in a new tab. */
export default function NewsSheet({ open, onClose }) {
  const { t, loc, lang } = useI18n();
  const { news, holdingOf } = useCity();
  const [kind, setKind] = useState('stock');
  const items = news.items.filter((i) => (kind === 'stock' ? i.kind === 'stock' : i.kind === 'market'));
  if (!open) return null;
  return (
    <Sheet open onClose={onClose} title={`📰 ${t('news.title')}`} tone="paper">
      <div className="flex gap-1.5 mb-3">
        {[['stock', t('news.mine')], ['market', t('news.market')]].map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => setKind(id)}
            className={`h-9 px-3.5 rounded-xl text-[12.5px] font-black ${kind === id ? 'bg-brand/12 text-brand-deep' : 'bg-paper-50 border border-paper-200 text-ink-900/70'}`}
          >
            {label}
          </button>
        ))}
      </div>
      {items.length === 0 ? (
        <p className="text-[13px] text-paper-muted py-6 text-center">{t('news.empty')}</p>
      ) : (
        <ul className="space-y-1.5 max-h-[60vh] overflow-y-auto -mx-1 px-1">
          {items.map((i) => {
            const h = i.symbol ? holdingOf(i.symbol) : null;
            const sector = h ? SECTOR_BY_ID[h.sector] : null;
            const hebrew = /[\u0590-\u05ff]/.test(i.title);
            return (
              <li key={i.id}>
                <a
                  href={i.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block rounded-2xl bg-white border border-paper-200 px-3 py-2.5 active:bg-paper-50"
                >
                  <span className="flex items-center gap-2 text-[10.5px] font-bold text-paper-muted">
                    {h && (
                      <span className="px-1.5 py-0.5 rounded-md text-ink-900 font-black" style={{ background: `${sector?.color ?? '#c1c1ff'}55` }}>
                        {loc(h.name) || i.symbol}
                      </span>
                    )}
                    {i.source && <span>{i.source}</span>}
                    <span>·</span>
                    <span>{ago(i.at, lang)}</span>
                    <ExternalLink size={11} className="ms-auto" aria-hidden="true" />
                  </span>
                  <span dir={hebrew ? 'rtl' : 'ltr'} className="block mt-1 text-[13.5px] font-bold text-ink-900 leading-snug text-start">{i.title}</span>
                </a>
              </li>
            );
          })}
        </ul>
      )}
      <p className="text-[11px] text-paper-muted mt-3 flex items-center gap-1.5"><Newspaper size={12} aria-hidden="true" />{t('news.source')}</p>
    </Sheet>
  );
}
