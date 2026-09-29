import { useEffect, useMemo, useState } from 'react';
import TourScene from './TourScene';
import { planFromObservation } from './fromPhotos';
import { generatePlan, DEFAULT_SPEC } from './generate';
import { goTo } from './engine/controls';
import { encodedFromLocation, unpackSpec, whatsappLink } from './share';
import { LANGS, pickLang } from './strings';
import Sheet from '../ui/Sheet';

const DEMO = {
  ...DEFAULT_SPEC,
  title: 'דירת 3 חדרים משופצת',
  address: 'רחוב הרצל 12, תל אביב',
  price: '₪2,450,000',
  size: 78,
  floor: '4',
  bedrooms: 2,
  bathrooms: 1,
  agent: { name: 'ישראל ישראלי', agency: 'נדל״ן פלוס', phone: '0501234567' },
};

/** Icons for the room kinds the survey can return. */
const KIND_ICON = {
  entry: '🚪', hall: '🚪', living: '🛋️', kitchen: '🍳', dining: '🍽️',
  bedroom: '🛏️', bathroom: '🚿', wc: '🚽', balcony: '🌿', study: '📚', utility: '🧺',
};

const ROOM_ICON = {
  living: '🛋️',
  master: '🛏️',
  bedroom2: '🛏️',
  bedroom3: '🛏️',
  bedroom4: '🛏️',
  bath: '🚿',
  bath2: '🚽',
  kitchen: '🍳',
};

export default function TourApp() {
  const lang = pickLang();
  const T = LANGS[lang];
  // the property is gzipped into the link, so unpacking it is asynchronous
  const [spec, setSpec] = useState(null);
  const [active, setActive] = useState('entrance');
  const [details, setDetails] = useState(false);

  useEffect(() => {
    let alive = true;
    unpackSpec(encodedFromLocation()).then((s) => {
      if (alive) setSpec(s || DEMO);
    });
    return () => {
      alive = false;
    };
  }, []);

  /**
   * A surveyed home is built from what the photographs showed. A link made
   * before the survey existed, or without photographs, still describes a flat
   * by its shape, and that is generated as before.
   */
  const plan = useMemo(() => {
    if (!spec) return null;
    if (spec.observation) {
      try {
        return planFromObservation(spec.observation);
      } catch {
        return generatePlan(spec);
      }
    }
    return generatePlan(spec);
  }, [spec]);

  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = T.dir;
    if (spec?.title) document.title = spec.title;
  }, [lang, T.dir, spec?.title]);

  if (!spec || !plan) {
    return (
      <div className="fixed inset-0 bg-[#0d1017] grid place-items-center">
        <span className="w-8 h-8 rounded-full border-2 border-brand border-t-transparent animate-spin" />
      </div>
    );
  }

  const photos = Array.isArray(spec.photos) ? spec.photos.filter(Boolean) : [];
  const wa = whatsappLink(
    spec.agent?.phone,
    `${lang === 'he' ? 'היי, ראיתי את הסיור של' : 'Hi, I saw the tour of'} ${spec.title || spec.address || ''}`
  );

  const stops = [
    { id: 'entrance', icon: '🚪', label: T.entrance, x: plan.spawn.x, z: plan.spawn.z, yaw: Math.PI },
    ...plan.rooms.map((r) => ({
      id: r.id,
      // a surveyed room already knows what it is called, in both languages
      icon: (r.observed ? KIND_ICON[r.type] : ROOM_ICON[r.id]) ?? '🚪',
      label: r.observed
        ? (lang === 'he' ? r.observed.nameHe : r.observed.nameEn)
        : r.id === 'living'
          ? (spec.openKitchen ? T.living : T.livingClosed)
          : T[r.id] || r.id,
      x: r.view.x,
      z: r.view.z,
      yaw: r.view.yaw,
      pitch: r.view.pitch,
    })),
  ];

  return (
    <div className="fixed inset-0 bg-[#0d1017] overflow-hidden touch-none select-none">
      <TourScene
        plan={plan}
        compact
        stickBottom="calc(9.4rem + env(safe-area-inset-bottom, 0px))"
      />

      {/* property header */}
      <header className="ui-layer absolute top-0 inset-x-0 z-20 pointer-events-none px-3 pt-[calc(0.5rem+env(safe-area-inset-top,0px))]">
        <div className="max-w-2xl mx-auto flex items-start gap-2">
          <button
            type="button"
            onClick={() => setDetails(true)}
            className="pointer-events-auto flex-1 min-w-0 text-start rounded-2xl bg-ink-800/85 backdrop-blur-md
              border border-ink-line shadow-chip px-3.5 py-2 active:scale-[0.99] transition-transform"
          >
            <div className="text-[13px] font-black text-white truncate">
              {spec.title || T.tour}
            </div>
            <div className="text-[11px] text-white/55 truncate">{spec.address}</div>
          </button>
          {spec.price && (
            <span className="shrink-0 h-10 px-3.5 rounded-2xl bg-brand text-white font-black text-[13px] grid place-items-center shadow-fab">
              {spec.price}
            </span>
          )}
        </div>
      </header>

      {/* room stops */}
      <nav className="ui-layer absolute z-20 inset-x-0 bottom-[calc(4.9rem+env(safe-area-inset-bottom,0px))] px-3">
        <div className="max-w-2xl mx-auto flex gap-1.5 overflow-x-auto pb-1 [scrollbar-width:none]">
          {stops.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => {
                goTo(s);
                setActive(s.id);
              }}
              className={`shrink-0 h-9 ps-2.5 pe-3 rounded-full flex items-center gap-1.5 border backdrop-blur-md
                text-[12.5px] font-bold transition-colors ${
                  active === s.id
                    ? 'bg-brand text-white border-brand shadow-fab'
                    : 'bg-ink-800/80 text-white/90 border-ink-line shadow-chip'
                }`}
            >
              <span className="text-sm leading-none">{s.icon}</span>
              {s.label}
            </button>
          ))}
        </div>
      </nav>

      {/* the agent, always one tap away */}
      <footer className="ui-layer absolute z-20 inset-x-0 bottom-0 px-3 pb-[calc(0.6rem+env(safe-area-inset-bottom,0px))]">
        <div className="max-w-2xl mx-auto flex items-center gap-2 rounded-2xl bg-ink-800/90 backdrop-blur-md border border-ink-line shadow-chip px-3 py-2">
          <span className="w-8 h-8 rounded-full bg-brand/20 grid place-items-center text-sm shrink-0">🧑‍💼</span>
          <span className="min-w-0 flex-1">
            <span className="block text-[12.5px] font-bold text-white truncate">
              {spec.agent?.name || '—'}
            </span>
            <span className="block text-[11px] text-white/50 truncate">{spec.agent?.agency}</span>
          </span>
          {wa && (
            <a
              href={wa}
              target="_blank"
              rel="noreferrer"
              className="shrink-0 h-9 px-4 rounded-full bg-brand text-white font-bold text-[13px] grid place-items-center shadow-fab"
            >
              {T.contact}
            </a>
          )}
        </div>
      </footer>

      <Sheet open={details} onClose={() => setDetails(false)} tone="paper" labelledBy="d-title">
        <div className="px-4 pb-5 pt-1 md:pt-5">
          <h2 id="d-title" className="text-lg font-black text-ink-900">
            {spec.title || T.details}
          </h2>
          <p className="text-[12.5px] text-paper-muted mb-4">{spec.address}</p>

          <div className="grid grid-cols-3 gap-2 mb-4">
            {[
              { k: T.rooms, v: spec.bedrooms + 1 },
              { k: T.size, v: `${spec.size} ${T.sqm}` },
              { k: T.floor, v: spec.floor || '—' },
            ].map((s) => (
              <div key={s.k} className="rounded-2xl bg-paper-50 border border-paper-200 p-3 text-center">
                <div className="text-[15px] font-black text-ink-900">{s.v}</div>
                <div className="text-[11px] text-paper-muted mt-0.5">{s.k}</div>
              </div>
            ))}
          </div>

          <div className="flex flex-wrap gap-1.5 mb-4">
            {spec.openKitchen && <Tag>{T.openKitchen}</Tag>}
            {spec.balcony && <Tag>{T.balcony}</Tag>}
            <Tag>{`${spec.bathrooms} ${T.bathroomsLabel ?? ''}`}</Tag>
          </div>

          {photos.length > 0 && (
            <>
              <h3 className="text-[11px] font-black uppercase tracking-wide text-paper-muted mb-2">
                {T.photos}
              </h3>
              <div className="flex gap-2 overflow-x-auto pb-2 mb-3 [scrollbar-width:none]">
                {photos.map((url) => (
                  <img
                    key={url}
                    src={url}
                    alt=""
                    className="h-28 rounded-xl object-cover shrink-0 border border-paper-200"
                  />
                ))}
              </div>
            </>
          )}

          <p className="text-[11px] text-paper-muted leading-snug">{T.note}</p>
        </div>
      </Sheet>
    </div>
  );
}

const Tag = ({ children }) => (
  <span className="px-2.5 py-1 rounded-full bg-paper-100 text-ink-900 text-[12px] font-bold">
    {children}
  </span>
);
