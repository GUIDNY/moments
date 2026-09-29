import { useEffect, useMemo, useState } from 'react';
import PhotoUploader from '../upload/PhotoUploader';
import TourScene from './TourScene';
import { readDraft, saveDraft } from './draft';
import { planFromObservation } from './fromPhotos';
import { DEFAULT_SPEC, generatePlan, normaliseSpec } from './generate';
import { tourUrlAsync, whatsappLink } from './share';
import { LANGS, pickLang } from './strings';

const START = {
  ...DEFAULT_SPEC,
  title: 'דירת 3 חדרים משופצת',
  address: 'רחוב הרצל 12, תל אביב',
  price: '₪2,450,000',
  floor: '4',
  agent: { name: '', agency: '', phone: '' },
};

function Field({ label, children }) {
  return (
    <label className="block">
      <span className="block text-[11.5px] font-bold text-paper-muted mb-1">{label}</span>
      {children}
    </label>
  );
}

const inputClass =
  'w-full h-11 px-3 rounded-xl bg-paper-50 border border-paper-200 text-ink-900 text-[14px] ' +
  'outline-none focus:border-brand focus:bg-paper transition-colors';

function Stepper({ value, onChange, min = 0, max = 4 }) {
  const btn =
    'w-11 h-11 rounded-xl bg-paper-100 text-ink-900 text-lg font-black active:scale-95 transition-transform disabled:opacity-35';
  return (
    <div className="flex items-center gap-2">
      <button type="button" className={btn} disabled={value <= min} onClick={() => onChange(value - 1)}>
        −
      </button>
      <span className="flex-1 h-11 rounded-xl bg-paper-50 border border-paper-200 grid place-items-center text-[15px] font-black text-ink-900">
        {value}
      </span>
      <button type="button" className={btn} disabled={value >= max} onClick={() => onChange(value + 1)}>
        +
      </button>
    </div>
  );
}

function Toggle({ label, on, onChange }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!on)}
      className={`h-11 px-4 rounded-xl border text-[13px] font-bold transition-colors ${
        on ? 'bg-brand text-white border-brand' : 'bg-paper-50 text-paper-muted border-paper-200'
      }`}
    >
      {label}
    </button>
  );
}

export default function StudioApp() {
  const lang = pickLang();
  const T = LANGS[lang];
  const [spec, setSpec] = useState(START);
  // photographs uploaded on the landing page are waiting here; anything added
  // below joins them
  const [photos, setPhotos] = useState(() => readDraft().photos || []);
  // what the survey read out of the photographs, if the agent came that way
  const [observation] = useState(() => readDraft().observation || null);
  const [link, setLink] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = T.dir;
  }, [lang, T.dir]);

  const set = (patch) => setSpec((s) => ({ ...s, ...patch }));
  const setAgent = (patch) => setSpec((s) => ({ ...s, agent: { ...s.agent, ...patch } }));

  // only rebuild the model when something structural changes, so typing a
  // title does not throw the preview camera back to the front door
  const shapeKey = observation
    ? 'surveyed'
    : `${spec.bedrooms}-${spec.bathrooms}-${spec.size}-${spec.openKitchen}-${spec.balcony}`;

  /**
   * A surveyed home wins over the form every time: the form describes a flat
   * that could exist, the survey describes the one in the photographs. The form
   * below stays for the things a photograph cannot tell you — the price, the
   * address, who to ring.
   */
  const plan = useMemo(() => {
    if (observation) {
      try {
        return planFromObservation(observation);
      } catch {
        // a survey we cannot build is worse than no survey
        return generatePlan(spec);
      }
    }
    return generatePlan(spec);
  }, [shapeKey, observation]); // eslint-disable-line react-hooks/exhaustive-deps

  // keep the draft in step, so a reload or a trip back to the landing page
  // does not lose an upload the agent already waited for
  useEffect(() => {
    saveDraft({ photos });
  }, [photos]);

  const build = async () => {
    const clean = normaliseSpec({ ...spec, photos });
    if (observation) clean.observation = observation;
    const url = await tourUrlAsync(clean);
    setLink(url);
    setCopied(false);
    navigator.clipboard?.writeText(url).then(
      () => setCopied(true),
      () => {}
    );
  };

  const wa = link
    ? whatsappLink(spec.agent.phone || '0500000000', `${spec.title || ''}\n${link}`)
    : null;

  return (
    <div className="fixed inset-0 bg-ink-900 text-ink-900 overflow-hidden flex flex-col md:flex-row">
      {/* live model */}
      <div className="relative h-[38vh] md:h-full md:flex-1 shrink-0 bg-[#0d1017]">
        <TourScene key={shapeKey} plan={plan} compact />
        <span className="ui-layer absolute top-3 start-3 z-20 h-8 px-3 rounded-full bg-ink-800/85 backdrop-blur-md border border-ink-line text-[11.5px] font-bold text-white grid place-items-center">
          {observation ? T.surveyed : T.preview} · {plan.area} {T.sqm}
        </span>
      </div>

      {/* the form */}
      <div className="flex-1 md:flex-none md:w-[420px] bg-paper overflow-y-auto">
        <div className="p-4 pb-[calc(1.5rem+env(safe-area-inset-bottom,0px))] space-y-5">
          <div>
            <h1 className="text-xl font-black text-ink-900">{T.studioTitle}</h1>
            <p className="text-[12.5px] text-paper-muted">{T.studioSub}</p>
          </div>

          <section className="space-y-3">
            <h2 className="text-[11px] font-black uppercase tracking-wide text-paper-muted">
              {T.property}
            </h2>
            <Field label={T.title}>
              <input className={inputClass} value={spec.title} onChange={(e) => set({ title: e.target.value })} />
            </Field>
            <Field label={T.address}>
              <input className={inputClass} value={spec.address} onChange={(e) => set({ address: e.target.value })} />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label={T.price}>
                <input className={inputClass} value={spec.price} onChange={(e) => set({ price: e.target.value })} />
              </Field>
              <Field label={T.floorLabel}>
                <input className={inputClass} value={spec.floor} onChange={(e) => set({ floor: e.target.value })} />
              </Field>
            </div>
            {observation && (
              <div className="rounded-xl bg-paper-50 border border-paper-200 p-3">
                <div className="text-[11px] font-black text-paper-muted mb-1.5">{T.roomsFound}</div>
                <div className="flex flex-wrap gap-1.5">
                  {plan.rooms.map((r) => (
                    <span
                      key={r.id}
                      className="h-7 px-2.5 rounded-lg bg-paper text-ink-900 border border-paper-200 text-[11.5px] font-bold grid place-items-center"
                    >
                      {lang === 'he' ? r.observed.nameHe : r.observed.nameEn} ·{' '}
                      {Math.round(r.observed.widthM * r.observed.depthM)} {T.sqm}
                    </span>
                  ))}
                </div>
              </div>
            )}
            {/* the shape controls describe a flat; once one has been surveyed
                they would only argue with it, so they step aside */}
            {!observation && (
              <>
                <Field label={`${T.sizeLabel} — ${spec.size}`}>
                  <input
                    type="range"
                    min="28"
                    max="220"
                    value={spec.size}
                    onChange={(e) => set({ size: Number(e.target.value) })}
                    className="w-full accent-brand h-11"
                  />
                </Field>
                <div className="grid grid-cols-2 gap-3">
                  <Field label={T.bedroomsLabel}>
                    <Stepper value={spec.bedrooms} onChange={(v) => set({ bedrooms: v })} min={0} max={4} />
                  </Field>
                  <Field label={T.bathroomsLabel}>
                    <Stepper value={spec.bathrooms} onChange={(v) => set({ bathrooms: v })} min={1} max={3} />
                  </Field>
                </div>
                <div className="flex gap-2">
                  <Toggle label={T.openKitchen} on={spec.openKitchen} onChange={(v) => set({ openKitchen: v })} />
                  <Toggle label={T.balcony} on={spec.balcony} onChange={(v) => set({ balcony: v })} />
                </div>
              </>
            )}
          </section>

          <section className="space-y-3">
            <h2 className="text-[11px] font-black uppercase tracking-wide text-paper-muted">
              {T.agentSection}
            </h2>
            <div className="grid grid-cols-2 gap-3">
              <Field label={T.agentName}>
                <input className={inputClass} value={spec.agent.name} onChange={(e) => setAgent({ name: e.target.value })} />
              </Field>
              <Field label={T.agency}>
                <input className={inputClass} value={spec.agent.agency} onChange={(e) => setAgent({ agency: e.target.value })} />
              </Field>
            </div>
            <Field label={T.phone}>
              <input
                className={inputClass}
                inputMode="tel"
                dir="ltr"
                value={spec.agent.phone}
                onChange={(e) => setAgent({ phone: e.target.value })}
              />
            </Field>
          </section>

          <section className="space-y-3">
            <h2 className="text-[11px] font-black uppercase tracking-wide text-paper-muted">
              {T.photosLabel}
            </h2>
            <PhotoUploader value={photos} onChange={setPhotos} T={T} max={8} compact />
          </section>

          <button
            type="button"
            onClick={build}
            className="w-full h-12 rounded-2xl bg-brand text-white font-black text-[15px] shadow-fab active:scale-[0.99] transition-transform"
          >
            {T.createLink}
          </button>

          {link && (
            <div className="rounded-2xl border border-paper-200 bg-paper-50 p-3 space-y-2 animate-pop-in">
              <div className="text-[11px] font-black text-paper-muted">
                {copied ? T.copied : T.linkReady}
              </div>
              <div dir="ltr" className="text-[11px] text-ink-900/70 break-all bg-paper rounded-lg p-2 border border-paper-200 max-h-24 overflow-y-auto">
                {link}
              </div>
              <div className="flex gap-2">
                <a
                  href={link}
                  target="_blank"
                  rel="noreferrer"
                  className="flex-1 h-11 rounded-xl bg-paper-100 text-ink-900 font-bold text-[13px] grid place-items-center"
                >
                  {T.openTour}
                </a>
                {wa && (
                  <a
                    href={wa}
                    target="_blank"
                    rel="noreferrer"
                    className="flex-1 h-11 rounded-xl bg-[#25d366] text-white font-bold text-[13px] grid place-items-center"
                  >
                    {T.sendWhatsapp}
                  </a>
                )}
              </div>
            </div>
          )}

          <p className="text-[11px] text-paper-muted leading-snug">{T.note}</p>
        </div>
      </div>
    </div>
  );
}
