import { useEffect, useRef, useState } from 'react';
import { saveDraft } from '../tour/draft';
import { siblingPage } from '../tour/share';
import { LANGS, pickLang } from '../tour/strings';
import { surveyPhotos } from '../tour/survey';
import PhotoUploader from '../upload/PhotoUploader';

/**
 * The front door of the agent product.
 *
 * It asks for exactly one thing — the photographs — because that is the part an
 * agent already has in their pocket and the part that takes longest. By the
 * time they reach the builder the uploads have finished in the background, so
 * the form feels instant.
 *
 * Everything below the fold is there to answer "what am I actually getting",
 * including the honesty note: this is a model of the layout, not a scan of the
 * flat. Saying so here costs one paragraph and saves an angry phone call.
 */

function Step({ n, title, body }) {
  return (
    <li className="flex gap-3">
      <span className="shrink-0 w-8 h-8 rounded-full bg-brand/15 text-brand grid place-items-center text-[14px] font-black">
        {n}
      </span>
      <div className="pt-0.5">
        <h3 className="text-[14px] font-black text-white">{title}</h3>
        <p className="text-[12.5px] text-white/55 leading-snug mt-0.5">{body}</p>
      </div>
    </li>
  );
}

function Reason({ title, body }) {
  return (
    <div className="rounded-2xl bg-ink-800 border border-ink-line p-4">
      <h3 className="text-[13.5px] font-black text-white">{title}</h3>
      <p className="text-[12.5px] text-white/55 leading-snug mt-1">{body}</p>
    </div>
  );
}

/** What the survey is doing, roughly, while it does it. */
function Progress({ T }) {
  const steps = [T.readingStep1, T.readingStep2, T.readingStep3, T.readingStep4];
  const [at, setAt] = useState(0);
  useEffect(() => {
    // the endpoint is one call and cannot report progress, so rather than a
    // spinner that says nothing, walk the stages it is actually working through
    const id = setInterval(() => setAt((i) => Math.min(steps.length - 1, i + 1)), 9000);
    return () => clearInterval(id);
  }, [steps.length]);

  return (
    <div className="py-2" aria-live="polite">
      <div className="flex items-center gap-2.5">
        <span className="w-5 h-5 rounded-full border-2 border-brand border-t-transparent animate-spin" />
        <span className="text-[14px] font-black text-ink-900">{steps[at]}</span>
      </div>
      <div className="mt-3 h-1.5 rounded-full bg-paper-100 overflow-hidden">
        <div
          className="h-full bg-brand transition-[width] duration-1000 ease-out"
          style={{ width: `${((at + 1) / steps.length) * 100}%` }}
        />
      </div>
      <p className="mt-2 text-[11.5px] text-paper-muted leading-snug">{T.readingWait}</p>
    </div>
  );
}

export default function LandingApp() {
  const lang = pickLang();
  const T = LANGS[lang];
  const [photos, setPhotos] = useState([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const uploadRef = useRef(null);

  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = T.dir;
  }, [lang, T.dir]);

  /**
   * The photographs become the home here. Everything the client will walk
   * through — rooms, sizes, colours, floors, furniture — is read out of them by
   * the survey, and only then does the builder open.
   */
  const buildFromPhotos = async () => {
    setBusy(true);
    setError(null);
    try {
      const observation = await surveyPhotos(photos);
      saveDraft({ photos, observation });
      window.location.href = siblingPage('studio');
    } catch (err) {
      setError(err.code || 'failed');
      setBusy(false);
    }
  };

  const goToBuilder = () => {
    saveDraft({ photos, observation: null });
    window.location.href = siblingPage('studio');
  };

  const scrollToUpload = () => {
    uploadRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div className="min-h-full bg-ink-900 text-white">
      {/* header */}
      <header className="sticky top-0 z-30 bg-ink-900/85 backdrop-blur-md border-b border-ink-line">
        <div className="mx-auto max-w-5xl px-4 h-14 flex items-center justify-between">
          <span className="flex items-center gap-2 font-black text-[15px]">
            <span className="w-7 h-7 rounded-lg bg-brand grid place-items-center text-[14px]">🏠</span>
            {T.studioTitle}
          </span>
          <a
            href={siblingPage('studio')}
            className="h-9 px-3.5 rounded-xl bg-ink-800 border border-ink-line text-[12.5px] font-bold grid place-items-center"
          >
            {T.property}
          </a>
        </div>
      </header>

      {/* hero */}
      <section className="mx-auto max-w-5xl px-4 pt-10 pb-8 sm:pt-16 text-center">
        <h1 className="text-[28px] sm:text-[42px] font-black leading-[1.15] tracking-tight">
          {T.landTitle}
        </h1>
        <p className="mx-auto mt-3 max-w-xl text-[14px] sm:text-[16px] text-white/60 leading-relaxed">
          {T.landSub}
        </p>
        {/* stacked on a phone: two short buttons side by side wrap their labels
            at 390px, and a wrapped call to action reads as an accident */}
        <div className="mt-6 flex flex-col sm:flex-row gap-2.5 sm:justify-center">
          <button
            type="button"
            onClick={scrollToUpload}
            className="h-12 px-6 rounded-2xl bg-brand text-white font-black text-[15px] shadow-fab active:scale-[0.98] transition-transform"
          >
            {T.landCta}
          </button>
          <a
            href={siblingPage('apartment')}
            className="h-12 px-6 rounded-2xl bg-ink-800 border border-ink-line text-white font-bold text-[15px] grid place-items-center active:scale-[0.98] transition-transform"
          >
            {T.landSecondary}
          </a>
        </div>
      </section>

      {/* the upload card — the whole point of the page */}
      <section ref={uploadRef} className="mx-auto max-w-2xl px-4 pb-10 scroll-mt-16">
        <div className="rounded-3xl bg-paper text-ink-900 p-4 sm:p-6 shadow-sheet">
          <h2 className="text-[17px] font-black">{T.landPhotosTitle}</h2>
          <p className="text-[12.5px] text-paper-muted leading-snug mt-1 mb-4">{T.landPhotosSub}</p>

          <PhotoUploader value={photos} onChange={setPhotos} T={T} max={8} />

          <p className="mt-3 text-[11.5px] text-paper-muted leading-snug">{T.photosNote}</p>

          {busy ? (
            <Progress T={T} />
          ) : (
            <>
              {error && (
                <div className="mt-4 rounded-xl bg-brand/10 p-3">
                  <p className="text-[12.5px] font-bold text-brand-deep leading-snug">
                    {T.surveyErrors[error] || T.surveyErrors.failed}
                  </p>
                </div>
              )}
              <button
                type="button"
                onClick={photos.length ? buildFromPhotos : goToBuilder}
                className="mt-5 w-full h-12 rounded-2xl bg-brand text-white font-black text-[15px] shadow-fab active:scale-[0.99] transition-transform"
              >
                {photos.length ? (error ? T.tryAgain : T.buildHouse) : T.landSkip}
              </button>
              {photos.length > 0 && (
                <button
                  type="button"
                  onClick={goToBuilder}
                  className="mt-2 w-full h-11 rounded-2xl bg-paper-100 text-ink-900 font-bold text-[13px] active:scale-[0.99] transition-transform"
                >
                  {T.manualBuild}
                </button>
              )}
            </>
          )}
        </div>
      </section>

      {/* how it works */}
      <section className="mx-auto max-w-2xl px-4 pb-10">
        <h2 className="text-[11px] font-black uppercase tracking-wide text-white/40 mb-3">
          {T.landStepsTitle}
        </h2>
        <ol className="space-y-4">
          <Step n="1" title={T.landStep1} body={T.landStep1Body} />
          <Step n="2" title={T.landStep2} body={T.landStep2Body} />
          <Step n="3" title={T.landStep3} body={T.landStep3Body} />
        </ol>
      </section>

      {/* why */}
      <section className="mx-auto max-w-4xl px-4 pb-10">
        <h2 className="text-[11px] font-black uppercase tracking-wide text-white/40 mb-3">
          {T.landWhyTitle}
        </h2>
        <div className="grid gap-3 sm:grid-cols-3">
          <Reason title={T.landWhy1} body={T.landWhy1Body} />
          <Reason title={T.landWhy2} body={T.landWhy2Body} />
          <Reason title={T.landWhy3} body={T.landWhy3Body} />
        </div>
      </section>

      <footer className="border-t border-ink-line">
        <div className="mx-auto max-w-4xl px-4 py-6 pb-[calc(1.5rem+env(safe-area-inset-bottom,0px))] space-y-2">
          <p className="text-[11.5px] text-white/40 leading-snug">{T.landHonest}</p>
          <p className="text-[11.5px] text-white/30">{T.landFooter}</p>
        </div>
      </footer>
    </div>
  );
}
