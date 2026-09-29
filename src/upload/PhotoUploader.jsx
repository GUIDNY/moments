import { useCallback, useEffect, useRef, useState } from 'react';
import { ACCEPT, MAX_BYTES, downscale, previewUrl } from '../lib/images';
import { storageReady, uploadPhoto } from '../lib/supabase';

/**
 * The one place a photograph enters the product.
 *
 * Both faces of the agent product use it: the landing page, where an agent
 * starts by emptying their camera roll, and the builder, where they add one
 * more. It owns the whole life of a file — shrink, upload, show, remove — and
 * hands the parent nothing but the finished public URLs.
 *
 * Every item keeps its own local preview URL from the moment it is picked, so
 * the grid fills instantly and the upload happens behind an already-visible
 * thumbnail. Waiting for a round trip before showing anything makes a fast
 * connection feel broken and a slow one feel dead.
 */

let seq = 0;

export default function PhotoUploader({ value = [], onChange, T, max = 8, compact = false }) {
  // `items` is the working state: previews, progress and errors. `value` is the
  // parent's list of finished URLs, and the two are reconciled on every change.
  const [items, setItems] = useState(() =>
    value.map((url) => ({ id: `seed-${seq++}`, url, preview: url, progress: 1 }))
  );
  const [dragging, setDragging] = useState(false);
  const fileRef = useRef(null);
  const cameraRef = useRef(null);

  /**
   * The list lives in the ref, and React state follows it.
   *
   * It has to be that way round. Adding a file kicks off an upload in the same
   * tick, and the upload's first progress callback then patches that item — but
   * React has not re-rendered yet, so a ref that is only refreshed during
   * render still holds the list from *before* the file was added. Patching
   * against that wipes the file that was just picked. Advancing the ref inside
   * `publish` keeps the imperative path and the rendered path on the same list
   * at every moment.
   */
  const itemsRef = useRef(items);

  // revoke the object URLs when the component goes, or a long session on a
  // phone leaks every photograph the agent ever picked
  useEffect(
    () => () => {
      itemsRef.current.forEach((it) => {
        if (it.preview && it.preview.startsWith('blob:')) URL.revokeObjectURL(it.preview);
      });
    },
    []
  );

  const publish = useCallback(
    (next) => {
      itemsRef.current = next;
      setItems(next);
      onChange?.(next.filter((it) => it.url).map((it) => it.url));
    },
    [onChange]
  );

  const add = useCallback(
    async (files) => {
      const room = max - itemsRef.current.length;
      const chosen = Array.from(files)
        .filter((f) => f.type.startsWith('image/'))
        .slice(0, Math.max(0, room));
      if (!chosen.length) return;

      const fresh = chosen.map((file) => ({
        id: `up-${seq++}`,
        file,
        preview: previewUrl(file),
        progress: 0,
        error: file.size > MAX_BYTES ? 'too-large' : null,
      }));
      publish([...itemsRef.current, ...fresh]);

      // one at a time: a phone on a weak uplink finishes eight sequential
      // uploads sooner than eight that all stall together, and the bar means
      // something
      for (const item of fresh) {
        if (item.error) continue;
        await run(item);
      }
    },
    [max, publish] // eslint-disable-line react-hooks/exhaustive-deps
  );

  const patch = useCallback(
    (id, changes) => {
      const next = itemsRef.current.map((it) => (it.id === id ? { ...it, ...changes } : it));
      publish(next);
    },
    [publish]
  );

  const run = useCallback(
    async (item) => {
      if (!storageReady) {
        patch(item.id, { error: 'storage-not-configured', progress: 0 });
        return;
      }
      try {
        const small = await downscale(item.file);
        const url = await uploadPhoto(small, {
          onProgress: (p) => patch(item.id, { progress: p, error: null }),
        });
        patch(item.id, { url, progress: 1, error: null });
      } catch (err) {
        patch(item.id, { error: err.message || 'failed', progress: 0 });
      }
    },
    [patch]
  );

  const retry = (item) => {
    patch(item.id, { error: null, progress: 0 });
    run({ ...item, error: null });
  };

  const remove = (id) => {
    const gone = itemsRef.current.find((it) => it.id === id);
    if (gone?.preview?.startsWith('blob:')) URL.revokeObjectURL(gone.preview);
    publish(itemsRef.current.filter((it) => it.id !== id));
  };

  const onDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    if (e.dataTransfer?.files?.length) add(e.dataTransfer.files);
  };

  const full = items.length >= max;
  const busy = items.some((it) => !it.url && !it.error);
  const done = items.filter((it) => it.url).length;

  return (
    <div className="space-y-3">
      {/* the drop zone */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        className={`rounded-2xl border-2 border-dashed transition-colors ${
          dragging ? 'border-brand bg-brand/5' : 'border-paper-200 bg-paper-50'
        } ${compact ? 'p-3' : 'p-5'}`}
      >
        <div className="flex flex-col items-center text-center gap-2">
          <div
            className={`grid place-items-center rounded-2xl bg-brand/10 text-brand ${
              compact ? 'w-10 h-10' : 'w-14 h-14'
            }`}
            aria-hidden="true"
          >
            <svg viewBox="0 0 24 24" fill="none" className={compact ? 'w-5 h-5' : 'w-7 h-7'}>
              <path
                d="M12 16V5m0 0L8 9m4-4 4 4M4 15v2a3 3 0 0 0 3 3h10a3 3 0 0 0 3-3v-2"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          {!compact && <p className="text-[14px] font-black text-ink-900">{T.dropTitle}</p>}
          <p className="text-[11.5px] text-paper-muted leading-snug">
            {full ? T.uploadFull.replace('{max}', max) : T.dropHint.replace('{max}', max)}
          </p>

          <div className="flex gap-2 pt-1">
            <button
              type="button"
              disabled={full}
              onClick={() => fileRef.current?.click()}
              className="h-10 px-4 rounded-xl bg-brand text-white font-bold text-[13px] disabled:opacity-40 active:scale-95 transition-transform"
            >
              {T.choosePhotos}
            </button>
            <button
              type="button"
              disabled={full}
              onClick={() => cameraRef.current?.click()}
              className="h-10 px-4 rounded-xl bg-paper-100 text-ink-900 font-bold text-[13px] disabled:opacity-40 active:scale-95 transition-transform sm:hidden"
            >
              {T.takePhoto}
            </button>
          </div>
        </div>

        <input
          ref={fileRef}
          type="file"
          accept={ACCEPT}
          multiple
          className="sr-only"
          onChange={(e) => {
            add(e.target.files);
            e.target.value = '';
          }}
        />
        <input
          ref={cameraRef}
          type="file"
          accept={ACCEPT}
          capture="environment"
          className="sr-only"
          onChange={(e) => {
            add(e.target.files);
            e.target.value = '';
          }}
        />
      </div>

      {!storageReady && items.length > 0 && (
        <p className="text-[11.5px] font-bold text-brand-deep bg-brand/10 rounded-xl p-2.5 leading-snug">
          {T.storageOff}
        </p>
      )}

      {items.length > 0 && (
        <>
          <div className="grid grid-cols-4 gap-2">
            {items.map((it) => (
              <figure
                key={it.id}
                className="relative aspect-square rounded-xl overflow-hidden bg-paper-100 border border-paper-200 animate-pop-in"
              >
                <img src={it.preview} alt="" className="w-full h-full object-cover" />

                {/* dim and cover while the bytes are still going up */}
                {!it.url && !it.error && (
                  <div className="absolute inset-0 bg-ink-900/55 grid place-items-end">
                    <div className="w-full h-1 bg-white/25">
                      <div
                        className="h-full bg-brand transition-[width] duration-200"
                        style={{ width: `${Math.round((it.progress || 0) * 100)}%` }}
                      />
                    </div>
                  </div>
                )}

                {it.error && (
                  <button
                    type="button"
                    onClick={() => retry(it)}
                    className="absolute inset-0 bg-ink-900/70 grid place-items-center text-[10px] font-black text-white px-1 leading-tight"
                  >
                    {T.errors[it.error] || T.errors.failed}
                    <span className="underline">{T.retry}</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => remove(it.id)}
                  aria-label={T.removePhoto}
                  className="absolute top-1 end-1 w-6 h-6 rounded-full bg-ink-900/75 text-white text-[13px] leading-none grid place-items-center backdrop-blur-sm"
                >
                  ×
                </button>
              </figure>
            ))}
          </div>

          <p className="text-[11px] text-paper-muted" aria-live="polite">
            {busy ? T.uploading : T.uploadedCount.replace('{n}', done)}
          </p>
        </>
      )}
    </div>
  );
}
